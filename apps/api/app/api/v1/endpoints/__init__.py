from fastapi import APIRouter

from . import auth, dashboard, websocket

router = APIRouter()

router.include_router(auth.router)
router.include_router(dashboard.router)
router.include_router(websocket.router)
