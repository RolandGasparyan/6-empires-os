from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/empires"
    QDRANT_URL: str = "http://localhost:6333"
    NEO4J_URI: str = "neo4j://localhost:7687"
    JWT_SECRET: str = "your-secret-key"
    class Config:
        env_file = ".env"
settings = Settings()
