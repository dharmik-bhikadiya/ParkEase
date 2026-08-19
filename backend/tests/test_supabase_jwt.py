import pytest
import uuid
from datetime import datetime, timedelta, timezone
from jose import jwt

from app.core.config import settings
from app.models.user import User, UserRole

def create_mock_supabase_token(sub: str, expires_in_minutes: int = 60, secret: str = None) -> str:
    if secret is None:
        secret = settings.SUPABASE_JWT_SECRET or settings.JWT_SECRET_KEY
    payload = {
        "sub": sub,
        "aud": "authenticated",
        "iss": "https://supabase.co/auth/v1",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes),
        "iat": datetime.now(timezone.utc),
        "role": "authenticated",
    }
    return jwt.encode(payload, secret, algorithm="HS256")

def test_valid_supabase_token(client, db_session):
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email="supabase_user@parkease.com",
        full_name="Supabase User",
        role=UserRole.USER,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()

    token = create_mock_supabase_token(sub=user_id)
    response = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["data"]["email"] == "supabase_user@parkease.com"

def test_expired_token(client, db_session):
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email="expired@parkease.com",
        full_name="Expired User",
        role=UserRole.USER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    expired_token = create_mock_supabase_token(sub=user_id, expires_in_minutes=-10)
    response = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {expired_token}"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"

def test_invalid_signature(client, db_session):
    user_id = str(uuid.uuid4())
    token = create_mock_supabase_token(sub=user_id, secret="wrong_signature_secret_12345")
    response = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"

def test_missing_token(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401

def test_malformed_token(client):
    response = client.get("/api/v1/users/me", headers={"Authorization": "Bearer malformed.invalid.token"})
    assert response.status_code == 401

def test_unknown_user_uuid(client):
    unknown_id = str(uuid.uuid4())
    token = create_mock_supabase_token(sub=unknown_id)
    response = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401

def test_inactive_user(client, db_session):
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email="inactive@parkease.com",
        full_name="Inactive User",
        role=UserRole.USER,
        is_active=False,
    )
    db_session.add(user)
    db_session.commit()

    token = create_mock_supabase_token(sub=user_id)
    response = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403
    assert "Inactive" in response.json()["detail"]

def test_user_role(client, db_session):
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email="normaluser@parkease.com",
        full_name="Normal User",
        role=UserRole.USER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    token = create_mock_supabase_token(sub=user_id)
    res = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["data"]["role"] == "USER"

def test_admin_role(client, db_session):
    admin_id = str(uuid.uuid4())
    admin = User(
        id=admin_id,
        email="adminuser@parkease.com",
        full_name="Admin User",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    token = create_mock_supabase_token(sub=admin_id)
    res = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

def test_parking_owner_role(client, db_session):
    owner_id = str(uuid.uuid4())
    owner = User(
        id=owner_id,
        email="owneruser@parkease.com",
        full_name="Owner User",
        role=UserRole.PARKING_OWNER,
        is_active=True,
    )
    db_session.add(owner)
    db_session.commit()

    token = create_mock_supabase_token(sub=owner_id)
    res = client.get("/api/v1/parking/owner/my-locations", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

def test_parking_staff_role(client, db_session):
    staff_id = str(uuid.uuid4())
    staff = User(
        id=staff_id,
        email="staffuser@parkease.com",
        full_name="Staff User",
        role=UserRole.PARKING_STAFF,
        is_active=True,
    )
    db_session.add(staff)
    db_session.commit()

    token = create_mock_supabase_token(sub=staff_id)
    res = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["data"]["role"] == "PARKING_STAFF"
