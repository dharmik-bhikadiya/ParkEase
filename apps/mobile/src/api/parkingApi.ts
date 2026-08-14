import { mobileApiFetch } from './client';

export const mobileParkingApi = {
  getParkingById: async (id: string) => {
    const res = await mobileApiFetch(`/parking/${id}`);
    return res.data;
  },

  getSlots: async (locationId: string) => {
    const res = await mobileApiFetch(`/parking/${locationId}/slots`);
    return res.data;
  },

  searchParking: async (params?: Record<string, any>) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const res = await mobileApiFetch(`/parking/search?${queryString}`);
    return res.data;
  },
};
