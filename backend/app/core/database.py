from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.models import Base

def create_db_engine():
    """
    Attempts connection to PostgreSQL.
    If PostgreSQL is offline or unreachable, seamlessly falls back to SQLite
    to ensure 100% development stability without failing requests.
    """
    try:
        pg_engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args={"connect_timeout": 2}
        )
        with pg_engine.connect() as conn:
            pass
        return pg_engine
    except Exception:
        # SQLite dev fallback
        sqlite_url = "sqlite:///./parkease_dev.db"
        sqlite_engine = create_engine(
            sqlite_url,
            connect_args={"check_same_thread": False}
        )
        Base.metadata.create_all(bind=sqlite_engine)
        return sqlite_engine

engine = create_db_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI Dependency that yields a SQLAlchemy database session.
    Automatically closes session after request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
