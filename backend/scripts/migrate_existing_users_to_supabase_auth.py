"""
ParkEase Script: Migrate Existing Users to Supabase Auth
Safely imports existing public.users into Supabase auth.users preserving UUIDs, bcrypt password hashes, and verification state.

Usage:
  python backend/scripts/migrate_existing_users_to_supabase_auth.py              (Dry-Run Mode)
  python backend/scripts/migrate_existing_users_to_supabase_auth.py --execute    (Live Execution Mode)
"""

import sys
import os
import argparse
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
load_dotenv(backend_dir / ".env")

supa_url = os.getenv("SUPABASE_DATABASE_URL")
if not supa_url:
    print("[ERROR] SUPABASE_DATABASE_URL environment variable is missing!")
    sys.exit(1)

def run_migration(execute: bool = False):
    mode_str = "LIVE EXECUTION" if execute else "DRY-RUN (SAFETY CHECK ONLY)"
    print("=" * 65)
    print(f"PARKEASE EXISTING USERS -> SUPABASE AUTH MIGRATION")
    print(f"MODE: {mode_str}")
    print("=" * 65)

    engine = create_engine(supa_url)

    with engine.connect() as conn:
        # 1. Fetch public.users
        public_users = conn.execute(text("""
            SELECT id, email, full_name, phone_number, role, is_verified, is_active, 
                   google_id, avatar_url, hashed_password, created_at, updated_at
            FROM public.users
            ORDER BY created_at ASC;
        """)).fetchall()

        user_count = len(public_users)
        print(f"\n[STEP 1] Audit Public Users: Found {user_count} existing users.")

        # Safety Check 1: User Count
        if user_count != 4:
            print(f"[SAFETY FAIL] Expected exactly 4 production users, but found {user_count}. Aborting.")
            sys.exit(1)

        # 2. Check auth.users existing rows
        auth_users = conn.execute(text("SELECT id, email FROM auth.users;")).fetchall()
        auth_user_map = {u[0]: u[1] for u in auth_users}
        print(f"[STEP 2] Audit auth.users: Found {len(auth_users)} existing auth users.")

        # Safety Check 2: Bcrypt & UUID Verification
        prepared_users = []
        for u in public_users:
            uid, email, full_name, phone, role, is_verified, is_active, google_id, avatar_url, pass_hash, created_at, updated_at = u

            # Password check
            if not pass_hash or not (pass_hash.startswith("$2b$") or pass_hash.startswith("$2a$")):
                print(f"[SAFETY FAIL] User {email} has missing or incompatible password hash! Aborting.")
                sys.exit(1)

            already_in_auth = uid in auth_user_map or email in auth_user_map.values()
            
            prepared_users.append({
                "id": uid,
                "email": email,
                "full_name": full_name,
                "phone": phone,
                "role": str(role),
                "is_verified": is_verified,
                "is_active": is_active,
                "google_id": google_id,
                "avatar_url": avatar_url,
                "hashed_password": pass_hash,
                "created_at": created_at,
                "updated_at": updated_at,
                "already_in_auth": already_in_auth,
            })

            status_str = "ALREADY IN AUTH.USERS" if already_in_auth else "READY FOR MIGRATION"
            print(f"  - [{status_str}] ID: {uid[:8]}... | Email: {email} | Role: {role}")

        # Summary of operations
        to_migrate = [u for u in prepared_users if not u["already_in_auth"]]
        print(f"\n[SUMMARY] Total: {user_count} | Ready to Import: {len(to_migrate)} | Already in Auth: {user_count - len(to_migrate)}")

        if not execute:
            print("\n" + "=" * 65)
            print("DRY-RUN COMPLETE: NO CHANGES WERE MADE TO THE DATABASE.")
            print("To perform actual migration, run with '--execute'.")
            print("=" * 65)
            return

        # LIVE EXECUTION MODE
        print("\n[STEP 3] Executing Live Import into auth.users and auth.identities...")
        with engine.begin() as tx_conn:
            for u in to_migrate:
                # Insert into auth.users
                insert_auth_user_sql = text("""
                    INSERT INTO auth.users (
                        id,
                        instance_id,
                        email,
                        encrypted_password,
                        email_confirmed_at,
                        confirmed_at,
                        raw_app_meta_data,
                        raw_user_meta_data,
                        aud,
                        role,
                        created_at,
                        updated_at
                    ) VALUES (
                        :id,
                        '00000000-0000-0000-0000-000000000000',
                        :email,
                        :hashed_password,
                        CASE WHEN :is_verified THEN NOW() ELSE NULL END,
                        CASE WHEN :is_verified THEN NOW() ELSE NULL END,
                        '{"provider":"email","providers":["email"]}',
                        json_build_object('full_name', :full_name, 'phone_number', :phone, 'avatar_url', :avatar_url),
                        'authenticated',
                        'authenticated',
                        :created_at,
                        :updated_at
                    )
                    ON CONFLICT (id) DO NOTHING;
                """)
                tx_conn.execute(insert_auth_user_sql, {
                    "id": u["id"],
                    "email": u["email"],
                    "hashed_password": u["hashed_password"],
                    "is_verified": u["is_verified"],
                    "full_name": u["full_name"],
                    "phone": u["phone"],
                    "avatar_url": u["avatar_url"],
                    "created_at": u["created_at"],
                    "updated_at": u["updated_at"],
                })

                # Insert email identity into auth.identities
                insert_identity_sql = text("""
                    INSERT INTO auth.identities (
                        id,
                        user_id,
                        identity_data,
                        provider,
                        last_sign_in_at,
                        created_at,
                        updated_at
                    ) VALUES (
                        :id,
                        :id,
                        json_build_object('sub', :id, 'email', :email),
                        'email',
                        NOW(),
                        :created_at,
                        :updated_at
                    )
                    ON CONFLICT (provider, id) DO NOTHING;
                """)
                tx_conn.execute(insert_identity_sql, {
                    "id": u["id"],
                    "email": u["email"],
                    "created_at": u["created_at"],
                    "updated_at": u["updated_at"],
                })

                print(f"  [IMPORTED] {u['email']} (UUID: {u['id'][:8]}...)")

        print("\n" + "=" * 65)
        print("LIVE MIGRATION EXECUTED SUCCESSFULLY 100%!")
        print("=" * 65)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate existing ParkEase users to Supabase Auth")
    parser.add_argument("--execute", action="store_true", help="Execute the actual database migration")
    args = parser.parse_args()

    run_migration(execute=args.execute)
