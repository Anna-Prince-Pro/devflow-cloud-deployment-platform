"""User service layer: creation and authentication using Passlib/bcrypt.
All functions accept an SQLAlchemy Session.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from passlib.context import CryptContext

from app.models.user import User
from app.schemas.user import UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------------
# Password utilities
# ---------------------------------------------------------------------------

def _hash_password(plain_password: str) -> str:
    """Return bcrypt hash of the plain password."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if plain_password matches hashed_password."""
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------------------------
# Read helpers
# ---------------------------------------------------------------------------

def get_user_by_email(db: Session, email: str) -> User | None:
    stmt = select(User).where(User.email == email)
    return db.execute(stmt).scalar_one_or_none()


def get_user_by_id(db: Session, user_id: str) -> User | None:
    """Return a user by UUID string, or None if invalid/not found."""
    try:
        uid = UUID(user_id)
    except ValueError:
        return None
    stmt = select(User).where(User.id == uid)
    return db.execute(stmt).scalar_one_or_none()


# ---------------------------------------------------------------------------
# Write helpers
# ---------------------------------------------------------------------------

def create_user(db: Session, payload: UserCreate) -> User:
    """Create a new user.

    Raises ValueError if the email is already registered.
    Rolls back and re-raises on any database error.
    """
    if get_user_by_email(db, payload.email):
        raise ValueError("Email already registered")
    hashed = _hash_password(payload.password)
    new_user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hashed,
    )
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception:
        db.rollback()
        raise


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Return User if credentials are valid, otherwise None."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not pwd_context.verify(password, user.password_hash):
        return None
    return user
