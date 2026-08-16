import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Phone, Calendar, Lock, CheckCircle2, AlertCircle, Save, Trash2, AlertTriangle, Eye, EyeOff, Camera, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
];

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, deleteAccount } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setProfileError('Image size should be less than 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    setIsUpdatingProfile(true);

    try {
      await updateProfile({ fullName, phoneNumber, avatarUrl });
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

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      await deleteAccount();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account.');
      setIsDeletingAccount(false);
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
          {/* Interactive Profile Avatar Header */}
          <div className="relative group shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.fullName}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#72C98B]/40 shadow-md transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#E8F6EC] border-4 border-[#72C98B]/30 text-[#176B4D] flex items-center justify-center text-3xl font-bold transition-transform group-hover:scale-105">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <label
              htmlFor="avatar-upload-header"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#176B4D] hover:bg-[#12543c] text-white flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110"
              title="Upload Profile Picture"
            >
              <Camera className="w-4 h-4" />
            </label>
            <input
              id="avatar-upload-header"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
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

              {/* Profile Picture Option */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-2">
                  Profile Picture
                </label>
                
                <div className="space-y-3 p-4 rounded-2xl bg-[#F7F9F5] border border-[#E8F6EC]">
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="avatar-file-input"
                      className="px-4 py-2.5 bg-[#176B4D] text-white hover:bg-[#12543c] font-semibold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Camera className="w-4 h-4" /> Upload from Device
                    </label>
                    <input
                      id="avatar-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold rounded-xl flex items-center gap-1 transition-all border border-red-200"
                      >
                        <X className="w-3.5 h-3.5" /> Remove Picture
                      </button>
                    )}
                  </div>

                  {/* Quick Preset Avatars */}
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium block mb-2">Or choose a preset avatar:</span>
                    <div className="flex flex-wrap gap-2.5">
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(url)}
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                            avatarUrl === url ? 'border-[#176B4D] scale-110 shadow-md ring-2 ring-[#72C98B]' : 'border-gray-200 hover:border-[#72C98B]'
                          }`}
                        >
                          <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full py-3.5 bg-[#176B4D] hover:bg-[#12543c] text-white font-semibold rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
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
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] text-sm font-medium focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] text-sm font-medium focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] text-sm font-medium focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPwd}
                className="w-full py-3.5 bg-[#18342A] hover:bg-[#0f221b] text-white font-semibold rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                {isChangingPwd ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Danger Zone: Account Deletion */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-red-50/60 rounded-3xl p-8 border border-red-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-700 font-bold text-lg">
              <Trash2 className="w-5 h-5" /> Danger Zone: Delete Account
            </div>
            <p className="text-xs text-red-600 font-medium max-w-xl">
              Permanently delete your account and all associated personal data including saved vehicles, booking history, active passes, and wallet details.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
          >
            Delete My Account
          </button>
        </motion.div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full border border-red-100 shadow-2xl space-y-6"
          >
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-[#18342A]">Delete Account Permanently?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                This permanently deletes your ParkEase account and eligible personal data. This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {deleteError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeletingAccount ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Delete Permanently
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
