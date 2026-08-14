import pytest
from datetime import datetime, timezone, timedelta
from app.models.user import User, UserRole
from app.models.parking import ParkingLocation, ParkingSlot, SlotStatus
from app.models.booking import Booking, BookingStatus
from app.core.security import get_password_hash
from app.services.booking_service import booking_service
from app.services.qr_service import qr_service
from app.schemas.booking import BookingCreate

def create_test_user(db_session, email="qruser@example.com"):
    user = User(
        email=email,
        full_name="QR Test User",
        phone_number="+919876543211",
        hashed_password=get_password_hash("Secret123!"),
        role=UserRole.DRIVER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

def create_test_parking(db_session, owner_id):
    loc = ParkingLocation(
        name="QR Test Hub",
        address="Station Plaza",
        city="Vadodara",
        area="Sayajiganj",
        latitude=22.31,
        longitude=73.18,
        owner_id=owner_id,
        hourly_rate=20.0,
        status="ACTIVE",
    )
    db_session.add(loc)
    db_session.commit()
    db_session.refresh(loc)

    slot = ParkingSlot(
        location_id=loc.id,
        slot_number="Q-202",
        floor="Floor 1",
        status=SlotStatus.AVAILABLE,
    )
    db_session.add(slot)
    db_session.commit()
    db_session.refresh(slot)

    return loc, slot

def test_qr_generation_entry_and_exit_flow(db_session):
    user = create_test_user(db_session, email="qrflow@example.com")
    loc, slot = create_test_parking(db_session, owner_id=user.id)

    # Create Booking
    start_time = datetime.now(timezone.utc) + timedelta(minutes=5)
    end_time = start_time + timedelta(hours=2)
    booking_req = BookingCreate(
        location_id=loc.id,
        slot_id=slot.id,
        vehicle_number="GJ01QR1001",
        start_time=start_time,
        end_time=end_time,
    )
    booking = booking_service.create_booking(db_session, user, booking_req)
    assert booking.status == BookingStatus.CONFIRMED

    # Generate QR passes
    passes = qr_service.get_or_create_qr_passes(db_session, booking.id, user)
    assert len(passes) == 2

    entry_pass = next(p for p in passes if p.type.value == "ENTRY")
    exit_pass = next(p for p in passes if p.type.value == "EXIT")

    assert entry_pass.is_used is False
    assert exit_pass.is_used is False

    # 1. Scan ENTRY QR
    entry_result = qr_service.validate_and_process_entry(db_session, entry_pass.qr_payload, user)
    assert entry_result["session_status"] == "ACTIVE"
    assert entry_result["vehicle_number"] == "GJ01QR1001"

    # Verify Booking status updated to ACTIVE & Slot status updated to OCCUPIED
    db_session.refresh(booking)
    db_session.refresh(slot)
    assert booking.status == BookingStatus.ACTIVE
    assert slot.status == SlotStatus.OCCUPIED

    # Attempt ENTRY Replay -> Should fail
    with pytest.raises(Exception) as exc_info:
        qr_service.validate_and_process_entry(db_session, entry_pass.qr_payload, user)
    assert "already been used" in str(exc_info.value.detail)

    # 2. Scan EXIT QR
    exit_result = qr_service.validate_and_process_exit(db_session, exit_pass.qr_payload, user)
    assert exit_result["session_status"] == "COMPLETED"

    # Verify Booking status updated to COMPLETED & Slot status restored to AVAILABLE
    db_session.refresh(booking)
    db_session.refresh(slot)
    assert booking.status == BookingStatus.COMPLETED
    assert slot.status == SlotStatus.AVAILABLE
