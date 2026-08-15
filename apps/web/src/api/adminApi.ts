import { apiClient } from './client';
import { User, ParkingLocation, Booking, WalletTransaction } from '@parkease/shared';

export interface AdminStats {
  total_users: number;
  total_owners: number;
  total_staff: number;
  total_parking: number;
  pending_approvals: number;
  active_bookings: number;
  total_revenue: number;
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const res = await apiClient.get('/admin/stats');
    return res.data.data;
  },

  getUsers: async (role?: string): Promise<User[]> => {
    const params = role ? { role } : {};
    const res = await apiClient.get('/admin/users', { params });
    return res.data.data || [];
  },

  getPendingParking: async (): Promise<ParkingLocation[]> => {
    const res = await apiClient.get('/admin/pending');
    return res.data.data || [];
  },

  getAllParking: async (): Promise<ParkingLocation[]> => {
    const res = await apiClient.get('/admin/all');
    return res.data.data || [];
  },

  approveParking: async (parkingId: string): Promise<ParkingLocation> => {
    const res = await apiClient.post(`/admin/${parkingId}/approve`);
    return res.data.data;
  },

  suspendParking: async (parkingId: string): Promise<ParkingLocation> => {
    const res = await apiClient.post(`/admin/${parkingId}/suspend`);
    return res.data.data;
  },

  getBookings: async (): Promise<Booking[]> => {
    const res = await apiClient.get('/admin/bookings');
    return res.data.data || [];
  },

  getPayments: async (): Promise<WalletTransaction[]> => {
    const res = await apiClient.get('/admin/payments');
    return res.data.data || [];
  },
};
