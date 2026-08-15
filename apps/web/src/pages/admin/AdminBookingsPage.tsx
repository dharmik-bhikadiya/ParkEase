import React, { useEffect, useState } from 'react';
import { Calendar, Search, RefreshCw } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { Booking } from '@parkease/shared';

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getBookings();
      setBookings(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filtered = bookings.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      (b.id || '').toLowerCase().includes(q) ||
      (b.vehicleNumber || '').toLowerCase().includes(q) ||
      (b.locationName || '').toLowerCase().includes(q) ||
      (b.userId || '').toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout
      title="Platform Bookings"
      subtitle="Audit all parking reservations and active sessions across the system."
    >
      <div className="bg-white rounded-2xl p-4 border border-[#E8F6EC] shadow-xs mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Booking ID, Vehicle, Location..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#72C98B]"
          />
        </div>
        <button
          onClick={fetchBookings}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-[#176B4D] hover:bg-gray-100 rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-[#E8F6EC] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-[#176B4D] mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">Loading platform bookings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-600">No bookings recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">Bookings created by drivers will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-6">Booking ID</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Vehicle</th>
                  <th className="py-3.5 px-6">Hours</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#18342A]">
                      {b.id.substring(0, 8)}...
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#18342A]">
                      {b.locationName || 'Parking Slot'}
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-600 uppercase">{b.vehicleNumber}</td>
                    <td className="py-4 px-6 text-gray-600 font-medium">{b.totalHours} hrs</td>
                    <td className="py-4 px-6 font-bold text-emerald-700">₹{b.totalAmount}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-gray-400">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
