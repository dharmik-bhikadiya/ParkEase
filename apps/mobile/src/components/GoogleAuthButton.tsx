import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { mobileTheme } from '../constants/theme';

interface GoogleAuthButtonProps {
  text?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  text = 'Continue with Google',
  onSuccess,
  onError,
}) => {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    try {
      if (googleClientId) {
        const redirectUrl = Linking.createURL('auth/google-callback');
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(googleClientId)}` +
          `&response_type=id_token` +
          `&scope=${encodeURIComponent('openid email profile')}` +
          `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
          `&nonce=${Math.random().toString(36).substring(7)}`;

        await Linking.openURL(authUrl);
        return;
      }

      // Development mode fallback token when production Google Client ID is not configured in .env
      const devMockToken = `mock_google_token:mobile_user_${Date.now()}@parkease.com:sub_mobile_google_${Math.floor(Math.random() * 100000)}:Mobile-Google-User`;
      await loginWithGoogle(devMockToken);
      if (onSuccess) {
        onSuccess();
      } else {
        router.replace('/(app)/profile');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Google sign-in failed on mobile';
      if (onError) {
        onError(errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleGoogleAuth}
      disabled={isSubmitting}
      activeOpacity={0.8}
    >
      {isSubmitting ? (
        <ActivityIndicator color={mobileTheme.colors.primary} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.iconText}>G</Text>
          <Text style={styles.buttonText}>{text}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 10,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
});
