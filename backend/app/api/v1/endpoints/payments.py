from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, UserRole
from app.models.booking import Booking
from app.models.payment import PaymentMethod
from app.schemas.response import APIResponse
from app.services.payment_service import payment_service
from app.services.notification_service import notification_service

router = APIRouter()

class CreatePaymentOrderRequest(BaseModel):
    booking_id: str
    method: Optional[str] = "WALLET"

class VerifyPaymentRequest(BaseModel):
    payment_id: str
    transaction_signature: str

@router.post("/create-order", response_model=APIResponse)
def create_payment_order(
    request: CreatePaymentOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Initialize payment order for booking via Wallet or Gateway abstraction.
    """
    booking = db.query(Booking).filter(Booking.id == request.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found."
        )

    if booking.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized payment order creation."
        )

    pm_enum = PaymentMethod.WALLET
    if request.method and request.method.upper() in PaymentMethod.__members__:
        pm_enum = PaymentMethod[request.method.upper()]

    result = payment_service.create_payment_order(db=db, booking=booking, method=pm_enum)
    
    if result.get("status") == "COMPLETED":
        notification_service.send_notification(
            db=db,
            user_id=current_user.id,
            title="Payment Confirmed",
            message=f"₹{booking.total_amount:.2f} paid successfully for Booking #{booking.id[:8]}.",
            type_="SUCCESS"
        )

    return APIResponse(
        success=True,
        message=result["message"],
        data=result
    )

@router.post("/verify", response_model=APIResponse)
def verify_payment(
    request: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Verify payment order signature and mark booking confirmed.
    """
    result = payment_service.verify_and_complete_payment(
        db=db,
        payment_id=request.payment_id,
        transaction_signature=request.transaction_signature
    )

    notification_service.send_notification(
        db=db,
        user_id=current_user.id,
        title="Payment Verified",
        message="Your payment signature was verified and booking is confirmed.",
        type_="SUCCESS"
    )

    return APIResponse(
        success=True,
        message=result["message"],
        data=result
    )
