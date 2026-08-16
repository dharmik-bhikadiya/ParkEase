import pytest
from datetime import datetime, timezone, timedelta
from app.models.user import User, UserRole
from app.models.vehicle import UserVehicle, VehicleType
from app.models.wallet import Wallet, WalletTransaction, TransactionType
from app.models.notification import Notification
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.models.parking import ParkingLocation, ParkingType, ParkingStatus, ParkingSlot, SlotStatus
from app.core.security import get_password_hash, create_access_token

def test_user_self_deletion(client, db_session):
    # 1. Setup User and dependent records (vehicle, wallet, notification)
    user = User(
        email="selfdelete@parkease.in",
        hashed_password=get_password_hash("Password@123"),
        full_name="Self Delete User",
        role=UserRole.USER,
    )
    db_session.add(user)
    db_session.flush()

    wallet = Wallet(user_id=user.id, balance=150.0)
    db_session.add(wallet)
    db_session.flush()

    tx = WalletTransaction(
        wallet_id=wallet.id,
        amount=150.0,
        type=TransactionType.TOPUP,
        description="Initial Topup",
    )
    vehicle = UserVehicle(
        user_id=user.id,
        vehicle_type=VehicleType.CAR,
        registration_number="MH12AB1234",
    )
    notification = Notification(
        user_id=user.id,
        title="Welcome",
        message="Welcome to ParkEase",
    )
    db_session.add_all([tx, vehicle, notification])
    db_session.commit()

    token = create_access_token(subject=user.id, role=user.role.value)
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Execute Self Deletion
    res = client.delete("/api/v1/users/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["message"] == "Account permanently deleted successfully"

    # 3. Verify database cleanup
    assert db_session.query(User).filter(User.id == user.id).first() is None
    assert db_session.query(Wallet).filter(Wallet.user_id == user.id).first() is None
    assert db_session.query(UserVehicle).filter(UserVehicle.user_id == user.id).first() is None
    assert db_session.query(Notification).filter(Notification.user_id == user.id).first() is None


def test_user_owning_parking_location_cannot_be_deleted(client, db_session):
    # 1. Create Parking Owner and Parking Location with Customer Booking
    owner = User(
        email="owner_test_delete@parkease.in",
        hashed_password=get_password_hash("OwnerPass123!"),
        full_name="Parking Owner",
        role=UserRole.PARKING_OWNER,
    )
    customer = User(
        email="customer_driver@parkease.in",
        hashed_password=get_password_hash("CustomerPass123!"),
        full_name="Customer Driver",
        role=UserRole.USER,
    )
    db_session.add_all([owner, customer])
    db_session.flush()

    location = ParkingLocation(
        owner_id=owner.id,
        name="Central Mall Parking",
        address="123 Main St",
        city="Ahmedabad",
        area="Navrangpura",
        latitude=23.0225,
        longitude=72.5714,
        hourly_rate=30.0,
    )
    db_session.add(location)
    db_session.flush()

    slot = ParkingSlot(
        location_id=location.id,
        slot_number="A-101",
        vehicle_type=VehicleType.CAR,
    )
    db_session.add(slot)
    db_session.flush()

    now = datetime.now(timezone.utc)
    booking = Booking(
        user_id=customer.id,
        location_id=location.id,
        slot_id=slot.id,
        vehicle_number="GJ01AB1234",
        start_time=now,
        end_time=now + timedelta(hours=2),
        total_hours=2.0,
        total_amount=60.0,
        status=BookingStatus.CONFIRMED,
    )
    db_session.add(booking)
    db_session.flush()

    payment = Payment(
        booking_id=booking.id,
        amount=60.0,
        method=PaymentMethod.WALLET,
        status=PaymentStatus.COMPLETED,
    )
    db_session.add(payment)
    db_session.commit()

    # 2. Attempt Self-Deletion by Parking Owner
    owner_token = create_access_token(subject=owner.id, role=owner.role.value)
    headers = {"Authorization": f"Bearer {owner_token}"}

    res = client.delete("/api/v1/users/me", headers=headers)
    assert res.status_code == 400
    assert "owns 1 parking location" in res.json()["detail"]

    # 3. Verify ALL data remains 100% intact (Rollback & Protection)
    assert db_session.query(User).filter(User.id == owner.id).first() is not None
    assert db_session.query(ParkingLocation).filter(ParkingLocation.id == location.id).first() is not None
    assert db_session.query(Booking).filter(Booking.id == booking.id).first() is not None
    assert db_session.query(Payment).filter(Payment.id == payment.id).first() is not None
    assert db_session.query(User).filter(User.id == customer.id).first() is not None


def test_admin_deletes_user(client, db_session):
    # 1. Setup Admin and Target User
    admin = User(
        email="admin_tester@parkease.in",
        hashed_password=get_password_hash("AdminPass123!"),
        full_name="System Admin",
        role=UserRole.ADMIN,
    )
    target_user = User(
        email="target_user@parkease.in",
        hashed_password=get_password_hash("UserPass123!"),
        full_name="Target User",
        role=UserRole.USER,
    )
    db_session.add_all([admin, target_user])
    db_session.commit()

    admin_token = create_access_token(subject=admin.id, role=admin.role.value)
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Admin Deletes Target User
    res = client.delete(f"/api/v1/admin/users/{target_user.id}", headers=headers)
    assert res.status_code == 200
    assert "deleted successfully" in res.json()["message"]

    # 3. Verify Database
    assert db_session.query(User).filter(User.id == target_user.id).first() is None
    assert db_session.query(User).filter(User.id == admin.id).first() is not None


def test_non_admin_cannot_delete_other_user(client, db_session):
    user1 = User(
        email="user1@parkease.in",
        hashed_password=get_password_hash("UserPass123!"),
        full_name="User One",
        role=UserRole.USER,
    )
    user2 = User(
        email="user2@parkease.in",
        hashed_password=get_password_hash("UserPass123!"),
        full_name="User Two",
        role=UserRole.USER,
    )
    db_session.add_all([user1, user2])
    db_session.commit()

    user1_token = create_access_token(subject=user1.id, role=user1.role.value)
    headers = {"Authorization": f"Bearer {user1_token}"}

    res = client.delete(f"/api/v1/admin/users/{user2.id}", headers=headers)
    assert res.status_code == 403


def test_sole_admin_deletion_prevented(client, db_session):
    sole_admin = User(
        email="sole_admin@parkease.in",
        hashed_password=get_password_hash("AdminPass123!"),
        full_name="Sole Admin",
        role=UserRole.ADMIN,
    )
    db_session.add(sole_admin)
    db_session.commit()

    admin_token = create_access_token(subject=sole_admin.id, role=sole_admin.role.value)
    headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.delete("/api/v1/users/me", headers=headers)
    assert res.status_code == 400
    assert "sole system Administrator" in res.json()["detail"]


def test_unrelated_data_preserved(client, db_session):
    user_a = User(email="usera@parkease.in", full_name="User A", role=UserRole.USER)
    user_b = User(email="userb@parkease.in", full_name="User B", role=UserRole.USER)
    db_session.add_all([user_a, user_b])
    db_session.commit()

    vehicle_b = UserVehicle(user_id=user_b.id, vehicle_type=VehicleType.CAR, registration_number="GJ01AB9999")
    db_session.add(vehicle_b)
    db_session.commit()

    user_a_token = create_access_token(subject=user_a.id, role=user_a.role.value)
    headers = {"Authorization": f"Bearer {user_a_token}"}

    res = client.delete("/api/v1/users/me", headers=headers)
    assert res.status_code == 200

    # User B and Vehicle B must remain intact
    assert db_session.query(User).filter(User.id == user_b.id).first() is not None
    assert db_session.query(UserVehicle).filter(UserVehicle.user_id == user_b.id).first() is not None
