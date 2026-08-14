import { apiClient } from './client';

export interface QrPassItem {
  id: string;
  booking_id: string;
  type: 'ENTRY' | 'EXIT';
  qr_payload: string;
  valid_from?: string;
  valid_until?: string;
  is_used: boolean;
}

export const qrApi = {
  getBookingQrPasses: async (bookingId: string): Promise<QrPassItem[]> => {
    const res = await apiClient.get<{ data: QrPassItem[] }>(`/qr/passes/${bookingId}`);
    return res.data.data || [];
  },

  scanEntry: async (payload: string) => {
    const res = await apiClient.post<{ data: any }>('/qr/scan-entry', { payload });
    return res.data.data;
  },

  scanExit: async (payload: string) => {
    const res = await apiClient.post<{ data: any }>('/qr/scan-exit', { payload });
    return res.data.data;
  },
};
