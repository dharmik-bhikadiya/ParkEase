import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginRequest, RegisterRequest, UpdateProfileRequest } from '@parkease/shared';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<User>;
  loginWithGoogle: (idToken: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('parkease_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('parkease_token');
      if (storedToken) {
        try {
          const res = await apiClient.get('/users/me');
          if (res.data?.success && res.data?.data) {
            setUser(res.data.data);
          } else {
            logoutLocal();
          }
        } catch {
          logoutLocal();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const logoutLocal = () => {
    localStorage.removeItem('parkease_token');
    localStorage.removeItem('parkease_refresh_token');
    setToken(null);
    setUser(null);
  };

  const login = async (credentials: LoginRequest): Promise<User> => {
    const res = await apiClient.post('/auth/login', {
      email_or_phone: credentials.emailOrPhone,
      password: credentials.password,
    });

    const tokenData = res.data.data;
    const accessToken = tokenData.access_token || tokenData.accessToken;
    const refreshToken = tokenData.refresh_token || tokenData.refreshToken;

    if (accessToken) localStorage.setItem('parkease_token', accessToken);
    if (refreshToken) localStorage.setItem('parkease_refresh_token', refreshToken);

    setToken(accessToken);
    setUser(tokenData.user);
    return tokenData.user;
  };

  const register = async (data: RegisterRequest): Promise<User> => {
    const res = await apiClient.post('/auth/register', {
      full_name: data.fullName,
      email: data.email,
      phone_number: data.phoneNumber,
      password: data.password,
      confirm_password: data.confirmPassword,
      role: data.role || 'USER',
    });

    const tokenData = res.data.data;
    const accessToken = tokenData.access_token || tokenData.accessToken;
    const refreshToken = tokenData.refresh_token || tokenData.refreshToken;

    if (accessToken) localStorage.setItem('parkease_token', accessToken);
    if (refreshToken) localStorage.setItem('parkease_refresh_token', refreshToken);

    setToken(accessToken);
    setUser(tokenData.user);
    return tokenData.user;
  };

  const loginWithGoogle = async (idToken: string): Promise<User> => {
    const res = await apiClient.post('/auth/google', {
      id_token: idToken,
    });

    const tokenData = res.data.data;
    const accessToken = tokenData.access_token || tokenData.accessToken;
    const refreshToken = tokenData.refresh_token || tokenData.refreshToken;

    if (accessToken) localStorage.setItem('parkease_token', accessToken);
    if (refreshToken) localStorage.setItem('parkease_refresh_token', refreshToken);

    setToken(accessToken);
    setUser(tokenData.user);
    return tokenData.user;
  };

  const logout = async () => {
    try {
      const refreshStr = localStorage.getItem('parkease_refresh_token');
      await apiClient.post('/auth/logout', null, {
        params: { refresh_token: refreshStr },
      });
    } catch {
      // Ignore logout backend errors
    } finally {
      logoutLocal();
    }
  };

  const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
    const res = await apiClient.patch('/users/me', {
      full_name: data.fullName,
      phone_number: data.phoneNumber,
    });
    const updated = res.data.data;
    setUser(updated);
    return updated;
  };

  const refreshUser = async () => {
    if (!token) return;
    const res = await apiClient.get('/users/me');
    if (res.data?.success && res.data?.data) {
      setUser(res.data.data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
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
