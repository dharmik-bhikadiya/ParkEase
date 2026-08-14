from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.wallet import Wallet, WalletTransaction, TransactionType
from app.models.booking import Booking, BookingStatus

class WalletService:
    @staticmethod
    def get_or_create_wallet(db: Session, user_id: str) -> Wallet:
        wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
        if not wallet:
            wallet = Wallet(
                user_id=user_id,
                balance=0.0,
                currency="INR"
            )
            db.add(wallet)
            db.commit()
            db.refresh(wallet)
        return wallet

    @staticmethod
    def topup_wallet(db: Session, user_id: str, amount: float, payment_method: str = "CARD") -> Wallet:
        if amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Top-up amount must be greater than zero."
            )
        
        wallet = WalletService.get_or_create_wallet(db, user_id)
        wallet.balance += amount

        txn = WalletTransaction(
            wallet_id=wallet.id,
            amount=amount,
            type=TransactionType.TOPUP,
            reference_id=None,
            description=f"Wallet Top-Up via {payment_method.upper()}"
        )
        db.add(txn)
        db.commit()
        db.refresh(wallet)
        return wallet

    @staticmethod
    def pay_for_booking(db: Session, user_id: str, booking_id: str, amount: float) -> Booking:
        wallet = WalletService.get_or_create_wallet(db, user_id)
        
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found."
            )

        if booking.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized booking access."
            )

        if wallet.balance < amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient wallet balance. Available: ₹{wallet.balance:.2f}, Required: ₹{amount:.2f}"
            )

        wallet.balance -= amount

        txn = WalletTransaction(
            wallet_id=wallet.id,
            amount=-amount,
            type=TransactionType.BOOKING_PAYMENT,
            reference_id=booking_id,
            description=f"Payment for Booking #{booking_id[:8]}"
        )
        db.add(txn)
        
        booking.payment_status = "PAID"
        booking.status = BookingStatus.CONFIRMED

        db.commit()
        db.refresh(booking)
        return booking

    @staticmethod
    def refund_booking(db: Session, user_id: str, booking_id: str, amount: float) -> Wallet:
        wallet = WalletService.get_or_create_wallet(db, user_id)
        wallet.balance += amount

        txn = WalletTransaction(
            wallet_id=wallet.id,
            amount=amount,
            type=TransactionType.REFUND,
            reference_id=booking_id,
            description=f"Refund for Cancelled Booking #{booking_id[:8]}"
        )
        db.add(txn)
        db.commit()
        db.refresh(wallet)
        return wallet

    @staticmethod
    def get_transactions(db: Session, user_id: str) -> list[WalletTransaction]:
        wallet = WalletService.get_or_create_wallet(db, user_id)
        return (
            db.query(WalletTransaction)
            .filter(WalletTransaction.wallet_id == wallet.id)
            .order_by(WalletTransaction.created_at.desc())
            .all()
        )

wallet_service = WalletService()
