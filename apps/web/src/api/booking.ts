import { apiClient } from './client';

export interface CreateBookingPayload {
  location_id: string;
  slot_id: string;
  vehicle_number: string;
  start_time: string;
  end_time: string;
}

export const bookingApi = {
  createBooking: async (payload: CreateBookingPayload) => {
    const res = await apiClient.post('/bookings', payload);
    return res.data.data;
  },

  getMyBookings: async () => {
    const res = await apiClient.get('/bookings/my-bookings');
    return res.data.data;
  },

  getBookingDetails: async (bookingId: string) => {
    const res = await apiClient.get(`/bookings/${bookingId}`);
    return res.data.data;
  },

  cancelBooking: async (bookingId: string) => {
    const res = await apiClient.post(`/bookings/${bookingId}/cancel`);
    return res.data.data;
  },

  getOwnerBookings: async () => {
    const res = await apiClient.get('/bookings/owner');
    return res.data.data;
  },
};
