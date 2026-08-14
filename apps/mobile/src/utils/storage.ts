// Storage wrapper for Mobile React Native
let memoryStorage: Record<string, string> = {};

export const mobileStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return memoryStorage[key] || null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryStorage[key] = value;
  },
  removeItem: async (key: string): Promise<void> => {
    delete memoryStorage[key];
  },
};
