import { apiClient } from './client';

export interface PaymentOrderResponse {
  payment_id: string;
  order_id?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  method: string;
  amount: number;
  currency?: string;
  gateway_configured?: boolean;
  message: string;
}

export const paymentApi = {
  createPaymentOrder: async (bookingId: string, method: string = 'UPI'): Promise<PaymentOrderResponse> => {
    const res = await apiClient.post<{ data: PaymentOrderResponse }>('/payments/create-order', {
      booking_id: bookingId,
      method,
    });
    return res.data.data;
  },

  verifyPayment: async (paymentId: string, transactionSignature: string) => {
    const res = await apiClient.post('/payments/verify', {
      payment_id: paymentId,
      transaction_signature: transactionSignature,
    });
    return res.data.data;
  },
};
