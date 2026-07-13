from pydantic import model_validator
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
    JWT_SECRET: str = "CHANGE_ME_IN_ENV"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24
    REFRESH_EXPIRE_DAYS: int = 14

    # Account bootstrap. Public registration is disabled by default. Creating the
    # founder account requires both the configured email and a one-time bootstrap
    # token supplied in the X-Founder-Bootstrap-Token header.
    FOUNDER_EMAIL: str = "roland.gasparyan@gmail.com"
    FOUNDER_BOOTSTRAP_TOKEN: str = ""
    ALLOW_PUBLIC_REGISTRATION: bool = False
    REGISTRATION_PASSWORD_MIN_LENGTH: int = 12

    # CORS - explicit origins (never "*" with credentials)
    CORS_ORIGINS: str = "http://localhost:3000,https://6-empires.com,https://www.6-empires.com,https://chat.6-empires.com"

    # AI / integrations (optional; empty disables the feature gracefully)
    OPENAI_API_KEY: str = ""
    OPENHUMAN_CLIENT_ID: str = ""
    OPENHUMAN_CLIENT_SECRET: str = ""

    # OpenHuman Core runtime
    OPENHUMAN_CORE_TOKEN: str = ""
    OPENHUMAN_RUNTIME_URL: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def is_production(self) -> bool:
        return self.ENV.strip().lower() == "production"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        """Fail closed when production starts with development credentials."""
        if not self.is_production:
            return self

        errors: list[str] = []
        if self.JWT_SECRET in {"", "CHANGE_ME_IN_ENV", "__CHANGE_ME_64_HEX__"} or len(self.JWT_SECRET) < 32:
            errors.append("JWT_SECRET must be a non-default value of at least 32 characters")
        if "empire:empire@" in self.DATABASE_URL or "__CHANGE_ME" in self.DATABASE_URL:
            errors.append("DATABASE_URL must not use the default or placeholder database password")
        if self.NEO4J_PASSWORD in {"", "neo4j", "__CHANGE_ME_STRONG__"}:
            errors.append("NEO4J_PASSWORD must be a non-default value")

        origins = self.cors_origins_list
        if not origins or "*" in origins:
            errors.append("CORS_ORIGINS must contain explicit production origins")
        if any("localhost" in origin or "127.0.0.1" in origin for origin in origins):
            errors.append("CORS_ORIGINS must not include local development origins in production")

        if errors:
            raise ValueError("Unsafe production configuration: " + "; ".join(errors))
        return self


settings = Settings()
