import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from app.config import settings


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=settings.JWT_EXPIRE_HOURS))
    to_encode.update({"exp": expire, "typ": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


def new_refresh_token() -> tuple[str, str, datetime]:
    """Return (raw_token, sha256_hash, expires_at). Only the hash is stored."""
    raw = secrets.token_urlsafe(48)
    h = hashlib.sha256(raw.encode()).hexdigest()
    exp = datetime.utcnow() + timedelta(days=getattr(settings, "REFRESH_EXPIRE_DAYS", 14))
    return raw, h, exp


def hash_refresh(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
