import pytest
import smtplib
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta
from app.models.user import User
from app.models.pending_registration import PendingRegistration
from app.services.otp_service import otp_service
from app.services.email_service import email_service
from app.core.config import Settings

def test_registration_creates_pending_registration_only(client, db_session):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "testotp@parkease.com",
            "full_name": "OTP Test User",
            "phone_number": "9112233445",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["email"] == "testotp@parkease.com"
    assert data["is_verified"] is False

    # Confirm NO row in main users table
    user = db_session.query(User).filter(User.email == "testotp@parkease.com").first()
    assert user is None

    # Confirm pending registration record IS created
    pending = db_session.query(PendingRegistration).filter(
        PendingRegistration.email == "testotp@parkease.com"
    ).first()
    assert pending is not None
    assert len(pending.otp_hash) == 64  # SHA-256 length
    assert pending.attempts_count == 0

def test_unverified_user_cannot_login(client):
    # Register unverified user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "unverified@parkease.com",
            "full_name": "Unverified User",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )

    # Attempt login before OTP verification
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": "unverified@parkease.com", "password": "Password123!"},
    )
    assert login_res.status_code == 403
    assert "not verified" in login_res.json()["detail"].lower()

def test_verify_email_success_creates_user_row(client, db_session):
    email = "successotp@parkease.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Success OTP",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )

    # Confirm user not in users table yet
    user_before = db_session.query(User).filter(User.email == email).first()
    assert user_before is None

    # Generate known OTP hash for testing
    raw_code = "654321"
    pending = db_session.query(PendingRegistration).filter(
        PendingRegistration.email == email
    ).first()
    pending.otp_hash = otp_service._hash_otp(raw_code)
    db_session.commit()

    # Submit verification request
    verify_res = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "otp": raw_code},
    )
    assert verify_res.status_code == 200
    user_data = verify_res.json()["data"]["user"]
    assert user_data["email"] == email
    assert user_data["is_verified"] is True

    # Confirm user is NOW created in users table
    user_after = db_session.query(User).filter(User.email == email).first()
    assert user_after is not None
    assert user_after.is_verified is True

    # Confirm pending record deleted from DB
    remaining_pending = db_session.query(PendingRegistration).filter(
        PendingRegistration.email == email
    ).first()
    assert remaining_pending is None

    # Login should now succeed
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": email, "password": "Password123!"},
    )
    assert login_res.status_code == 200

def test_verify_email_invalid_code(client, db_session):
    email = "invalidotp@parkease.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Invalid OTP",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )

    # Submit wrong code
    verify_res = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "otp": "000000"},
    )
    assert verify_res.status_code == 400
    assert "code isn't correct" in verify_res.json()["detail"].lower()

    # Check attempts count in DB
    pending = db_session.query(PendingRegistration).filter(
        PendingRegistration.email == email
    ).first()
    assert pending.attempts_count == 1

def test_verify_email_max_attempts_exceeded(client, db_session):
    email = "maxattempts@parkease.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Max Attempts User",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )

    pending = db_session.query(PendingRegistration).filter(
        PendingRegistration.email == email
    ).first()
    pending.attempts_count = 5
    db_session.commit()

    # Try verifying after max attempts reached
    verify_res = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "otp": "123456"},
    )
    assert verify_res.status_code == 400
    assert "too many incorrect attempts" in verify_res.json()["detail"].lower()

def test_verify_email_expired_code(client, db_session):
    email = "expiredotp@parkease.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Expired OTP User",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )

    pending = db_session.query(PendingRegistration).filter(
        PendingRegistration.email == email
    ).first()
    pending.expires_at = datetime.now(timezone.utc) - timedelta(minutes=15)
    db_session.commit()

    verify_res = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "otp": "123456"},
    )
    assert verify_res.status_code == 400
    assert "expired" in verify_res.json()["detail"].lower()

def test_resend_verification_cooldown(client):
    email = "cooldown@parkease.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Cooldown User",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )

    # Immediate resend request should trigger 429 Too Many Requests
    resend_res = client.post(
        "/api/v1/auth/resend-verification",
        json={"email": email},
    )
    assert resend_res.status_code == 429
    assert "please wait" in resend_res.json()["detail"].lower()

def test_resend_verification_success_after_cooldown(client, db_session):
    email = "resendsuccess@parkease.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Resend Success User",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )

    pending = db_session.query(PendingRegistration).filter(
        PendingRegistration.email == email
    ).first()
    # Fast-forward 65 seconds in the past
    pending.last_resent_at = datetime.now(timezone.utc) - timedelta(seconds=65)
    db_session.commit()

    resend_res = client.post(
        "/api/v1/auth/resend-verification",
        json={"email": email},
    )
    assert resend_res.status_code == 200
    assert "dispatched" in resend_res.json()["message"].lower()

def test_google_auth_user_is_auto_verified(client):
    google_res = client.post(
        "/api/v1/auth/google",
        json={"id_token": "mock_google_token:google_verified@parkease.com:sub_987:Verified-Google-User"},
    )
    assert google_res.status_code == 200
    user_data = google_res.json()["data"]["user"]
    assert user_data["email"] == "google_verified@parkease.com"
    assert user_data["is_verified"] is True

