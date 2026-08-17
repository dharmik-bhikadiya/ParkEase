import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginRequest, RegisterRequest, UpdateProfileRequest } from '@parkease/shared';
import { mobileApiFetch } from '../api/client';
import { mobileStorage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<User>;
  verifyEmail: (email: string, otp: string) => Promise<User>;
  resendVerification: (email: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = await mobileStorage.getItem('parkease_token');
      if (storedToken) {
        try {
          const res = await mobileApiFetch('/users/me');
          if (res?.success && res?.data) {
            setUser(res.data);
          } else {
            await logoutLocal();
          }
        } catch {
          await logoutLocal();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const logoutLocal = async () => {
    await mobileStorage.removeItem('parkease_token');
    await mobileStorage.removeItem('parkease_refresh_token');
    setUser(null);
  };

  const login = async (credentials: LoginRequest): Promise<User> => {
    const res = await mobileApiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email_or_phone: credentials.emailOrPhone,
        password: credentials.password,
      }),
    });

    const tokenData = res.data;
    const accessToken = tokenData.access_token || tokenData.accessToken;
    const refreshToken = tokenData.refresh_token || tokenData.refreshToken;

    if (accessToken) await mobileStorage.setItem('parkease_token', accessToken);
    if (refreshToken) await mobileStorage.setItem('parkease_refresh_token', refreshToken);

    setUser(tokenData.user);
    return tokenData.user;
  };

  const register = async (data: RegisterRequest): Promise<User> => {
    const res = await mobileApiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: data.fullName,
        email: data.email,
        phone_number: data.phoneNumber,
        password: data.password,
        confirm_password: data.confirmPassword,
        role: data.role || 'USER',
      }),
    });

    return (res.data?.user || res.data) as User;
  };

  const verifyEmail = async (email: string, otp: string): Promise<User> => {
    const res = await mobileApiFetch('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({
        email,
        otp,
      }),
    });

    const tokenData = res.data;
    const accessToken = tokenData.access_token || tokenData.accessToken;
    const refreshToken = tokenData.refresh_token || tokenData.refreshToken;

    if (accessToken) await mobileStorage.setItem('parkease_token', accessToken);
    if (refreshToken) await mobileStorage.setItem('parkease_refresh_token', refreshToken);

    setUser(tokenData.user);
    return tokenData.user;
  };

  const resendVerification = async (email: string): Promise<void> => {
    await mobileApiFetch('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({
        email,
      }),
    });
  };

  const loginWithGoogle = async (idToken: string): Promise<User> => {
    const res = await mobileApiFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        id_token: idToken,
      }),
    });

    const tokenData = res.data;
    const accessToken = tokenData.access_token || tokenData.accessToken;
    const refreshToken = tokenData.refresh_token || tokenData.refreshToken;

    if (accessToken) await mobileStorage.setItem('parkease_token', accessToken);
    if (refreshToken) await mobileStorage.setItem('parkease_refresh_token', refreshToken);

    setUser(tokenData.user);
    return tokenData.user;
  };

  const logout = async () => {
    try {
      const refreshStr = await mobileStorage.getItem('parkease_refresh_token');
      await mobileApiFetch(`/auth/logout?refresh_token=${encodeURIComponent(refreshStr || '')}`, {
        method: 'POST',
      });
    } catch {
      // Ignore backend logout error
    } finally {
      await logoutLocal();
    }
  };

  const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
    const res = await mobileApiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({
        full_name: data.fullName,
        phone_number: data.phoneNumber,
      }),
    });
    const updated = res.data;
    setUser(updated);
    return updated;
  };

  const refreshUser = async () => {
    const res = await mobileApiFetch('/users/me');
    if (res?.success && res?.data) {
      setUser(res.data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        verifyEmail,
        resendVerification,
        loginWithGoogle,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
