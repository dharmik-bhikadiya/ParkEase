from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Locate root monorepo directory dynamically
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BASE_DIR.parent
ROOT_ENV_FILE = ROOT_DIR / ".env"
LOCAL_ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    APP_NAME: str = "ParkEase"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "info"
    SECRET_KEY: str = "super_secret_parkease_key_change_in_production_32bytes"

    # API Server Configuration
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:19006",
        "http://localhost:8081",
        "http://10.211.40.184:5173",
        "http://10.211.40.184:8081",
        "exp://10.211.40.184:8081",
        "exp://localhost:8081",
    ]

    # Database Settings
    POSTGRES_USER: str = "parkease_user"
    POSTGRES_PASSWORD: str = "parkease_secure_password"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "parkease_db"
    DATABASE_URL: str = "postgresql://parkease_user:parkease_secure_password@localhost:5432/parkease_db"

    # JWT Security Settings
    JWT_SECRET_KEY: str = "parkease_jwt_secret_key_change_me_in_production_12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Google Auth OAuth 2.0
    GOOGLE_CLIENT_ID: str = ""

    # Payment Gateway Options
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    PAYMENT_PROVIDER: str = "SANDBOX"

    model_config = SettingsConfigDict(
        env_file=(str(ROOT_ENV_FILE), str(LOCAL_ENV_FILE), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
