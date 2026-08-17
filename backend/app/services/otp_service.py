import secrets
import string
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.models.wallet import Wallet
from app.models.pending_registration import PendingRegistration
from app.models.refresh_token import RefreshToken
from app.services.email_service import email_service
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token

def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

class OTPService:
    @staticmethod
    def _generate_6digit_code() -> str:
        return "".join(secrets.choice(string.digits) for _ in range(6))

    @staticmethod
    def _hash_otp(raw_otp: str) -> str:
        salted = f"parkease_otp_salt_{raw_otp}_{settings.SECRET_KEY}"
        return hashlib.sha256(salted.encode("utf-8")).hexdigest()

    @classmethod
    def create_and_send_pending_otp(
        cls,
        db: Session,
        email: str,
        full_name: str,
        phone_number: str | None,
        hashed_password: str,
        role: str
    ) -> None:
        """
        Creates or updates a pending registration in pending_registrations table.
        Does NOT insert any row into the main users table yet.
        """
        clean_email = email.lower().strip()
        now = datetime.now(timezone.utc)
        raw_otp = cls._generate_6digit_code()
        otp_hash = cls._hash_otp(raw_otp)
        expires_at = now + timedelta(minutes=10)

        pending = db.query(PendingRegistration).filter(
            PendingRegistration.email == clean_email
        ).first()

        if pending:
            pending.full_name = full_name.strip()
            pending.phone_number = phone_number.strip() if phone_number else None
            pending.password_hash = hashed_password
            pending.role = role
            pending.otp_hash = otp_hash
            pending.attempts_count = 0
            pending.expires_at = expires_at
            pending.last_resent_at = now
        else:
            pending = PendingRegistration(
                email=clean_email,
                full_name=full_name.strip(),
                phone_number=phone_number.strip() if phone_number else None,
                password_hash=hashed_password,
                role=role,
                otp_hash=otp_hash,
                attempts_count=0,
                expires_at=expires_at,
                last_resent_at=now,
                created_at=now,
            )
            db.add(pending)

        db.commit()

        # Send branded HTML verification email
        sent = email_service.send_otp_email(
            recipient_email=clean_email,
            recipient_name=full_name,
            otp_code=raw_otp
        )

        if not sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to send verification email. Please try again or check server email settings."
            )

    @classmethod
    def resend_pending_otp(cls, db: Session, email: str) -> None:
        """
        Resends verification OTP for a pending registration with 60s cooldown limit.
        """
        clean_email = email.lower().strip()

        # Check if user already exists in main users table
        existing_user = db.query(User).filter(User.email == clean_email).first()
        if existing_user:
            if existing_user.is_verified:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Your email is already verified. Please sign in."
                )

        pending = db.query(PendingRegistration).filter(
            PendingRegistration.email == clean_email
        ).first()

        if not pending:
            # Prevent enumeration: silent return if no pending registration
            return

        now = datetime.now(timezone.utc)
        last_resent = _ensure_utc(pending.last_resent_at)
        elapsed_seconds = (now - last_resent).total_seconds()
        if elapsed_seconds < 60:
            cooldown_remaining = int(60 - elapsed_seconds)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {cooldown_remaining} seconds before requesting another code."
            )

        raw_otp = cls._generate_6digit_code()
        pending.otp_hash = cls._hash_otp(raw_otp)
        pending.attempts_count = 0
        pending.expires_at = now + timedelta(minutes=10)
        pending.last_resent_at = now
        db.commit()

        sent = email_service.send_otp_email(
            recipient_email=pending.email,
            recipient_name=pending.full_name,
            otp_code=raw_otp
        )

        if not sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to send verification email. Please try again."
            )

    @classmethod
    def verify_otp_and_create_user(cls, db: Session, email: str, raw_otp: str) -> Tuple[User, str, str]:
        """
        Verifies 6-digit OTP code against pending_registrations.
        UPON SUCCESSFUL VERIFICATION ONLY:
        1. Inserts User row into main users table (is_verified=True).
        2. Creates initial Wallet.
        3. Deletes row from pending_registrations.
        4. Generates and stores JWT Access & Refresh Tokens.
        """
        clean_otp = raw_otp.strip()
        if len(clean_otp) != 6 or not clean_otp.isdigit():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="That code isn't correct. Please check your email and try again."
            )

        clean_email = email.lower().strip()

        # Check if already verified user exists
        existing_user = db.query(User).filter(User.email == clean_email).first()
        if existing_user and existing_user.is_verified:
            access_token = create_access_token(subject=existing_user.id, role=existing_user.role.value)
            raw_refresh, refresh_hash, expires_at = create_refresh_token(subject=existing_user.id)
            return existing_user, access_token, raw_refresh

        pending = db.query(PendingRegistration).filter(
            PendingRegistration.email == clean_email
        ).first()

        if not pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active verification session found. Please register first."
            )

        now = datetime.now(timezone.utc)

        # Check Expiration (10 mins)
        if now > _ensure_utc(pending.expires_at):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This code has expired. Please request a new verification code."
            )

        # Check Attempt Limit (5 attempts)
        if pending.attempts_count >= 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many incorrect attempts. Please request a new code."
            )

        # Hash Verification
        submitted_hash = cls._hash_otp(clean_otp)
        if submitted_hash != pending.otp_hash:
            pending.attempts_count += 1
            db.commit()

            remaining_attempts = 5 - pending.attempts_count
            if remaining_attempts <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Too many incorrect attempts. Please request a new code."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"That code isn't correct. {remaining_attempts} attempt(s) remaining."
            )

        # ==============================================================================
        # SUCCESSFUL VERIFICATION — CREATE USER IN DATABASE HERE ONLY!
        # ==============================================================================
        try:
            role_enum = UserRole[pending.role] if pending.role in UserRole.__members__ else UserRole.USER
        except Exception:
            role_enum = UserRole.USER

        new_user = User(
            email=pending.email,
            full_name=pending.full_name,
            phone_number=pending.phone_number,
            hashed_password=pending.password_hash,
            role=role_enum,
            is_active=True,
            is_verified=True,
            auth_provider="email",
        )
        db.add(new_user)
        db.flush()

        # Initialize Wallet
        user_wallet = Wallet(user_id=new_user.id, balance=0.0)
        db.add(user_wallet)

        # Remove Pending Registration
        db.delete(pending)

        # Generate Tokens
        access_token = create_access_token(subject=new_user.id, role=new_user.role.value)
        raw_refresh, refresh_hash, expires_at = create_refresh_token(subject=new_user.id)

        db.add(RefreshToken(
            user_id=new_user.id,
            token_hash=refresh_hash,
            expires_at=expires_at,
        ))

        db.commit()
        db.refresh(new_user)

        return new_user, access_token, raw_refresh

otp_service = OTPService()
