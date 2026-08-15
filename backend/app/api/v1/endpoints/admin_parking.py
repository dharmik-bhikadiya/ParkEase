from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.models.parking import ParkingLocation, ParkingStatus
from app.models.booking import Booking, BookingStatus
from app.models.wallet import WalletTransaction
from app.schemas.parking import (
    ParkingLocationResponse,
    ParkingStatusUpdate,
    ParkingStaffAssignmentCreate,
    ParkingStaffAssignmentResponse,
)
from app.schemas.user import UserResponse
from app.schemas.booking import BookingResponse
from app.schemas.wallet import TransactionResponse
from app.schemas.response import APIResponse
from app.repositories.parking_repository import parking_repository
from app.repositories.user_repository import user_repository

router = APIRouter()

@router.get("/stats", response_model=APIResponse[dict])
def get_admin_stats(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Get platform-wide statistics for Admin Dashboard.
    Calculates actual database numbers.
    """
    total_users = db.query(func.count(User.id)).filter(User.role.in_([UserRole.USER, UserRole.DRIVER])).scalar() or 0
    total_owners = db.query(func.count(User.id)).filter(User.role == UserRole.PARKING_OWNER).scalar() or 0
    total_staff = db.query(func.count(User.id)).filter(User.role.in_([UserRole.PARKING_STAFF, UserRole.STAFF])).scalar() or 0
    total_parking = db.query(func.count(ParkingLocation.id)).scalar() or 0
    pending_approvals = db.query(func.count(ParkingLocation.id)).filter(ParkingLocation.status == ParkingStatus.PENDING_APPROVAL).scalar() or 0
    active_bookings = db.query(func.count(Booking.id)).filter(Booking.status.in_([BookingStatus.ACTIVE, BookingStatus.CONFIRMED])).scalar() or 0
    
    total_revenue_result = db.query(func.sum(Booking.total_amount)).filter(Booking.status == BookingStatus.COMPLETED).scalar()
    total_revenue = float(total_revenue_result or 0.0)

    stats = {
        "total_users": total_users,
        "total_owners": total_owners,
        "total_staff": total_staff,
        "total_parking": total_parking,
        "pending_approvals": pending_approvals,
        "active_bookings": active_bookings,
        "total_revenue": total_revenue,
    }
    return APIResponse(message="Admin platform statistics retrieved", data=stats)

@router.get("/users", response_model=APIResponse[List[UserResponse]])
def get_all_users_admin(
    role: Optional[str] = Query(None, description="Optional role filter (USER, PARKING_OWNER, PARKING_STAFF, ADMIN)"),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Get all registered users across platform for Admin audit.
    """
    if role:
        users = user_repository.get_by_role(db, role)
    else:
        users = user_repository.get_all(db)

    return APIResponse(
        message=f"Retrieved {len(users)} users",
        data=[UserResponse.model_validate(u) for u in users]
    )

@router.get("/bookings", response_model=APIResponse[List[BookingResponse]])
def get_all_bookings_admin(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Get all bookings platform-wide for Admin audit.
    """
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()
    return APIResponse(
        message=f"Retrieved {len(bookings)} bookings",
        data=[BookingResponse.model_validate(b) for b in bookings]
    )

@router.get("/payments", response_model=APIResponse[List[TransactionResponse]])
def get_all_payments_admin(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Get all wallet transactions platform-wide for Admin finance audit.
    """
    txs = db.query(WalletTransaction).order_by(WalletTransaction.created_at.desc()).all()
    return APIResponse(
        message=f"Retrieved {len(txs)} transactions",
        data=[TransactionResponse.model_validate(t) for t in txs]
    )

@router.get("/pending", response_model=APIResponse[List[ParkingLocationResponse]])
def get_pending_parking_locations(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Get all parking locations awaiting admin approval (PENDING_APPROVAL).
    """
    pending = parking_repository.get_pending_approvals(db)
    return APIResponse(
        message=f"Retrieved {len(pending)} pending approval locations",
        data=[ParkingLocationResponse.model_validate(p) for p in pending]
    )

@router.get("/all", response_model=APIResponse[List[ParkingLocationResponse]])
def get_all_parking_locations_admin(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Get all parking locations across system for admin audit.
    """
    all_locations = parking_repository.get_all_admin(db)
    return APIResponse(
        message="Retrieved all system parking locations",
        data=[ParkingLocationResponse.model_validate(p) for p in all_locations]
    )

@router.post("/{parking_id}/approve", response_model=APIResponse[ParkingLocationResponse])
def approve_parking_location(
    parking_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Approve a pending parking location (Sets status to ACTIVE).
    """
    location = parking_repository.update_status(db, parking_id, ParkingStatus.ACTIVE)
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking location not found")

    return APIResponse(
        message="Parking location approved and set to ACTIVE",
        data=ParkingLocationResponse.model_validate(location)
    )

@router.post("/{parking_id}/suspend", response_model=APIResponse[ParkingLocationResponse])
def suspend_parking_location(
    parking_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Suspend a parking location (Sets status to SUSPENDED).
    """
    location = parking_repository.update_status(db, parking_id, ParkingStatus.SUSPENDED)
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking location not found")

    return APIResponse(
        message="Parking location suspended",
        data=ParkingLocationResponse.model_validate(location)
    )

@router.post("/{parking_id}/staff/{user_id}", response_model=APIResponse[ParkingStaffAssignmentResponse])
def assign_staff_to_parking(
    parking_id: str,
    user_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Assign a staff member to a parking location.
    """
    location = parking_repository.get_by_id(db, parking_id)
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking location not found")

    assignment = parking_repository.assign_staff(db, parking_id, user_id)
    return APIResponse(
        message="Staff member assigned to parking location",
        data=ParkingStaffAssignmentResponse.model_validate(assignment)
    )

@router.delete("/{parking_id}/staff/{user_id}", response_model=APIResponse[dict])
def remove_staff_from_parking(
    parking_id: str,
    user_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Remove staff assignment from a parking location.
    """
    success = parking_repository.remove_staff(db, parking_id, user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff assignment not found")

    return APIResponse(message="Staff member unassigned", data={"parking_id": parking_id, "user_id": user_id})
