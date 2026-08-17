import httpx
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.models.wallet import Wallet
from app.models.refresh_token import RefreshToken
from app.core.security import create_access_token, create_refresh_token
from app.core.config import settings

class GoogleAuthService:
    @staticmethod
    def verify_google_id_token(id_token: str) -> Dict[str, Any]:
        """
        Verifies Google ID token against Google OAuth 2.0 tokeninfo API.
        Supports development mock tokens for automated tests.
        """
        # Development / Test Mock Token Handling
        if id_token.startswith("mock_google_token:"):
            parts = id_token.split(":")
            email = parts[1] if len(parts) > 1 else "googleuser@parkease.com"
            google_sub = parts[2] if len(parts) > 2 else "mock_google_sub_12345"
            name = parts[3].replace("-", " ") if len(parts) > 3 else "Google Test User"
            return {
                "sub": google_sub,
                "email": email.lower(),
                "email_verified": True,
                "name": name,
                "picture": "https://lh3.googleusercontent.com/a/default-avatar",
            }

        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(url)
                if resp.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid or expired Google token"
                    )
                data = resp.json()
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to reach Google authentication service"
            )

        # Validate issuer
        iss = data.get("iss")
        if iss not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token issuer"
            )

        # Validate audience (client ID) if configured
        if settings.GOOGLE_CLIENT_ID:
            aud = data.get("aud")
            if aud != settings.GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google token audience does not match application client ID"
                )

        # Verify email status
        email_verified = data.get("email_verified")
        if email_verified is not True and email_verified != "true":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google email address is not verified. Authentication rejected."
            )

        return {
            "sub": data["sub"],
            "email": data["email"].lower(),
            "email_verified": True,
            "name": data.get("name", "Google User"),
            "picture": data.get("picture"),
        }

    @classmethod
    def authenticate_google_user(cls, db: Session, id_token: str) -> dict:
        google_info = cls.verify_google_id_token(id_token)

        google_sub = google_info["sub"]
        email = google_info["email"]
        name = google_info["name"]
        picture = google_info.get("picture")

        # CASE C: Check by google_id
        user = db.query(User).filter(User.google_id == google_sub).first()

        if user:
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your account has been deactivated. Please contact support."
                )
            # Update avatar if provided
            if picture and not user.avatar_url:
                user.avatar_url = picture
                db.commit()
        else:
            # CASE B: Check by verified email
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                if not existing_user.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Your account has been deactivated. Please contact support."
                    )
                # Link Google Identity safely
                existing_user.google_id = google_sub
                existing_user.is_verified = True
                if existing_user.auth_provider == "email":
                    existing_user.auth_provider = "google+email"
                if picture and not existing_user.avatar_url:
                    existing_user.avatar_url = picture
                db.commit()
                db.refresh(existing_user)
                user = existing_user
            else:
                # CASE A: Create brand new USER account
                user = User(
                    email=email,
                    full_name=name,
                    google_id=google_sub,
                    auth_provider="google",
                    avatar_url=picture,
                    role=UserRole.USER,
                    is_verified=True,
                    hashed_password=None,
                )
                db.add(user)
                db.flush()

                # Automatically create Wallet
                user_wallet = Wallet(user_id=user.id, balance=0.0)
                db.add(user_wallet)
                db.commit()
                db.refresh(user)

        # Generate tokens
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

google_auth_service = GoogleAuthService()
