import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.security.jwt import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)) -> User:
    payload = verify_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    # `sub` is serialized as a string in the JWT; cast back to UUID for the
    # UUID-typed primary key (required on Postgres, and SQLite for tests).
    try:
        user_id = uuid.UUID(str(payload["sub"]))
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


async def require_founder(user: User = Depends(get_current_user)) -> User:
    """Founder-only gate for the private admin dashboard."""
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Founder access only")
    return user


def require_role(*allowed: str):
    """Dependency factory: allow users whose role is in `allowed`.
    'founder' is always allowed (founder == is_admin)."""
    async def _checker(user: User = Depends(get_current_user)) -> User:
        role = getattr(user, "role", None) or ("founder" if user.is_admin else "viewer")
        if user.is_admin or role == "founder" or role in allowed:
            return user
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"Requires role: {', '.join(allowed) or 'founder'}")
    return _checker
