from fastapi import APIRouter
from . import auth, dashboard, websocket, agents, system, openhuman, media, chat, console

router = APIRouter()
router.include_router(auth.router)
router.include_router(dashboard.router)
router.include_router(websocket.router)
router.include_router(agents.router)
router.include_router(system.router)
router.include_router(openhuman.router)
router.include_router(media.router)
router.include_router(chat.router)
router.include_router(console.router)
