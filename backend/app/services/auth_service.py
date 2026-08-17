from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.models.wallet import Wallet
from app.models.refresh_token import RefreshToken
from app.models.parking import ParkingLocation
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserUpdate,
    PasswordChange,
    CreatePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenRefreshRequest,
)
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token,
    validate_strong_password,
    validate_phone_number,
)
from app.repositories.user_repository import user_repository
from app.services.otp_service import otp_service

def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

# Clean Mock Notification Service Interface
class MockNotificationService:
    @staticmethod
    def send_password_reset_notification(recipient: str, reset_token: str) -> None:
        # Development mock logger (never log raw tokens in production logs)
        print(f"[MOCK NOTIFICATION SERVICE] Password reset token generated for {recipient}")

class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> dict:
        if user_in.password != user_in.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password and Confirm Password do not match"
            )

        is_strong, password_err = validate_strong_password(user_in.password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=password_err
            )

        existing_email = user_repository.get_by_email(db, user_in.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

        if user_in.phone_number:
            if not validate_phone_number(user_in.phone_number):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid phone number format"
                )
            existing_phone = user_repository.get_by_phone(db, user_in.phone_number)
            if existing_phone:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this mobile number already exists"
                )

        hashed_password = get_password_hash(user_in.password)
        new_user = User(
            email=user_in.email.lower().strip(),
            hashed_password=hashed_password,
            full_name=user_in.full_name.strip(),
            phone_number=user_in.phone_number.strip() if user_in.phone_number else None,
            role=user_in.role or UserRole.USER,
            is_verified=False,
        )
        db.add(new_user)
        db.flush()

        # Initialize User Wallet automatically
        user_wallet = Wallet(user_id=new_user.id, balance=0.0)
        db.add(user_wallet)

        # Generate and dispatch 6-digit OTP verification email
        otp_service.create_and_send_otp(db, new_user)

        # Generate tokens
        access_token = create_access_token(subject=new_user.id, role=new_user.role.value)
        raw_refresh, refresh_hash, expires_at = create_refresh_token(subject=new_user.id)

        db.add(RefreshToken(
            user_id=new_user.id,
            token_hash=refresh_hash,
            expires_at=expires_at,
        ))
        db.commit()
        db.refresh(new_user)

        return {
            "access_token": access_token,
            "refresh_token": raw_refresh,
            "token_type": "bearer",
            "user": new_user,
        }

    @staticmethod
    def authenticate_user(db: Session, credentials: UserLogin) -> dict:
        user = user_repository.get_by_email_or_phone(db, credentials.email_or_phone.strip())
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated or blocked. Please contact support."
            )

        if not user.is_verified:
            # Re-trigger OTP verification email if user attempts login while unverified
            otp_service.create_and_send_otp(db, user)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your email address is not verified. A verification code has been sent to your email."
            )

        access_token = create_access_token(subject=user.id, role=user.role.value)
        raw_refresh, refresh_hash, expires_at = create_refresh_token(subject=user.id)

        db.add(RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=expires_at,
        ))
        db.commit()

        return {
            "access_token": access_token,
            "refresh_token": raw_refresh,
            "token_type": "bearer",
            "user": user,
        }

    @staticmethod
    def refresh_access_token(db: Session, refresh_in: TokenRefreshRequest) -> dict:
        token_hash = hash_token(refresh_in.refresh_token)
        stored_token = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False
        ).first()

        if not stored_token or _ensure_utc(stored_token.expires_at) < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        user = user_repository.get_by_id(db, stored_token.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )

        new_access_token = create_access_token(subject=user.id, role=user.role.value)
        return {
            "access_token": new_access_token,
            "refresh_token": refresh_in.refresh_token,
            "token_type": "bearer",
            "user": user,
        }

    @staticmethod
    def logout_user(db: Session, refresh_token_str: Optional[str]) -> None:
        if refresh_token_str:
            token_hash = hash_token(refresh_token_str)
            db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).update({"revoked": True})
            db.commit()

    @staticmethod
    def forgot_password(db: Session, request: ForgotPasswordRequest) -> str:
        user = user_repository.get_by_email_or_phone(db, request.email_or_phone.strip())
        # Return generic success response to prevent account enumeration attacks
        if user:
            raw_token, token_hash, expires_at = create_refresh_token(subject=user.id)
            db.add(RefreshToken(
                user_id=user.id,
                token_hash=token_hash,
                expires_at=datetime.now(timezone.utc) + timedelta(hours=2),
            ))
            db.commit()
            MockNotificationService.send_password_reset_notification(user.email, raw_token)
            return raw_token
        return "mock_reset_token"

    @staticmethod
    def reset_password(db: Session, request: ResetPasswordRequest) -> None:
        if request.new_password != request.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password and confirm password do not match"
            )

        is_strong, err = validate_strong_password(request.new_password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=err
            )

        token_hash = hash_token(request.token)
        token_entry = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False
        ).first()

        if not token_entry or _ensure_utc(token_entry.expires_at) < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )

        user = user_repository.get_by_id(db, token_entry.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        user.hashed_password = get_password_hash(request.new_password)
        token_entry.revoked = True
        db.commit()

    @staticmethod
    def update_profile(db: Session, user: User, user_in: UserUpdate) -> User:
        if user_in.full_name is not None:
            user.full_name = user_in.full_name.strip()
        if user_in.phone_number is not None:
            clean_phone = user_in.phone_number.strip()
            if not validate_phone_number(clean_phone):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid phone number format"
                )
            existing = user_repository.get_by_phone(db, clean_phone)
            if existing and existing.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Mobile number already registered to another user"
                )
            user.phone_number = clean_phone
        if user_in.avatar_url is not None:
            user.avatar_url = user_in.avatar_url.strip()

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def change_password(db: Session, user: User, pwd_in: PasswordChange) -> None:
        if not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have a password set. Use create password instead."
            )

        if not verify_password(pwd_in.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password"
            )

        if pwd_in.new_password != pwd_in.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password and confirm password do not match"
            )

        is_strong, err = validate_strong_password(pwd_in.new_password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=err
            )

        user.hashed_password = get_password_hash(pwd_in.new_password)
        db.commit()

    @staticmethod
    def create_password(db: Session, user: User, pwd_in: CreatePasswordRequest) -> None:
        if user.hashed_password is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has a password set. Use change password instead."
            )

        if pwd_in.new_password != pwd_in.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password and confirm password do not match"
            )

        is_strong, err = validate_strong_password(pwd_in.new_password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=err
            )

        user.hashed_password = get_password_hash(pwd_in.new_password)
        if user.auth_provider == "google":
            user.auth_provider = "google+email"
        db.commit()


    @staticmethod
    def delete_user_account(db: Session, target_user: User, requesting_user: User) -> None:
        """
        Safely delete a user account and all exclusive dependent data in an atomic transaction.
        Enforces RBAC and guards protected Admin accounts.
        """
        # Authorization check
        is_self_delete = (target_user.id == requesting_user.id)
        is_admin = (requesting_user.role == UserRole.ADMIN)

        if not (is_self_delete or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this user account."
            )

        # Protected Admin Guard: Prevent deleting the only remaining Admin account
        if target_user.role == UserRole.ADMIN:
            admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete the sole system Administrator account."
                )

        # Parking Location Ownership Guard: Block deletion if user owns parking locations
        owned_locations_count = db.query(ParkingLocation).filter(ParkingLocation.owner_id == target_user.id).count()
        if owned_locations_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete user account that owns {owned_locations_count} parking location(s). Please transfer or remove parking location ownership first."
            )

        try:
            db.delete(target_user)
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to complete user account deletion: {str(e)}"
            )

auth_service = AuthService()
