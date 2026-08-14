from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.payment import PaymentMethod, PaymentStatus

class PaymentRequest(BaseModel):
    booking_id: str
    method: PaymentMethod = PaymentMethod.WALLET

class PaymentResponse(BaseModel):
    id: str
    booking_id: str
    amount: float
    method: PaymentMethod
    status: PaymentStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
