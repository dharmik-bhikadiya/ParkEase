from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import (
    UserCreate,
    UserLogin,
    GoogleAuthRequest,
    UserResponse,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenRefreshRequest,
    VerifyEmailRequest,
    ResendVerificationRequest,
)
from app.schemas.response import APIResponse
from app.services.auth_service import auth_service
from app.services.google_auth_service import google_auth_service
from app.services.otp_service import otp_service
from app.core.security import create_access_token, create_refresh_token
from app.models.refresh_token import RefreshToken

router = APIRouter()

@router.post("/register", response_model=APIResponse[Token], status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new ParkEase user with email, mobile, and password validation.
    """
    result = auth_service.register_user(db, user_in)
    return APIResponse(
        message="User registered successfully",
        data=Token(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
            token_type=result["token_type"],
            user=UserResponse.model_validate(result["user"])
        )
    )

@router.post("/login", response_model=APIResponse[Token])
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user via email/mobile and password, issuing access & refresh tokens.
    """
    result = auth_service.authenticate_user(db, credentials)
    return APIResponse(
        message="Login successful",
        data=Token(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
            token_type=result["token_type"],
            user=UserResponse.model_validate(result["user"])
        )
    )

@router.post("/google", response_model=APIResponse[Token])
def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate or register user via verified Google OAuth 2.0 ID Token.
    """
    result = google_auth_service.authenticate_google_user(db, request.id_token)
    return APIResponse(
        message="Google authentication successful",
        data=Token(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
            token_type=result["token_type"],
            user=UserResponse.model_validate(result["user"])
        )
    )

@router.post("/refresh", response_model=APIResponse[Token])
def refresh(refresh_in: TokenRefreshRequest, db: Session = Depends(get_db)):
    """
    Issue a new JWT access token using a valid refresh token.
    """
    result = auth_service.refresh_access_token(db, refresh_in)
    return APIResponse(
        message="Token refreshed successfully",
        data=Token(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
            token_type=result["token_type"],
            user=UserResponse.model_validate(result["user"])
        )
    )

@router.post("/logout", response_model=APIResponse[None])
def logout(refresh_token: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Revoke user refresh token and terminate active session.
    """
    auth_service.logout_user(db, refresh_token)
    return APIResponse(message="Logged out successfully")

@router.post("/forgot-password", response_model=APIResponse[dict])
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiate password reset via email or mobile.
    """
    reset_token = auth_service.forgot_password(db, request)
    return APIResponse(
        message="If an account exists with the provided email/mobile, password reset instructions have been dispatched.",
        data={"reset_token": reset_token}
    )

@router.post("/reset-password", response_model=APIResponse[None])
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset user password using a valid reset token.
    """
    auth_service.reset_password(db, request)
    return APIResponse(message="Password reset successfully. You can now login with your new password.")

@router.post("/verify-email", response_model=APIResponse[Token])
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    Verify user account using the 6-digit OTP sent to their email and issue active access tokens.
    """
    user = otp_service.verify_otp(db, email=request.email, raw_otp=request.otp)
    
    # Issue active JWT tokens upon successful email verification
    access_token = create_access_token(subject=user.id, role=user.role.value)
    raw_refresh, refresh_hash, expires_at = create_refresh_token(subject=user.id)

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=refresh_hash,
        expires_at=expires_at,
    ))
    db.commit()

    return APIResponse(
        message="Email verified successfully. Your ParkEase account is active and ready.",
        data=Token(
            access_token=access_token,
            refresh_token=raw_refresh,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
    )

@router.post("/resend-verification", response_model=APIResponse[None])
def resend_verification(request: ResendVerificationRequest, db: Session = Depends(get_db)):
    """
    Resend verification OTP email enforcing 60-second cooldown period.
    """
    otp_service.resend_otp(db, email=request.email)
    return APIResponse(
        message="A new 6-digit verification code has been dispatched to your email address."
    )
