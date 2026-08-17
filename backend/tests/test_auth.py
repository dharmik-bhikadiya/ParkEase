import pytest

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
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["user"]["email"] == "driver@parkease.com"
    assert data["data"]["user"]["role"] == "USER"

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

def test_user_login_and_profile(client):
    # 1. Register user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "owner@parkease.com",
            "full_name": "Parking Owner",
            "phone_number": "9998887770",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "PARKING_OWNER",
        },
    )

    # 2. Login using email
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": "owner@parkease.com", "password": "Password123!"},
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
    assert user_data["email"] == "owner@parkease.com"
    assert user_data["role"] == "PARKING_OWNER"

def test_refresh_token_flow(client):
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "refresh@parkease.com",
            "full_name": "Refresh User",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )
    refresh_token = reg_res.json()["data"]["refresh_token"]

    refresh_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()["data"]

def test_vehicle_management(client):
    # 1. Register & Login
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "carowner@parkease.com",
            "full_name": "Car Owner",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER",
        },
    )
    token = reg_res.json()["data"]["access_token"]
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

    # 3. List Vehicles
    list_res = client.get("/api/v1/users/me/vehicles", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 1

    # 4. Update Vehicle
    edit_res = client.patch(
        f"/api/v1/users/me/vehicles/{vehicle_id}",
        json={"nickname": "Updated Speedster"},
        headers=headers,
    )
    assert edit_res.status_code == 200
    assert edit_res.json()["data"]["nickname"] == "Updated Speedster"

    # 5. Delete Vehicle
    del_res = client.delete(f"/api/v1/users/me/vehicles/{vehicle_id}", headers=headers)
    assert del_res.status_code == 200

    # 6. Verify List Empty
    list_res2 = client.get("/api/v1/users/me/vehicles", headers=headers)
    assert len(list_res2.json()["data"]) == 0

def test_google_auth_new_user(client):
    # CASE A: Create new user via Google
    res = client.post(
        "/api/v1/auth/google",
        json={"id_token": "mock_google_token:newgoogle@parkease.com:sub_99999:Google-New-User"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["user"]["email"] == "newgoogle@parkease.com"
    assert data["user"]["google_id"] == "sub_99999"
    assert data["user"]["auth_provider"] == "google"
    assert "access_token" in data

def test_google_auth_account_linking(client):
    # CASE B: Existing email user links Google ID
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

    # 3. Create password
    create_res = client.post(
        "/api/v1/users/me/create-password",
        json={"new_password": "CreatedPassword123!", "confirm_password": "CreatedPassword123!"},
        headers=headers,
    )
    assert create_res.status_code == 200
    assert create_res.json()["message"] == "Password created successfully"

    # 4. Verify profile updated
    profile_res = client.get("/api/v1/users/me", headers=headers)
    assert profile_res.status_code == 200
    updated_user = profile_res.json()["data"]
    assert updated_user["has_password"] is True
    assert updated_user["auth_provider"] == "google+email"

    # 5. Verify email + password login now works
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": "googlepass@parkease.com", "password": "CreatedPassword123!"},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()["data"]

    # 6. Verify duplicate create-password call fails
    dup_res = client.post(
        "/api/v1/users/me/create-password",
        json={"new_password": "AnotherPassword123!", "confirm_password": "AnotherPassword123!"},
        headers=headers,
    )
    assert dup_res.status_code == 400
    assert "User already has a password set" in dup_res.json()["detail"]

    # 7. Verify Google login still works
    google_res2 = client.post(
        "/api/v1/auth/google",
        json={"id_token": "mock_google_token:googlepass@parkease.com:sub_77777:Google-Pass-User"},
    )
    assert google_res2.status_code == 200
    assert google_res2.json()["data"]["user"]["has_password"] is True

