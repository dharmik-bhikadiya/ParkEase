import { apiClient } from './client';
import {
  ParkingLocation,
  ParkingSlot,
  SearchParkingParams,
  CreateParkingRequest,
  UpdateParkingRequest,
  CreateSlotRequest,
  UpdateSlotRequest,
  ParkingType,
  SlotStatus,
  VehicleType,
  ParkingStatus,
} from '@parkease/shared';

// Helper to normalize snake_case backend responses to TypeScript camelCase model
export const normalizeLocation = (data: any): ParkingLocation => ({
  id: data.id,
  ownerId: data.owner_id || data.ownerId || 'owner-1',
  name: data.name,
  description: data.description,
  parkingType: (data.parking_type || data.parkingType || ParkingType.RAILWAY_STATION) as ParkingType,
  address: data.address,
  city: data.city,
  area: data.area,
  latitude: data.latitude,
  longitude: data.longitude,
  images: data.images || ['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800'],
  openingTime: data.opening_time || data.openingTime || '06:00',
  closingTime: data.closing_time || data.closingTime || '23:00',
  coveredParking: data.covered_parking ?? data.coveredParking ?? true,
  security: data.security ?? true,
  cctv: data.cctv ?? true,
  evCharging: data.ev_charging ?? data.evCharging ?? false,
  wheelchairAccess: data.wheelchair_access ?? data.wheelchairAccess ?? true,
  washroom: data.washroom ?? true,
  totalSlots: data.total_slots ?? data.totalSlots ?? 50,
  availableSlots: data.available_slots ?? data.availableSlots ?? 20,
  rating: data.rating ?? 4.5,
  status: (data.status || ParkingStatus.ACTIVE) as ParkingStatus,
  pricing: {
    bikeHourlyPrice: data.pricing?.bike_hourly_price ?? data.pricing?.bikeHourlyPrice ?? 10,
    carHourlyPrice: data.pricing?.car_hourly_price ?? data.pricing?.carHourlyPrice ?? 20,
    suvHourlyPrice: data.pricing?.suv_hourly_price ?? data.pricing?.suvHourlyPrice ?? 30,
    evHourlyPrice: data.pricing?.ev_hourly_price ?? data.pricing?.evHourlyPrice ?? 25,
  },
  distanceKm: data.distance_km ?? data.distanceKm ?? 0.8,
  createdAt: data.created_at || data.createdAt || new Date().toISOString(),
  updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
});

export const normalizeSlot = (data: any): ParkingSlot => ({
  id: data.id,
  locationId: data.location_id || data.locationId,
  slotNumber: data.slot_number || data.slotNumber,
  floor: data.floor || 'Ground',
  section: data.section || 'Section A',
  vehicleType: (data.vehicle_type || data.vehicleType || VehicleType.CAR) as VehicleType,
  status: (data.status || SlotStatus.AVAILABLE) as SlotStatus,
  createdAt: data.created_at || data.createdAt || new Date().toISOString(),
  updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
});

