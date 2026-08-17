/**
 * ParkEase Domain Interfaces & Types
 */

export enum UserRole {
  USER = 'USER',
  DRIVER = 'DRIVER',
  PARKING_OWNER = 'PARKING_OWNER',
  PARKING_STAFF = 'PARKING_STAFF',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  googleId?: string;
  google_id?: string;
  authProvider?: string;
  auth_provider?: string;
  hasPassword?: boolean;
  has_password?: boolean;
  avatarUrl?: string;
  avatar_url?: string;
  isActive: boolean;
  isVerified?: boolean;
  is_verified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum VehicleType {
  BIKE = 'BIKE',
  CAR = 'CAR',
  SUV = 'SUV',
  EV = 'EV',
  OTHER = 'OTHER',
}

export interface UserVehicle {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  registrationNumber: string;
  nickname?: string;
  isEv: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleRequest {
  vehicleType: VehicleType;
  registrationNumber: string;
  nickname?: string;
  isEv?: boolean;
  isDefault?: boolean;
}

export interface UpdateVehicleRequest {
  vehicleType?: VehicleType;
  registrationNumber?: string;
  nickname?: string;
  isEv?: boolean;
  isDefault?: boolean;
}

export interface LoginRequest {
  emailOrPhone: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role?: UserRole;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

export interface ForgotPasswordRequest {
  emailOrPhone: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CreatePasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export enum ParkingType {
  RAILWAY_STATION = 'RAILWAY_STATION',
  BUS_STAND = 'BUS_STAND',
  AIRPORT = 'AIRPORT',
  MALL = 'MALL',
  HOSPITAL = 'HOSPITAL',
  CINEMA = 'CINEMA',
  TOURIST_PLACE = 'TOURIST_PLACE',
  OTHER = 'OTHER',
}

export enum ParkingStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface ParkingPricing {
  bikeHourlyPrice: number;
  carHourlyPrice: number;
  suvHourlyPrice: number;
  evHourlyPrice: number;
}

export interface ParkingLocation {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  parkingType: ParkingType;
  address: string;
  city: string;
  area: string;
  latitude: number;
  longitude: number;
  images: string[];
  openingTime: string;
  closingTime: string;
  coveredParking: boolean;
  security: boolean;
  cctv: boolean;
  evCharging: boolean;
  wheelchairAccess: boolean;
  washroom: boolean;
  totalSlots: number;
  availableSlots: number;
  rating: number;
  status: ParkingStatus;
  pricing: ParkingPricing;
  distanceKm?: number;
  createdAt: string;
  updatedAt: string;
}

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  BLOCKED = 'BLOCKED',
  MAINTENANCE = 'MAINTENANCE',
}

export interface ParkingSlot {
  id: string;
  locationId: string;
  slotNumber: string;
  floor: string;
  section: string;
  vehicleType: VehicleType;
  status: SlotStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParkingStaffAssignment {
  id: string;
  staffUserId: string;
  parkingLocationId: string;
  staffName?: string;
  staffEmail?: string;
  createdAt: string;
}

export interface SearchParkingParams {
  query?: string;
  city?: string;
  area?: string;
  vehicleType?: VehicleType;
  parkingType?: ParkingType;
  maxPrice?: number;
  coveredParking?: boolean;
  cctv?: boolean;
  security?: boolean;
  evCharging?: boolean;
  minRating?: number;
  minSlots?: number;
  sortBy?: 'distance' | 'price' | 'availability' | 'rating';
  lat?: number;
  lng?: number;
}

export interface CreateParkingRequest {
  name: string;
  description?: string;
  parkingType: ParkingType;
  address: string;
  city: string;
  area: string;
  latitude: number;
  longitude: number;
  images?: string[];
  openingTime?: string;
  closingTime?: string;
  coveredParking?: boolean;
  security?: boolean;
  cctv?: boolean;
  evCharging?: boolean;
  wheelchairAccess?: boolean;
  washroom?: boolean;
  bikeHourlyPrice: number;
  carHourlyPrice: number;
  suvHourlyPrice: number;
  evHourlyPrice: number;
  totalSlots: number;
  initialSlotsConfig?: {
    floorCount?: number;
    slotsPerFloor?: number;
    sections?: string[];
  };
}

export interface UpdateParkingRequest {
  name?: string;
  description?: string;
  parkingType?: ParkingType;
  address?: string;
  city?: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  openingTime?: string;
  closingTime?: string;
  coveredParking?: boolean;
  security?: boolean;
  cctv?: boolean;
  evCharging?: boolean;
  wheelchairAccess?: boolean;
  washroom?: boolean;
  bikeHourlyPrice?: number;
  carHourlyPrice?: number;
  suvHourlyPrice?: number;
  evHourlyPrice?: number;
}

export interface CreateSlotRequest {
  slotNumber: string;
  floor?: string;
  section?: string;
  vehicleType?: VehicleType;
  status?: SlotStatus;
}

export interface UpdateSlotRequest {
  slotNumber?: string;
  floor?: string;
  section?: string;
  vehicleType?: VehicleType;
  status?: SlotStatus;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface CreateBookingRequest {
  locationId: string;
  slotId: string;
  vehicleNumber: string;
  startTime: string;
  endTime: string;
}

export interface Booking {
  id: string;
  userId: string;
  locationId: string;
  slotId: string;
  vehicleNumber: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  totalAmount: number;
  status: BookingStatus;
  entryQrCode?: string;
  exitQrCode?: string;
  actualEntryTime?: string;
  actualExitTime?: string;
  overstayCharges?: number;
  locationName?: string;
  locationAddress?: string;
  slotNumber?: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

export enum TransactionType {
  TOPUP = 'TOPUP',
  BOOKING_PAYMENT = 'BOOKING_PAYMENT',
  REFUND = 'REFUND',
  OVERSTAY_CHARGE = 'OVERSTAY_CHARGE',
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  referenceId?: string;
  description: string;
  createdAt: string;
}

export interface QrPassData {
  bookingId: string;
  userId: string;
  locationId: string;
  type: 'ENTRY' | 'EXIT';
  validFrom: string;
  validUntil: string;
  hash: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: string | Record<string, any>;
  };
  timestamp: string;
}
