from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_stats():
    return {"agents_active": 9, "trades_today": 12, "pnl": 2500.00, "health": 98.5}

@router.get("/agents")
async def get_agents():
    return {"total": 12, "active": [{"name": "TITAN", "status": "executing"}]}

@router.get("/knowledge")
async def get_knowledge():
    return {"documents": 150, "entities": 420, "relationships": 1200}
