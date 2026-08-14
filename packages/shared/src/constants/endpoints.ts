/**
 * API Route Constants for ParkEase FastAPI Backend
 */

export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    ME: '/users/me',
    UPDATE_PROFILE: '/users/me',
    CHANGE_PASSWORD: '/users/me/password',
    VEHICLES: '/users/me/vehicles',
    VEHICLE_DETAILS: (id: string) => `/users/me/vehicles/${id}`,
  },
  PARKING: {
    SEARCH: '/parking/search',
    LOCATIONS: '/parking/locations',
    LOCATION_DETAILS: (id: string) => `/parking/locations/${id}`,
    SLOTS: (locationId: string) => `/parking/locations/${locationId}/slots`,
  },
  BOOKINGS: {
    CREATE: '/bookings',
    LIST: '/bookings/user',
    DETAILS: (id: string) => `/bookings/${id}`,
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
  },
  WALLET: {
    BALANCE: '/wallet/balance',
    TRANSACTIONS: '/wallet/transactions',
    TOPUP: '/wallet/topup',
  },
  QR: {
    GENERATE_ENTRY: (bookingId: string) => `/qr/entry/${bookingId}`,
    GENERATE_EXIT: (bookingId: string) => `/qr/exit/${bookingId}`,
    VERIFY: '/qr/verify',
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
  },
} as const;
