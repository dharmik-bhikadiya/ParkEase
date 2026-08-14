import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Building2,
  Layers,
  CheckCircle2,
  ArrowUpRight,
  Sliders,
  Calendar,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { parkingApi } from '../api/parkingApi';
import { bookingApi } from '../api/booking';
import { ParkingLocation, Booking } from '@parkease/shared';

export const OwnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOwnerData = async () => {
      setLoading(true);
      try {
        const [locRes, bookingRes] = await Promise.all([
          parkingApi.getOwnerLocations(),
          bookingApi.getOwnerBookings(),
        ]);
        setLocations(locRes || []);
        setOwnerBookings(bookingRes || []);
      } catch {
        // Handled in API client
      } finally {
        setLoading(false);
      }
    };
    fetchOwnerData();
  }, []);

  const totalLocations = locations.length;
  const totalSlots = locations.reduce((sum, l) => sum + (l.totalSlots || 0), 0);
  const totalAvailable = locations.reduce((sum, l) => sum + (l.availableSlots || 0), 0);

  return (
    <div className="min-h-screen bg-[#F7F9F5] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* 1. HEADER & MAIN ACTIONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#18342A] tracking-tight">
            Parking Owner Control Dashboard
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Manage your registered parking hubs, slot configurations, and live reservations.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/owner/parking/new')}
          className="bg-[#176B4D] hover:bg-[#12543c] text-white font-extrabold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-md"
        >
          <Plus className="w-5 h-5" /> Add New Parking
        </Button>
      </div>

      {/* 2. REAL METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 bg-white border border-[#E8F6EC] shadow-sm rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registered Hubs</span>
            <div className="p-2 bg-[#E8F6EC] rounded-xl text-[#176B4D]">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#18342A]">{totalLocations}</div>
          <p className="text-[11px] text-gray-400 font-medium">Active & Pending Parking Lots</p>
        </Card>

        <Card className="p-5 bg-white border border-[#E8F6EC] shadow-sm rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total System Slots</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#18342A]">{totalSlots}</div>
          <p className="text-[11px] text-gray-400 font-medium">Configured Physical Slots</p>
        </Card>

        <Card className="p-5 bg-white border border-[#E8F6EC] shadow-sm rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Available Slots</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#176B4D]">{totalAvailable}</div>
          <p className="text-[11px] text-emerald-600 font-medium">Ready for Vehicle Entry</p>
        </Card>

        <Card className="p-5 bg-white border border-[#E8F6EC] shadow-sm rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Live Reservations</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#18342A]">{ownerBookings.length}</div>
          <p className="text-[11px] text-gray-500 font-medium">Customer Parking Bookings</p>
        </Card>
      </div>

      {/* 3. PARKING LOCATIONS MANAGEMENT TABLE */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#18342A] flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#176B4D]" /> My Managed Parking Locations
        </h2>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-2 text-xs text-gray-500">Loading owner locations...</p>
          </div>
        ) : locations.length === 0 ? (
          <Card className="p-10 text-center space-y-4 bg-white rounded-3xl border border-dashed border-gray-300">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#18342A]">No Parking Locations Created Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Register your first parking lot to start managing slots, vehicle rates, and staff assignments.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/owner/parking/new')}
              className="bg-[#176B4D] text-white font-bold"
            >
              Add Your First Parking Location
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((loc) => {
              const isPending = loc.status === 'PENDING_APPROVAL';

              return (
                <Card
                  key={loc.id}
                  className="p-5 bg-white border border-[#E8F6EC] shadow-sm hover:shadow-md rounded-3xl space-y-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#F7F9F5] text-gray-600 uppercase tracking-wider">
                        {loc.parkingType.replace('_', ' ')}
                      </span>
                      <h3 className="font-extrabold text-lg text-[#18342A] mt-1">{loc.name}</h3>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md shrink-0 uppercase tracking-wider ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : loc.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {loc.status}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-gray-600 space-y-1">
                    <p>📍 {loc.address}, {loc.city}</p>
                    <p>🕒 Hours: {loc.openingTime} - {loc.closingTime}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#F7F9F5] rounded-2xl text-xs">
                    <div>
                      <span className="text-gray-400 block font-semibold text-[10px]">Total Capacity</span>
                      <span className="font-extrabold text-[#18342A] text-sm">{loc.totalSlots} Slots</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-semibold text-[10px]">Available</span>
                      <span className="font-extrabold text-[#176B4D] text-sm">{loc.availableSlots} Free</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/owner/parking/${loc.id}/slots`)}
                      className="flex-1 text-xs font-bold py-2 border-[#176B4D] text-[#176B4D] hover:bg-[#E8F6EC]"
                    >
                      <Sliders className="w-3.5 h-3.5 mr-1" /> Manage Slots
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/parking/${loc.id}`)}
                      className="bg-[#176B4D] text-white text-xs font-bold py-2 px-3"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. RECENT RESERVATIONS SECTION */}
      {ownerBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#18342A] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#176B4D]" /> Customer Reservations Overview
          </h2>
          <Card className="p-4 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-medium">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Slot</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ownerBookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-[#F7F9F5]">
                    <td className="py-3 px-3 font-bold text-[#18342A]">{b.locationName}</td>
                    <td className="py-3 px-3 font-extrabold text-[#176B4D]">{b.slotNumber}</td>
                    <td className="py-3 px-3 font-mono font-semibold">{b.vehicleNumber}</td>
                    <td className="py-3 px-3">{b.totalHours} hrs</td>
                    <td className="py-3 px-3 font-extrabold text-gray-900">₹{b.totalAmount}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
};
