import pytest
from app.models.user import User
from app.models.pending_registration import PendingRegistration
from app.services.otp_service import otp_service

def test_user_registration(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "driver@parkease.com",
            "full_name": "Test Driver",
            "phone_number": "9876543210",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "driver@parkease.com"
    assert data["data"]["is_verified"] is False

def test_user_registration_weak_password(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "weak@parkease.com",
            "full_name": "Weak Password User",
            "password": "123",
            "confirm_password": "123",
            "role": "USER",
        },
    )
    assert response.status_code == 400
    assert "Password must be at least 8 characters long" in response.json()["detail"]

def test_user_registration_password_mismatch(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "mismatch@parkease.com",
            "full_name": "Mismatch User",
            "password": "Password123!",
            "confirm_password": "Password456!",
            "role": "USER",
        },
    )
    assert response.status_code == 400
    assert "do not match" in response.json()["detail"]

def test_user_login_and_profile(client, db_session):
    # 1. Register user
    email = "owner@parkease.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Parking Owner",
            "phone_number": "9998887770",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "PARKING_OWNER",
        },
    )

    # Verify user email via OTP verification
    pending = db_session.query(PendingRegistration).filter(PendingRegistration.email == email).first()
    raw_code = "123456"
    pending.otp_hash = otp_service._hash_otp(raw_code)
    db_session.commit()

    verify_res = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "otp": raw_code},
    )
    assert verify_res.status_code == 200

    # 2. Login using email
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": email, "password": "Password123!"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()["data"]
    token = token_data["access_token"]

    # 3. Fetch profile with Bearer token
    profile_res = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert profile_res.status_code == 200
    user_data = profile_res.json()["data"]
    assert user_data["email"] == email
    assert user_data["role"] == "PARKING_OWNER"

def test_refresh_token_flow(client, db_session):
    email = "refresh@parkease.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Refresh User",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )

    pending = db_session.query(PendingRegistration).filter(PendingRegistration.email == email).first()
    raw_code = "123456"
    pending.otp_hash = otp_service._hash_otp(raw_code)
    db_session.commit()

    verify_res = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "otp": raw_code},
    )
    assert verify_res.status_code == 200
    refresh_token = verify_res.json()["data"]["refresh_token"]

    refresh_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()["data"]

def test_vehicle_management(client, db_session):
    email = "carowner@parkease.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Car Owner",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )

    pending = db_session.query(PendingRegistration).filter(PendingRegistration.email == email).first()
    raw_code = "123456"
    pending.otp_hash = otp_service._hash_otp(raw_code)
    db_session.commit()

    verify_res = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "otp": raw_code},
    )
    assert verify_res.status_code == 200
    token = verify_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Add Vehicle
    add_res = client.post(
        "/api/v1/users/me/vehicles",
        json={
            "vehicle_type": "EV",
            "registration_number": "KA 01 AB 1234",
            "nickname": "Tesla Model 3",
            "is_ev": True,
            "is_default": True,
        },
        headers=headers,
    )
    assert add_res.status_code == 201
    vehicle_id = add_res.json()["data"]["id"]
    assert add_res.json()["data"]["registration_number"] == "KA 01 AB 1234"

    # 3. Get Vehicles
    get_res = client.get("/api/v1/users/me/vehicles", headers=headers)
    assert get_res.status_code == 200
    assert len(get_res.json()["data"]) == 1

    # 4. Delete Vehicle
    del_res = client.delete(f"/api/v1/users/me/vehicles/{vehicle_id}", headers=headers)
    assert del_res.status_code == 200

    # 5. Verify empty list
    get_res_after = client.get("/api/v1/users/me/vehicles", headers=headers)
    assert len(get_res_after.json()["data"]) == 0

def test_google_auth_new_user(client):
    res = client.post(
        "/api/v1/auth/google",
        json={"id_token": "mock_google_token:newgoogle@parkease.com:sub_99999:New-Google-User"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert "access_token" in data
    assert data["user"]["email"] == "newgoogle@parkease.com"
    assert data["user"]["google_id"] == "sub_99999"
    assert data["user"]["is_verified"] is True
    assert data["user"]["auth_provider"] == "google"

def test_google_auth_account_linking(client):
    # CASE B: Existing pending user links Google ID
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "existinguser@parkease.com",
            "full_name": "Existing User",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )

    res = client.post(
        "/api/v1/auth/google",
        json={"id_token": "mock_google_token:existinguser@parkease.com:sub_88888:Existing-User"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["user"]["email"] == "existinguser@parkease.com"
    assert data["user"]["google_id"] == "sub_88888"
    assert data["user"]["auth_provider"] == "google+email"

def test_google_user_create_password_flow(client):
    # 1. Sign up via Google (no password set initially)
    google_res = client.post(
        "/api/v1/auth/google",
        json={"id_token": "mock_google_token:googlepass@parkease.com:sub_77777:Google-Pass-User"},
    )
    assert google_res.status_code == 200
    token = google_res.json()["data"]["access_token"]
    user_data = google_res.json()["data"]["user"]
    assert user_data["has_password"] is False
    assert user_data["auth_provider"] == "google"

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Try to change password before creating one (should fail)
    change_res = client.patch(
        "/api/v1/users/me/password",
        json={"current_password": "OldPassword123!", "new_password": "NewPassword123!", "confirm_password": "NewPassword123!"},
        headers=headers,
    )
    assert change_res.status_code == 400
    assert "User does not have a password set" in change_res.json()["detail"]

    # 3. Create initial password
    create_res = client.post(
        "/api/v1/users/me/create-password",
        json={"new_password": "BrandNewPassword123!", "confirm_password": "BrandNewPassword123!"},
        headers=headers,
    )
    assert create_res.status_code == 200
    assert "Password created successfully" in create_res.json()["message"]

    # 4. Now change password using new password
    change_success = client.patch(
        "/api/v1/users/me/password",
        json={"current_password": "BrandNewPassword123!", "new_password": "AnotherPassword123!", "confirm_password": "AnotherPassword123!"},
        headers=headers,
    )
    assert change_success.status_code == 200
