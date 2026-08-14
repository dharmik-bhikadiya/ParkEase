import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { mobileTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { GoogleAuthButton } from '../../src/components/GoogleAuthButton';

export default function MobileLoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      setError('Please enter email/mobile and password');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ emailOrPhone, password });
      router.replace('/(app)/profile');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.headerTitle}>Welcome Back</Text>
        <Text style={styles.headerSubtitle}>Sign in to your ParkEase account</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <GoogleAuthButton onError={(msg) => setError(msg)} />

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR SIGN IN WITH EMAIL</Text>
          <View style={styles.dividerLine} />
        </View>

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

        <View style={styles.field}>
          <View style={styles.rowLabel}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.linkText}>Forgot?</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.linkTextBold}>Create Account</Text>
          </Text>
        </TouchableOpacity>
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
  field: {
    marginBottom: 16,
  },
  rowLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  linkText: {
    fontSize: 12,
    color: mobileTheme.colors.darkGreen,
    fontWeight: 'bold',
  },
  linkTextBold: {
    color: mobileTheme.colors.darkGreen,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginHorizontal: 8,
    letterSpacing: 0.5,
  },
});
