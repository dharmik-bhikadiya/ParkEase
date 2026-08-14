from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.parking import ParkingType, ParkingStatus, SlotStatus, VehicleType

# PRICING SCHEMAS
class ParkingPricingBase(BaseModel):
    bike_hourly_price: float = Field(10.0, ge=0)
    car_hourly_price: float = Field(30.0, ge=0)
    suv_hourly_price: float = Field(40.0, ge=0)
    ev_hourly_price: float = Field(35.0, ge=0)

class ParkingPricingCreate(ParkingPricingBase):
    pass

class ParkingPricingResponse(ParkingPricingBase):
    id: str
    parking_location_id: str

    model_config = ConfigDict(from_attributes=True)

# SLOT SCHEMAS
class ParkingSlotBase(BaseModel):
    slot_number: str
    floor: str = "Ground"
    section: str = "Section A"
    vehicle_type: VehicleType = VehicleType.CAR
    status: SlotStatus = SlotStatus.AVAILABLE

class ParkingSlotCreate(ParkingSlotBase):
    pass

class ParkingSlotUpdate(BaseModel):
    slot_number: Optional[str] = None
    floor: Optional[str] = None
    section: Optional[str] = None
    vehicle_type: Optional[VehicleType] = None
    status: Optional[SlotStatus] = None

class ParkingSlotResponse(ParkingSlotBase):
    id: str
    location_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# PARKING LOCATION SCHEMAS
class ParkingLocationBase(BaseModel):
    name: str
    description: Optional[str] = None
    parking_type: ParkingType = ParkingType.OTHER
    address: str
    city: str
    area: str
    latitude: float
    longitude: float
    images: Optional[List[str]] = []
    opening_time: str = "00:00"
    closing_time: str = "23:59"
    covered_parking: bool = False
    security: bool = True
    cctv: bool = True
    ev_charging: bool = False
    wheelchair_access: bool = False
    washroom: bool = False
    hourly_rate: float = 20.0
    is_open: bool = True

class InitialSlotsConfig(BaseModel):
    floor_count: Optional[int] = 1
    slots_per_floor: Optional[int] = 10
    sections: Optional[List[str]] = ["Section A"]

class ParkingLocationCreate(ParkingLocationBase):
    total_slots: int = Field(..., gt=0)
    bike_hourly_price: float = Field(10.0, ge=0)
    car_hourly_price: float = Field(30.0, ge=0)
    suv_hourly_price: float = Field(40.0, ge=0)
    ev_hourly_price: float = Field(35.0, ge=0)
    initial_slots_config: Optional[InitialSlotsConfig] = None

class ParkingLocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parking_type: Optional[ParkingType] = None
    address: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    images: Optional[List[str]] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    covered_parking: Optional[bool] = None
    security: Optional[bool] = None
    cctv: Optional[bool] = None
    ev_charging: Optional[bool] = None
    wheelchair_access: Optional[bool] = None
    washroom: Optional[bool] = None
    hourly_rate: Optional[float] = None
    is_open: Optional[bool] = None
    bike_hourly_price: Optional[float] = None
    car_hourly_price: Optional[float] = None
    suv_hourly_price: Optional[float] = None
    ev_hourly_price: Optional[float] = None

class ParkingLocationResponse(ParkingLocationBase):
    id: str
    owner_id: str
    total_slots: int
    available_slots: int
    rating: float
    status: ParkingStatus
    distance_km: Optional[float] = None
    pricing: Optional[ParkingPricingResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ParkingLocationDetailResponse(ParkingLocationResponse):
    slots: List[ParkingSlotResponse] = []

# ADMIN & STAFF SCHEMAS
class ParkingStatusUpdate(BaseModel):
    status: ParkingStatus

class ParkingStaffAssignmentCreate(BaseModel):
    staff_user_id: str

class ParkingStaffAssignmentResponse(BaseModel):
    id: str
    staff_user_id: str
    parking_location_id: str
    staff_name: Optional[str] = None
    staff_email: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# SEARCH PARAMS SCHEMA
class ParkingSearchFilter(BaseModel):
    query: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    vehicle_type: Optional[VehicleType] = None
    parking_type: Optional[ParkingType] = None
    max_price: Optional[float] = None
    covered_parking: Optional[bool] = None
    cctv: Optional[bool] = None
    security: Optional[bool] = None
    ev_charging: Optional[bool] = None
    min_rating: Optional[float] = None
    min_slots: Optional[int] = None
    sort_by: Optional[str] = "distance"
    lat: Optional[float] = None
    lng: Optional[float] = None
