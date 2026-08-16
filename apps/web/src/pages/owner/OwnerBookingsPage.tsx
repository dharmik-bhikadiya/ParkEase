import React, { useState, useEffect } from 'react';
import { Calendar, Search, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { OwnerLayout } from '../../components/owner/OwnerLayout';
import { Card } from '../../components/ui/Card';
import { bookingApi } from '../../api/booking';
import { Booking } from '@parkease/shared';
import { SelectDropdown } from '../../components/ui/SelectDropdown';

export const OwnerBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const res = await bookingApi.getOwnerBookings();
        setBookings(res || []);
      } catch {
        // Handled in API client
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      (b.locationName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.vehicleNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.slotNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <OwnerLayout
      title="Location Reservations"
      subtitle="Track customer bookings, slot allocations, and reservation status for your parking lots."
    >
      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E8F6EC] shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by location, vehicle number, slot, or booking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F9F5] border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#72C98B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-48">
              <SelectDropdown
                options={[
                  { value: 'ALL', label: `All Statuses (${bookings.length})` },
                  { value: 'CONFIRMED', label: 'Confirmed' },
                  { value: 'ACTIVE', label: 'Active Session' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as any)}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Content Table / Cards */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-xs text-gray-500 font-medium">Fetching reservations...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="p-12 text-center space-y-4 bg-white rounded-3xl border border-dashed border-gray-300">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#18342A]">No Reservations Found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'No reservation matches your search criteria.'
                  : 'Customer reservations for your parking locations will appear here as they are booked.'}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="bg-white border border-[#E8F6EC] shadow-sm rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-medium">
                <thead>
                  <tr className="bg-[#F7F9F5] border-b border-gray-200 text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Slot</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F7F9F5]/70 transition-all">
                      <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-gray-500">
                        #{b.id.substring(0, 8)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#18342A]">
                        {b.locationName || 'Parking Hub'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#176B4D]">
                        {b.slotNumber || 'Slot'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-800">
                        {b.vehicleNumber}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {b.totalHours} hrs
                      </td>
                      <td className="py-3.5 px-4 font-black text-[#18342A]">
                        ₹{b.totalAmount}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1 uppercase tracking-wider ${
                            b.status === 'CONFIRMED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : b.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : b.status === 'COMPLETED'
                              ? 'bg-gray-100 text-gray-800 border border-gray-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {b.status === 'CONFIRMED' && <Clock className="w-3 h-3 text-blue-700" />}
                          {b.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                          {b.status === 'CANCELLED' && <XCircle className="w-3 h-3 text-rose-700" />}
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </OwnerLayout>
  );
};
