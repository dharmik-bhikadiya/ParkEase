from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.models.parking import ParkingStatus
from app.schemas.parking import (
    ParkingLocationResponse,
    ParkingStatusUpdate,
    ParkingStaffAssignmentCreate,
    ParkingStaffAssignmentResponse,
)
from app.schemas.response import APIResponse
from app.repositories.parking_repository import parking_repository

router = APIRouter()

@router.get("/pending", response_model=APIResponse[List[ParkingLocationResponse]])
def get_pending_parking_locations(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
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
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
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
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
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
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
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
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
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
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Remove staff assignment from a parking location.
    """
    success = parking_repository.remove_staff(db, parking_id, user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff assignment not found")

    return APIResponse(message="Staff member unassigned", data={"parking_id": parking_id, "user_id": user_id})
