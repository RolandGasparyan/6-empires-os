from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.models.user import User, RefreshToken
from app.database import get_db
from app.config import settings
from app.security.password import hash_password, verify_password
from app.security.jwt import create_access_token, new_refresh_token, hash_refresh
from app.security.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


class RefreshBody(BaseModel):
    refresh_token: str


async def _issue_refresh(db, user: User) -> str:
    raw, h, exp = new_refresh_token()
    db.add(RefreshToken(user_id=user.id, token_hash=h, expires_at=exp))
    await db.commit()
    return raw


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db=Depends(get_db)):
    exists = await db.execute(select(User).where(User.email == payload.email))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    is_founder = payload.email.lower() == settings.FOUNDER_EMAIL.lower()
    user = User(
        email=payload.email, username=payload.username, full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role="founder" if is_founder else "viewer",
        is_admin=is_founder,
    )
    db.add(user)
    await db.commit()
    return {"message": "registered", "is_founder": is_founder, "role": user.role}


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access = create_access_token({"sub": str(user.id), "role": user.role, "admin": user.is_admin})
    refresh = await _issue_refresh(db, user)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshBody, db=Depends(get_db)):
    h = hash_refresh(body.refresh_token)
    row = (await db.execute(select(RefreshToken).where(RefreshToken.token_hash == h))).scalar_one_or_none()
    if not row or row.revoked_at is not None or row.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user = await db.get(User, row.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    # rotate: revoke old, issue new
    row.revoked_at = datetime.utcnow()
    access = create_access_token({"sub": str(user.id), "role": user.role, "admin": user.is_admin})
    new_raw = await _issue_refresh(db, user)
    return TokenResponse(access_token=access, refresh_token=new_raw)


@router.post("/logout")
async def logout(body: RefreshBody, db=Depends(get_db)):
    h = hash_refresh(body.refresh_token)
    row = (await db.execute(select(RefreshToken).where(RefreshToken.token_hash == h))).scalar_one_or_none()
    if row and row.revoked_at is None:
        row.revoked_at = datetime.utcnow()
        await db.commit()
    return {"revoked": True}


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {"id": str(user.id), "email": user.email, "username": user.username,
            "full_name": user.full_name, "role": user.role, "is_admin": user.is_admin}
