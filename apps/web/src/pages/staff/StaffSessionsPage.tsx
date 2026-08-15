import React, { useState, useEffect } from 'react';
import { Car, Search, CheckCircle2 } from 'lucide-react';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { Card } from '../../components/ui/Card';
import { bookingApi } from '../../api/booking';
import { Booking } from '@parkease/shared';

export const StaffSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const res = await bookingApi.getOwnerBookings();
        setSessions(res || []);
      } catch {
        // Handled in API client
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');
  const filteredSessions = activeSessions.filter((s) =>
    (s.vehicleNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.slotNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.locationName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StaffLayout
      title="Active Parking Sessions"
      subtitle="Live list of vehicles currently parked inside assigned parking facilities."
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8F6EC] shadow-2xs">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search active parked vehicle by plate number, slot, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F9F5] border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#72C98B]"
            />
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-xs text-gray-500 font-medium">Fetching active sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <Card className="p-12 text-center space-y-4 bg-white rounded-3xl border border-dashed border-gray-300">
            <Car className="w-12 h-12 text-gray-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#18342A]">No Active Sessions Found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {searchTerm ? 'No parked vehicle matches your search term.' : 'There are currently no active parked vehicles in the system.'}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="bg-white border border-[#E8F6EC] shadow-sm rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-medium">
                <thead>
                  <tr className="bg-[#F7F9F5] border-b border-gray-200 text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Slot</th>
                    <th className="py-3 px-4">Vehicle Plate</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F7F9F5]/70 transition-all">
                      <td className="py-3.5 px-4 font-black text-[#176B4D] text-base">{s.slotNumber}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900 text-sm">{s.vehicleNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-[#18342A]">{s.locationName}</td>
                      <td className="py-3.5 px-4 text-gray-600">{s.totalHours} hrs reserved</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 uppercase">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> ACTIVE SESSION
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
    </StaffLayout>
  );
};
