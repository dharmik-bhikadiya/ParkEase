from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.parking import ParkingType, SlotStatus, VehicleType, ParkingStatus
from app.schemas.parking import (
    ParkingLocationResponse,
    ParkingLocationDetailResponse,
    ParkingLocationCreate,
    ParkingLocationUpdate,
    ParkingSlotResponse,
    ParkingSlotCreate,
    ParkingSlotUpdate,
    ParkingPricingResponse,
)
from app.schemas.response import APIResponse
from app.repositories.parking_repository import parking_repository

router = APIRouter()

@router.get("/search", response_model=APIResponse[List[ParkingLocationResponse]])
def search_parking(
    query: Optional[str] = Query(None, description="Search term for name, city, area or address"),
    city: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    vehicle_type: Optional[VehicleType] = Query(None),
    parking_type: Optional[ParkingType] = Query(None),
    max_price: Optional[float] = Query(None),
    covered_parking: Optional[bool] = Query(None),
    cctv: Optional[bool] = Query(None),
    security: Optional[bool] = Query(None),
    ev_charging: Optional[bool] = Query(None),
    min_rating: Optional[float] = Query(None),
    min_slots: Optional[int] = Query(None),
    sort_by: Optional[str] = Query("distance", description="distance | price | availability | rating"),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Search active parking locations with comprehensive filters and sorting.
    """
    locations = parking_repository.search_parking(
        db=db,
        query=query,
        city=city,
        area=area,
        vehicle_type=vehicle_type,
        parking_type=parking_type,
        max_price=max_price,
        covered_parking=covered_parking,
        cctv=cctv,
        security=security,
        ev_charging=ev_charging,
        min_rating=min_rating,
        min_slots=min_slots,
        sort_by=sort_by,
        user_lat=lat,
        user_lng=lng,
    )
    return APIResponse(
        message=f"Found {len(locations)} matching parking locations",
        data=[ParkingLocationResponse.model_validate(loc) for loc in locations]
    )

@router.get("/owner/my-locations", response_model=APIResponse[List[ParkingLocationResponse]])
def get_owner_locations(
    current_user: User = Depends(require_roles([UserRole.PARKING_OWNER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Fetch all parking locations owned by current authenticated parking owner.
    """
    locations = parking_repository.get_by_owner(db, current_user.id)
    return APIResponse(
        message="Owner parking locations retrieved",
        data=[ParkingLocationResponse.model_validate(loc) for loc in locations]
    )

@router.get("/{parking_id}", response_model=APIResponse[ParkingLocationDetailResponse])
def get_parking_by_id(
    parking_id: str,
    db: Session = Depends(get_db)
):
    """
    Fetch detailed parking information by ID.
    """
    location = parking_repository.get_by_id_with_details(db, parking_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking location not found"
        )
    return APIResponse(
        message="Parking location details retrieved",
        data=ParkingLocationDetailResponse.model_validate(location)
    )

@router.post("", response_model=APIResponse[ParkingLocationResponse], status_code=status.HTTP_201_CREATED)
def create_parking_location(
    data: ParkingLocationCreate,
    current_user: User = Depends(require_roles([UserRole.PARKING_OWNER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Create a new parking location (Initial status: PENDING_APPROVAL).
    Requires PARKING_OWNER or ADMIN role.
    """
    location = parking_repository.create_location_with_pricing_and_slots(
        db=db,
        owner_id=current_user.id,
        data=data
    )
    return APIResponse(
        message="Parking location submitted for approval",
        data=ParkingLocationResponse.model_validate(location)
    )

@router.patch("/{parking_id}", response_model=APIResponse[ParkingLocationResponse])
def update_parking_location(
    parking_id: str,
    data: ParkingLocationUpdate,
    current_user: User = Depends(require_roles([UserRole.PARKING_OWNER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Update parking location details. Enforces ownership authorization.
    """
    existing = parking_repository.get_by_id(db, parking_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking location not found")

    if current_user.role != UserRole.ADMIN and existing.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this parking location")

    updated = parking_repository.update_location(db, parking_id, data)
    return APIResponse(
        message="Parking location updated",
        data=ParkingLocationResponse.model_validate(updated)
    )

@router.delete("/{parking_id}", response_model=APIResponse[dict])
def delete_parking_location(
    parking_id: str,
    current_user: User = Depends(require_roles([UserRole.PARKING_OWNER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Delete a parking location. Enforces ownership authorization.
    """
    existing = parking_repository.get_by_id(db, parking_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking location not found")

    if current_user.role != UserRole.ADMIN and existing.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this parking location")

    parking_repository.delete(db, parking_id)
    return APIResponse(message="Parking location deleted successfully", data={"id": parking_id})

# SLOT ENDPOINTS
@router.get("/{parking_id}/slots", response_model=APIResponse[List[ParkingSlotResponse]])
def get_parking_slots(
    parking_id: str,
    db: Session = Depends(get_db)
):
    """
    Get visual layout slots for a parking location.
    """
    location = parking_repository.get_by_id(db, parking_id)
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking location not found")

    slots = parking_repository.get_slots(db, parking_id)
    return APIResponse(
        message="Parking slots retrieved",
        data=[ParkingSlotResponse.model_validate(s) for s in slots]
    )

@router.post("/{parking_id}/slots", response_model=APIResponse[ParkingSlotResponse], status_code=status.HTTP_201_CREATED)
def create_parking_slot(
    parking_id: str,
    data: ParkingSlotCreate,
    current_user: User = Depends(require_roles([UserRole.PARKING_OWNER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Create a new slot under a parking location.
    """
    location = parking_repository.get_by_id(db, parking_id)
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking location not found")

    if current_user.role != UserRole.ADMIN and location.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this parking location")

    slot = parking_repository.create_slot(db, parking_id, data)
    return APIResponse(
        message="Parking slot created",
        data=ParkingSlotResponse.model_validate(slot)
    )

@router.patch("/{parking_id}/slots/{slot_id}", response_model=APIResponse[ParkingSlotResponse])
def update_parking_slot(
    parking_id: str,
    slot_id: str,
    data: ParkingSlotUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update slot status or details.
    Authorized for Owner of location, Staff assigned to location, or Admin.
    """
    location = parking_repository.get_by_id(db, parking_id)
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking location not found")

    is_owner = location.owner_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN
    is_assigned_staff = (
        current_user.role in [UserRole.PARKING_STAFF, UserRole.STAFF]
        and parking_repository.is_staff_assigned(db, parking_id, current_user.id)
    )

    if not (is_owner or is_admin or is_assigned_staff):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to manage slots for this parking location"
        )

    updated_slot = parking_repository.update_slot(db, slot_id, data)
    if not updated_slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

    return APIResponse(
        message="Parking slot updated",
        data=ParkingSlotResponse.model_validate(updated_slot)
    )
