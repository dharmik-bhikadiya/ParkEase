import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { mobileTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { MobileLogo } from '../../src/components/MobileLogo';

export default function MobileVerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { verifyEmail, resendVerification } = useAuth();

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    setError(null);
    setResendMsg(null);
    const digit = value.replace(/\D/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join('');
    setError(null);
    setResendMsg(null);

    if (!email) {
      setError('Invalid email address provided');
      return;
    }
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your code');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyEmail(email, code);
      setIsSuccess(true);
      setTimeout(() => {
        router.replace('/(app)/profile');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setError(null);
    setResendMsg(null);
    setIsResending(true);

    try {
      await resendVerification(email);
      setResendMsg('A new 6-digit code has been dispatched to your email.');
      setCooldown(60);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <MobileLogo size={52} align="center" />
        <Text style={styles.title}>Verify Email OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to {'\n'}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {resendMsg && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{resendMsg}</Text>
          </View>
        )}

        {isSuccess ? (
          <View style={styles.successCard}>
            <Text style={styles.successCardTitle}>✓ Account Verified!</Text>
            <Text style={styles.successCardSubtitle}>Redirecting to profile...</Text>
          </View>
        ) : (
          <>
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(val) => handleChange(i, val)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, otp.join('').length !== 6 && styles.submitBtnDisabled]}
              onPress={() => handleVerify()}
              disabled={isSubmitting || otp.join('').length !== 6}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Verify & Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <TouchableOpacity
                onPress={handleResend}
                disabled={cooldown > 0 || isResending}
              >
                <Text style={[styles.resendText, cooldown > 0 && styles.resendDisabled]}>
                  {cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Verification Code'}
                </Text>
              </TouchableOpacity>
            </View>
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emailHighlight: {
    fontWeight: 'bold',
    color: mobileTheme.colors.darkGreen,
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
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: '#E8F6EC',
    padding: 12,
    borderRadius: mobileTheme.borderRadius.sm,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#72C98B',
  },
  successText: {
    color: mobileTheme.colors.darkGreen,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  successCard: {
    padding: 20,
    alignItems: 'center',
  },
  successCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: mobileTheme.colors.darkGreen,
    marginBottom: 6,
  },
  successCardSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    borderRadius: mobileTheme.borderRadius.md,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
    backgroundColor: '#FAFDFB',
  },
  otpBoxFilled: {
    borderColor: mobileTheme.colors.darkGreen,
    backgroundColor: '#E8F6EC',
    color: mobileTheme.colors.darkGreen,
  },
  submitBtn: {
    backgroundColor: mobileTheme.colors.darkGreen,
    paddingVertical: 14,
    borderRadius: mobileTheme.borderRadius.md,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: mobileTheme.colors.darkGreen,
  },
  resendDisabled: {
    color: '#94A3B8',
  },
});
