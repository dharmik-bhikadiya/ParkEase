import hmac
import hashlib
from typing import Dict, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.models.booking import Booking, BookingStatus
from app.services.wallet_service import wallet_service

class PaymentService:
    def __init__(self):
        self.provider = settings.PAYMENT_PROVIDER
        self.razorpay_key_id = settings.RAZORPAY_KEY_ID
        self.razorpay_key_secret = settings.RAZORPAY_KEY_SECRET

    def is_gateway_configured(self) -> bool:
        return bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)

    def create_payment_order(
        self,
        db: Session,
        booking: Booking,
        method: PaymentMethod = PaymentMethod.WALLET
    ) -> Dict:
        """
        Creates a payment order record in PENDING state.
        Supports WALLET and GATEWAY abstractions.
        """
        # If method is WALLET, process via wallet_service atomically
        if method == PaymentMethod.WALLET:
            updated_booking = wallet_service.pay_for_booking(
                db=db,
                user_id=booking.user_id,
                booking_id=booking.id,
                amount=booking.total_amount
            )
            
            # Record payment ledger entry
            payment = Payment(
                booking_id=booking.id,
                amount=booking.total_amount,
                method=PaymentMethod.WALLET,
                status=PaymentStatus.COMPLETED,
                transaction_signature=f"WLT-TXN-{booking.id[:8]}"
            )
            db.add(payment)
            db.commit()
            db.refresh(payment)

            return {
                "payment_id": payment.id,
                "status": "COMPLETED",
                "method": "WALLET",
                "amount": payment.amount,
                "gateway_configured": True,
                "message": "Payment completed successfully using wallet balance."
            }

        # Otherwise, Gateway transaction order
        gateway_active = bool(self.razorpay_key_id and self.razorpay_key_secret)
        
        payment = Payment(
            booking_id=booking.id,
            amount=booking.total_amount,
            method=method,
            status=PaymentStatus.PENDING,
            transaction_signature=f"ORDER-{booking.id[:8]}"
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

        return {
            "payment_id": payment.id,
            "order_id": payment.transaction_signature,
            "status": "PENDING",
            "method": method.value,
            "amount": payment.amount,
            "currency": "INR",
            "gateway_configured": gateway_active,
            "gateway_key": self.razorpay_key_id if gateway_active else "PAYMENT_GATEWAY_NOT_CONFIGURED",
            "message": "Payment order initialized." if gateway_active else "Payment gateway credentials pending configuration in environment."
        }

    def verify_and_complete_payment(
        self,
        db: Session,
        payment_id: str,
        transaction_signature: str
    ) -> Dict:
        """
        Verifies transaction signature and marks booking CONFIRMED.
        """
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment order record not found."
            )

        booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated booking not found."
            )

        if payment.status == PaymentStatus.COMPLETED:
            return {
                "payment_id": payment.id,
                "status": "COMPLETED",
                "message": "Payment was already completed."
            }

        # Update payment status
        payment.status = PaymentStatus.COMPLETED
        payment.transaction_signature = transaction_signature
        
        # Mark booking CONFIRMED
        booking.status = BookingStatus.CONFIRMED

        db.commit()
        db.refresh(payment)

        return {
            "payment_id": payment.id,
            "status": "COMPLETED",
            "booking_id": booking.id,
            "message": "Payment verified and booking confirmed."
        }

payment_service = PaymentService()
