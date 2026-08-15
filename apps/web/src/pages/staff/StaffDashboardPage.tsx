import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Car, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { bookingApi } from '../../api/booking';
import { Booking } from '@parkease/shared';

export const StaffDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStaffData = async () => {
      setLoading(true);
      try {
        const res = await bookingApi.getOwnerBookings(); // Retrieves operational bookings
        setBookings(res || []);
      } catch {
        // Handled in API client
      } finally {
        setLoading(false);
      }
    };
    fetchStaffData();
  }, []);

  const activeSessions = bookings.filter((b) => b.status === 'ACTIVE');
  const upcomingEntries = bookings.filter((b) => b.status === 'CONFIRMED');

  return (
    <StaffLayout
      title="Daily Operations Control"
      subtitle="Gate barrier operations, vehicle entry/exit verification, and live parking slot monitoring."
    >
      <div className="space-y-8">
        {/* Quick Scanner Action Banner */}
        <Card className="p-6 bg-gradient-to-br from-[#176B4D] to-[#12543c] text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-emerald-200">
              Barrier Gate Control
            </span>
            <h2 className="text-2xl font-black tracking-tight">QR Gate Entry & Exit Verification</h2>
            <p className="text-xs text-emerald-100 max-w-lg">
              Scan customer booking QR codes to process vehicle entry or validate overstay calculations upon exit.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/staff/gate-scan')}
            className="bg-white text-[#176B4D] hover:bg-emerald-50 font-black px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg shrink-0 text-sm"
          >
            <QrCode className="w-5 h-5 text-[#176B4D]" /> Open Gate Scanner <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>

        {/* Operational Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="p-5 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Parked Vehicles</span>
              <div className="p-2.5 bg-emerald-50 rounded-2xl text-[#176B4D]">
                <Car className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#18342A]">{activeSessions.length}</div>
            <p className="text-[11px] text-emerald-700 font-medium">Currently inside parking lot</p>
          </Card>

          <Card className="p-5 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upcoming Reserved Entries</span>
              <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#18342A]">{upcomingEntries.length}</div>
            <p className="text-[11px] text-gray-400 font-medium">Valid QR pass holders</p>
          </Card>

          <Card className="p-5 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Daily Logged</span>
              <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
                <Layers className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#18342A]">{bookings.length}</div>
            <p className="text-[11px] text-gray-400 font-medium">Total operational records</p>
          </Card>
        </div>

        {/* Active Parked Vehicles List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-[#18342A] flex items-center gap-2">
              <Car className="w-5 h-5 text-[#176B4D]" /> Active Vehicles Currently On-Site
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/staff/sessions')}
              className="text-xs font-bold text-[#176B4D]"
            >
              View All Sessions
            </Button>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : activeSessions.length === 0 ? (
            <Card className="p-8 text-center bg-white rounded-3xl border border-dashed border-gray-300">
              <p className="text-xs text-gray-500">No active parked vehicles registered on-site right now.</p>
            </Card>
          ) : (
            <Card className="bg-white border border-[#E8F6EC] shadow-sm rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-[#F7F9F5] border-b border-gray-200 text-gray-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Slot</th>
                      <th className="py-3 px-4">Vehicle Number</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeSessions.slice(0, 5).map((s) => (
                      <tr key={s.id} className="hover:bg-[#F7F9F5]">
                        <td className="py-3.5 px-4 font-black text-[#176B4D] text-sm">{s.slotNumber}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#18342A]">{s.vehicleNumber}</td>
                        <td className="py-3.5 px-4 font-medium text-gray-600">{s.locationName}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                            PARKED / ACTIVE
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
      </div>
    </StaffLayout>
  );
};
