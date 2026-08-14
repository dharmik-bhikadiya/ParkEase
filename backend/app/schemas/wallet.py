from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.wallet import TransactionType

class WalletTopupRequest(BaseModel):
    amount: float
    payment_method: str = "CARD"

class TransactionResponse(BaseModel):
    id: str
    wallet_id: str
    amount: float
    type: TransactionType
    reference_id: Optional[str] = None
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WalletResponse(BaseModel):
    id: str
    user_id: str
    balance: float
    currency: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
