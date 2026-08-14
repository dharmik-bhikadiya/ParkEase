from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.booking import BookingStatus

class BookingCreate(BaseModel):
    location_id: str
    slot_id: str
    vehicle_number: str
    start_time: datetime
    end_time: datetime

class BookingResponse(BaseModel):
    id: str
    user_id: str
    location_id: str
    slot_id: str
    vehicle_number: str
    start_time: datetime
    end_time: datetime
    total_hours: float
    total_amount: float
    status: BookingStatus
    actual_entry_time: Optional[datetime] = None
    actual_exit_time: Optional[datetime] = None
    overstay_charges: float = 0.0
    created_at: datetime
    location_name: Optional[str] = None
    location_address: Optional[str] = None
    slot_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
