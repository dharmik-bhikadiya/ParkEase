import enum
from typing import Optional, List
from sqlalchemy import String, Float, Integer, Boolean, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, generate_uuid

class ParkingType(str, enum.Enum):
    RAILWAY_STATION = "RAILWAY_STATION"
    BUS_STAND = "BUS_STAND"
    AIRPORT = "AIRPORT"
    MALL = "MALL"
    HOSPITAL = "HOSPITAL"
    CINEMA = "CINEMA"
    TOURIST_PLACE = "TOURIST_PLACE"
    OTHER = "OTHER"

class ParkingStatus(str, enum.Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class SlotStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    RESERVED = "RESERVED"
    BLOCKED = "BLOCKED"
    MAINTENANCE = "MAINTENANCE"

class VehicleType(str, enum.Enum):
    BIKE = "BIKE"
    CAR = "CAR"
    SUV = "SUV"
    EV = "EV"
    OTHER = "OTHER"

class ParkingLocation(Base, TimestampMixin):
    __tablename__ = "parking_locations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parking_type: Mapped[ParkingType] = mapped_column(Enum(ParkingType), default=ParkingType.OTHER, index=True, nullable=False)
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    city: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    area: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    images: Mapped[Optional[dict]] = mapped_column(JSON, default=list, nullable=True)
    opening_time: Mapped[str] = mapped_column(String(20), default="00:00", nullable=False)
    closing_time: Mapped[str] = mapped_column(String(20), default="23:59", nullable=False)
    covered_parking: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    security: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    cctv: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ev_charging: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    wheelchair_access: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    washroom: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    total_slots: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    available_slots: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hourly_rate: Mapped[float] = mapped_column(Float, default=20.0, nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=4.5, nullable=False)
    status: Mapped[ParkingStatus] = mapped_column(Enum(ParkingStatus), default=ParkingStatus.PENDING_APPROVAL, index=True, nullable=False)
    is_open: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    pricing = relationship("ParkingPricing", back_populates="location", uselist=False, cascade="all, delete-orphan")
    slots = relationship("ParkingSlot", back_populates="location", cascade="all, delete-orphan")
    staff_assignments = relationship("ParkingStaffAssignment", back_populates="location", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="location")

class ParkingPricing(Base, TimestampMixin):
    __tablename__ = "parking_pricing"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    parking_location_id: Mapped[str] = mapped_column(String(36), ForeignKey("parking_locations.id"), unique=True, nullable=False)
    bike_hourly_price: Mapped[float] = mapped_column(Float, default=10.0, nullable=False)
    car_hourly_price: Mapped[float] = mapped_column(Float, default=30.0, nullable=False)
    suv_hourly_price: Mapped[float] = mapped_column(Float, default=40.0, nullable=False)
    ev_hourly_price: Mapped[float] = mapped_column(Float, default=35.0, nullable=False)

    # Relationship
    location = relationship("ParkingLocation", back_populates="pricing")

class ParkingSlot(Base, TimestampMixin):
    __tablename__ = "parking_slots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    location_id: Mapped[str] = mapped_column(String(36), ForeignKey("parking_locations.id"), index=True, nullable=False)
    slot_number: Mapped[str] = mapped_column(String(50), nullable=False)
    floor: Mapped[str] = mapped_column(String(20), default="Ground", nullable=False)
    section: Mapped[str] = mapped_column(String(50), default="Section A", nullable=False)
    vehicle_type: Mapped[VehicleType] = mapped_column(Enum(VehicleType), default=VehicleType.CAR, nullable=False)
    status: Mapped[SlotStatus] = mapped_column(Enum(SlotStatus), default=SlotStatus.AVAILABLE, index=True, nullable=False)

    # Relationships
    location = relationship("ParkingLocation", back_populates="slots")
    bookings = relationship("Booking", back_populates="slot")

class ParkingStaffAssignment(Base, TimestampMixin):
    __tablename__ = "parking_staff_assignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    staff_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    parking_location_id: Mapped[str] = mapped_column(String(36), ForeignKey("parking_locations.id"), index=True, nullable=False)

    # Relationships
    staff_user = relationship("User", foreign_keys=[staff_user_id])
    location = relationship("ParkingLocation", back_populates="staff_assignments")
