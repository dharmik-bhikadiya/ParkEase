import pytest
from datetime import datetime, timezone, timedelta
from app.models.user import User
from app.models.email_verification import EmailVerificationOTP
from app.services.otp_service import otp_service

def test_registration_creates_unverified_user_and_otp(client, db_session):
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
    assert data["user"]["is_verified"] is False

    # Verify user in database
    user = db_session.query(User).filter(User.email == "testotp@parkease.com").first()
    assert user is not None
    assert user.is_verified is False

    # Verify OTP record created
    otp_record = db_session.query(EmailVerificationOTP).filter(
        EmailVerificationOTP.user_id == user.id
    ).first()
    assert otp_record is not None
    assert len(otp_record.otp_hash) == 64  # SHA-256 length
    assert otp_record.attempts_count == 0

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

    # Attempt login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": "unverified@parkease.com", "password": "Password123!"},
    )
    assert login_res.status_code == 403
    assert "not verified" in login_res.json()["detail"].lower()

def test_verify_email_success(client, db_session):
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

    # Generate known code for testing
    user = db_session.query(User).filter(User.email == email).first()
    raw_code = "654321"
    otp_record = db_session.query(EmailVerificationOTP).filter(
        EmailVerificationOTP.user_id == user.id
    ).first()
    otp_record.otp_hash = otp_service._hash_otp(raw_code)
    db_session.commit()

    # Submit verification request
    verify_res = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "otp": raw_code},
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["data"]["user"]["is_verified"] is True

    # Confirm OTP record deleted from DB
    remaining_otp = db_session.query(EmailVerificationOTP).filter(
        EmailVerificationOTP.user_id == user.id
    ).first()
    assert remaining_otp is None

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
    user = db_session.query(User).filter(User.email == email).first()
    otp_record = db_session.query(EmailVerificationOTP).filter(
        EmailVerificationOTP.user_id == user.id
    ).first()
    assert otp_record.attempts_count == 1

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

    user = db_session.query(User).filter(User.email == email).first()
    otp_record = db_session.query(EmailVerificationOTP).filter(
        EmailVerificationOTP.user_id == user.id
    ).first()
    otp_record.attempts_count = 5
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

    user = db_session.query(User).filter(User.email == email).first()
    otp_record = db_session.query(EmailVerificationOTP).filter(
        EmailVerificationOTP.user_id == user.id
    ).first()
    otp_record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=15)
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

    user = db_session.query(User).filter(User.email == email).first()
    otp_record = db_session.query(EmailVerificationOTP).filter(
        EmailVerificationOTP.user_id == user.id
    ).first()
    # Fast-forward 65 seconds in the past
    otp_record.last_resent_at = datetime.now(timezone.utc) - timedelta(seconds=65)
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
