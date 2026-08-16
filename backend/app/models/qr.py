import enum
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, generate_uuid

class QrType(str, enum.Enum):
    ENTRY = "ENTRY"
    EXIT = "EXIT"

class QrPass(Base, TimestampMixin):
    __tablename__ = "qr_passes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[QrType] = mapped_column(Enum(QrType), nullable=False)
    qr_payload: Mapped[str] = mapped_column(String(500), nullable=False)
    hash_signature: Mapped[str] = mapped_column(String(255), nullable=False)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    used_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="qr_passes")
