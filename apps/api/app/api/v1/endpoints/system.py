from fastapi import APIRouter, Depends
from app.security.deps import require_founder

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/health")
async def system_health(_=Depends(require_founder)):
    return {
        "services": [
            {"name": "postgres", "status": "healthy"},
            {"name": "redis", "status": "healthy"},
            {"name": "qdrant", "status": "healthy"},
            {"name": "neo4j", "status": "warning"},
            {"name": "api", "status": "healthy"},
            {"name": "web", "status": "healthy"},
        ],
        "resources": {"cpu": 34, "ram": 58, "disk": 41, "gateway_ms": 118},
    }


@router.get("/logs")
async def logs(_=Depends(require_founder), limit: int = 50):
    return {"lines": [f"[{i:03d}] system nominal" for i in range(limit)]}
