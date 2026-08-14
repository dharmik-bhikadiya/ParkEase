import math
from typing import List, Optional, Tuple
from sqlalchemy import or_, and_, asc, desc
from sqlalchemy.orm import Session, joinedload
from app.models.parking import (
    ParkingLocation,
    ParkingPricing,
    ParkingSlot,
    ParkingType,
    ParkingStatus,
    SlotStatus,
    VehicleType,
    ParkingStaffAssignment,
)
from app.models.user import User
from app.schemas.parking import ParkingLocationCreate, ParkingLocationUpdate, ParkingSlotCreate, ParkingSlotUpdate
from app.repositories.base import BaseRepository

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two coordinates."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class ParkingRepository(BaseRepository[ParkingLocation]):
    def __init__(self):
        super().__init__(ParkingLocation)

    def search_parking(
        self,
        db: Session,
        query: Optional[str] = None,
        city: Optional[str] = None,
        area: Optional[str] = None,
        vehicle_type: Optional[VehicleType] = None,
        parking_type: Optional[ParkingType] = None,
        max_price: Optional[float] = None,
        covered_parking: Optional[bool] = None,
        cctv: Optional[bool] = None,
        security: Optional[bool] = None,
        ev_charging: Optional[bool] = None,
        min_rating: Optional[float] = None,
        min_slots: Optional[int] = None,
        sort_by: Optional[str] = "distance",
        user_lat: Optional[float] = None,
        user_lng: Optional[float] = None,
        include_inactive: bool = False,
    ) -> List[ParkingLocation]:
        """
        Advanced backend parking discovery query
        """
        q = db.query(ParkingLocation).options(joinedload(ParkingLocation.pricing))

        if not include_inactive:
            q = q.filter(ParkingLocation.status == ParkingStatus.ACTIVE, ParkingLocation.is_open == True)

        if query:
            search_pattern = f"%{query}%"
            q = q.filter(
                or_(
                    ParkingLocation.name.ilike(search_pattern),
                    ParkingLocation.address.ilike(search_pattern),
                    ParkingLocation.city.ilike(search_pattern),
                    ParkingLocation.area.ilike(search_pattern),
                    ParkingLocation.description.ilike(search_pattern),
                )
            )

        if city:
            q = q.filter(ParkingLocation.city.ilike(f"%{city}%"))

        if area:
            q = q.filter(ParkingLocation.area.ilike(f"%{area}%"))

        if parking_type:
            q = q.filter(ParkingLocation.parking_type == parking_type)

        if covered_parking is True:
            q = q.filter(ParkingLocation.covered_parking == True)

        if cctv is True:
            q = q.filter(ParkingLocation.cctv == True)

        if security is True:
            q = q.filter(ParkingLocation.security == True)

        if ev_charging is True:
            q = q.filter(ParkingLocation.ev_charging == True)

        if min_rating:
            q = q.filter(ParkingLocation.rating >= min_rating)

        if min_slots:
            q = q.filter(ParkingLocation.available_slots >= min_slots)

        locations = q.all()

        # Calculate distances & attach dynamically
        for loc in locations:
            if user_lat is not None and user_lng is not None:
                loc.distance_km = haversine_distance(user_lat, user_lng, loc.latitude, loc.longitude)
            else:
                loc.distance_km = 1.2 # Default visual approximation

        # Apply price filter based on vehicle_type or hourly_rate
        if max_price is not None:
            filtered = []
            for loc in locations:
                price = loc.hourly_rate
                if loc.pricing:
                    if vehicle_type == VehicleType.BIKE:
                        price = loc.pricing.bike_hourly_price
                    elif vehicle_type == VehicleType.CAR:
                        price = loc.pricing.car_hourly_price
                    elif vehicle_type == VehicleType.SUV:
                        price = loc.pricing.suv_hourly_price
                    elif vehicle_type == VehicleType.EV:
                        price = loc.pricing.ev_hourly_price
                if price <= max_price:
                    filtered.append(loc)
            locations = filtered

        # Sorting
        if sort_by == "price":
            locations.sort(key=lambda x: x.hourly_rate)
        elif sort_by == "availability":
            locations.sort(key=lambda x: x.available_slots, reverse=True)
        elif sort_by == "rating":
            locations.sort(key=lambda x: x.rating, reverse=True)
        else:  # default 'distance'
            locations.sort(key=lambda x: getattr(x, "distance_km", 0.0))

        return locations

    def get_by_id_with_details(self, db: Session, location_id: str) -> Optional[ParkingLocation]:
        return (
            db.query(ParkingLocation)
            .options(joinedload(ParkingLocation.pricing), joinedload(ParkingLocation.slots))
            .filter(ParkingLocation.id == location_id)
            .first()
        )

    def get_by_owner(self, db: Session, owner_id: str) -> List[ParkingLocation]:
        return (
            db.query(ParkingLocation)
            .options(joinedload(ParkingLocation.pricing), joinedload(ParkingLocation.slots))
            .filter(ParkingLocation.owner_id == owner_id)
            .order_by(desc(ParkingLocation.created_at))
            .all()
        )

    def get_pending_approvals(self, db: Session) -> List[ParkingLocation]:
        return (
            db.query(ParkingLocation)
            .options(joinedload(ParkingLocation.pricing), joinedload(ParkingLocation.owner))
            .filter(ParkingLocation.status == ParkingStatus.PENDING_APPROVAL)
            .order_by(desc(ParkingLocation.created_at))
            .all()
        )

    def get_all_admin(self, db: Session) -> List[ParkingLocation]:
        return (
            db.query(ParkingLocation)
            .options(joinedload(ParkingLocation.pricing), joinedload(ParkingLocation.owner))
            .order_by(desc(ParkingLocation.created_at))
            .all()
        )

    def create_location_with_pricing_and_slots(
        self, db: Session, owner_id: str, data: ParkingLocationCreate
    ) -> ParkingLocation:
        # Create Location
        location = ParkingLocation(
            owner_id=owner_id,
            name=data.name,
            description=data.description,
            parking_type=data.parking_type,
            address=data.address,
            city=data.city,
            area=data.area,
            latitude=data.latitude,
            longitude=data.longitude,
            images=data.images or [],
            opening_time=data.opening_time,
            closing_time=data.closing_time,
            covered_parking=data.covered_parking,
            security=data.security,
            cctv=data.cctv,
            ev_charging=data.ev_charging,
            wheelchair_access=data.wheelchair_access,
            washroom=data.washroom,
            total_slots=data.total_slots,
            available_slots=data.total_slots,
            hourly_rate=data.car_hourly_price,
            rating=4.5,
            status=ParkingStatus.PENDING_APPROVAL, # Requires Admin Approval
            is_open=True,
        )
        db.add(location)
        db.flush()

        # Create Pricing
        pricing = ParkingPricing(
            parking_location_id=location.id,
            bike_hourly_price=data.bike_hourly_price,
            car_hourly_price=data.car_hourly_price,
            suv_hourly_price=data.suv_hourly_price,
            ev_hourly_price=data.ev_hourly_price,
        )
        db.add(pricing)

        # Generate Initial Slots Layout
        floor_count = (data.initial_slots_config.floor_count if data.initial_slots_config else 1) or 1
        slots_per_floor = (data.initial_slots_config.slots_per_floor if data.initial_slots_config else 10) or 10
        sections = (data.initial_slots_config.sections if data.initial_slots_config else ["Section A"]) or ["Section A"]

        slot_idx = 1
        for f in range(floor_count):
            floor_label = f"Ground" if f == 0 else f"Floor {f}"
            for sec_idx, sec_name in enumerate(sections):
                per_section = max(1, slots_per_floor // len(sections))
                for s in range(per_section):
                    if slot_idx > data.total_slots:
                        break
                    slot_number = f"A{slot_idx:02d}" if f == 0 else f"F{f}-{slot_idx:02d}"
                    slot = ParkingSlot(
                        location_id=location.id,
                        slot_number=slot_number,
                        floor=floor_label,
                        section=sec_name,
                        vehicle_type=VehicleType.CAR,
                        status=SlotStatus.AVAILABLE,
                    )
                    db.add(slot)
                    slot_idx += 1

        db.commit()
        db.refresh(location)
        return location

    def update_location(self, db: Session, location_id: str, data: ParkingLocationUpdate) -> Optional[ParkingLocation]:
        location = db.query(ParkingLocation).filter(ParkingLocation.id == location_id).first()
        if not location:
            return None

        update_dict = data.model_dump(exclude_unset=True)

        # Handle pricing fields separately
        pricing_fields = ['bike_hourly_price', 'car_hourly_price', 'suv_hourly_price', 'ev_hourly_price']
        pricing_updates = {f: update_dict.pop(f) for f in pricing_fields if f in update_dict}

        for key, value in update_dict.items():
            setattr(location, key, value)

        if pricing_updates and location.pricing:
            for k, v in pricing_updates.items():
                setattr(location.pricing, k, v)
        elif pricing_updates and not location.pricing:
            location.pricing = ParkingPricing(
                parking_location_id=location.id,
                bike_hourly_price=pricing_updates.get('bike_hourly_price', 10.0),
                car_hourly_price=pricing_updates.get('car_hourly_price', 30.0),
                suv_hourly_price=pricing_updates.get('suv_hourly_price', 40.0),
                ev_hourly_price=pricing_updates.get('ev_hourly_price', 35.0),
            )

        db.commit()
        db.refresh(location)
        return location

    def update_status(self, db: Session, location_id: str, status: ParkingStatus) -> Optional[ParkingLocation]:
        location = db.query(ParkingLocation).filter(ParkingLocation.id == location_id).first()
        if not location:
            return None
        location.status = status
        db.commit()
        db.refresh(location)
        return location

    # SLOT METHODS
    def get_slots(self, db: Session, location_id: str) -> List[ParkingSlot]:
        return db.query(ParkingSlot).filter(ParkingSlot.location_id == location_id).order_by(asc(ParkingSlot.slot_number)).all()

    def create_slot(self, db: Session, location_id: str, data: ParkingSlotCreate) -> ParkingSlot:
        slot = ParkingSlot(
            location_id=location_id,
            slot_number=data.slot_number,
            floor=data.floor,
            section=data.section,
            vehicle_type=data.vehicle_type,
            status=data.status,
        )
        db.add(slot)
        
        # Increment total & available slots count on location
        loc = db.query(ParkingLocation).filter(ParkingLocation.id == location_id).first()
        if loc:
            loc.total_slots += 1
            if data.status == SlotStatus.AVAILABLE:
                loc.available_slots += 1

        db.commit()
        db.refresh(slot)
        return slot

    def update_slot(self, db: Session, slot_id: str, data: ParkingSlotUpdate) -> Optional[ParkingSlot]:
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
        if not slot:
            return None

        old_status = slot.status
        update_dict = data.model_dump(exclude_unset=True)

        for key, value in update_dict.items():
            setattr(slot, key, value)

        # Recalculate available slots on location if status changed
        if "status" in update_dict and old_status != data.status:
            loc = db.query(ParkingLocation).filter(ParkingLocation.id == slot.location_id).first()
            if loc:
                if old_status == SlotStatus.AVAILABLE and data.status != SlotStatus.AVAILABLE:
                    loc.available_slots = max(0, loc.available_slots - 1)
                elif old_status != SlotStatus.AVAILABLE and data.status == SlotStatus.AVAILABLE:
                    loc.available_slots += 1

        db.commit()
        db.refresh(slot)
        return slot

    # STAFF ASSIGNMENT METHODS
    def assign_staff(self, db: Session, location_id: str, staff_user_id: str) -> ParkingStaffAssignment:
        existing = db.query(ParkingStaffAssignment).filter(
            ParkingStaffAssignment.parking_location_id == location_id,
            ParkingStaffAssignment.staff_user_id == staff_user_id
        ).first()
        if existing:
            return existing

        assignment = ParkingStaffAssignment(
            parking_location_id=location_id,
            staff_user_id=staff_user_id
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment

    def remove_staff(self, db: Session, location_id: str, staff_user_id: str) -> bool:
        assignment = db.query(ParkingStaffAssignment).filter(
            ParkingStaffAssignment.parking_location_id == location_id,
            ParkingStaffAssignment.staff_user_id == staff_user_id
        ).first()
        if assignment:
            db.delete(assignment)
            db.commit()
            return True
        return False

    def is_staff_assigned(self, db: Session, location_id: str, user_id: str) -> bool:
        count = db.query(ParkingStaffAssignment).filter(
            ParkingStaffAssignment.parking_location_id == location_id,
            ParkingStaffAssignment.staff_user_id == user_id
        ).count()
        return count > 0

    def get_assigned_locations_for_staff(self, db: Session, staff_user_id: str) -> List[ParkingLocation]:
        assignments = db.query(ParkingStaffAssignment).filter(
            ParkingStaffAssignment.staff_user_id == staff_user_id
        ).all()
        loc_ids = [a.parking_location_id for a in assignments]
        if not loc_ids:
            return []
        return db.query(ParkingLocation).filter(ParkingLocation.id.in_(loc_ids)).all()

parking_repository = ParkingRepository()
