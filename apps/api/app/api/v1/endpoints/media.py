from fastapi import APIRouter, Depends
from app.security.deps import require_founder

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/queue")
async def render_queue(_=Depends(require_founder)):
    return {"queue": [
        {"name": "Q3 Brand Commercial", "pct": 82, "kind": "video"},
        {"name": "Founder Avatar v4", "pct": 47, "kind": "avatar"},
    ]}
