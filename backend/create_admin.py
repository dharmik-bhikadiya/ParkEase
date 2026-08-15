import sys
import argparse
import getpass
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.wallet import Wallet
from app.core.security import get_password_hash, validate_strong_password
from app.repositories.user_repository import user_repository

def create_admin_cli():
    parser = argparse.ArgumentParser(description="ParkEase - Safe Development CLI for Creating Admin Accounts")
    parser.add_argument("--email", type=str, help="Admin user email address")
    parser.add_argument("--password", type=str, help="Admin user password")
    parser.add_argument("--name", type=str, help="Admin full name")

    args = parser.parse_args()

    email = args.email
    password = args.password
    full_name = args.name

    # Interactive prompts if arguments are missing
    if not email:
        email = input("Enter Admin Email: ").strip()

    if not email:
        print("❌ Error: Email cannot be empty.")
        sys.exit(1)

    if not full_name:
        full_name = input("Enter Admin Full Name: ").strip() or "ParkEase Administrator"

    if not password:
        password = getpass.getpass("Enter Secure Admin Password: ").strip()

    if not password:
        print("❌ Error: Password cannot be empty.")
        sys.exit(1)

    is_strong, err_msg = validate_strong_password(password)
    if not is_strong:
        print(f"❌ Error: Password does not meet security requirements: {err_msg}")
        sys.exit(1)

    db = SessionLocal()
    try:
        target_role = UserRole.ADMIN

        existing_user = user_repository.get_by_email(db, email)
        if existing_user:
            print(f"ℹ️ User with email '{email}' already exists.")
            existing_user.role = target_role
            existing_user.hashed_password = get_password_hash(password)
            existing_user.is_active = True
            db.commit()
            print(f"✅ User '{email}' role set to {target_role.value} successfully!")
        else:
            hashed_pwd = get_password_hash(password)
            new_admin = User(
                email=email.lower().strip(),
                hashed_password=hashed_pwd,
                full_name=full_name.strip(),
                role=target_role,
                is_active=True,
                auth_provider="email"
            )
            db.add(new_admin)
            db.flush()

            # Initialize wallet for admin
            db.add(Wallet(user_id=new_admin.id, balance=10000.0))
            db.commit()
            print(f"🎉 Successfully created new {target_role.value} account for '{email}'!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin account: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_cli()
