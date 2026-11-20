"""Common FastAPI dependencies for the DevFlow backend.
Provides ``get_current_user`` which validates a JWT token and returns the authenticated ``User``.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.core.config import settings
from app.database.session import get_db
from app.services.user_service import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> "User":
    """Validate JWT token and retrieve the corresponding ``User``.

    - ``token`` is extracted from the ``Authorization: Bearer <token>`` header.
    - ``decode_access_token`` raises ``JWTError`` for invalid/expired tokens.
    - The token payload must contain ``sub`` with the user UUID.
    - Returns the ``User`` ORM instance.
    - Raises ``401 Unauthorized`` for any validation failure.
    """
    from jose import JWTError
    from app.models.user import User

    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise JWTError("Missing sub claim")
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
