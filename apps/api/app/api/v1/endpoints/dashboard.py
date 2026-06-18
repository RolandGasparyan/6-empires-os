from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats():
    return {"agents_active": 9, "trades_today": 12, "pnl": 2500.00, "health": 98.5}


@router.get("/agents")
async def get_agents():
    return {"total": 7, "active": [{"name": "TITAN", "status": "executing"}]}


@router.get("/knowledge")
async def get_knowledge():
    return {"documents": 150, "entities": 420, "relationships": 1200}


@router.get("/timeseries")
async def get_timeseries(points: int = 24):
    now = datetime.now(timezone.utc)
    return {
        "pnl": [round(2500 + (i % 5) * 120 - 200, 2) for i in range(points)],
        "labels": [f"{(now.hour - points + i) % 24:02d}:00" for i in range(points)],
    }
