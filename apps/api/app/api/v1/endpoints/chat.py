from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.security.deps import require_role
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


class PostBody(BaseModel):
    body: str


@router.get("/channels")
async def channels():
    return {"channels": chat_service.CHANNELS}


@router.get("/channels/{channel}/messages")
async def get_messages(channel: str, limit: int = 50):
    return {"channel": channel, "messages": await chat_service.list_messages(channel, limit)}


@router.post("/channels/{channel}/messages")
async def post_message(channel: str, body: PostBody, _=Depends(require_role("operator"))):
    if not any(c["key"] == channel for c in chat_service.CHANNELS):
        raise HTTPException(404, "Unknown channel")
    rec = await chat_service.post_message(channel, body.body)
    return {"posted": True, "message": rec}
