import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import endpoints
from app.services import agent_state


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (dev). In prod, run Alembic migrations instead.
    try:
        from app.database import init_db
        await init_db()
        # Phase E: hydrate persisted agent tasks + memory so a restart
        # no longer wipes state.
        await agent_state.hydrate()
    except Exception as exc:  # don't crash boot if DB not reachable yet
        print(f"[startup] DB init/hydrate skipped: {exc}")
    # Start the live agent-state engine + the agent worker loop.
    engine = asyncio.create_task(agent_state.run_engine())
    worker = asyncio.create_task(agent_state.run_worker())
    try:
        yield
    finally:
        engine.cancel()
        worker.cancel()


app = FastAPI(title=settings.APP_NAME, version="2.0.0", lifespan=lifespan)

# CORS — explicit origins (never "*" together with credentials).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router, prefix="/api/v1")


# ---- observability (Phase F) ----
from starlette.requests import Request
from starlette.responses import PlainTextResponse
from app.services import metrics as _metrics


@app.middleware("http")
async def _count_requests(request: Request, call_next):
    response = await call_next(request)
    try:
        _metrics.record_request(request.method, response.status_code)
    except Exception:
        pass
    return response


@app.get("/metrics", include_in_schema=False)
async def metrics_endpoint():
    return PlainTextResponse(_metrics.render(), media_type="text/plain; version=0.0.4")


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "service": settings.APP_NAME, "env": settings.ENV}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=(settings.ENV == "development"))
