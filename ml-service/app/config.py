"""
Configuration Settings for SmartDorm ML Service.
Reads environment variables with sensible production defaults.
"""
import os
from typing import List, Union
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings class."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Server Configuration
    ML_HOST: str = "0.0.0.0"
    ML_PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: Union[str, List[str]] = "*"

    # InfluxDB 2.7 Configuration
    INFLUXDB_URL: str = "http://localhost:8086"
    INFLUXDB_TOKEN: str = "smart-dormitory-super-secret-token-12345"
    INFLUXDB_ORG: str = "smart-dormitory"
    INFLUXDB_BUCKET: str = "smart-dormitory-raw"

    # SQLite Database / Prisma dev.db URL
    DATABASE_URL: str = "sqlite:///../backend/prisma/dev.db"

    # Model Artifacts Directory
    MODEL_DIR: str = "models"

    # Default Data Source Tag
    DATA_SOURCE_DEFAULT: str = "SIMULATION_DATA"

    def get_cors_origins_list(self) -> List[str]:
        """Returns list of allowed CORS origins."""
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    def get_sqlite_file_path(self) -> Path:
        """Resolves SQLite DB file path relative to repository or backend directory."""
        raw_url = self.DATABASE_URL
        if raw_url.startswith("sqlite://"):
            raw_path = raw_url.replace("sqlite:///", "").replace("sqlite://", "")
        else:
            raw_path = raw_url

        # Check relative to ml-service dir
        p1 = Path(raw_path)
        if p1.is_absolute() and p1.exists():
            return p1

        base_dir = Path(__file__).resolve().parent.parent
        p2 = (base_dir / raw_path).resolve()
        if p2.exists():
            return p2

        # Check common locations: ../backend/prisma/dev.db
        p3 = (base_dir.parent / "backend" / "prisma" / "dev.db").resolve()
        if p3.exists():
            return p3

        return p2


# Global settings instance
settings = Settings()
