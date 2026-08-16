import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  QrCode,
  Car,
  Layers,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Camera,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Card } from '../ui/Card';
import { Link } from 'react-router-dom';

export const StaffProfileView: React.FC = () => {
  const { user, updateProfile, deleteAccount } = useAuth();

  // Personal Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // Danger Zone Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setProfileError('Image size should be less than 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
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
      setProfileSuccess('Staff operator details updated successfully!');
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
      setDeleteError(err.message || 'Failed to delete staff account.');
      setIsDeletingAccount(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Staff Identity Header */}
      <Card className="p-6 md:p-8 bg-white border border-[#E8F6EC] rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.fullName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#72C98B] shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#E8F6EC] border-2 border-[#72C98B] text-[#176B4D] font-extrabold text-2xl flex items-center justify-center shadow-xs">
                  {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'PS'}
                </div>
              )}
              <label
                htmlFor="staff-avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#176B4D] hover:bg-[#12543c] text-white cursor-pointer shadow-md transition-transform hover:scale-110"
                title="Change Avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
              <input
                id="staff-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-[#18342A] tracking-tight">{user.fullName}</h1>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-[#E8F6EC] text-[#176B4D] border border-[#72C98B] uppercase">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#176B4D]" /> STAFF
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Authorized Gate Attendant
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium flex items-center justify-center sm:justify-start gap-2">
                <span>{user.email}</span>
                {user.phoneNumber && <span className="text-gray-300">•</span>}
                {user.phoneNumber && <span>{user.phoneNumber}</span>}
              </p>
              <p className="text-[11px] text-gray-400 font-mono flex items-center justify-center sm:justify-start gap-1">
                Staff Badge ID: {user.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/staff/gate-scan"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#176B4D] hover:bg-[#12543c] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <QrCode className="w-4 h-4" /> Launch Gate Scanner
            </Link>
          </div>
        </div>
      </Card>

      {/* Section B: Gate Operations Hub */}
      <Card className="p-6 bg-white border border-[#E8F6EC] rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#176B4D]" />
            <h2 className="text-base font-extrabold text-[#18342A]">Gate Operations Control Hub</h2>
          </div>
          <span className="text-xs font-bold text-[#176B4D]">Active Duty Tools</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/staff/gate-scan"
            className="p-5 bg-gradient-to-br from-[#176B4D] to-[#0f4733] text-white rounded-2xl space-y-3 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <QrCode className="w-7 h-7 text-emerald-300" />
              <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">Barrier Gate Scanner</h3>
              <p className="text-[11px] text-emerald-100 font-medium mt-0.5">Verify QR passes for entry & exit authorization.</p>
            </div>
          </Link>

          <Link
            to="/staff/sessions"
            className="p-5 bg-[#F7F9F5] border border-gray-200 text-[#18342A] rounded-2xl space-y-3 hover:border-gray-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <Car className="w-7 h-7 text-[#176B4D]" />
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">Active Parking Sessions</h3>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Monitor real-time parked vehicles and overstay tracking.</p>
            </div>
          </Link>

          <Link
            to="/staff/slots"
            className="p-5 bg-[#F7F9F5] border border-gray-200 text-[#18342A] rounded-2xl space-y-3 hover:border-gray-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <Layers className="w-7 h-7 text-[#176B4D]" />
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">Slot Control Grid</h3>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Inspect floor slot occupancy and mark slot maintenance.</p>
            </div>
          </Link>
        </div>
      </Card>

      {/* Main Grid: Staff Form & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (6 cols): Staff Information */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 bg-white border border-[#E8F6EC] rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <UserIcon className="w-5 h-5 text-[#176B4D]" />
              <h3 className="text-sm font-extrabold text-[#18342A]">Attendant Identity & Contact</h3>
            </div>

            {profileSuccess && (
              <div className="p-3 rounded-xl bg-[#E8F6EC] text-[#176B4D] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] font-semibold text-gray-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1">
                  Staff Email (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Duty Mobile Phone
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] font-semibold text-gray-800 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full py-2.5 bg-[#176B4D] hover:bg-[#12543c] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isUpdatingProfile ? 'Saving...' : 'Save Attendant Info'}
              </button>
            </form>
          </Card>
        </div>

        {/* Right Column (6 cols): Security & Danger Zone */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 bg-white border border-[#E8F6EC] rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Lock className="w-5 h-5 text-[#176B4D]" />
              <h3 className="text-sm font-extrabold text-[#18342A]">Password & Security</h3>
            </div>

            {pwdSuccess && (
              <div className="p-3 rounded-xl bg-[#E8F6EC] text-[#176B4D] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {pwdSuccess}
              </div>
            )}
            {pwdError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {pwdError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] font-semibold text-gray-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] font-semibold text-gray-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] font-semibold text-gray-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPwd}
                className="w-full py-2.5 bg-[#18342A] hover:bg-[#0f221b] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                {isChangingPwd ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </Card>

          <Card className="p-6 bg-rose-50/60 border border-rose-200 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
              <Trash2 className="w-4 h-4" /> Danger Zone
            </div>
            <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
              Delete staff account. This revokes your gate scanner and duty privileges.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Delete Staff Account
            </button>
          </Card>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-red-100 shadow-2xl space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-[#18342A]">Delete Staff Account?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                This permanently deletes your staff credentials and revokes gate entry verification rights.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {deleteError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
