import hmac
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.booking import Booking, BookingStatus
from app.models.parking import ParkingSlot, SlotStatus
from app.models.qr import QrPass, QrType
from app.models.user import User, UserRole

class QrService:
    @staticmethod
    def _generate_signature(payload_str: str) -> str:
        secret = getattr(settings, "SECRET_KEY", "parkease-super-secret-key-2026")
        return hmac.new(secret.encode('utf-8'), payload_str.encode('utf-8'), hashlib.sha256).hexdigest()

    @staticmethod
    def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    @staticmethod
    def get_or_create_qr_passes(db: Session, booking_id: str, user: User) -> List[QrPass]:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found."
            )

        if user.role != UserRole.ADMIN and booking.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view QR passes for this booking."
            )

        passes = db.query(QrPass).filter(QrPass.booking_id == booking_id).all()
        if passes and len(passes) >= 2:
            return passes

        # Generate ENTRY and EXIT passes
        created_passes = []
        start_time = QrService._ensure_utc(booking.start_time) or datetime.now(timezone.utc)
        end_time = QrService._ensure_utc(booking.end_time) or (start_time + timedelta(hours=2))

        valid_from = start_time - timedelta(minutes=30)
        valid_until = end_time + timedelta(hours=4)

        for q_type in [QrType.ENTRY, QrType.EXIT]:
            existing = db.query(QrPass).filter(
                QrPass.booking_id == booking_id,
                QrPass.type == q_type
            ).first()

            if existing:
                created_passes.append(existing)
                continue

            payload_raw = f"PARKEASE|{booking.id}|{q_type.value}|{valid_until.isoformat()}"
            sig = QrService._generate_signature(payload_raw)
            full_payload = f"{payload_raw}:{sig}"

            qr_pass = QrPass(
                booking_id=booking.id,
                type=q_type,
                qr_payload=full_payload,
                hash_signature=sig,
                valid_from=valid_from,
                valid_until=valid_until,
                is_used=False
            )
            db.add(qr_pass)
            created_passes.append(qr_pass)

        db.commit()
        for p in created_passes:
            db.refresh(p)
        return created_passes

    @staticmethod
    def validate_and_process_entry(db: Session, full_payload: str, staff_user: User) -> Dict:
        try:
            payload_raw, sig = full_payload.rsplit(":", 1)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Malformed QR pass payload structure."
            )

        expected_sig = QrService._generate_signature(payload_raw)
        if not hmac.compare_digest(expected_sig, sig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid QR signature. Tampered or counterfeit QR pass."
            )

        parts = payload_raw.split("|")
        if len(parts) != 4 or parts[0] != "PARKEASE" or parts[2] != QrType.ENTRY.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid ENTRY QR pass format."
            )

        booking_id = parts[1]
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated booking not found."
            )

        qr_pass = db.query(QrPass).filter(
            QrPass.booking_id == booking_id,
            QrPass.type == QrType.ENTRY
        ).first()

        if qr_pass and qr_pass.is_used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ENTRY QR pass has already been used. Replay attack blocked."
            )

        if booking.status not in [BookingStatus.CONFIRMED, BookingStatus.PENDING]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot start session. Booking status is '{booking.status.value}'."
            )

        now = datetime.now(timezone.utc)
        if qr_pass and qr_pass.valid_until:
            vu = QrService._ensure_utc(qr_pass.valid_until)
            if vu and now > vu:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="ENTRY QR pass has expired."
                )

        # Transition Booking -> ACTIVE
        booking.status = BookingStatus.ACTIVE
        booking.actual_entry_time = now

        # Transition Slot -> OCCUPIED
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first()
        if slot:
            slot.status = SlotStatus.OCCUPIED

        if qr_pass:
            qr_pass.is_used = True
            qr_pass.used_at = now

        db.commit()
        db.refresh(booking)

        return {
            "session_status": "ACTIVE",
            "booking_id": booking.id,
            "vehicle_number": booking.vehicle_number,
            "entry_time": now.isoformat(),
            "slot_number": slot.slot_number if slot else "N/A",
            "message": f"Entry approved for vehicle {booking.vehicle_number} at slot {slot.slot_number if slot else ''}."
        }

    @staticmethod
    def validate_and_process_exit(db: Session, full_payload: str, staff_user: User) -> Dict:
        try:
            payload_raw, sig = full_payload.rsplit(":", 1)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Malformed QR pass payload structure."
            )

        expected_sig = QrService._generate_signature(payload_raw)
        if not hmac.compare_digest(expected_sig, sig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid QR signature. Tampered or counterfeit QR pass."
            )

        parts = payload_raw.split("|")
        if len(parts) != 4 or parts[0] != "PARKEASE" or parts[2] != QrType.EXIT.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid EXIT QR pass format."
            )

        booking_id = parts[1]
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated booking not found."
            )

        qr_pass = db.query(QrPass).filter(
            QrPass.booking_id == booking_id,
            QrPass.type == QrType.EXIT
        ).first()

        if qr_pass and qr_pass.is_used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="EXIT QR pass has already been used."
            )

        if booking.status != BookingStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot process exit. Booking status is '{booking.status.value}', expected 'ACTIVE'."
            )

        now = datetime.now(timezone.utc)
        
        # Transition Booking -> COMPLETED
        booking.status = BookingStatus.COMPLETED
        booking.actual_exit_time = now

        # Calculate Overstay if actual exit > end_time
        b_end_time = QrService._ensure_utc(booking.end_time)
        if b_end_time and now > b_end_time:
            overstay_seconds = (now - b_end_time).total_seconds()
            overstay_hours = round(max(overstay_seconds / 3600.0, 0.5), 2)
            # Default rate ₹30/hr for overstay
            booking.overstay_charges = round(overstay_hours * 30.0, 2)

        # Transition Slot -> AVAILABLE
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first()
        if slot:
            slot.status = SlotStatus.AVAILABLE

        if qr_pass:
            qr_pass.is_used = True
            qr_pass.used_at = now

        db.commit()
        db.refresh(booking)

        return {
            "session_status": "COMPLETED",
            "booking_id": booking.id,
            "vehicle_number": booking.vehicle_number,
            "exit_time": now.isoformat(),
            "overstay_charges": booking.overstay_charges,
            "slot_number": slot.slot_number if slot else "N/A",
            "message": f"Exit approved for vehicle {booking.vehicle_number}. Overstay charge: ₹{booking.overstay_charges:.2f}."
        }

qr_service = QrService()
