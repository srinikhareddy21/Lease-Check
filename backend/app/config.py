"""
Application configuration, read from environment variables (.env in dev).
"""

import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Database -----------------------------------------------------
    database_url: str = os.environ.get(
        "DATABASE_URL",
        "postgresql+psycopg2://leasecheck:leasecheck@localhost:5432/leasecheck",
    )

    # --- Auth -----------------------------------------------------------
    jwt_secret: str = os.environ.get("JWT_SECRET", "dev-secret-change-me-in-production")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "20160"))  # 14 days
    reset_token_expire_minutes: int = int(os.environ.get("RESET_TOKEN_EXPIRE_MINUTES", "30"))

    # --- Gemini -----------------------------------------------------------
    gemini_api_key: str | None = os.environ.get("GEMINI_API_KEY")
    gemini_model: str = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    # --- CORS -----------------------------------------------------------
    allowed_origins: str = os.environ.get("ALLOWED_ORIGINS", "*")

    # --- Uploads -----------------------------------------------------------
    max_upload_bytes: int = 15 * 1024 * 1024

    # --- Frontend (for password reset links) -------------------------------
    frontend_url: str = os.environ.get("FRONTEND_URL", "http://localhost:5173")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
