import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, LoginRequest, RegisterRequest, UpdateProfileRequest } from '@parkease/shared';
import { mobileApiFetch } from '../api/client';
import { mobileStorage } from '../utils/storage';
import { supabase } from '../lib/supabase';

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

  const fetchParkEaseProfile = async (accessToken?: string): Promise<User | null> => {
    try {
      const activeToken = accessToken || (await mobileStorage.getItem('parkease_token'));
      if (!activeToken) return null;
      const res = await mobileApiFetch('/users/me', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res?.success && res?.data) {
        setUser(res.data);
        return res.data;
      }
    } catch {
      // Ignore profile fetch failure
    }
    return null;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await mobileStorage.setItem('parkease_token', session.access_token);
          await fetchParkEaseProfile(session.access_token);
        } else {
          const storedToken = await mobileStorage.getItem('parkease_token');
          if (storedToken) {
            await fetchParkEaseProfile(storedToken);
          }
        }
      } catch {
        await logoutLocal();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.access_token) {
        await mobileStorage.setItem('parkease_token', session.access_token);
        await fetchParkEaseProfile(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        await logoutLocal();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logoutLocal = async () => {
    await mobileStorage.removeItem('parkease_token');
    await mobileStorage.removeItem('parkease_refresh_token');
    setUser(null);
  };

  const login = async (credentials: LoginRequest): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.emailOrPhone,
      password: credentials.password,
    });

    if (error || !data.session) {
      throw new Error(error?.message || 'Invalid email or password.');
    }

    const accessToken = data.session.access_token;
    const refreshToken = data.session.refresh_token;

    if (accessToken) await mobileStorage.setItem('parkease_token', accessToken);
    if (refreshToken) await mobileStorage.setItem('parkease_refresh_token', refreshToken);

    const profile = await fetchParkEaseProfile(accessToken);
    if (profile) return profile;

    const fallbackUser: User = {
      id: data.user.id,
      email: data.user.email || '',
      fullName: data.user.user_metadata?.full_name || 'ParkEase User',
      phoneNumber: data.user.user_metadata?.phone_number || '',
      role: UserRole.USER,
      isVerified: !!data.user.email_confirmed_at,
      is_verified: !!data.user.email_confirmed_at,
      isActive: true,
      createdAt: data.user.created_at || new Date().toISOString(),
      updatedAt: data.user.updated_at || new Date().toISOString(),
    };
    setUser(fallbackUser);
    return fallbackUser;
  };

  const register = async (data: RegisterRequest): Promise<User> => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone_number: data.phoneNumber,
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Registration failed via Supabase Auth');
    }

    const createdUser: User = {
      id: authData.user?.id || '',
      email: data.email,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      role: UserRole.USER,
      isVerified: !!authData.user?.email_confirmed_at,
      is_verified: !!authData.user?.email_confirmed_at,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return createdUser;
  };

  const verifyEmail = async (email: string, otp: string): Promise<User> => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    });

    if (error || !data.session) {
      throw new Error(error?.message || 'Email verification failed or code expired');
    }

    const accessToken = data.session.access_token;
    await mobileStorage.setItem('parkease_token', accessToken);

    const profile = await fetchParkEaseProfile(accessToken);
    return profile || ({ id: data.user?.id, email, is_verified: true, role: 'USER' } as User);
  };

  const resendVerification = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      throw new Error(error.message || 'Failed to resend confirmation email');
    }
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
    if (accessToken) await mobileStorage.setItem('parkease_token', accessToken);

    setUser(tokenData.user);
    return tokenData.user;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore errors
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
    await fetchParkEaseProfile();
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
