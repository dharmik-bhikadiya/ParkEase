import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Phone, Calendar, Lock, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    setIsUpdatingProfile(true);

    try {
      await updateProfile({ fullName, phoneNumber });
      setProfileSuccess('Profile updated successfully!');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }

    setIsChangingPwd(true);

    try {
      await apiClient.patch('/users/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPwdSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.message || 'Failed to change password');
    } finally {
      setIsChangingPwd(false);
    }
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="min-h-[85vh] bg-[#F7F9F5] p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 border border-[#E8F6EC] shadow-lg shadow-[#176B4D]/5 flex flex-col md:flex-row items-center gap-6"
        >
          <div className="w-24 h-24 rounded-full bg-[#E8F6EC] border-4 border-[#72C98B]/30 text-[#176B4D] flex items-center justify-center text-3xl font-bold">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="flex-grow text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-[#18342A]">{user.fullName}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#176B4D] text-white">
                {user.role}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F6EC] text-[#176B4D] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Account
              </span>
            </div>

            <p className="text-sm text-gray-500 flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-4 h-4 text-gray-400" /> {user.email}
              {user.phoneNumber && (
                <>
                  <span className="text-gray-300">•</span>
                  <Phone className="w-4 h-4 text-gray-400" /> {user.phoneNumber}
                </>
              )}
            </p>

            <p className="text-xs text-gray-400 flex items-center justify-center md:justify-start gap-1.5 pt-1">
              <Calendar className="w-3.5 h-3.5" /> Member since {formattedDate}
            </p>
          </div>
        </motion.div>

        {/* Profile Settings & Change Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Edit Profile Form */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 border border-[#E8F6EC] shadow-md space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <UserIcon className="w-5 h-5 text-[#176B4D]" />
              <h2 className="text-xl font-bold text-[#18342A]">Personal Details</h2>
            </div>

            {profileSuccess && (
              <div className="p-4 rounded-2xl bg-[#E8F6EC] text-[#176B4D] text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] text-sm font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                  Email (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-gray-500 text-sm font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] text-sm font-medium focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full py-3.5 bg-[#176B4D] hover:bg-[#12543c] text-white font-semibold rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
              >
                <Save className="w-4 h-4" />
                {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </motion.div>

          {/* Change Password Form */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 border border-[#E8F6EC] shadow-md space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <Lock className="w-5 h-5 text-[#176B4D]" />
              <h2 className="text-xl font-bold text-[#18342A]">Security & Password</h2>
            </div>

            {pwdSuccess && (
              <div className="p-4 rounded-2xl bg-[#E8F6EC] text-[#176B4D] text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> {pwdSuccess}
              </div>
            )}
            {pwdError && (
              <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> {pwdError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] text-sm font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] text-sm font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] text-sm font-medium focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPwd}
                className="w-full py-3.5 bg-[#18342A] hover:bg-[#0f221b] text-white font-semibold rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
              >
                <Lock className="w-4 h-4" />
                {isChangingPwd ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
