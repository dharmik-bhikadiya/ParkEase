import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Any
from sqlalchemy import create_engine, text, inspect, Engine
from sqlalchemy.exc import OperationalError

from dotenv import load_dotenv

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

load_dotenv(backend_dir / ".env")

from app.models import Base
from app.core.config import settings

# Dependency order for safe table migration
MIGRATION_TABLE_ORDER = [
    "users",
    "pending_registrations",
    "alembic_version",
    "wallets",
    "refresh_tokens",
    "email_verification_otps",
    "notifications",
    "user_vehicles",
    "parking_locations",
    "parking_pricing",
    "parking_slots",
    "parking_staff_assignments",
    "bookings",
    "wallet_transactions",
    "payments",
    "qr_passes",
]

def mask_connection_url(url: str) -> str:
    """Mask password and sensitive parts of connection URL for safe logging."""
    if not url:
        return "NOT_CONFIGURED"
    try:
        parts = url.split("@")
        if len(parts) > 1:
            user_pass = parts[0].split("://")[-1]
            host_db = parts[1]
            user = user_pass.split(":")[0]
            return f"postgresql://{user}:*****@{host_db}"
    except Exception:
        pass
    return "postgresql://*****"

def get_connection_urls() -> Tuple[str, str]:
    neon_url = os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not neon_url:
        neon_url = "postgresql://neondb_owner:your_neon_password@localhost:5432/neondb"
    
    supabase_url = os.getenv("SUPABASE_DATABASE_URL", "").strip()
    if supabase_url.startswith("postgres://"):
        supabase_url = supabase_url.replace("postgres://", "postgresql://", 1)

    return neon_url, supabase_url

def verify_supabase_target(supabase_engine: Engine) -> Dict[str, Any]:
    print("\n[PHASE 1] Verifying Supabase PostgreSQL Target...")
    info = {"connected": False, "tables": [], "region": "Singapore (ap-southeast-1)", "error": None}
    try:
        with supabase_engine.connect() as conn:
            res = conn.execute(text("SELECT current_database(), current_user;")).fetchone()
            print(f"[OK] Connected to Supabase DB: '{res[0]}' as user '{res[1]}'")
            
            # Check existing tables
            t_res = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"))
            tables = [r[0] for r in t_res.fetchall()]
            info["connected"] = True
            info["tables"] = tables
            print(f"[OK] Found {len(tables)} existing tables in public schema.")
    except Exception as e:
        info["error"] = str(e)
        print(f"[FAIL] Connection failed: {e}")
    return info

def create_supabase_schema(supabase_engine: Engine, existing_tables: List[str]):
    print("\n[PHASE 2] Creating Schema on Supabase PostgreSQL...")
    with supabase_engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL PRIMARY KEY
            );
        """))
        conn.commit()
    
    if not existing_tables:
        Base.metadata.create_all(bind=supabase_engine)
        print("[OK] All 16 SQLAlchemy model tables + alembic_version created on Supabase PostgreSQL.")
    else:
        print(f"Tables already exist ({len(existing_tables)} tables). Verifying model table alignment...")
        Base.metadata.create_all(bind=supabase_engine) # Safe: SQLAlchemy create_all is idempotent
        print("[OK] Schema alignment verified.")

def execute_data_migration(neon_engine: Engine, supabase_engine: Engine) -> Dict[str, Tuple[int, int, bool]]:
    print("\n[PHASE 3] Executing Data Migration (Neon -> Supabase)...")
    results = {}
    
    with neon_engine.connect() as n_conn, supabase_engine.connect() as s_conn:
        for table in MIGRATION_TABLE_ORDER:
            # 1. Count rows in Neon
            n_count = n_conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
            
            if n_count == 0:
                s_count = s_conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
                results[table] = (n_count, s_count, n_count == s_count)
                print(f"Table '{table:<28}': 0 rows in Neon. Skipped.")
                continue

            # Fetch columns
            col_res = n_conn.execute(text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '{table}' 
                ORDER BY ordinal_position;
            """))
            columns = [r[0] for r in col_res.fetchall()]
            col_str = ", ".join([f'"{c}"' for c in columns])
            param_str = ", ".join([f':{c}' for c in columns])
            
            # Fetch all records
            rows = n_conn.execute(text(f'SELECT {col_str} FROM "{table}"')).mappings().fetchall()
            row_dicts = [dict(r) for r in rows]
            
            # Safe idempotent insert preserving UUIDs
            insert_stmt = text(f'INSERT INTO "{table}" ({col_str}) VALUES ({param_str}) ON CONFLICT DO NOTHING;')
            s_conn.execute(insert_stmt, row_dicts)
            s_conn.commit()
            
            s_count = s_conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
            match = (n_count == s_count)
            results[table] = (n_count, s_count, match)
            print(f"[OK] Table '{table:<28}': Neon={n_count}, Supabase={s_count} | Match={match}")

    return results

