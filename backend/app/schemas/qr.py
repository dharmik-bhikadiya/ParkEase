from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.qr import QrType

class QrGenerateRequest(BaseModel):
    booking_id: str
    type: QrType

class QrVerifyRequest(BaseModel):
    qr_payload: str
    scanner_location_id: str

class QrPassResponse(BaseModel):
    id: str
    booking_id: str
    type: QrType
    qr_payload: str
    valid_from: datetime
    valid_until: datetime
    is_used: bool

    model_config = ConfigDict(from_attributes=True)