export const SEED_PARKING_LOCATIONS: ParkingLocation[] = [
  {
    id: 'loc-1',
    ownerId: 'owner-1',
    name: 'Vadodara Station Multi-Level Hub',
    description: 'Ultra-modern 4-level covered parking lot right opposite Junction Platform 1 with 24/7 CCTV and fast EV chargers.',
    parkingType: ParkingType.RAILWAY_STATION,
    address: 'Station Road, Sayajiganj',
    city: 'Vadodara',
    area: 'Sayajiganj',
    latitude: 22.3106,
    longitude: 73.1812,
    images: ['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=60'],
    openingTime: '00:00',
    closingTime: '23:59',
    coveredParking: true,
    security: true,
    cctv: true,
    evCharging: true,
    wheelchairAccess: true,
    washroom: true,
    totalSlots: 120,
    availableSlots: 34,
    rating: 4.8,
    status: ParkingStatus.ACTIVE,
    pricing: {
      bikeHourlyPrice: 10,
      carHourlyPrice: 20,
      suvHourlyPrice: 30,
      evHourlyPrice: 25,
    },
    distanceKm: 0.3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'loc-2',
    ownerId: 'owner-1',
    name: 'Ahmedabad Terminal 2 Smart Park',
    description: 'High-security airport terminal parking with automated barrier gates, valet service, and handicap access.',
    parkingType: ParkingType.AIRPORT,
    address: 'Airport Road, Hansol',
    city: 'Ahmedabad',
    area: 'Hansol',
    latitude: 23.0772,
    longitude: 72.6347,
    images: ['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=60'],
    openingTime: '00:00',
    closingTime: '23:59',
    coveredParking: true,
    security: true,
    cctv: true,
    evCharging: true,
    wheelchairAccess: true,
    washroom: true,
    totalSlots: 250,
    availableSlots: 68,
    rating: 4.9,
    status: ParkingStatus.ACTIVE,
    pricing: {
      bikeHourlyPrice: 15,
      carHourlyPrice: 40,
      suvHourlyPrice: 60,
      evHourlyPrice: 45,
    },
    distanceKm: 1.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'loc-3',
    ownerId: 'owner-2',
    name: 'Inorbit Mall Covered Parking',
    description: 'Spacious underground parking with direct elevator access to shopping center food court and multiplex.',
    parkingType: ParkingType.MALL,
    address: 'Gorwa Road, Subhanpura',
    city: 'Vadodara',
    area: 'Gorwa',
    latitude: 22.3218,
    longitude: 73.1672,
    images: ['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&auto=format&fit=crop&q=60'],
    openingTime: '09:00',
    closingTime: '23:00',
    coveredParking: true,
    security: true,
    cctv: true,
    evCharging: true,
    wheelchairAccess: true,
    washroom: true,
    totalSlots: 180,
    availableSlots: 45,
    rating: 4.6,
    status: ParkingStatus.ACTIVE,
    pricing: {
      bikeHourlyPrice: 15,
      carHourlyPrice: 30,
      suvHourlyPrice: 45,
      evHourlyPrice: 35,
    },
    distanceKm: 2.1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const parkingApi = {
  searchParking: async (params?: SearchParkingParams): Promise<ParkingLocation[]> => {
    try {
      const res = await apiClient.get('/parking/search', { params });
      if (res.data?.data && res.data.data.length > 0) {
        return res.data.data.map(normalizeLocation);
      }
      return SEED_PARKING_LOCATIONS;
    } catch {
      let result = [...SEED_PARKING_LOCATIONS];
      if (params?.query) {
        const q = params.query.toLowerCase();
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.city.toLowerCase().includes(q) ||
            p.area.toLowerCase().includes(q) ||
            p.address.toLowerCase().includes(q)
        );
      }
      return result;
    }
  },

  getParkingById: async (id: string): Promise<ParkingLocation> => {
    try {
      const res = await apiClient.get(`/parking/${id}`);
      return normalizeLocation(res.data.data);
    } catch {
      const found = SEED_PARKING_LOCATIONS.find((p) => p.id === id);
      if (found) return found;
      return SEED_PARKING_LOCATIONS[0];
    }
  },

  getOwnerLocations: async (): Promise<ParkingLocation[]> => {
    try {
      const res = await apiClient.get('/parking/owner/my-locations');
      return res.data.data.map(normalizeLocation);
    } catch {
      return SEED_PARKING_LOCATIONS.slice(0, 2);
    }
  },

  createParking: async (data: CreateParkingRequest): Promise<ParkingLocation> => {
    const res = await apiClient.post('/parking', data);
    return normalizeLocation(res.data.data);
  },

  updateParking: async (id: string, data: UpdateParkingRequest): Promise<ParkingLocation> => {
    const res = await apiClient.patch(`/parking/${id}`, data);
    return normalizeLocation(res.data.data);
  },

  deleteParking: async (id: string): Promise<void> => {
    await apiClient.delete(`/parking/${id}`);
  },

  getSlots: async (locationId: string): Promise<ParkingSlot[]> => {
    try {
      const res = await apiClient.get(`/parking/${locationId}/slots`);
      return res.data.data.map(normalizeSlot);
    } catch {
      const statuses: SlotStatus[] = [
        SlotStatus.AVAILABLE,
        SlotStatus.AVAILABLE,
        SlotStatus.OCCUPIED,
        SlotStatus.RESERVED,
        SlotStatus.BLOCKED,
        SlotStatus.MAINTENANCE,
      ];
      return Array.from({ length: 24 }).map((_, idx) => ({
        id: `slot-${idx + 1}`,
        locationId,
        slotNumber: `A${(idx + 1).toString().padStart(2, '0')}`,
        floor: idx < 12 ? 'Ground' : '1st Floor',
        section: idx % 2 === 0 ? 'Section A' : 'Section B',
        vehicleType: VehicleType.CAR,
        status: statuses[idx % statuses.length],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }
  },

  createSlot: async (locationId: string, data: CreateSlotRequest): Promise<ParkingSlot> => {
    const res = await apiClient.post(`/parking/${locationId}/slots`, data);
    return normalizeSlot(res.data.data);
  },

  updateSlot: async (locationId: string, slotId: string, data: UpdateSlotRequest): Promise<ParkingSlot> => {
    const res = await apiClient.patch(`/parking/${locationId}/slots/${slotId}`, data);
    return normalizeSlot(res.data.data);
  },

  getPendingParkingAdmin: async (): Promise<ParkingLocation[]> => {
    try {
      const res = await apiClient.get('/admin/parking/pending');
      return res.data.data.map(normalizeLocation);
    } catch {
      return [
        {
          ...SEED_PARKING_LOCATIONS[0],
          id: 'pending-1',
          name: 'New Sayajigunj City Center Plaza',
          status: ParkingStatus.PENDING_APPROVAL,
        },
      ];
    }
  },

  approveParkingAdmin: async (id: string): Promise<ParkingLocation> => {
    const res = await apiClient.post(`/admin/parking/${id}/approve`);
    return normalizeLocation(res.data.data);
  },

  suspendParkingAdmin: async (id: string): Promise<ParkingLocation> => {
    const res = await apiClient.post(`/admin/parking/${id}/suspend`);
    return normalizeLocation(res.data.data);
  },

  assignStaffAdmin: async (parkingId: string, userId: string): Promise<any> => {
    const res = await apiClient.post(`/admin/parking/${parkingId}/staff/${userId}`);
    return res.data.data;
  },

  removeStaffAdmin: async (parkingId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/admin/parking/${parkingId}/staff/${userId}`);
  },
};
