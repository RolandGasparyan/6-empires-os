from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from app.models.user import User
from app.database import get_db
from app.security.password import hash_password, verify_password
from app.security.jwt import create_access_token
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegister(BaseModel):
    email: str
    username: str
    password: str

@router.post("/register")
async def register(user: UserRegister, db = Depends(get_db)):
    new_user = User(email=user.email, username=user.username, hashed_password=hash_password(user.password))
    db.add(new_user)
    await db.commit()
    return {"message": "registered"}

@router.post("/login")
async def login(email: str, password: str, db = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}
