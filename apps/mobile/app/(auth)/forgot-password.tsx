import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { mobileTheme } from '../../src/constants/theme';
import { mobileApiFetch } from '../../src/api/client';

export default function MobileForgotPasswordScreen() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!emailOrPhone.trim()) {
      setError('Please enter email or mobile number');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await mobileApiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email_or_phone: emailOrPhone }),
      });
      setIsSubmitted(true);
      if (res?.data?.reset_token) {
        setResetToken(res.data.reset_token);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.headerTitle}>Forgot Password</Text>
        <Text style={styles.headerSubtitle}>
          Enter registered email/mobile to receive password reset token
        </Text>

        {isSubmitted ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Request Sent</Text>
            <Text style={styles.successText}>
              If an account is associated with {emailOrPhone}, reset instructions have been created.
            </Text>

            {resetToken && (
              <View style={styles.devTokenBox}>
                <Text style={styles.devTokenLabel}>Dev Mock Token:</Text>
                <Text style={styles.devTokenVal}>{resetToken}</Text>
                <TouchableOpacity
                  style={styles.proceedBtn}
                  onPress={() => router.push({ pathname: '/(auth)/reset-password', params: { token: resetToken } })}
                >
                  <Text style={styles.proceedBtnText}>Proceed to Reset Password</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.linkTextBold}>Back to Sign In</Text>
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
              <Text style={styles.label}>Email or Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                placeholder="name@example.com or 9876543210"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerText}>
                Remembered your password? <Text style={styles.linkTextBold}>Sign In</Text>
              </Text>
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
  devTokenBox: {
    backgroundColor: mobileTheme.colors.softGreen,
    padding: 12,
    borderRadius: mobileTheme.borderRadius.md,
    width: '100%',
    marginBottom: 16,
  },
  devTokenLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: mobileTheme.colors.darkGreen,
  },
  devTokenVal: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#333333',
    marginVertical: 4,
  },
  proceedBtn: {
    backgroundColor: mobileTheme.colors.darkGreen,
    paddingVertical: 10,
    borderRadius: mobileTheme.borderRadius.sm,
    alignItems: 'center',
    marginTop: 8,
  },
  proceedBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
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
  footerText: {
    fontSize: 14,
    color: '#666666',
  },
  linkTextBold: {
    color: mobileTheme.colors.darkGreen,
    fontWeight: 'bold',
  },
});
