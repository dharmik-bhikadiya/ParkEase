import pytest
from datetime import datetime, timezone, timedelta
from app.models.user import User, UserRole
from app.models.parking import ParkingLocation, ParkingSlot, SlotStatus
from app.models.booking import Booking, BookingStatus
from app.core.security import get_password_hash
from app.services.wallet_service import wallet_service
from app.services.booking_service import booking_service
from app.schemas.booking import BookingCreate

def create_test_user(db_session, email="walletuser@example.com"):
    user = User(
        email=email,
        full_name="Wallet Test User",
        phone_number="+919876543210",
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
        name="Wallet Hub",
        address="Near Railway Station",
        city="Vadodara",
        area="Sayajiganj",
        latitude=22.3106,
        longitude=73.1812,
        owner_id=owner_id,
        hourly_rate=20.0,
        status="ACTIVE",
    )
    db_session.add(loc)
    db_session.commit()
    db_session.refresh(loc)

    slot = ParkingSlot(
        location_id=loc.id,
        slot_number="W-101",
        floor="Ground",
        status=SlotStatus.AVAILABLE,
    )
    db_session.add(slot)
    db_session.commit()
    db_session.refresh(slot)

    return loc, slot

def test_wallet_creation_and_topup(db_session):
    user = create_test_user(db_session, email="topup@example.com")
    
    # Get wallet (creates default ₹0 balance)
    wallet = wallet_service.get_or_create_wallet(db_session, user.id)
    assert wallet.balance == 0.0
    assert wallet.currency == "INR"

    # Topup ₹500
    updated_wallet = wallet_service.topup_wallet(db_session, user.id, amount=500.0, payment_method="UPI")
    assert updated_wallet.balance == 500.0

    # Verify transaction log
    txns = wallet_service.get_transactions(db_session, user.id)
    assert len(txns) == 1
    assert txns[0].amount == 500.0
    assert txns[0].type.value == "TOPUP"

def test_wallet_payment_and_refund_on_cancel(db_session):
    user = create_test_user(db_session, email="payrefund@example.com")
    loc, slot = create_test_parking(db_session, owner_id=user.id)

    # Topup ₹200
    wallet_service.topup_wallet(db_session, user.id, amount=200.0)

    # Create Booking (duration 2 hours -> cost ₹40)
    start_time = datetime.now(timezone.utc) + timedelta(hours=1)
    end_time = start_time + timedelta(hours=2)
    booking_req = BookingCreate(
        location_id=loc.id,
        slot_id=slot.id,
        vehicle_number="GJ01XY9999",
        start_time=start_time,
        end_time=end_time,
    )
    booking = booking_service.create_booking(db_session, user, booking_req)
    assert booking.total_amount == 40.0

    # Pay for booking via Wallet
    paid_booking = wallet_service.pay_for_booking(db_session, user.id, booking.id, amount=booking.total_amount)
    assert paid_booking.payment_status == "PAID"
    
    # Check balance after payment (200 - 40 = 160)
    w_after_pay = wallet_service.get_or_create_wallet(db_session, user.id)
    assert w_after_pay.balance == 160.0

    # Cancel booking -> should auto refund ₹40 back
    cancelled = booking_service.cancel_booking(db_session, booking.id, user)
    assert cancelled.status == BookingStatus.CANCELLED
    assert cancelled.payment_status == "REFUNDED"

    # Check balance after refund (160 + 40 = 200)
    w_after_refund = wallet_service.get_or_create_wallet(db_session, user.id)
    assert w_after_refund.balance == 200.0
