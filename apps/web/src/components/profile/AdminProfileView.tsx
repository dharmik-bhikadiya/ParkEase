import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Building2,
  Users,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Save,
  Camera,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminApi, AdminStats } from '../../api/adminApi';
import { Card } from '../ui/Card';
import { Link } from 'react-router-dom';
import { PasswordSecurityCard } from './PasswordSecurityCard';

export const AdminProfileView: React.FC = () => {
  const { user, updateProfile } = useAuth();

  // Admin Info Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await adminApi.getStats();
      setStats(data);
    } catch {
      // Keep null fallback
    } finally {
      setIsLoadingStats(false);
    }
  };

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
      setProfileSuccess('Administrator profile updated successfully!');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update admin profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Admin Identity Header */}
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
                <div className="w-20 h-20 rounded-full bg-[#176B4D] text-white font-black text-2xl flex items-center justify-center shadow-xs">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              <label
                htmlFor="admin-avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#176B4D] hover:bg-[#12543c] text-white cursor-pointer shadow-md transition-transform hover:scale-110"
                title="Change Avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
              <input
                id="admin-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-[#18342A] tracking-tight">{user.fullName}</h1>
                <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> ADMIN
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Super Administrator
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium flex items-center justify-center sm:justify-start gap-2">
                <span>{user.email}</span>
                {user.phoneNumber && <span className="text-gray-300">•</span>}
                {user.phoneNumber && <span>{user.phoneNumber}</span>}
              </p>
              <p className="text-[11px] text-gray-400 font-mono flex items-center justify-center sm:justify-start gap-1">
                Admin Privilege Identifier: {user.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/admin/users"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#176B4D] hover:bg-[#12543c] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Users className="w-4 h-4" /> User Directory
            </Link>
            <Link
              to="/admin/parking"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#E8F6EC] hover:bg-[#d5f0de] text-[#176B4D] border border-[#72C98B]/50 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Building2 className="w-4 h-4" /> Parking Lots
            </Link>
          </div>
        </div>
      </Card>

      {/* Section B: Platform Overview Live Metrics */}
      <Card className="p-6 bg-white border border-[#E8F6EC] rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#176B4D]" />
            <h2 className="text-base font-extrabold text-[#18342A]">ParkEase System Platform Metrics</h2>
          </div>
          <span className="text-xs font-bold text-[#176B4D]">Real-Time Telemetry</span>
        </div>

        {isLoadingStats ? (
          <div className="py-6 text-center text-xs text-gray-500 font-medium">Loading platform statistics...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3.5 bg-[#F7F9F5] rounded-2xl border border-gray-200 text-center space-y-0.5">
              <span className="text-xl font-black text-[#18342A]">{stats?.total_users ?? 0}</span>
              <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total Users</span>
            </div>
            <div className="p-3.5 bg-[#F7F9F5] rounded-2xl border border-gray-200 text-center space-y-0.5">
              <span className="text-xl font-black text-[#18342A]">{stats?.total_owners ?? 0}</span>
              <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Owners</span>
            </div>
            <div className="p-3.5 bg-[#F7F9F5] rounded-2xl border border-gray-200 text-center space-y-0.5">
              <span className="text-xl font-black text-[#18342A]">{stats?.total_staff ?? 0}</span>
              <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Staff</span>
            </div>
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-0.5">
              <span className="text-xl font-black text-emerald-900">{stats?.total_parking ?? 0}</span>
              <span className="block text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Facilities</span>
            </div>
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-0.5">
              <span className="text-xl font-black text-amber-900">{stats?.pending_approvals ?? 0}</span>
              <span className="block text-[9px] font-bold text-amber-700 uppercase tracking-wider">Pending</span>
            </div>
            <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 text-center space-y-0.5">
              <span className="text-xl font-black text-blue-900">{stats?.active_bookings ?? 0}</span>
              <span className="block text-[9px] font-bold text-blue-700 uppercase tracking-wider">Active Passes</span>
            </div>
            <div className="p-3.5 bg-emerald-100/60 rounded-2xl border border-emerald-300 text-center space-y-0.5 col-span-2 md:col-span-1">
              <span className="text-xl font-black text-[#176B4D]">₹{stats?.total_revenue ?? 0}</span>
              <span className="block text-[9px] font-extrabold text-[#176B4D] uppercase tracking-wider">Revenue</span>
            </div>
          </div>
        )}
      </Card>

      {/* Section C: Administration Shortcuts Console */}
      <Card className="p-6 bg-white border border-[#E8F6EC] rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#176B4D]" />
            <h2 className="text-base font-extrabold text-[#18342A]">Administration Console Shortcuts</h2>
          </div>
          <span className="text-xs font-bold text-[#176B4D]">Superuser Management</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="p-4 bg-[#F7F9F5] border border-gray-200 rounded-2xl space-y-2 hover:border-[#72C98B] transition-all group"
          >
            <div className="flex items-center justify-between">
              <Users className="w-6 h-6 text-[#176B4D]" />
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#18342A]">User Audit & Roles</h3>
              <p className="text-[10px] text-gray-500 font-medium">Manage driver, owner, and staff role authorizations.</p>
            </div>
          </Link>

          <Link
            to="/admin/parking"
            className="p-4 bg-[#F7F9F5] border border-gray-200 rounded-2xl space-y-2 hover:border-[#72C98B] transition-all group"
          >
            <div className="flex items-center justify-between">
              <Building2 className="w-6 h-6 text-[#176B4D]" />
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#18342A]">Parking Facilities Approval</h3>
              <p className="text-[10px] text-gray-500 font-medium">Approve, suspend, or inspect parking lots.</p>
            </div>
          </Link>

          <Link
            to="/admin/bookings"
            className="p-4 bg-[#F7F9F5] border border-gray-200 rounded-2xl space-y-2 hover:border-[#72C98B] transition-all group"
          >
            <div className="flex items-center justify-between">
              <Layers className="w-6 h-6 text-[#176B4D]" />
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#18342A]">System Bookings Log</h3>
              <p className="text-[10px] text-gray-500 font-medium">Inspect all platform reservations & pass status.</p>
            </div>
          </Link>

          <Link
            to="/admin/reports"
            className="p-4 bg-[#F7F9F5] border border-gray-200 rounded-2xl space-y-2 hover:border-[#72C98B] transition-all group"
          >
            <div className="flex items-center justify-between">
              <BarChart3 className="w-6 h-6 text-[#176B4D]" />
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#18342A]">Analytics & Reports</h3>
              <p className="text-[10px] text-gray-500 font-medium">Export system utilization and revenue reports.</p>
            </div>
          </Link>
        </div>
      </Card>

      {/* Main Grid: Admin Form & Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (6 cols): Admin Details */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 bg-white border border-[#E8F6EC] rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <UserIcon className="w-5 h-5 text-[#176B4D]" />
              <h3 className="text-sm font-extrabold text-[#18342A]">Administrator Details</h3>
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
                  Admin Email (Read-only)
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
                  Contact Mobile Number
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
                {isUpdatingProfile ? 'Saving...' : 'Save Admin Info'}
              </button>
            </form>
          </Card>
        </div>

        {/* Right Column (6 cols): Security & Protected Admin Guard */}
        <div className="lg:col-span-6 space-y-6">
          <PasswordSecurityCard />

          {/* Section E: Protected Admin Account Guard */}
          <Card className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-700" /> Protected Platform Admin Credentials
            </div>
            <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
              Super-administrator accounts are protected with mandatory platform safeguards. Self-deletion is disabled to prevent system administrative lockout.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
