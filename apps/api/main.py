import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.responses import PlainTextResponse
from app.config import settings
from app.api.v1 import endpoints
from app.services import agent_state
from app.services import metrics as _metrics


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.startup_complete = False
    app.state.startup_error = None
    try:
        if not settings.is_production:
            from app.database import init_db

            await init_db()
        # Phase E: hydrate persisted agent tasks + memory so a restart
        # no longer wipes state.
        await agent_state.hydrate()
        app.state.startup_complete = True
    except Exception as exc:
        app.state.startup_error = type(exc).__name__
        print(f"[startup] DB init/hydrate failed: {type(exc).__name__}")
    # Start the live agent-state engine + the agent worker loop.
    engine = asyncio.create_task(agent_state.run_engine())
    worker = asyncio.create_task(agent_state.run_worker())
    try:
        yield
    finally:
        engine.cancel()
        worker.cancel()
        await asyncio.gather(engine, worker, return_exceptions=True)


app = FastAPI(title=settings.APP_NAME, version="2.0.0", lifespan=lifespan)
MAX_REQUEST_BYTES = 1_000_000

# CORS — explicit origins (never "*" together with credentials).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router, prefix="/api/v1")


@app.middleware("http")
async def _count_requests(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            too_large = int(content_length) > MAX_REQUEST_BYTES
        except ValueError:
            return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length"})
        if too_large:
            return JSONResponse(status_code=413, content={"detail": "Request body too large"})
    response = await call_next(request)
    try:
        _metrics.record_request(request.method, response.status_code)
    except Exception:
        pass
    return response


@app.get("/metrics", include_in_schema=False)
async def metrics_endpoint():
    return PlainTextResponse(_metrics.render(), media_type="text/plain; version=0.0.4")


@app.get("/live", tags=["system"])
@app.get("/health", tags=["system"])
async def liveness():
    return {"status": "ok", "service": settings.APP_NAME, "env": settings.ENV}


@app.get("/ready", tags=["system"])
async def readiness(request: Request):
    if not getattr(request.app.state, "startup_complete", False):
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "service": settings.APP_NAME,
                "reason": getattr(request.app.state, "startup_error", None) or "starting",
            },
        )
    try:
        from app.database import async_session

        async with async_session() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "service": settings.APP_NAME, "reason": "database_unavailable"},
        )
    return {"status": "ready", "service": settings.APP_NAME, "env": settings.ENV}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=(settings.ENV == "development"))
