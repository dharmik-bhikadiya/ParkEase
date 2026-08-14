from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.vehicle import UserVehicle, VehicleType
from app.schemas.vehicle import VehicleCreate, VehicleUpdate
from app.repositories.vehicle_repository import vehicle_repository

class VehicleService:
    def get_user_vehicles(self, db: Session, user_id: str) -> List[UserVehicle]:
        return vehicle_repository.get_by_user(db, user_id)

    def add_vehicle(self, db: Session, user_id: str, vehicle_in: VehicleCreate) -> UserVehicle:
        # Check if user already has vehicles; if none, make this default automatically
        existing = vehicle_repository.get_by_user(db, user_id)
        is_default = vehicle_in.is_default if vehicle_in.is_default is not None else (len(existing) == 0)

        if is_default:
            vehicle_repository.unset_defaults_for_user(db, user_id)

        new_vehicle = UserVehicle(
            user_id=user_id,
            vehicle_type=vehicle_in.vehicle_type,
            registration_number=vehicle_in.registration_number.upper().strip(),
            nickname=vehicle_in.nickname,
            is_ev=vehicle_in.is_ev or (vehicle_in.vehicle_type == VehicleType.EV),
            is_default=is_default,
        )
        db.add(new_vehicle)
        db.commit()
        db.refresh(new_vehicle)
        return new_vehicle

    def update_vehicle(self, db: Session, user_id: str, vehicle_id: str, vehicle_in: VehicleUpdate) -> UserVehicle:
        vehicle = vehicle_repository.get_by_id_and_user(db, vehicle_id, user_id)
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vehicle not found or access denied"
            )

        if vehicle_in.is_default:
            vehicle_repository.unset_defaults_for_user(db, user_id)

        update_data = vehicle_in.model_dump(exclude_unset=True)
        if "registration_number" in update_data and update_data["registration_number"]:
            update_data["registration_number"] = update_data["registration_number"].upper().strip()

        for key, value in update_data.items():
            setattr(vehicle, key, value)

        db.commit()
        db.refresh(vehicle)
        return vehicle

    def delete_vehicle(self, db: Session, user_id: str, vehicle_id: str) -> None:
        vehicle = vehicle_repository.get_by_id_and_user(db, vehicle_id, user_id)
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vehicle not found or access denied"
            )

        was_default = vehicle.is_default
        db.delete(vehicle)
        db.commit()

        # If deleted vehicle was default, set another remaining vehicle as default
        if was_default:
            remaining = vehicle_repository.get_by_user(db, user_id)
            if remaining:
                remaining[0].is_default = True
                db.commit()

vehicle_service = VehicleService()
