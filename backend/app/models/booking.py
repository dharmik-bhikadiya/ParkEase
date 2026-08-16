import enum
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, generate_uuid

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"

class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    location_id: Mapped[str] = mapped_column(String(36), ForeignKey("parking_locations.id"), nullable=False)
    slot_id: Mapped[str] = mapped_column(String(36), ForeignKey("parking_slots.id"), nullable=False)
    vehicle_number: Mapped[str] = mapped_column(String(30), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_hours: Mapped[float] = mapped_column(Float, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False)
    
    actual_entry_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_exit_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    overstay_charges: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationships
    user = relationship("User", back_populates="bookings")
    location = relationship("ParkingLocation", back_populates="bookings")
    slot = relationship("ParkingSlot", back_populates="bookings")
    qr_passes = relationship("QrPass", back_populates="booking", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
