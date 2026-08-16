import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Plus, Trash2, Edit3, Star, Zap, Bike, AlertCircle, X } from 'lucide-react';
import { UserVehicle, VehicleType } from '@parkease/shared';
import { apiClient } from '../api/client';
import { SelectDropdown } from '../components/ui/SelectDropdown';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<UserVehicle | null>(null);

  // Form State
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.CAR);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [isEv, setIsEv] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/users/me/vehicles');
      if (res.data?.success) {
        setVehicles(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openAddModal = () => {
    setEditingVehicle(null);
    setVehicleType(VehicleType.CAR);
    setRegistrationNumber('');
    setNickname('');
    setIsEv(false);
    setIsDefault(vehicles.length === 0);
    setIsModalOpen(true);
  };

  const openEditModal = (v: UserVehicle) => {
    setEditingVehicle(v);
    setVehicleType(v.vehicleType);
    setRegistrationNumber(v.registrationNumber);
    setNickname(v.nickname || '');
    setIsEv(v.isEv);
    setIsDefault(v.isDefault);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (editingVehicle) {
        await apiClient.patch(`/users/me/vehicles/${editingVehicle.id}`, {
          vehicle_type: vehicleType,
          registration_number: registrationNumber,
          nickname,
          is_ev: isEv,
          is_default: isDefault,
        });
      } else {
        await apiClient.post('/users/me/vehicles', {
          vehicle_type: vehicleType,
          registration_number: registrationNumber,
          nickname,
          is_ev: isEv,
          is_default: isDefault,
        });
      }
      setIsModalOpen(false);
      await fetchVehicles();
    } catch (err: any) {
      setError(err.message || 'Failed to save vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await apiClient.delete(`/users/me/vehicles/${id}`);
      await fetchVehicles();
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  const handleSetDefault = async (v: UserVehicle) => {
    try {
      await apiClient.patch(`/users/me/vehicles/${v.id}`, { is_default: true });
      await fetchVehicles();
    } catch (err: any) {
      alert(err.message || 'Failed to set default vehicle');
    }
  };

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case VehicleType.BIKE:
        return <Bike className="w-6 h-6 text-[#176B4D]" />;
      case VehicleType.EV:
        return <Zap className="w-6 h-6 text-emerald-500" />;
      default:
        return <Car className="w-6 h-6 text-[#176B4D]" />;
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F9F5] p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#18342A] tracking-tight">My Vehicles</h1>
            <p className="text-sm text-gray-600">Manage your registered vehicles for quick parking reservations</p>
          </div>
          <button
            onClick={openAddModal}
            className="px-5 py-3 bg-[#176B4D] hover:bg-[#12543c] text-white font-semibold rounded-2xl shadow-lg shadow-[#176B4D]/10 flex items-center gap-2 transition-all"
          >
            <Plus className="w-5 h-5" /> Add New Vehicle
          </button>
        </div>

        {/* Vehicles Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#176B4D]"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E8F6EC] shadow-sm max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#E8F6EC] text-[#176B4D] flex items-center justify-center mx-auto">
              <Car className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#18342A]">No Vehicles Added</h3>
            <p className="text-sm text-gray-500">Add your first vehicle to enable quick barrier gate entry & exit.</p>
            <button
              onClick={openAddModal}
              className="px-6 py-2.5 bg-[#176B4D] text-white font-medium rounded-xl hover:bg-[#12543c] transition-all"
            >
              Add Vehicle Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white rounded-3xl p-6 border transition-all shadow-md relative ${
                  v.isDefault ? 'border-[#72C98B] ring-2 ring-[#72C98B]/20' : 'border-[#E8F6EC]'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#E8F6EC] flex items-center justify-center">
                      {getVehicleIcon(v.vehicleType)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[#18342A]">
                        {v.nickname || v.registrationNumber}
                      </h3>
                      <p className="text-xs text-gray-400 font-mono tracking-wider">
                        {v.registrationNumber}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                    {v.vehicleType}
                  </span>
                  {v.isEv && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-500" /> EV Plug
                    </span>
                  )}
                  {v.isDefault && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#176B4D] text-white flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Default Vehicle
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs font-medium">
                  {!v.isDefault ? (
                    <button
                      onClick={() => handleSetDefault(v)}
                      className="text-[#176B4D] hover:underline flex items-center gap-1"
                    >
                      Set Default
                    </button>
                  ) : (
                    <span className="text-gray-400">Primary</span>
                  )}
                  <div className="flex items-center gap-3 text-gray-500">
                    <button onClick={() => openEditModal(v)} className="hover:text-[#176B4D]" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="hover:text-red-600" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#E8F6EC] shadow-2xl relative"
              >
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-[#18342A] mb-2">
                  {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <p className="text-xs text-gray-500 mb-6">Enter vehicle registration and specification details</p>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      required
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="MH 02 CL 1234"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] text-sm font-semibold uppercase tracking-wider focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                      Vehicle Nickname (Optional)
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="My Red Sedan"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] text-sm font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <SelectDropdown
                      label="Vehicle Category"
                      options={[
                        { value: VehicleType.CAR, label: 'Car / Sedan', icon: <Car className="w-4 h-4" /> },
                        { value: VehicleType.SUV, label: 'SUV / MUV', icon: <Car className="w-4 h-4" /> },
                        { value: VehicleType.BIKE, label: 'Bike / Two Wheeler', icon: <Bike className="w-4 h-4 text-[#176B4D]" /> },
                        { value: VehicleType.EV, label: 'Electric Vehicle (EV)', icon: <Zap className="w-4 h-4 text-emerald-500" /> },
                        { value: VehicleType.OTHER, label: 'Other' },
                      ]}
                      value={vehicleType}
                      onChange={(val) => setVehicleType(val as VehicleType)}
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEv}
                        onChange={(e) => setIsEv(e.target.checked)}
                        className="w-4 h-4 rounded text-[#176B4D] focus:ring-[#72C98B]"
                      />
                      <span className="text-xs font-medium text-[#18342A]">Supports EV Charging Slot</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="w-4 h-4 rounded text-[#176B4D] focus:ring-[#72C98B]"
                      />
                      <span className="text-xs font-medium text-[#18342A]">Set as Default Vehicle for Bookings</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#176B4D] hover:bg-[#12543c] text-white font-semibold rounded-2xl shadow-lg shadow-[#176B4D]/20 transition-all disabled:opacity-50 mt-6"
                  >
                    {isSubmitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
