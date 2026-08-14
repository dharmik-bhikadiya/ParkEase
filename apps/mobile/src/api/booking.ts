import { mobileApiFetch } from './client';

export interface CreateBookingPayload {
  location_id: string;
  slot_id: string;
  vehicle_number: string;
  start_time: string;
  end_time: string;
}

export const mobileBookingApi = {
  createBooking: async (payload: CreateBookingPayload) => {
    const res = await mobileApiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  getMyBookings: async () => {
    const res = await mobileApiFetch('/bookings/my-bookings');
    return res.data;
  },

  getBookingDetails: async (id: string) => {
    const res = await mobileApiFetch(`/bookings/${id}`);
    return res.data;
  },

  cancelBooking: async (id: string) => {
    const res = await mobileApiFetch(`/bookings/${id}/cancel`, {
      method: 'POST',
    });
    return res.data;
  },
};
