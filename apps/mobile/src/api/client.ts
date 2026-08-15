import Constants from 'expo-constants';
import { mobileStorage } from '../utils/storage';

/**
 * Dynamically resolves the API Base URL for Mobile Development & Production.
 * If EXPO_PUBLIC_API_BASE_URL is set, it uses that.
 * Otherwise, it extracts the host IP from Metro bundler (Constants.expoConfig.hostUri)
 * so physical devices and local dev builds connect to the host computer's backend.
 */
export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Extract host IP from Metro bundler URL (e.g. 192.168.1.5:8081 -> 192.168.1.5)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:8000/api/v1`;
    }
  }

  return 'http://localhost:8000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export async function mobileApiFetch(endpoint: string, options: RequestInit = {}) {
  const token = await mobileStorage.getItem('parkease_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorMessage =
        data?.detail ||
        data?.message ||
        (response.status === 401
          ? 'Session expired. Please sign in again.'
          : response.status === 403
          ? 'Access denied. You do not have permission.'
          : response.status === 404
          ? 'Requested resource not found.'
          : 'Server error. Please try again later.');

      throw new Error(errorMessage);
    }

    return data;
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('Network') && !err.message.includes('Failed')) {
      throw err;
    }
    // Clean user-friendly message for network or connection failures
    throw new Error('Unable to connect to ParkEase right now. Please check your connection and try again.');
  }
}
