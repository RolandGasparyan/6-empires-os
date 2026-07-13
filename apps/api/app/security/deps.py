import uuid
from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from app.database import async_session, get_db
from app.config import settings
from app.models.user import User
from app.security.jwt import verify_token

ACCESS_COOKIE_NAME = "empire_access"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def resolve_user(token: str, db) -> User:
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


async def get_current_user(
    bearer_token: str | None = Depends(oauth2_scheme),
    access_cookie: str | None = Cookie(default=None, alias=ACCESS_COOKIE_NAME),
    db=Depends(get_db),
) -> User:
    token = bearer_token or access_cookie
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return await resolve_user(token, db)


async def get_websocket_user(token: str) -> User:
    async with async_session() as db:
        return await resolve_user(token, db)


def require_cookie_origin(request: Request) -> None:
    """Protect cookie-authenticated state changes from cross-site requests."""
    if request.headers.get("authorization"):
        return
    if request.cookies.get(ACCESS_COOKIE_NAME):
        origin = request.headers.get("origin")
        if not origin or not settings.is_allowed_origin(origin):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Origin not allowed")


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
