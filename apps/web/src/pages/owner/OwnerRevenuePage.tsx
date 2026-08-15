import React, { useState, useEffect } from 'react';
import { CircleDollarSign, TrendingUp, Calendar, Building2 } from 'lucide-react';
import { OwnerLayout } from '../../components/owner/OwnerLayout';
import { Card } from '../../components/ui/Card';
import { bookingApi } from '../../api/booking';
import { parkingApi } from '../../api/parkingApi';
import { Booking, ParkingLocation } from '@parkease/shared';

export const OwnerRevenuePage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bookingRes, locationRes] = await Promise.all([
          bookingApi.getOwnerBookings(),
          parkingApi.getOwnerLocations(),
        ]);
        setBookings(bookingRes || []);
        setLocations(locationRes || []);
      } catch {
        // Handled in API client
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'ACTIVE' || b.status === 'CONFIRMED');
  const averageBookingValue = completedBookings.length > 0 ? (totalRevenue / completedBookings.length).toFixed(2) : '0';

  return (
    <OwnerLayout
      title="Revenue & Financial Summary"
      subtitle="Track total parking collection, average reservation value, and location performance."
    >
      <div className="space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="p-5 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue Collected</span>
              <div className="p-2.5 bg-emerald-50 rounded-2xl text-[#176B4D]">
                <CircleDollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#18342A]">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Calculated from confirmed reservations
            </p>
          </Card>

          <Card className="p-5 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirmed Bookings</span>
              <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#18342A]">{completedBookings.length}</div>
            <p className="text-[11px] text-gray-400 font-medium">Valid Customer Reservations</p>
          </Card>

          <Card className="p-5 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Average Booking Value</span>
              <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#18342A]">₹{averageBookingValue}</div>
            <p className="text-[11px] text-gray-400 font-medium">Average ticket price</p>
          </Card>
        </div>

        {/* Location-wise Revenue Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-[#18342A] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#176B4D]" /> Revenue Breakdown by Location
          </h3>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : locations.length === 0 ? (
            <Card className="p-8 text-center bg-white rounded-3xl border border-dashed border-gray-300">
              <p className="text-xs text-gray-500">No location data available for financial breakdown.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((loc) => {
                const locBookings = bookings.filter((b) => b.locationName === loc.name || b.locationId === loc.id);
                const locRevenue = locBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

                return (
                  <Card key={loc.id} className="p-5 bg-white border border-[#E8F6EC] rounded-3xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-[#18342A] text-base">{loc.name}</h4>
                        <p className="text-xs text-gray-500">{loc.city}</p>
                      </div>
                      <span className="text-xl font-black text-[#176B4D]">₹{locRevenue.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
                      <span>Bookings: <strong className="text-[#18342A]">{locBookings.length}</strong></span>
                      <span>Total Slots: <strong className="text-[#18342A]">{loc.totalSlots}</strong></span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
};
