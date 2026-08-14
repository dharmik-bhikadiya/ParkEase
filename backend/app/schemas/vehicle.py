from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.vehicle import VehicleType

class VehicleBase(BaseModel):
    vehicle_type: VehicleType = VehicleType.CAR
    registration_number: str
    nickname: Optional[str] = None
    is_ev: bool = False
    is_default: bool = False

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    vehicle_type: Optional[VehicleType] = None
    registration_number: Optional[str] = None
    nickname: Optional[str] = None
    is_ev: Optional[bool] = None
    is_default: Optional[bool] = None

class VehicleResponse(VehicleBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
