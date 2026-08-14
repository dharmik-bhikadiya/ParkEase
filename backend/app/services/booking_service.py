from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status

from app.models.booking import Booking, BookingStatus
from app.models.parking import ParkingLocation, ParkingSlot, ParkingPricing, SlotStatus, ParkingStatus
from app.models.user import User, UserRole
from app.schemas.booking import BookingCreate
from app.services.wallet_service import wallet_service

class BookingService:
    @staticmethod
    def create_booking(db: Session, user: User, data: BookingCreate) -> Booking:
        """
        Creates a new reservation with double-booking & concurrency protection.
        """
        # Validate time window
        if data.end_time <= data.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End time must be strictly after start time"
            )

        now = datetime.now(timezone.utc)
        # 10-minute grace buffer for client clock skew
        if data.start_time < (now - timedelta(minutes=10)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reservation start time cannot be in the past"
            )

        # Validate Parking Location
        location = db.query(ParkingLocation).filter(
            ParkingLocation.id == data.location_id
        ).first()

        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parking location not found"
            )

        # Validate Slot
        slot = db.query(ParkingSlot).filter(
            ParkingSlot.id == data.slot_id,
            ParkingSlot.location_id == data.location_id
        ).first()

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parking slot not found"
            )

        if slot.status == SlotStatus.MAINTENANCE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This slot is currently under maintenance"
            )

        # Double-Booking & Concurrency Protection Check
        overlapping_booking = db.query(Booking).filter(
            Booking.slot_id == data.slot_id,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE]),
            and_(
                Booking.start_time < data.end_time,
                Booking.end_time > data.start_time
            )
        ).first()

        if overlapping_booking:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This parking slot is already reserved for the selected time window."
            )

        # Calculate Duration & Price
        duration_seconds = (data.end_time - data.start_time).total_seconds()
        total_hours = round(max(duration_seconds / 3600.0, 0.5), 2)

        # Retrieve hourly pricing
        pricing = db.query(ParkingPricing).filter(
            ParkingPricing.parking_location_id == data.location_id
        ).first()

        hourly_rate = pricing.car_hourly_price if pricing else location.hourly_rate
        total_amount = round(total_hours * hourly_rate, 2)

        # Create Booking
        new_booking = Booking(
            user_id=user.id,
            location_id=data.location_id,
            slot_id=data.slot_id,
            vehicle_number=data.vehicle_number.upper().strip(),
            start_time=data.start_time,
            end_time=data.end_time,
            total_hours=total_hours,
            total_amount=total_amount,
            status=BookingStatus.CONFIRMED,
        )

        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)
        return new_booking

    @staticmethod
    def get_user_bookings(db: Session, user_id: str) -> List[Booking]:
        """
        Retrieves all bookings created by the given user.
        """
        return db.query(Booking).filter(
            Booking.user_id == user_id
        ).order_by(Booking.created_at.desc()).all()

    @staticmethod
    def get_booking_by_id(db: Session, booking_id: str, user: User) -> Booking:
        """
        Retrieves a single booking with authorization check.
        """
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )

        # Check authorization (User who booked, or Owner of location, or Admin)
        if user.role != UserRole.ADMIN and booking.user_id != user.id:
            location = db.query(ParkingLocation).filter(ParkingLocation.id == booking.location_id).first()
            if not location or location.owner_id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to view this booking"
                )

        return booking

    @staticmethod
    def cancel_booking(db: Session, booking_id: str, user: User) -> Booking:
        """
        Cancels a booking if status is PENDING or CONFIRMED, and issues automatic refund if paid.
        """
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )

        if booking.user_id != user.id and user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to cancel this booking"
            )

        if booking.status not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel a booking with status '{booking.status.value}'"
            )

        booking.status = BookingStatus.CANCELLED
        
        # Automatic Refund if Paid
        if getattr(booking, "payment_status", None) == "PAID":
            booking.payment_status = "REFUNDED"
            wallet_service.refund_booking(db, booking.user_id, booking.id, booking.total_amount)

        db.commit()
        db.refresh(booking)
        return booking

    @staticmethod
    def get_owner_bookings(db: Session, owner_id: str) -> List[Booking]:
        """
        Retrieves bookings for all locations owned by the given owner.
        """
        owner_locations = db.query(ParkingLocation.id).filter(
            ParkingLocation.owner_id == owner_id
        ).all()

        location_ids = [loc.id for loc in owner_locations]
        if not location_ids:
            return []

        return db.query(Booking).filter(
            Booking.location_id.in_(location_ids)
        ).order_by(Booking.created_at.desc()).all()

booking_service = BookingService()
