import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { mobileTheme } from '../../src/constants/theme';
import { mobileApiFetch } from '../../src/api/client';

export default function MobileResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();

  const [token, setToken] = useState(params.token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (params.token) {
      setToken(params.token);
    }
  }, [params.token]);

  const handleReset = async () => {
    if (!token.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await mobileApiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: token.trim(),
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.headerTitle}>Reset Password</Text>
        <Text style={styles.headerSubtitle}>Set a new secure password for your account</Text>

        {isSuccess ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Password Updated!</Text>
            <Text style={styles.successText}>
              Your password was updated successfully. Please log in with your new password.
            </Text>

            <TouchableOpacity style={styles.submitBtn} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.submitBtnText}>Sign In Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Reset Token</Text>
              <TextInput
                style={styles.input}
                value={token}
                onChangeText={setToken}
                placeholder="Paste token here"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleReset} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.linkTextBold}>Back to Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: mobileTheme.spacing.md,
    backgroundColor: mobileTheme.colors.background,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: mobileTheme.borderRadius.lg,
    padding: mobileTheme.spacing.lg,
    borderWidth: 1,
    borderColor: '#E8F6EC',
    shadowColor: mobileTheme.colors.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#FFEDED',
    padding: 12,
    borderRadius: mobileTheme.borderRadius.sm,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '500',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: mobileTheme.colors.darkGreen,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: mobileTheme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#FAFDFB',
    color: mobileTheme.colors.textDark,
  },
  submitBtn: {
    backgroundColor: mobileTheme.colors.darkGreen,
    paddingVertical: 14,
    borderRadius: mobileTheme.borderRadius.md,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkTextBold: {
    color: mobileTheme.colors.darkGreen,
    fontWeight: 'bold',
  },
});
