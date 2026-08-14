import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { mobileTheme } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';

export default function MobileHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Phase 2A • Auth Active</Text>
        </View>

        <Text style={styles.title}>ParkEase Mobile</Text>
        <Text style={styles.subtitle}>
          Smart parking reservation, profile security, and vehicle management platform.
        </Text>

        {user ? (
          <View style={styles.userBox}>
            <Text style={styles.welcomeText}>Welcome back, {user.fullName}!</Text>
            <Text style={styles.userRole}>Role: {user.role}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/(app)/profile')}
              >
                <Text style={styles.primaryButtonText}>View My Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push('/(app)/vehicles')}
              >
                <Text style={styles.secondaryButtonText}>Manage My Vehicles</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={async () => {
                  await logout();
                }}
              >
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
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
  badge: {
    backgroundColor: mobileTheme.colors.softGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: mobileTheme.borderRadius.pill,
    alignSelf: 'flex-start',
    marginBottom: mobileTheme.spacing.md,
  },
  badgeText: {
    color: mobileTheme.colors.darkGreen,
    fontWeight: 'bold',
    fontSize: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
    marginBottom: mobileTheme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: mobileTheme.spacing.lg,
  },
  userBox: {
    backgroundColor: mobileTheme.colors.softGreen,
    borderRadius: mobileTheme.borderRadius.md,
    padding: mobileTheme.spacing.md,
    marginBottom: mobileTheme.spacing.md,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: mobileTheme.colors.darkGreen,
  },
  userRole: {
    fontSize: 12,
    fontWeight: 'bold',
    color: mobileTheme.colors.primaryGreen,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#444444',
    marginBottom: mobileTheme.spacing.md,
  },
  buttonGroup: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: mobileTheme.colors.darkGreen,
    paddingVertical: 14,
    borderRadius: mobileTheme.borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: mobileTheme.colors.darkGreen,
    paddingVertical: 14,
    borderRadius: mobileTheme.borderRadius.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: mobileTheme.colors.darkGreen,
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FFEDED',
    paddingVertical: 12,
    borderRadius: mobileTheme.borderRadius.md,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutButtonText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
