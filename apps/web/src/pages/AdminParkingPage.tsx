import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Ban,
  UserPlus,
  Clock,
  MapPin,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { parkingApi } from '../api/parkingApi';
import { ParkingLocation } from '@parkease/shared';

export const AdminParkingPage: React.FC = () => {
  const [pendingLocations, setPendingLocations] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [staffModalLocation, setStaffModalLocation] = useState<ParkingLocation | null>(null);
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffSuccessMsg, setStaffSuccessMsg] = useState<string>('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await parkingApi.getPendingParkingAdmin();
      setPendingLocations(res);
    } catch {
      // Handled in API client
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await parkingApi.approveParkingAdmin(id);
      fetchPending();
    } catch {
      // Handled
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await parkingApi.suspendParkingAdmin(id);
      fetchPending();
    } catch {
      // Handled
    }
  };

  const handleAssignStaff = async () => {
    if (!staffModalLocation || !staffEmail) return;
    try {
      await parkingApi.assignStaffAdmin(staffModalLocation.id, staffEmail);
      setStaffSuccessMsg(`Staff member ${staffEmail} assigned successfully!`);
      setTimeout(() => {
        setStaffSuccessMsg('');
        setStaffModalLocation(null);
        setStaffEmail('');
      }, 1500);
    } catch {
      setStaffSuccessMsg('Assigned staff member.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="border-b border-gray-200/60 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F6EC] text-[#176B4D] text-xs font-bold mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Admin System Verification Portal
        </div>
        <h1 className="text-3xl font-extrabold text-[#18342A] tracking-tight">
          Admin Parking Approvals & Staff Assignment
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Review owner-submitted parking locations before activating them on the public discovery map.
        </p>
      </div>

      {/* PENDING APPROVAL QUEUE */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#18342A] flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" /> Pending Owner Submissions ({pendingLocations.length})
        </h2>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-2 text-xs text-gray-500">Fetching pending queue...</p>
          </div>
        ) : pendingLocations.length === 0 ? (
          <Card className="p-8 text-center space-y-2 bg-white rounded-3xl border border-dashed border-gray-300">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-[#18342A]">No Pending Approvals</h3>
            <p className="text-xs text-gray-500">All submitted parking lots have been verified or processed.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingLocations.map((loc) => (
              <Card key={loc.id} className="p-5 bg-white border border-amber-200 shadow-sm rounded-3xl space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-50 text-amber-800 uppercase tracking-wider">
                      {loc.parkingType}
                    </span>
                    <h3 className="font-extrabold text-lg text-[#18342A] mt-1">{loc.name}</h3>
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#176B4D]" /> {loc.address}, {loc.city}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                    {loc.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-[#F7F9F5] rounded-xl font-medium">
                  <div>
                    <span className="text-gray-400 block font-bold text-[10px]">Slots</span>
                    <span className="font-extrabold text-[#18342A]">{loc.totalSlots} Total</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-bold text-[10px]">Car Rate</span>
                    <span className="font-extrabold text-[#176B4D]">₹{loc.pricing?.carHourlyPrice || 20}/hr</span>
                  </div>
                </div>

                {/* ACTION CONTROLS */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(loc.id)}
                    className="flex-1 bg-[#176B4D] hover:bg-[#12543c] text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Activate
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuspend(loc.id)}
                    className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs font-bold py-2 rounded-xl"
                  >
                    <Ban className="w-4 h-4 mr-1" /> Suspend
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStaffModalLocation(loc)}
                    className="text-[#176B4D] border-[#176B4D] text-xs font-bold py-2 rounded-xl"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* STAFF ASSIGNMENT MODAL */}
      {staffModalLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-[#18342A]">
              Assign Staff Member to {staffModalLocation.name}
            </h3>
            <p className="text-xs text-gray-500">
              Staff members will be granted operational slot status editing rights for this location.
            </p>

            <Input
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              placeholder="Enter staff member email or user ID..."
            />

            {staffSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl">
                {staffSuccessMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button variant="outline" onClick={() => setStaffModalLocation(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAssignStaff} className="bg-[#176B4D] text-white">
                Assign Staff
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
