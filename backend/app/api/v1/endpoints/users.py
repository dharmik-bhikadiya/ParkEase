from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate, PasswordChange
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.schemas.response import APIResponse
from app.services.auth_service import auth_service
from app.services.vehicle_service import vehicle_service

router = APIRouter()

# User Profile APIs
@router.get("/me", response_model=APIResponse[UserResponse])
def get_my_profile(current_user: User = Depends(get_current_active_user)):
    """
    Fetch authenticated user profile details.
    """
    return APIResponse(
        message="User profile retrieved",
        data=UserResponse.model_validate(current_user)
    )

@router.patch("/me", response_model=APIResponse[UserResponse])
def update_my_profile(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update authenticated user profile information (Name, Mobile, Avatar URL).
    """
    updated_user = auth_service.update_profile(db, current_user, user_in)
    return APIResponse(
        message="Profile updated successfully",
        data=UserResponse.model_validate(updated_user)
    )

@router.patch("/me/password", response_model=APIResponse[None])
def change_my_password(
    pwd_in: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Change authenticated user password.
    """
    auth_service.change_password(db, current_user, pwd_in)
    return APIResponse(message="Password changed successfully")

# Vehicle Management APIs (User Ownership Protected)
@router.get("/me/vehicles", response_model=APIResponse[List[VehicleResponse]])
def get_my_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch all vehicles belonging to the authenticated user.
    """
    vehicles = vehicle_service.get_user_vehicles(db, current_user.id)
    return APIResponse(
        message="Vehicles retrieved",
        data=[VehicleResponse.model_validate(v) for v in vehicles]
    )

@router.post("/me/vehicles", response_model=APIResponse[VehicleResponse], status_code=status.HTTP_201_CREATED)
def add_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add a new vehicle to authenticated user's account.
    """
    vehicle = vehicle_service.add_vehicle(db, current_user.id, vehicle_in)
    return APIResponse(
        message="Vehicle added successfully",
        data=VehicleResponse.model_validate(vehicle)
    )

@router.patch("/me/vehicles/{vehicle_id}", response_model=APIResponse[VehicleResponse])
def update_vehicle(
    vehicle_id: str,
    vehicle_in: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a vehicle owned by the authenticated user.
    """
    vehicle = vehicle_service.update_vehicle(db, current_user.id, vehicle_id, vehicle_in)
    return APIResponse(
        message="Vehicle updated successfully",
        data=VehicleResponse.model_validate(vehicle)
    )

@router.delete("/me/vehicles/{vehicle_id}", response_model=APIResponse[None])
def delete_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a vehicle owned by the authenticated user.
    """
    vehicle_service.delete_vehicle(db, current_user.id, vehicle_id)
    return APIResponse(message="Vehicle deleted successfully")