# ==============================================================================
# SMTP PRODUCTION PIPELINE & DIAGNOSTIC TESTS
# ==============================================================================

def test_smtp_alias_choices_detection():
    settings_alias = Settings(
        SMTP_HOST="smtp.gmail.com",
        SMTP_USERNAME="alias_user@gmail.com",
        SMTP_PASS="secret_password",
        SMTP_FROM_EMAIL="custom_from@parkease.com",
        SMTP_FROM_NAME="ParkEase Live",
    )
    assert settings_alias.SMTP_HOST == "smtp.gmail.com"
    assert settings_alias.SMTP_USER == "alias_user@gmail.com"
    assert settings_alias.SMTP_PASSWORD == "secret_password"
    assert settings_alias.EMAILS_FROM_EMAIL == "custom_from@parkease.com"
    assert settings_alias.EMAILS_FROM_NAME == "ParkEase Live"
    assert settings_alias.is_smtp_configured is True

def test_smtp_send_success_mock_smtp():
    with patch("smtplib.SMTP") as mock_smtp_cls:
        mock_server = MagicMock()
        mock_smtp_cls.return_value.__enter__.return_value = mock_server

        with patch("app.core.config.settings.SMTP_HOST", "smtp.gmail.com"), \
             patch("app.core.config.settings.SMTP_USER", "test@gmail.com"), \
             patch("app.core.config.settings.SMTP_PASSWORD", "app_password_123"):

            success, _ = email_service.send_otp_email("recipient@domain.com", "Test User", "123456")
            assert success is True
            mock_server.ehlo.assert_called()
            mock_server.starttls.assert_called()
            mock_server.login.assert_called_with("test@gmail.com", "app_password_123")
            mock_server.send_message.assert_called_once()

def test_smtp_auth_failure_handling():
    with patch("smtplib.SMTP") as mock_smtp_cls:
        mock_server = MagicMock()
        mock_server.login.side_effect = smtplib.SMTPAuthenticationError(535, b"5.7.8 Username and Password not accepted.")
        mock_smtp_cls.return_value.__enter__.return_value = mock_server

        with patch("app.core.config.settings.SMTP_HOST", "smtp.gmail.com"), \
             patch("app.core.config.settings.SMTP_USER", "invalid@gmail.com"), \
             patch("app.core.config.settings.SMTP_PASSWORD", "wrong_pass"):

            success, _ = email_service.send_otp_email("recipient@domain.com", "Test User", "123456")
            assert success is False

def test_production_missing_smtp_returns_false_and_no_mock():
    with patch("app.core.config.settings.SUPABASE_EMAIL_FUNCTION_URL", None), \
         patch("app.core.config.settings.RESEND_API_KEY", None), \
         patch("app.core.config.settings.SMTP_HOST", None), \
         patch("app.core.config.settings.SMTP_USER", None), \
         patch("app.core.config.settings.ENVIRONMENT", "production"):

        success, msg = email_service.send_otp_email("user@domain.com", "Prod User", "999888")
        assert success is False
        assert "not configured" in msg.lower()

def test_supabase_edge_function_email_success():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"success": True, "message_id": "msg_supabase_123"}

    with patch("httpx.Client.post", return_value=mock_resp) as mock_post, \
         patch("app.core.config.settings.SUPABASE_EMAIL_FUNCTION_URL", "https://xyz.supabase.co/functions/v1/send-parkease-verification-email"), \
         patch("app.core.config.settings.SUPABASE_EMAIL_FUNCTION_SECRET", "test_bearer_secret"):

        success, msg = email_service.send_otp_email("test@example.com", "Test User", "123456")
        assert success is True
        assert "successfully" in msg.lower()
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert kwargs["headers"]["Authorization"] == "Bearer test_bearer_secret"
        assert kwargs["json"]["to"] == "test@example.com"
        assert kwargs["json"]["otp"] == "123456"

def test_supabase_edge_function_email_failure_returns_false():
    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.json.return_value = {"success": False, "error": "UNAUTHORIZED_SERVER_REQUEST"}

    with patch("httpx.Client.post", return_value=mock_resp), \
         patch("app.core.config.settings.SUPABASE_EMAIL_FUNCTION_URL", "https://xyz.supabase.co/functions/v1/send-parkease-verification-email"), \
         patch("app.core.config.settings.SUPABASE_EMAIL_FUNCTION_SECRET", "wrong_secret"):

        success, msg = email_service.send_otp_email("test@example.com", "Test User", "123456")
        assert success is False
        assert "secret mismatch" in msg.lower() or "unauthorized" in msg.lower()

def test_resend_direct_https_api_success():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"id": "resend_msg_999"}

    with patch("httpx.Client.post", return_value=mock_resp) as mock_post, \
         patch("app.core.config.settings.SUPABASE_EMAIL_FUNCTION_URL", None), \
         patch("app.core.config.settings.RESEND_API_KEY", "re_123456789"), \
         patch("app.core.config.settings.PARKEASE_EMAIL_FROM", "ParkEase <onboarding@resend.dev>"):

        success, _ = email_service.send_otp_email("resend_recipient@example.com", "Resend User", "654321")
        assert success is True
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert kwargs["headers"]["Authorization"] == "Bearer re_123456789"
        assert kwargs["json"]["to"] == ["resend_recipient@example.com"]

