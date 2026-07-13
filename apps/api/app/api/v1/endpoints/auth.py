import hmac
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, EmailStr, Field
from app.models.user import User, RefreshToken
from app.database import get_db
from app.config import settings
from app.security.password import hash_password, verify_password
from app.security.jwt import create_access_token, new_refresh_token, hash_refresh
from app.security.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
ACCESS_COOKIE_NAME = "empire_access"
REFRESH_COOKIE_NAME = "empire_refresh"


class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=2, max_length=100, pattern=r"^[A-Za-z0-9_.-]+$")
    password: str = Field(min_length=12, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


class RefreshBody(BaseModel):
    refresh_token: str | None = None


async def _issue_refresh(db, user: User) -> str:
    raw, h, exp = new_refresh_token()
    db.add(RefreshToken(user_id=user.id, token_hash=h, expires_at=exp))
    await db.commit()
    return raw


def _set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    same_site: Literal["none", "lax"] = "none" if settings.is_production else "lax"
    response.set_cookie(
        ACCESS_COOKIE_NAME,
        access,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.is_production,
        samesite=same_site,
        path="/",
    )
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh,
        max_age=settings.REFRESH_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=settings.is_production,
        samesite=same_site,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    same_site: Literal["none", "lax"] = "none" if settings.is_production else "lax"
    response.delete_cookie(ACCESS_COOKIE_NAME, path="/", secure=settings.is_production, httponly=True, samesite=same_site)
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/", secure=settings.is_production, httponly=True, samesite=same_site)


def _require_cookie_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if not origin or not settings.is_allowed_origin(origin):
        raise HTTPException(status_code=403, detail="Origin not allowed")


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegister,
    db=Depends(get_db),
    x_founder_bootstrap_token: str | None = Header(default=None),
):
    normalized_email = payload.email.lower()
    exists = await db.execute(
        select(User).where(or_(User.email == normalized_email, User.username == payload.username))
    )
    existing_user = exists.scalars().first()
    if existing_user:
        field = "Email" if existing_user.email == normalized_email else "Username"
        raise HTTPException(status_code=409, detail=f"{field} already registered")
    is_founder_email = normalized_email == settings.FOUNDER_EMAIL.lower()
    is_founder = False
    if is_founder_email:
        configured = settings.FOUNDER_BOOTSTRAP_TOKEN
        if not configured:
            raise HTTPException(status_code=503, detail="Founder bootstrap is not configured")
        if not x_founder_bootstrap_token or not hmac.compare_digest(x_founder_bootstrap_token, configured):
            raise HTTPException(status_code=403, detail="Invalid founder bootstrap token")
        existing_founder = await db.execute(select(User).where(User.is_admin.is_(True)))
        if existing_founder.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Founder account already bootstrapped")
        is_founder = True
    user = User(
        email=normalized_email, username=payload.username, full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role="founder" if is_founder else "viewer",
        is_admin=is_founder,
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Email or username already registered") from exc
    return {"message": "registered", "is_founder": is_founder, "role": user.role}


@router.post("/login", response_model=TokenResponse)
async def login(response: Response, form: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form.username))
    user = result.scalar_one_or_none()
    if not user or not user.is_active or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access = create_access_token({"sub": str(user.id), "role": user.role, "admin": user.is_admin})
    refresh = await _issue_refresh(db, user)
    _set_auth_cookies(response, access, refresh)
    return TokenResponse(access_token=access)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    response: Response,
    body: RefreshBody | None = None,
    refresh_cookie: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db=Depends(get_db),
):
    raw_refresh = (body.refresh_token if body else None) or refresh_cookie
    if not raw_refresh:
        raise HTTPException(status_code=401, detail="Refresh token required")
    if (body is None or not body.refresh_token) and refresh_cookie:
        _require_cookie_origin(request)
    h = hash_refresh(raw_refresh)
    row = (await db.execute(select(RefreshToken).where(RefreshToken.token_hash == h))).scalar_one_or_none()
    if not row or row.revoked_at is not None or _as_utc(row.expires_at) < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user = await db.get(User, row.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    # rotate: revoke old, issue new
    row.revoked_at = datetime.now(timezone.utc)
    access = create_access_token({"sub": str(user.id), "role": user.role, "admin": user.is_admin})
    new_raw = await _issue_refresh(db, user)
    _set_auth_cookies(response, access, new_raw)
    return TokenResponse(access_token=access)


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    body: RefreshBody | None = None,
    refresh_cookie: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db=Depends(get_db),
):
    raw_refresh = (body.refresh_token if body else None) or refresh_cookie
    if (body is None or not body.refresh_token) and refresh_cookie:
        _require_cookie_origin(request)
    if raw_refresh:
        h = hash_refresh(raw_refresh)
        row = (await db.execute(select(RefreshToken).where(RefreshToken.token_hash == h))).scalar_one_or_none()
        if row and row.revoked_at is None:
            row.revoked_at = datetime.now(timezone.utc)
            await db.commit()
    _clear_auth_cookies(response)
    return {"revoked": True}


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {"id": str(user.id), "email": user.email, "username": user.username,
            "full_name": user.full_name, "role": user.role, "is_admin": user.is_admin}
