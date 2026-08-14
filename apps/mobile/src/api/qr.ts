import { mobileApiFetch } from './client';

export interface MobileQrPassItem {
  id: string;
  booking_id: string;
  type: 'ENTRY' | 'EXIT';
  qr_payload: string;
  valid_from?: string;
  valid_until?: string;
  is_used: boolean;
}

export const mobileQrApi = {
  getBookingQrPasses: async (bookingId: string): Promise<MobileQrPassItem[]> => {
    const res = await mobileApiFetch(`/qr/passes/${bookingId}`);
    return res.data || [];
  },
};
