import React, { useEffect, useState } from 'react';
import { Users, MapPin, IndianRupee, RefreshCw } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi, AdminStats } from '../../api/adminApi';

export const AdminReportsPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const s = await adminApi.getStats();
      setStats(s);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <AdminLayout
      title="Platform Reports & System Analytics"
      subtitle="Comprehensive operational overview based on real backend metrics."
    >
      <div className="flex justify-end mb-6">
        <button
          onClick={loadStats}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-xs font-semibold text-[#18342A] rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 border border-[#E8F6EC] shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h3 className="font-extrabold text-sm text-[#18342A] flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" /> Account Distribution
            </h3>
            <span className="text-xs font-bold text-gray-400">Total Registered</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Drivers / Customers</span>
                <span className="text-[#176B4D]">{stats?.total_users || 0}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-[#176B4D] h-2 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Parking Owners</span>
                <span className="text-blue-700">{stats?.total_owners || 0}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Staff Personnel</span>
                <span className="text-indigo-700">{stats?.total_staff || 0}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E8F6EC] shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h3 className="font-extrabold text-sm text-[#18342A] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" /> Infrastructure Status
            </h3>
            <span className="text-xs font-bold text-gray-400">Locations Audit</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Total Locations</p>
              <p className="text-2xl font-black text-[#18342A] mt-1">{stats?.total_parking || 0}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/60">
              <p className="text-[10px] font-bold text-amber-700 uppercase">Pending Approvals</p>
              <p className="text-2xl font-black text-amber-800 mt-1">{stats?.pending_approvals || 0}</p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-800 uppercase">System Revenue</p>
              <p className="text-xl font-extrabold text-emerald-900 mt-0.5">
                ₹{(stats?.total_revenue || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <IndianRupee className="w-8 h-8 text-emerald-600/40" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
