from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.vehicle import UserVehicle, VehicleType
from app.repositories.base import BaseRepository

class VehicleRepository(BaseRepository[UserVehicle]):
    def __init__(self):
        super().__init__(UserVehicle)

    def get_by_user(self, db: Session, user_id: str) -> List[UserVehicle]:
        return db.query(UserVehicle).filter(UserVehicle.user_id == user_id).order_by(UserVehicle.is_default.desc(), UserVehicle.created_at.desc()).all()

    def get_by_id_and_user(self, db: Session, vehicle_id: str, user_id: str) -> Optional[UserVehicle]:
        return db.query(UserVehicle).filter(
            UserVehicle.id == vehicle_id,
            UserVehicle.user_id == user_id
        ).first()

    def unset_defaults_for_user(self, db: Session, user_id: str) -> None:
        db.query(UserVehicle).filter(UserVehicle.user_id == user_id).update({"is_default": False})

vehicle_repository = VehicleRepository()
