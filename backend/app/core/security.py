from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import JWTError, jwt
from app.core.config import settings

ALGORITHM = "HS256"

def create_access_token(data: Dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token.
    ``data`` should contain the payload (e.g., ``{"sub": user_id}``).
    ``expires_delta`` optional; defaults to ``settings.ACCESS_TOKEN_EXPIRE_MINUTES`` minutes.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode a JWT token and return its payload.
    Will raise ``JWTError`` if the token is invalid or expired.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
