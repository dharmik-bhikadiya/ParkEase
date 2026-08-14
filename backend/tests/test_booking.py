import pytest
from datetime import datetime, timezone, timedelta
from app.models.user import User, UserRole
from app.models.parking import ParkingLocation, ParkingSlot, SlotStatus, ParkingStatus
from app.core.security import create_access_token

def test_booking_flow(client, db_session):
    # Setup test User
    user = User(
        email="booking_test_driver@parkease.com",
        full_name="Booking Driver",
        role=UserRole.USER,
        is_active=True
    )
    owner = User(
        email="booking_test_owner@parkease.com",
        full_name="Booking Owner",
        role=UserRole.PARKING_OWNER,
        is_active=True
    )
    db_session.add_all([user, owner])
    db_session.commit()

    # Setup test Parking Location & Slot
    location = ParkingLocation(
        owner_id=owner.id,
        name="Alkapuri Station Parking",
        address="123 RC Dutt Road",
        city="Vadodara",
        area="Alkapuri",
        latitude=22.31,
        longitude=73.18,
        hourly_rate=30.0,
        status=ParkingStatus.ACTIVE
    )
    db_session.add(location)
    db_session.commit()

    slot = ParkingSlot(
        location_id=location.id,
        slot_number="A-101",
        status=SlotStatus.AVAILABLE
    )
    db_session.add(slot)
    db_session.commit()

    user_token = create_access_token(user.id, role=user.role.value)
    headers = {"Authorization": f"Bearer {user_token}"}

    start = datetime.now(timezone.utc) + timedelta(hours=1)
    end = start + timedelta(hours=2)

    payload = {
        "location_id": location.id,
        "slot_id": slot.id,
        "vehicle_number": "GJ01AB1234",
        "start_time": start.isoformat(),
        "end_time": end.isoformat()
    }

    # 1. Create Reservation
    create_resp = client.post("/api/v1/bookings", json=payload, headers=headers)
    assert create_resp.status_code == 200
    booking_data = create_resp.json()["data"]
    assert booking_data["status"] == "CONFIRMED"
    assert booking_data["total_hours"] == 2.0
    booking_id = booking_data["id"]

    # 2. Test Double Booking Prevention (Overlapping Time Window)
    dup_resp = client.post("/api/v1/bookings", json=payload, headers=headers)
    assert dup_resp.status_code == 409
    assert "already reserved" in dup_resp.json()["detail"]

    # 3. Fetch User Bookings
    my_resp = client.get("/api/v1/bookings/my-bookings", headers=headers)
    assert my_resp.status_code == 200
    my_bookings = my_resp.json()["data"]
    assert any(b["id"] == booking_id for b in my_bookings)

    # 4. Cancel Booking
    cancel_resp = client.post(f"/api/v1/bookings/{booking_id}/cancel", headers=headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["data"]["status"] == "CANCELLED"

    # 5. Duplicate Cancel Rejection
    dup_cancel = client.post(f"/api/v1/bookings/{booking_id}/cancel", headers=headers)
    assert dup_cancel.status_code == 400
