from urllib.parse import urlparse

from pydantic import field_validator, model_validator
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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_EXPIRE_DAYS: int = 14

    # Founder gate — only this email gets is_admin / founder dashboard access
    FOUNDER_EMAIL: str = "roland.gasparyan@gmail.com"
    # Public registration never grants founder privileges based on email alone.
    # The first founder account must also present this server-side bootstrap
    # secret in X-Founder-Bootstrap-Token.
    FOUNDER_BOOTSTRAP_TOKEN: str = ""

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

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return "postgresql+asyncpg://" + value.removeprefix("postgres://")
        if value.startswith("postgresql://"):
            return "postgresql+asyncpg://" + value.removeprefix("postgresql://")
        return value

    @property
    def is_production(self) -> bool:
        return self.ENV.strip().lower() == "production"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.CORS_ORIGINS.split(",") if o.strip()]

    def is_allowed_origin(self, origin: str | None) -> bool:
        if not origin:
            return True
        return origin.rstrip("/") in self.cors_origins_list

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if not self.is_production:
            return self

        errors: list[str] = []
        weak_values = {"", "change_me_in_env", "__change_me_64_hex__"}
        if self.JWT_SECRET.strip().lower() in weak_values or len(self.JWT_SECRET) < 32:
            errors.append("JWT_SECRET must be a non-default value of at least 32 characters")
        if (
            not self.FOUNDER_BOOTSTRAP_TOKEN
            or self.FOUNDER_BOOTSTRAP_TOKEN.startswith("__CHANGE_ME")
            or len(self.FOUNDER_BOOTSTRAP_TOKEN) < 32
        ):
            errors.append("FOUNDER_BOOTSTRAP_TOKEN must be a non-default value of at least 32 characters")
        if "empire:empire@localhost" in self.DATABASE_URL or "__CHANGE_ME" in self.DATABASE_URL:
            errors.append("DATABASE_URL must not use the development/default credential")
        if self.NEO4J_PASSWORD in {"neo4j", "__CHANGE_ME_STRONG__"}:
            errors.append("NEO4J_PASSWORD must not use the default credential")
        if self.OPENHUMAN_CORE_TOKEN.startswith("__CHANGE_ME"):
            errors.append("OPENHUMAN_CORE_TOKEN must be empty or a real secret")
        for origin in self.cors_origins_list:
            parsed = urlparse(origin)
            if parsed.scheme != "https" or not parsed.hostname or parsed.hostname in {"localhost", "127.0.0.1"}:
                errors.append("CORS_ORIGINS must contain only HTTPS production origins")
                break
        if errors:
            raise ValueError("Invalid production configuration: " + "; ".join(errors))
        return self


settings = Settings()
