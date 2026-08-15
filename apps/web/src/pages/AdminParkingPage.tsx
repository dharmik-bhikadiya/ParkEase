import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Ban,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { adminApi } from '../api/adminApi';
import { ParkingLocation } from '@parkease/shared';
import { AdminLayout } from '../components/admin/AdminLayout';

export const AdminParkingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'active' | 'suspended'>('pending');
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchParkingData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        const res = await adminApi.getPendingParking();
        setLocations(res);
      } else {
        const res = await adminApi.getAllParking();
        if (activeTab === 'active') {
          setLocations(res.filter((l) => l.status === 'ACTIVE'));
        } else if (activeTab === 'suspended') {
          setLocations(res.filter((l) => l.status === 'SUSPENDED'));
        } else {
          setLocations(res);
        }
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingData();
  }, [activeTab]);

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveParking(id);
      fetchParkingData();
    } catch {
      // Handled
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await adminApi.suspendParking(id);
      fetchParkingData();
    } catch {
      // Handled
    }
  };

  return (
    <AdminLayout
      title="Admin Parking Management & Approvals"
      subtitle="Review owner submissions, approve new locations, and manage platform parking sites."
    >
      {/* Tabs Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8F6EC] shadow-xs mb-6 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          {[
            { key: 'pending', label: 'Pending Approval' },
            { key: 'all', label: 'All Locations' },
            { key: 'active', label: 'Active' },
            { key: 'suspended', label: 'Suspended' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-[#176B4D] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchParkingData}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-[#176B4D] hover:bg-gray-100 rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Locations Display */}
      {loading ? (
        <div className="py-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#176B4D] mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-medium">Fetching parking locations...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-gray-300">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-[#18342A]">No Parking Locations Found</h3>
          <p className="text-xs text-gray-500 mt-1">There are no locations matching the selected status tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations.map((loc) => (
            <div key={loc.id} className="p-5 bg-white border border-[#E8F6EC] shadow-xs rounded-3xl space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-gray-100 text-gray-700 uppercase tracking-wider">
                    {loc.parkingType}
                  </span>
                  <h3 className="font-extrabold text-lg text-[#18342A] mt-1">{loc.name}</h3>
                  <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#176B4D]" /> {loc.address}, {loc.city}
                  </p>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded border uppercase ${
                  loc.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : loc.status === 'PENDING_APPROVAL'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}>
                  {loc.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-[#F7F9F5] rounded-xl font-medium">
                <div>
                  <span className="text-gray-400 block font-bold text-[10px]">Slots</span>
                  <span className="font-extrabold text-[#18342A]">{loc.totalSlots} Total</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold text-[10px]">Hourly Rate</span>
                  <span className="font-extrabold text-[#176B4D]">₹{loc.pricing?.carHourlyPrice || 20}/hr</span>
                </div>
              </div>

              {/* ACTION CONTROLS */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                {loc.status !== 'ACTIVE' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(loc.id)}
                    className="flex-1 bg-[#176B4D] hover:bg-[#12543c] text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </Button>
                )}

                {loc.status !== 'SUSPENDED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuspend(loc.id)}
                    className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs font-bold py-2 rounded-xl flex-1 flex items-center justify-center gap-1"
                  >
                    <Ban className="w-4 h-4" /> Suspend
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};
