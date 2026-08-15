import sys
import os
import getpass
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 1. Load backend/.env explicitly
env_path = Path("backend/.env")
if not env_path.exists():
    print("ERROR: backend/.env file not found!")
    sys.exit(1)

load_dotenv(dotenv_path=env_path, override=True)

sys.path.insert(0, "backend")

from app.core.config import settings
from app.models.user import User, UserRole
from app.core.security import get_password_hash, verify_password, validate_strong_password

db_url = settings.sync_database_url

# 2. Strict Neon PostgreSQL check
if "neon.tech" not in db_url and "postgresql" not in db_url:
    print("ABORTING: DATABASE_URL is not pointing to Neon PostgreSQL!")
    sys.exit(1)

engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 15})

# Test connection identity
try:
    with engine.connect() as conn:
        db_name = conn.execute(text("SELECT current_database();")).scalar()
        db_user = conn.execute(text("SELECT current_user;")).scalar()
        if db_name != "neondb":
            print("ABORTING: Connected database name is not 'neondb'!")
            sys.exit(1)
except Exception as e:
    print(f"ABORTING: Failed to connect to Neon PostgreSQL: {e}")
    sys.exit(1)

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    admin = db.query(User).filter(User.email == "admin@parkease.in", User.role == UserRole.ADMIN).first()
    if not admin:
        print("ERROR: Admin user admin@parkease.in not found!")
        sys.exit(1)

    # 3. Check for password without hardcoding or using default
    new_password = os.environ.get("ADMIN_NEW_PASSWORD")
    if not new_password:
        if sys.stdin.isatty():
            new_password = getpass.getpass("Enter your new Admin Password: ").strip()
        else:
            print("INTERACTIVE_INPUT_UNAVAILABLE: Please set $env:ADMIN_NEW_PASSWORD or run interactively.")
            sys.exit(2)

    is_strong, err = validate_strong_password(new_password)
    if not is_strong:
        print(f"ERROR: Password validation failed: {err}")
        sys.exit(1)

    # 4. Hash and update
    admin.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(admin)

    # 5. Verify via verify_password()
    auth_success = verify_password(new_password, admin.hashed_password)
    assert auth_success is True, "Verification failed"

    print("PASSWORD_UPDATE_SUCCESSFUL")
    print(f"Admin Email: {admin.email}")
    print(f"Role: {admin.role.value}")
    print(f"Active Status: {admin.is_active}")
    print("Password update successful: True")
    print("Password verification successful: True")

finally:
    db.close()
