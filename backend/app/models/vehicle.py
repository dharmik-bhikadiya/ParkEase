import enum
from typing import Optional
from sqlalchemy import String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, generate_uuid

class VehicleType(str, enum.Enum):
    BIKE = "BIKE"
    CAR = "CAR"
    SUV = "SUV"
    EV = "EV"
    OTHER = "OTHER"

class UserVehicle(Base, TimestampMixin):
    __tablename__ = "user_vehicles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    vehicle_type: Mapped[VehicleType] = mapped_column(Enum(VehicleType), default=VehicleType.CAR, nullable=False)
    registration_number: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    nickname: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_ev: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="vehicles")
