import { mobileApiFetch } from './client';
import { Wallet, WalletTransaction } from '@parkease/shared';

export const mobileWalletApi = {
  getWallet: async (): Promise<Wallet> => {
    const res = await mobileApiFetch('/wallet');
    return res.data;
  },

  topupWallet: async (amount: number, paymentMethod: string = 'CARD'): Promise<Wallet> => {
    const res = await mobileApiFetch('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, payment_method: paymentMethod }),
    });
    return res.data;
  },

  payWithWallet: async (bookingId: string, amount: number) => {
    const res = await mobileApiFetch('/wallet/pay', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId, amount }),
    });
    return res.data;
  },

  getTransactions: async (): Promise<WalletTransaction[]> => {
    const res = await mobileApiFetch('/wallet/transactions');
    return res.data || [];
  },
};
