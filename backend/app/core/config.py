from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

from pydantic import Field, AliasChoices

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

    @property
    def sync_database_url(self) -> str:
        """
        Returns normalized PostgreSQL connection URL for SQLAlchemy.
        Converts legacy 'postgres://' schema (common in Neon/Render) to 'postgresql://'.
        """
        if self.DATABASE_URL and self.DATABASE_URL.startswith("postgres://"):
            return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
        return self.DATABASE_URL

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

    # SMTP / Email Infrastructure Configuration
    SUPABASE_URL: Optional[str] = Field(default=None, validation_alias=AliasChoices("SUPABASE_URL", "SUPABASE_PROJECT_URL"))
    SUPABASE_EMAIL_FUNCTION_URL: Optional[str] = Field(default=None, validation_alias=AliasChoices("SUPABASE_EMAIL_FUNCTION_URL", "SUPABASE_FUNCTION_URL"))
    SUPABASE_EMAIL_FUNCTION_SECRET: Optional[str] = Field(default=None, validation_alias=AliasChoices("SUPABASE_EMAIL_FUNCTION_SECRET", "PARKEASE_EMAIL_FUNCTION_SECRET"))
    RESEND_API_KEY: Optional[str] = Field(default=None, validation_alias=AliasChoices("RESEND_API_KEY", "RESEND_KEY"))
    PARKEASE_EMAIL_FROM: str = Field(default="ParkEase <onboarding@resend.dev>", validation_alias=AliasChoices("PARKEASE_EMAIL_FROM", "RESEND_FROM_EMAIL"))

    SMTP_HOST: Optional[str] = Field(default=None, validation_alias=AliasChoices("SMTP_HOST", "MAIL_SERVER"))
    SMTP_PORT: int = Field(default=587, validation_alias=AliasChoices("SMTP_PORT", "MAIL_PORT"))
    SMTP_USER: Optional[str] = Field(default=None, validation_alias=AliasChoices("SMTP_USER", "SMTP_USERNAME", "MAIL_USERNAME"))
    SMTP_PASSWORD: Optional[str] = Field(default=None, validation_alias=AliasChoices("SMTP_PASSWORD", "SMTP_PASS", "MAIL_PASSWORD"))
    EMAILS_FROM_EMAIL: str = Field(default="noreply@parkease.com", validation_alias=AliasChoices("EMAILS_FROM_EMAIL", "SMTP_FROM_EMAIL", "SMTP_FROM", "MAIL_FROM"))
    EMAILS_FROM_NAME: str = Field(default="ParkEase", validation_alias=AliasChoices("EMAILS_FROM_NAME", "SMTP_FROM_NAME", "MAIL_FROM_NAME"))
    SMTP_TLS: bool = Field(default=True, validation_alias=AliasChoices("SMTP_TLS", "SMTP_USE_TLS", "MAIL_USE_TLS"))

    @property
    def normalized_supabase_url(self) -> Optional[str]:
        """
        Returns normalized Supabase Edge Function HTTPS URL stripped of trailing slashes and spaces.
        """
        if not self.SUPABASE_EMAIL_FUNCTION_URL or not self.SUPABASE_EMAIL_FUNCTION_URL.strip():
            return None
        url = self.SUPABASE_EMAIL_FUNCTION_URL.strip().rstrip("/")
        if url.startswith("http://"):
            url = "https://" + url[7:]
        elif not url.startswith("https://"):
            url = "https://" + url
        return url

    @property
    def is_smtp_configured(self) -> bool:
        """
        Returns True if any valid email infrastructure (Supabase Edge Function, Resend API key, or SMTP credentials) is configured.
        """
        return bool(
            (self.normalized_supabase_url) or
            (self.RESEND_API_KEY and self.RESEND_API_KEY.strip()) or
            (self.SMTP_HOST and self.SMTP_HOST.strip() and self.SMTP_USER and self.SMTP_USER.strip() and self.SMTP_PASSWORD and self.SMTP_PASSWORD.strip())
        )

    model_config = SettingsConfigDict(
        env_file=(str(ROOT_ENV_FILE), str(LOCAL_ENV_FILE), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
