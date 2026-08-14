import pytest
from app.models.user import User, UserRole
from app.models.parking import ParkingLocation, ParkingStatus
from app.core.security import create_access_token

def test_auth_token_generator(client, db_session):
    user = User(
        email="test_driver@parkease.com",
        full_name="Driver One",
        role=UserRole.USER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(user.id, role=user.role.value)
    res = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["data"]["email"] == "test_driver@parkease.com"

# 1. USER CANNOT CREATE PARKING
def test_regular_user_cannot_create_parking(client, db_session):
    user = User(
        email="regular_user@parkease.com",
        full_name="Regular User",
        role=UserRole.USER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(user.id, role=user.role.value)
    payload = {
        "name": "Unauthorized Parking Lot",
        "parking_type": "RAILWAY_STATION",
        "address": "123 Test St",
        "city": "Vadodara",
        "area": "Sayajiganj",
        "latitude": 22.3,
        "longitude": 73.1,
        "total_slots": 10,
        "bike_hourly_price": 10.0,
        "car_hourly_price": 20.0,
        "suv_hourly_price": 30.0,
        "ev_hourly_price": 25.0
    }
    response = client.post("/api/v1/parking", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403

# 2. OWNER CAN CREATE PARKING (INITIAL STATUS: PENDING_APPROVAL)
def test_owner_can_create_parking(client, db_session):
    owner = User(
        email="owner1@parkease.com",
        full_name="Parking Owner 1",
        role=UserRole.PARKING_OWNER,
        is_active=True
    )
    db_session.add(owner)
    db_session.commit()
    db_session.refresh(owner)

    token = create_access_token(owner.id, role=owner.role.value)
    payload = {
        "name": "Sayajiganj Express Parking",
        "parking_type": "RAILWAY_STATION",
        "address": "Station Plaza Road",
        "city": "Vadodara",
        "area": "Sayajiganj",
        "latitude": 22.3106,
        "longitude": 73.1812,
        "total_slots": 20,
        "bike_hourly_price": 10.0,
        "car_hourly_price": 20.0,
        "suv_hourly_price": 30.0,
        "ev_hourly_price": 25.0
    }
    response = client.post("/api/v1/parking", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["name"] == "Sayajiganj Express Parking"
    assert data["status"] == "PENDING_APPROVAL"

# 3. OWNER CANNOT EDIT ANOTHER OWNER'S PARKING
def test_owner_cannot_edit_another_owners_parking(client, db_session):
    owner1 = User(
        email="owner_a@parkease.com",
        full_name="Owner A",
        role=UserRole.PARKING_OWNER,
        is_active=True
    )
    owner2 = User(
        email="owner_b@parkease.com",
        full_name="Owner B",
        role=UserRole.PARKING_OWNER,
        is_active=True
    )
    db_session.add_all([owner1, owner2])
    db_session.commit()

    loc = ParkingLocation(
        owner_id=owner1.id,
        name="Owner A Hub",
        address="Address 1",
        city="Vadodara",
        area="Area 1",
        latitude=22.3,
        longitude=73.1,
        status=ParkingStatus.ACTIVE
    )
    db_session.add(loc)
    db_session.commit()

    token2 = create_access_token(owner2.id, role=owner2.role.value)
    response = client.patch(f"/api/v1/parking/{loc.id}", json={"name": "Hacked Name"}, headers={"Authorization": f"Bearer {token2}"})
    assert response.status_code == 403

# 4. OWNER CANNOT DELETE ANOTHER OWNER'S PARKING
def test_owner_cannot_delete_another_owners_parking(client, db_session):
    owner1 = User(
        email="owner_c@parkease.com",
        full_name="Owner C",
        role=UserRole.PARKING_OWNER,
        is_active=True
    )
    owner2 = User(
        email="owner_d@parkease.com",
        full_name="Owner D",
        role=UserRole.PARKING_OWNER,
        is_active=True
    )
    db_session.add_all([owner1, owner2])
    db_session.commit()

    loc = ParkingLocation(
        owner_id=owner1.id,
        name="Owner C Hub",
        address="Address 1",
        city="Vadodara",
        area="Area 1",
        latitude=22.3,
        longitude=73.1,
        status=ParkingStatus.ACTIVE
    )
    db_session.add(loc)
    db_session.commit()

    token2 = create_access_token(owner2.id, role=owner2.role.value)
    response = client.delete(f"/api/v1/parking/{loc.id}", headers={"Authorization": f"Bearer {token2}"})
    assert response.status_code == 403

# 5. ADMIN CAN APPROVE PARKING
def test_admin_can_approve_parking(client, db_session):
    owner = User(
        email="owner_e@parkease.com",
        full_name="Owner E",
        role=UserRole.PARKING_OWNER,
        is_active=True
    )
    admin = User(
        email="admin_system@parkease.com",
        full_name="Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add_all([owner, admin])
    db_session.commit()

    loc = ParkingLocation(
        owner_id=owner.id,
        name="Pending Approval Hub",
        address="Address 1",
        city="Vadodara",
        area="Area 1",
        latitude=22.3,
        longitude=73.1,
        status=ParkingStatus.PENDING_APPROVAL
    )
    db_session.add(loc)
    db_session.commit()

    admin_token = create_access_token(admin.id, role=admin.role.value)
    response = client.post(f"/api/v1/admin/parking/{loc.id}/approve", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "ACTIVE"

# 6. PARKING SEARCH & FILTERS
def test_parking_search_and_filter(client, db_session):
    owner = User(
        email="owner_f@parkease.com",
        full_name="Owner F",
        role=UserRole.PARKING_OWNER,
        is_active=True
    )
    db_session.add(owner)
    db_session.commit()

    loc1 = ParkingLocation(
        owner_id=owner.id,
        name="Airport Smart Parking",
        address="Airport Road",
        city="Ahmedabad",
        area="Hansol",
        latitude=23.07,
        longitude=72.63,
        status=ParkingStatus.ACTIVE
    )
    db_session.add(loc1)
    db_session.commit()

    response = client.get("/api/v1/parking/search?city=Ahmedabad")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) >= 1
    assert data[0]["city"] == "Ahmedabad"
