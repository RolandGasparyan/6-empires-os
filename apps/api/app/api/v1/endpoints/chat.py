from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.security.deps import get_current_user, require_cookie_origin, require_role
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


class PostBody(BaseModel):
    body: str = Field(min_length=1, max_length=20_000)


@router.get("/channels")
async def channels(_=Depends(get_current_user)):
    return {"channels": chat_service.CHANNELS}


@router.get("/channels/{channel}/messages")
async def get_messages(
    channel: str,
    limit: int = Query(default=50, ge=1, le=200),
    _=Depends(get_current_user),
):
    if not any(c["key"] == channel for c in chat_service.CHANNELS):
        raise HTTPException(404, "Unknown channel")
    try:
        messages = await chat_service.list_messages(channel, limit)
    except chat_service.ChatRepositoryError as exc:
        raise HTTPException(503, "Messages are temporarily unavailable") from exc
    return {"channel": channel, "messages": messages}


@router.post("/channels/{channel}/messages")
async def post_message(
    channel: str,
    body: PostBody,
    _=Depends(require_role("operator")),
    __=Depends(require_cookie_origin),
):
    if not any(c["key"] == channel for c in chat_service.CHANNELS):
        raise HTTPException(404, "Unknown channel")
    try:
        rec = await chat_service.post_message(channel, body.body)
    except chat_service.ChatRepositoryError as exc:
        raise HTTPException(503, "Message could not be durably stored") from exc
    return {"posted": True, "message": rec}
