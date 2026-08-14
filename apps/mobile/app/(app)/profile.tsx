import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { mobileTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { mobileApiFetch } from '../../src/api/client';

export default function MobileProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  if (!user) return null;

  const handleUpdateProfile = async () => {
    setProfileSuccess(null);
    setProfileError(null);
    setIsUpdatingProfile(true);

    try {
      await updateProfile({ fullName, phoneNumber });
      setProfileSuccess('Profile updated!');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPwdSuccess(null);
    setPwdError(null);

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }

    setIsChangingPwd(true);

    try {
      await mobileApiFetch('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      setPwdSuccess('Password changed!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.message || 'Failed to change password');
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Profile Card */}
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.fullName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user.role}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Edit Profile Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Details</Text>

        {profileSuccess && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{profileSuccess}</Text>
          </View>
        )}
        {profileError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{profileError}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mobile Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="9876543210"
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateProfile} disabled={isUpdatingProfile}>
          {isUpdatingProfile ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Save Profile Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Change Password Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Change Password</Text>

        {pwdSuccess && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{pwdSuccess}</Text>
          </View>
        )}
        {pwdError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{pwdError}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="••••••••"
            secureTextEntry
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

        <TouchableOpacity style={styles.darkSubmitBtn} onPress={handleChangePassword} disabled={isChangingPwd}>
          {isChangingPwd ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={async () => {
          await logout();
          router.replace('/(auth)/login');
        }}
      >
        <Text style={styles.logoutBtnText}>Sign Out Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: mobileTheme.spacing.md,
    backgroundColor: mobileTheme.colors.background,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: mobileTheme.borderRadius.lg,
    padding: mobileTheme.spacing.md,
    borderWidth: 1,
    borderColor: '#E8F6EC',
    elevation: 2,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: mobileTheme.colors.softGreen,
    borderWidth: 2,
    borderColor: mobileTheme.colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: mobileTheme.colors.darkGreen,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
  },
  userEmail: {
    fontSize: 13,
    color: '#666666',
    marginVertical: 2,
  },
  roleBadge: {
    backgroundColor: mobileTheme.colors.darkGreen,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: mobileTheme.borderRadius.pill,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
    marginBottom: 14,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: mobileTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FAFDFB',
    color: mobileTheme.colors.textDark,
  },
  submitBtn: {
    backgroundColor: mobileTheme.colors.darkGreen,
    paddingVertical: 12,
    borderRadius: mobileTheme.borderRadius.md,
    alignItems: 'center',
    marginTop: 6,
  },
  darkSubmitBtn: {
    backgroundColor: mobileTheme.colors.textDark,
    paddingVertical: 12,
    borderRadius: mobileTheme.borderRadius.md,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: '#FFEDED',
    padding: 10,
    borderRadius: mobileTheme.borderRadius.sm,
    marginBottom: 12,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
  },
  successBox: {
    backgroundColor: mobileTheme.colors.softGreen,
    padding: 10,
    borderRadius: mobileTheme.borderRadius.sm,
    marginBottom: 12,
  },
  successText: {
    color: mobileTheme.colors.darkGreen,
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: '#FFEDED',
    paddingVertical: 14,
    borderRadius: mobileTheme.borderRadius.md,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  logoutBtnText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
