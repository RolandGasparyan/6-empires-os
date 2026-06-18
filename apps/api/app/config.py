from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Core
    APP_NAME: str = "6-EMPIRE OS API"
    ENV: str = "development"

    # Databases (async drivers where applicable)
    DATABASE_URL: str = "postgresql+asyncpg://empire:empire@localhost:5432/empires"
    REDIS_URL: str = "redis://localhost:6379/0"
    QDRANT_URL: str = "http://localhost:6333"
    NEO4J_URI: str = "neo4j://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "neo4j"

    # Security
    JWT_SECRET: str = "CHANGE_ME_IN_ENV"  # MUST be overridden via environment
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24
    REFRESH_EXPIRE_DAYS: int = 14

    # Founder gate — only this email gets is_admin / founder dashboard access
    FOUNDER_EMAIL: str = "roland.gasparyan@gmail.com"

    # CORS — explicit origins (never "*" with credentials)
    CORS_ORIGINS: str = "http://localhost:3000,https://6-empires.com,https://www.6-empires.com,https://chat.6-empires.com"

    # AI / integrations (optional; empty disables the feature gracefully)
    OPENAI_API_KEY: str = ""
    OPENHUMAN_CLIENT_ID: str = ""
    OPENHUMAN_CLIENT_SECRET: str = ""

    # OpenHuman Core runtime
    # When 6-EMPIRE acts as the runtime, OPENHUMAN_CORE_TOKEN is the bearer
    # token that inbound RPC callers must present (Authorization: Bearer ...).
    # When 6-EMPIRE connects OUT to a remote runtime, OPENHUMAN_RUNTIME_URL +
    # OPENHUMAN_CORE_TOKEN are the saved defaults the test-connection uses.
    # Empty token => RPC endpoint is locked (503) until configured.
    OPENHUMAN_CORE_TOKEN: str = ""
    OPENHUMAN_RUNTIME_URL: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
