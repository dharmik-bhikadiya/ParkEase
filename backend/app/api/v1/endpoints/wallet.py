from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.response import APIResponse
from app.schemas.wallet import WalletResponse, TransactionResponse, WalletTopupRequest
from app.services.wallet_service import wallet_service

router = APIRouter()

class PayBookingRequest(BaseModel):
    booking_id: str
    amount: float

@router.get("", response_model=APIResponse[WalletResponse])
def get_wallet(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get or initialize user digital wallet balance and currency
    """
    wallet = wallet_service.get_or_create_wallet(db, current_user.id)
    return APIResponse(
        message="Wallet details retrieved successfully",
        data=WalletResponse.model_validate(wallet)
    )

@router.get("/balance", response_model=APIResponse[dict])
def get_wallet_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get user digital wallet balance
    """
    wallet = wallet_service.get_or_create_wallet(db, current_user.id)
    return APIResponse(
        message="Wallet balance preview",
        data={"balance": wallet.balance, "currency": wallet.currency}
    )

@router.post("/topup", response_model=APIResponse[WalletResponse])
def topup_wallet(
    payload: WalletTopupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Top-up funds into user digital wallet
    """
    wallet = wallet_service.topup_wallet(
        db,
        user_id=current_user.id,
        amount=payload.amount,
        payment_method=payload.payment_method
    )
    return APIResponse(
        message=f"Successfully added ₹{payload.amount:.2f} to wallet",
        data=WalletResponse.model_validate(wallet)
    )

@router.post("/pay", response_model=APIResponse[dict])
def pay_for_booking(
    payload: PayBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Deduct funds from user digital wallet for parking booking
    """
    booking = wallet_service.pay_for_booking(
        db,
        user_id=current_user.id,
        booking_id=payload.booking_id,
        amount=payload.amount
    )
    return APIResponse(
        message=f"Successfully paid ₹{payload.amount:.2f} via wallet for booking #{booking.id[:8]}",
        data={
            "booking_id": booking.id,
            "status": booking.status,
            "payment_status": booking.payment_status,
            "total_amount": booking.total_amount
        }
    )

@router.get("/transactions", response_model=APIResponse[List[TransactionResponse]])
def get_wallet_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get wallet transaction history
    """
    txns = wallet_service.get_transactions(db, current_user.id)
    txn_data = [TransactionResponse.model_validate(t) for t in txns]
    return APIResponse(
        message="Wallet transaction history retrieved",
        data=txn_data
    )
