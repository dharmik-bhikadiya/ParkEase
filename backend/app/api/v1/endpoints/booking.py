from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, UserRole
from app.schemas.booking import BookingCreate, BookingResponse
from app.schemas.response import APIResponse
from app.services.booking_service import booking_service

router = APIRouter()

def format_booking_response(db: Session, booking) -> dict:
    resp = BookingResponse.model_validate(booking).model_dump()
    if booking.location:
        resp["location_name"] = booking.location.name
        resp["location_address"] = booking.location.address
    if booking.slot:
        resp["slot_number"] = booking.slot.slot_number
    return resp

@router.post("", response_model=APIResponse)
def create_reservation(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new slot reservation with double-booking validation.
    """
    booking = booking_service.create_booking(db=db, user=current_user, data=data)
    formatted = format_booking_response(db, booking)
    return APIResponse(
        success=True,
        message="Parking slot reserved successfully",
        data=formatted
    )

@router.get("/my-bookings", response_model=APIResponse)
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all reservations created by the current user.
    """
    bookings = booking_service.get_user_bookings(db=db, user_id=current_user.id)
    formatted = [format_booking_response(db, b) for b in bookings]
    return APIResponse(
        success=True,
        message="User bookings retrieved successfully",
        data=formatted
    )

@router.get("/owner", response_model=APIResponse)
def get_owner_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get reservations for parking locations owned by current user.
    """
    if current_user.role not in [UserRole.PARKING_OWNER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parking location owners can view owner reservations"
        )
    
    bookings = booking_service.get_owner_bookings(db=db, owner_id=current_user.id)
    formatted = [format_booking_response(db, b) for b in bookings]
    return APIResponse(
        success=True,
        message="Owner parking bookings retrieved successfully",
        data=formatted
    )

@router.get("/{booking_id}", response_model=APIResponse)
def get_booking_details(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get single booking details.
    """
    booking = booking_service.get_booking_by_id(db=db, booking_id=booking_id, user=current_user)
    formatted = format_booking_response(db, booking)
    return APIResponse(
        success=True,
        message="Booking details retrieved",
        data=formatted
    )

@router.post("/{booking_id}/cancel", response_model=APIResponse)
def cancel_reservation(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Cancel an existing reservation.
    """
    booking = booking_service.cancel_booking(db=db, booking_id=booking_id, user=current_user)
    formatted = format_booking_response(db, booking)
    return APIResponse(
        success=True,
        message="Booking reservation cancelled successfully",
        data=formatted
    )
