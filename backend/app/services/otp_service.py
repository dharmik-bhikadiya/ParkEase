import secrets
import string
import hashlib
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.email_verification import EmailVerificationOTP
from app.services.email_service import email_service
from app.core.config import settings

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
    def create_and_send_otp(cls, db: Session, user: User) -> None:
        """
        Generates a 6-digit OTP, stores its SHA-256 hash in the database,
        and dispatches a branded verification email to the user.
        """
        if user.is_verified:
            return

        now = datetime.now(timezone.utc)
        raw_otp = cls._generate_6digit_code()
        otp_hash = cls._hash_otp(raw_otp)
        expires_at = now + timedelta(minutes=10)

        otp_record = db.query(EmailVerificationOTP).filter(
            EmailVerificationOTP.user_id == user.id
        ).first()

        if otp_record:
            otp_record.otp_hash = otp_hash
            otp_record.attempts_count = 0
            otp_record.expires_at = expires_at
            otp_record.last_resent_at = now
        else:
            otp_record = EmailVerificationOTP(
                user_id=user.id,
                otp_hash=otp_hash,
                attempts_count=0,
                expires_at=expires_at,
                last_resent_at=now,
                created_at=now,
            )
            db.add(otp_record)

        db.commit()

        # Send branded HTML verification email
        email_service.send_otp_email(
            recipient_email=user.email,
            recipient_name=user.full_name,
            otp_code=raw_otp
        )

    @classmethod
    def resend_otp(cls, db: Session, email: str) -> None:
        """
        Resends verification OTP enforcing a strict 60-second cooldown period.
        Invalidates previous OTP upon resending.
        """
        clean_email = email.lower().strip()
        user = db.query(User).filter(User.email == clean_email).first()
        if not user:
            # Prevent account enumeration: raise generic success response in endpoint
            return

        if user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your email is already verified. Please sign in."
            )

        now = datetime.now(timezone.utc)
        otp_record = db.query(EmailVerificationOTP).filter(
            EmailVerificationOTP.user_id == user.id
        ).first()

        if otp_record:
            last_resent = _ensure_utc(otp_record.last_resent_at)
            elapsed_seconds = (now - last_resent).total_seconds()
            if elapsed_seconds < 60:
                cooldown_remaining = int(60 - elapsed_seconds)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {cooldown_remaining} seconds before requesting another code."
                )

        cls.create_and_send_otp(db, user)

    @classmethod
    def verify_otp(cls, db: Session, email: str, raw_otp: str) -> User:
        """
        Verifies the user-submitted 6-digit OTP code against the hashed record.
        Enforces 10-minute expiry, max 5 failed attempts limit, and invalidates OTP upon success.
        """
        clean_otp = raw_otp.strip()
        if len(clean_otp) != 6 or not clean_otp.isdigit():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="That code isn't correct. Please check your email and try again."
            )

        clean_email = email.lower().strip()
        user = db.query(User).filter(User.email == clean_email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found. Please register first."
            )

        if user.is_verified:
            return user

        otp_record = db.query(EmailVerificationOTP).filter(
            EmailVerificationOTP.user_id == user.id
        ).first()

        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active verification code found. Please request a new code."
            )

        now = datetime.now(timezone.utc)

        # Check Expiration (10 mins)
        if now > _ensure_utc(otp_record.expires_at):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This code has expired. Request a new verification code."
            )

        # Check Maximum Attempt Limit (5 attempts)
        if otp_record.attempts_count >= 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many incorrect attempts. Please request a new code."
            )

        # Hash check
        submitted_hash = cls._hash_otp(clean_otp)
        if submitted_hash != otp_record.otp_hash:
            otp_record.attempts_count += 1
            db.commit()
            
            remaining_attempts = 5 - otp_record.attempts_count
            if remaining_attempts <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Too many incorrect attempts. Please request a new code."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"That code isn't correct. {remaining_attempts} attempt(s) remaining."
            )

        # Successful Verification
        user.is_verified = True
        db.delete(otp_record)
        db.commit()
        db.refresh(user)

        return user

otp_service = OTPService()
