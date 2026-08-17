import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  AlertTriangle,
  Camera,
  Car,
  Bike,
  Zap,
  Plus,
  Star,
  Edit3,
  Wallet as WalletIcon,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { UserVehicle, VehicleType, Wallet as WalletType } from '@parkease/shared';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { bookingApi } from '../../api/booking';
import { walletApi } from '../../api/walletApi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { PasswordSecurityCard } from './PasswordSecurityCard';

export const DriverProfileView: React.FC = () => {
  const { user, updateProfile, deleteAccount } = useAuth();

  // Personal Info Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Vehicles State
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<UserVehicle | null>(null);
  const [vType, setVType] = useState<VehicleType>(VehicleType.CAR);
  const [regNumber, setRegNumber] = useState('');
  const [vNickname, setVNickname] = useState('');
  const [isEv, setIsEv] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  // Booking Stats State
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  });

  // Wallet State
  const [wallet, setWallet] = useState<WalletType | null>(null);

  // Account Deletion Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    // Load Vehicles
    try {
      setIsLoadingVehicles(true);
      const res = await apiClient.get('/users/me/vehicles');
      if (res.data?.success) {
        setVehicles(res.data.data);
      }
    } catch {
      // Fallback empty vehicles list
    } finally {
      setIsLoadingVehicles(false);
    }

    // Load Booking Stats
    try {
      const bookings = await bookingApi.getMyBookings();
      if (Array.isArray(bookings)) {
        setBookingStats({
          total: bookings.length,
          active: bookings.filter((b: any) => b.status === 'ACTIVE' || b.status === 'CONFIRMED').length,
          completed: bookings.filter((b: any) => b.status === 'COMPLETED').length,
          cancelled: bookings.filter((b: any) => b.status === 'CANCELLED').length,
        });
      }
    } catch {
      // Keep initial 0s
    }

    // Load Wallet
    try {
      const w = await walletApi.getWallet();
      setWallet(w);
    } catch {
      // Keep null
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
      setProfileSuccess('Personal profile updated successfully!');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setVType(VehicleType.CAR);
    setRegNumber('');
    setVNickname('');
    setIsEv(false);
    setIsDefault(vehicles.length === 0);
    setVehicleError(null);
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (v: UserVehicle) => {
    setEditingVehicle(v);
    setVType(v.vehicleType);
    setRegNumber(v.registrationNumber);
    setVNickname(v.nickname || '');
    setIsEv(v.isEv);
    setIsDefault(v.isDefault);
    setVehicleError(null);
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleError(null);
    setIsSavingVehicle(true);

    try {
      if (editingVehicle) {
        await apiClient.patch(`/users/me/vehicles/${editingVehicle.id}`, {
          vehicle_type: vType,
          registration_number: regNumber,
          nickname: vNickname,
          is_ev: isEv,
          is_default: isDefault,
        });
      } else {
        await apiClient.post('/users/me/vehicles', {
          vehicle_type: vType,
          registration_number: regNumber,
          nickname: vNickname,
          is_ev: isEv,
          is_default: isDefault,
        });
      }
      setIsVehicleModalOpen(false);
      await loadDriverData();
    } catch (err: any) {
      setVehicleError(err.message || 'Failed to save vehicle');
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm('Remove this vehicle from your profile?')) return;
    try {
      await apiClient.delete(`/users/me/vehicles/${id}`);
      await loadDriverData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle');
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

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Driver Identity Header */}
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
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'D'}
                </div>
              )}
              <label
                htmlFor="driver-avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#176B4D] hover:bg-[#12543c] text-white cursor-pointer shadow-md transition-transform hover:scale-110"
                title="Change Avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
              <input
                id="driver-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-[#18342A] tracking-tight">{user.fullName}</h1>
                <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-[#E8F6EC] text-[#176B4D] border border-[#72C98B] uppercase">
                  <Car className="w-3.5 h-3.5 text-[#176B4D]" /> DRIVER
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Account
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium flex items-center justify-center sm:justify-start gap-2">
                <span>{user.email}</span>
                {user.phoneNumber && <span className="text-gray-300">•</span>}
                {user.phoneNumber && <span>{user.phoneNumber}</span>}
              </p>
              <p className="text-[11px] text-gray-400 font-semibold flex items-center justify-center sm:justify-start gap-1">
                <Calendar className="w-3.5 h-3.5" /> Member since {formattedDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/bookings"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#176B4D] hover:bg-[#12543c] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-4 h-4" /> My Bookings
            </Link>
            <Link
              to="/wallet"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#E8F6EC] hover:bg-[#d5f0de] text-[#176B4D] border border-[#72C98B]/50 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <WalletIcon className="w-4 h-4" /> Wallet
            </Link>
          </div>
        </div>
      </Card>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Vehicles & Activity Stats */}
        <div className="lg:col-span-8 space-y-8">
          {/* Section B: My Vehicles (Personal Mobility Fleet) */}
          <Card className="p-6 bg-white border border-[#E8F6EC] rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Car className="w-5 h-5 text-[#176B4D]" />
                <div>
                  <h2 className="text-base font-extrabold text-[#18342A]">My Registered Vehicles</h2>
                  <p className="text-xs text-gray-500 font-medium">Manage your cars, bikes, and EV profiles for instant booking pass verification.</p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={handleOpenAddVehicle}
                className="bg-[#176B4D] hover:bg-[#12543c] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Vehicle
              </Button>
            </div>

            {isLoadingVehicles ? (
              <div className="py-8 text-center text-xs text-gray-500 font-medium">Loading registered vehicles...</div>
            ) : vehicles.length === 0 ? (
              <div className="p-6 bg-[#F7F9F5] border border-dashed border-gray-200 rounded-2xl text-center space-y-3">
                <Car className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-600 font-semibold">No vehicles registered yet.</p>
                <p className="text-[11px] text-gray-400">Add your vehicle registration number to enjoy faster parking entry and gate pass scanning.</p>
                <button
                  onClick={handleOpenAddVehicle}
                  className="px-4 py-2 bg-[#176B4D] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:bg-[#12543c]"
                >
                  + Register First Vehicle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      v.isDefault
                        ? 'bg-[#E8F6EC]/40 border-[#72C98B] shadow-2xs'
                        : 'bg-[#F7F9F5] border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white border border-gray-200 text-[#176B4D]">
                          {v.vehicleType === VehicleType.BIKE ? (
                            <Bike className="w-5 h-5" />
                          ) : (
                            <Car className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-[#18342A] uppercase tracking-wide">
                              {v.registrationNumber}
                            </span>
                            {v.isDefault && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-[#176B4D] text-white uppercase flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-current" /> Default
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium">
                            {v.nickname || `${v.vehicleType} Vehicle`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditVehicle(v)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#176B4D] hover:bg-white transition-colors"
                          title="Edit Vehicle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition-colors"
                          title="Remove Vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {v.isEv && (
                      <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex items-center gap-1 text-[10px] font-extrabold text-emerald-800">
                        <Zap className="w-3 h-3 text-emerald-600" /> Electric Vehicle (EV Charging Ready)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section C: Parking Activity Snapshot */}
          <Card className="p-6 bg-white border border-[#E8F6EC] rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#176B4D]" />
                <div>
                  <h2 className="text-base font-extrabold text-[#18342A]">Parking Activity Snapshot</h2>
                  <p className="text-xs text-gray-500 font-medium">Your historical reservation performance & active pass summary.</p>
                </div>
              </div>
              <Link to="/bookings" className="text-xs font-bold text-[#176B4D] hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-[#F7F9F5] rounded-2xl border border-gray-200 text-center space-y-1">
                <span className="text-2xl font-black text-[#18342A]">{bookingStats.total}</span>
                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Bookings</span>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
                <span className="text-2xl font-black text-emerald-900">{bookingStats.active}</span>
                <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active Pass</span>
              </div>
              <div className="p-4 bg-[#F7F9F5] rounded-2xl border border-gray-200 text-center space-y-1">
                <span className="text-2xl font-black text-gray-700">{bookingStats.completed}</span>
                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Completed</span>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-center space-y-1">
                <span className="text-2xl font-black text-rose-800">{bookingStats.cancelled}</span>
                <span className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider">Cancelled</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (4 cols): Personal Info, Wallet Snapshot, Security & Danger Zone */}
        <div className="lg:col-span-4 space-y-8">
          {/* Section D: Wallet Snapshot */}
          <Card className="p-6 bg-white border border-[#E8F6EC] rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <WalletIcon className="w-5 h-5 text-[#176B4D]" />
                <h3 className="text-sm font-extrabold text-[#18342A]">ParkEase Wallet</h3>
              </div>
              <Link to="/wallet" className="text-xs font-bold text-[#176B4D] hover:underline flex items-center gap-0.5">
                Manage <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#176B4D] to-[#0f4733] text-white space-y-3 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block">Available Balance</span>
              <div className="text-3xl font-black tracking-tight">
                ₹{wallet?.balance !== undefined ? wallet.balance.toFixed(2) : '0.00'}
              </div>
              <div className="flex gap-2 pt-2">
                <Link
                  to="/wallet"
                  className="flex-1 py-2 bg-white text-[#176B4D] text-xs font-extrabold rounded-xl text-center shadow-2xs hover:bg-emerald-50 transition-colors"
                >
                  + Add Funds
                </Link>
              </div>
            </div>
          </Card>

          {/* Section A: Personal Information Form */}
          <Card className="p-6 bg-white border border-[#E8F6EC] rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <UserIcon className="w-5 h-5 text-[#176B4D]" />
              <h3 className="text-sm font-extrabold text-[#18342A]">Personal Information</h3>
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
                  Email Address (Read-only)
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
                  Mobile Number
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
                {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </Card>

          {/* Section E: Security & Credentials */}
          <PasswordSecurityCard />

          {/* Section F: Danger Zone */}
          <Card className="p-6 bg-rose-50/60 border border-rose-200 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
              <Trash2 className="w-4 h-4" /> Danger Zone
            </div>
            <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
              Permanently delete your account, saved vehicles, wallet balance, and driver booking history.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Delete My Driver Account
            </button>
          </Card>
        </div>
      </div>

      {/* Add / Edit Vehicle Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E8F6EC] shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-[#18342A]">
                {editingVehicle ? 'Edit Vehicle Details' : 'Add New Vehicle'}
              </h3>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            {vehicleError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {vehicleError}
              </div>
            )}

            <form onSubmit={handleSaveVehicle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Vehicle Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVType(VehicleType.CAR)}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      vType === VehicleType.CAR
                        ? 'bg-[#176B4D] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Car className="w-4 h-4" /> 4-Wheeler Car
                  </button>
                  <button
                    type="button"
                    onClick={() => setVType(VehicleType.BIKE)}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      vType === VehicleType.BIKE
                        ? 'bg-[#176B4D] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Bike className="w-4 h-4" /> 2-Wheeler Bike
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Registration Number (e.g. GJ06AB1234)
                </label>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                  placeholder="GJ-06-AB-1234"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] font-mono font-bold text-gray-800 uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Nickname / Model (Optional)
                </label>
                <input
                  type="text"
                  value={vNickname}
                  onChange={(e) => setVNickname(e.target.value)}
                  placeholder="e.g. My White Swift"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] font-semibold text-gray-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEv}
                    onChange={(e) => setIsEv(e.target.checked)}
                    className="w-4 h-4 rounded text-[#176B4D] focus:ring-[#72C98B]"
                  />
                  <span>Electric Vehicle (EV)</span>
                </label>

                <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-[#176B4D] focus:ring-[#72C98B]"
                  />
                  <span>Set Primary Vehicle</span>
                </label>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVehicle}
                  className="flex-1 py-2.5 bg-[#176B4D] hover:bg-[#12543c] text-white font-bold rounded-xl shadow-xs"
                >
                  {isSavingVehicle ? 'Saving...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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
              <h3 className="text-lg font-extrabold text-[#18342A]">Delete Driver Account?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                This action permanently removes your ParkEase driver account and all associated vehicles and booking history.
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
                {isDeletingAccount ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
