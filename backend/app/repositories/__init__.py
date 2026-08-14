from app.repositories.base import BaseRepository
from app.repositories.user_repository import user_repository, UserRepository
from app.repositories.parking_repository import parking_repository, ParkingRepository

__all__ = [
    "BaseRepository",
    "user_repository",
    "UserRepository",
    "parking_repository",
    "ParkingRepository",
]
