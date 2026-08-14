import { apiClient } from './client';
import { Wallet, WalletTransaction } from '@parkease/shared';

export const walletApi = {
  getWallet: async (): Promise<Wallet> => {
    const res = await apiClient.get<{ data: Wallet }>('/wallet');
    return res.data.data;
  },

  topupWallet: async (amount: number, paymentMethod: string = 'CARD'): Promise<Wallet> => {
    const res = await apiClient.post<{ data: Wallet }>('/wallet/topup', {
      amount,
      payment_method: paymentMethod,
    });
    return res.data.data;
  },

  payWithWallet: async (bookingId: string, amount: number) => {
    const res = await apiClient.post<{ data: any }>('/wallet/pay', {
      booking_id: bookingId,
      amount,
    });
    return res.data.data;
  },

  getTransactions: async (): Promise<WalletTransaction[]> => {
    const res = await apiClient.get<{ data: WalletTransaction[] }>('/wallet/transactions');
    return res.data.data || [];
  },
};
