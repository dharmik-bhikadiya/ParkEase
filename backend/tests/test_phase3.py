import pytest
from datetime import datetime, timezone, timedelta
from app.models.user import User, UserRole
from app.models.parking import ParkingLocation, ParkingType, ParkingStatus, ParkingSlot, SlotStatus, VehicleType
from app.models.booking import Booking, BookingStatus
from app.services.payment_service import payment_service
from app.services.wallet_service import wallet_service
from app.services.notification_service import notification_service

def test_payment_service_order_and_verification(db_session):
    user = User(
        email="phase3_user@example.com",
        full_name="Phase3 Tester",
        role=UserRole.USER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    # Topup wallet balance
    wallet_service.topup_wallet(db_session, user.id, 500.0)

    loc = ParkingLocation(
        name="Phase3 Test Hub",
        address="123 Tech Blvd",
        city="Ahmedabad",
        area="Navrangpura",
        latitude=23.0225,
        longitude=72.5714,
        total_slots=10,
        available_slots=10,
        hourly_rate=40.0,
        owner_id=user.id,
        status=ParkingStatus.ACTIVE
    )
    db_session.add(loc)
    db_session.commit()

    slot = ParkingSlot(
        location_id=loc.id,
        slot_number="P3-01",
        vehicle_type=VehicleType.CAR,
        status=SlotStatus.AVAILABLE
    )
    db_session.add(slot)
    db_session.commit()

    now = datetime.now(timezone.utc)
    booking = Booking(
        user_id=user.id,
        location_id=loc.id,
        slot_id=slot.id,
        vehicle_number="GJ01AB1234",
        start_time=now,
        end_time=now + timedelta(hours=2),
        total_hours=2.0,
        total_amount=80.0,
        status=BookingStatus.PENDING
    )
    db_session.add(booking)
    db_session.commit()

    order = payment_service.create_payment_order(db=db_session, booking=booking)
    assert order["status"] in ["COMPLETED", "PENDING"]
    assert order["amount"] == 80.0

def test_notification_service(db_session):
    user = User(
        email="phase3_notif@example.com",
        full_name="Notification Tester",
        role=UserRole.USER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    notif = notification_service.send_notification(
        db=db_session,
        user_id=user.id,
        title="Welcome to Phase 3",
        message="Your parking session pass is generated.",
        type_="INFO"
    )
    assert notif.id is not None
    assert notif.is_read is False

    user_notifs = notification_service.get_user_notifications(db_session, user.id)
    assert len(user_notifs) >= 1

    notification_service.mark_as_read(db_session, notif.id, user.id)
    updated = notification_service.get_user_notifications(db_session, user.id)
    assert updated[0].is_read is True
