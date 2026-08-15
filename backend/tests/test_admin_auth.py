import pytest
from app.models.user import User, UserRole
from app.core.security import create_access_token

def test_user_cannot_access_admin_routes(client, db_session):
    user = User(
        email="driver_test@parkease.com",
        full_name="Driver User",
        role=UserRole.USER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token(user.id, role=user.role.value)
    response = client.get("/api/v1/admin/parking/pending", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"].lower()

def test_google_user_cannot_access_admin_routes(client, db_session):
    google_user = User(
        email="google_driver@parkease.com",
        full_name="Google Driver",
        google_id="google_sub_123456",
        auth_provider="google",
        role=UserRole.USER,
        is_active=True
    )
    db_session.add(google_user)
    db_session.commit()

    token = create_access_token(google_user.id, role=google_user.role.value)
    response = client.get("/api/v1/admin/parking/pending", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"].lower()

def test_owner_cannot_access_admin_routes(client, db_session):
    owner = User(
        email="owner_test@parkease.com",
        full_name="Owner User",
        role=UserRole.PARKING_OWNER,
        is_active=True
    )
    db_session.add(owner)
    db_session.commit()

    token = create_access_token(owner.id, role=owner.role.value)
    response = client.get("/api/v1/admin/parking/pending", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403

def test_staff_cannot_access_admin_routes(client, db_session):
    staff = User(
        email="staff_test@parkease.com",
        full_name="Staff User",
        role=UserRole.PARKING_STAFF,
        is_active=True
    )
    db_session.add(staff)
    db_session.commit()

    token = create_access_token(staff.id, role=staff.role.value)
    response = client.get("/api/v1/admin/parking/pending", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403

def test_admin_can_access_admin_routes(client, db_session):
    admin = User(
        email="admin_test@parkease.com",
        full_name="Admin User",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()

    token = create_access_token(admin.id, role=admin.role.value)
    response = client.get("/api/v1/admin/parking/pending", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["success"] is True