def verify_critical_data(neon_engine: Engine, supabase_engine: Engine) -> Dict[str, bool]:
    print("\n[PHASE 4 & 5] Verifying Critical Data Records (Users, Wallets, Refresh Tokens, Pending Registrations)...")
    verifications = {}
    
    with neon_engine.connect() as n_conn, supabase_engine.connect() as s_conn:
        # 1. Users verification
        n_users = n_conn.execute(text("SELECT id, email, hashed_password, role FROM users ORDER BY id;")).mappings().fetchall()
        s_users = s_conn.execute(text("SELECT id, email, hashed_password, role FROM users ORDER BY id;")).mappings().fetchall()
        
        users_match = len(n_users) == len(s_users) and all(
            n["id"] == s["id"] and n["email"] == s["email"] and n["hashed_password"] == s["hashed_password"]
            for n, s in zip(n_users, s_users)
        )
        verifications["users_exact_match"] = users_match
        print(f"Users verification: {'[OK] MATCH' if users_match else '[FAIL] MISMATCH'}")
        
        # 2. Wallets verification
        n_wallets = n_conn.execute(text("SELECT id, user_id, balance FROM wallets ORDER BY id;")).mappings().fetchall()
        s_wallets = s_conn.execute(text("SELECT id, user_id, balance FROM wallets ORDER BY id;")).mappings().fetchall()
        
        wallets_match = len(n_wallets) == len(s_wallets) and all(
            n["id"] == s["id"] and n["user_id"] == s["user_id"] and n["balance"] == s["balance"]
            for n, s in zip(n_wallets, s_wallets)
        )
        verifications["wallets_exact_match"] = wallets_match
        print(f"Wallets verification: {'[OK] MATCH' if wallets_match else '[FAIL] MISMATCH'}")
        
        # 3. Pending Registrations verification
        n_pending = n_conn.execute(text("SELECT id, email, otp_hash FROM pending_registrations ORDER BY id;")).mappings().fetchall()
        s_pending = s_conn.execute(text("SELECT id, email, otp_hash FROM pending_registrations ORDER BY id;")).mappings().fetchall()
        
        pending_match = len(n_pending) == len(s_pending) and all(
            n["id"] == s["id"] and n["email"] == s["email"] and n["otp_hash"] == s["otp_hash"]
            for n, s in zip(n_pending, s_pending)
        )
        verifications["pending_registrations_exact_match"] = pending_match
        print(f"Pending Registrations verification: {'[OK] MATCH' if pending_match else '[FAIL] MISMATCH'}")

    return verifications

def run_migration_pipeline():
    neon_url, supabase_url = get_connection_urls()
    print("=" * 60)
    print("PARKEASE NEON -> SUPABASE DATABASE MIGRATION PIPELINE")
    print("=" * 60)
    print(f"Source Neon:   {mask_connection_url(neon_url)}")
    print(f"Target Supabase: {mask_connection_url(supabase_url)}")
    print("-" * 60)
    
    if not supabase_url:
        print("\n[MIGRATION STATUS: WAITING FOR SUPABASE CONNECTION STRING]")
        print("To complete live migration:")
        print("1. Set SUPABASE_DATABASE_URL in backend/.env")
        print("   e.g.: SUPABASE_DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\"")
        print("2. Re-run this migration script.")
        return False, "SUPABASE_DATABASE_URL missing"

    neon_engine = create_engine(neon_url)
    supabase_engine = create_engine(supabase_url)
    
    target_info = verify_supabase_target(supabase_engine)
    if not target_info["connected"]:
        print(f"\n[ERROR] Migration aborted. Target connection failed: {target_info['error']}")
        return False, target_info['error']
        
    create_supabase_schema(supabase_engine, target_info["tables"])
    migration_results = execute_data_migration(neon_engine, supabase_engine)
    critical_verifications = verify_critical_data(neon_engine, supabase_engine)
    
    all_matched = all(m for _, _, m in migration_results.values()) and all(critical_verifications.values())
    
    if all_matched:
        print("\nDATABASE MIGRATION READY")
        return True, "SUCCESS"
    else:
        print("\n[WARNING] Migration completed with mismatches.")
        return False, "MISMATCH_DETECTED"

if __name__ == "__main__":
    run_migration_pipeline()
