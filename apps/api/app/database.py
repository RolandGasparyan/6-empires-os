from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=(settings.ENV == "development"), future=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


async def get_db():
    async with async_session() as session:
        yield session


async def init_db() -> None:
    """Create tables on startup (dev convenience; use Alembic in prod)."""
    # Import models so they register on Base.metadata before create_all.
    from app.models import user, agent, knowledge, agent_runtime, message  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
