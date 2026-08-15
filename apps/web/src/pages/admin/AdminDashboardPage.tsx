import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  UserCheck,
  MapPin,
  Calendar,
  IndianRupee,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi, AdminStats } from '../../api/adminApi';
import { ParkingLocation } from '@parkease/shared';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingLocations, setPendingLocations] = useState<ParkingLocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sData, pData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getPendingParking(),
      ]);
      setStats(sData);
      setPendingLocations(pData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load system statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats ? stats.total_users : '0',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      link: '/admin/users?role=USER',
    },
    {
      title: 'Parking Owners',
      value: stats ? stats.total_owners : '0',
      icon: Building2,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      link: '/admin/owners',
    },
    {
      title: 'Staff Members',
      value: stats ? stats.total_staff : '0',
      icon: UserCheck,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      link: '/admin/staff',
    },
    {
      title: 'Total Parking Locations',
      value: stats ? stats.total_parking : '0',
      icon: MapPin,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      link: '/admin/parking',
    },
    {
      title: 'Pending Approvals',
      value: stats ? stats.pending_approvals : '0',
      icon: ShieldAlert,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      link: '/admin/parking?tab=pending',
    },
    {
      title: 'Active Bookings',
      value: stats ? stats.active_bookings : '0',
      icon: Calendar,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      link: '/admin/bookings',
    },
    {
      title: 'Total Revenue',
      value: stats ? `₹${stats.total_revenue.toLocaleString('en-IN')}` : '₹0',
      icon: IndianRupee,
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      link: '/admin/payments',
    },
  ];

  return (
    <AdminLayout
      title="System Overview"
      subtitle="Comprehensive real-time platform statistics & management console."
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Live System Metrics
        </span>
        <button
          onClick={loadDashboardData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-xs font-semibold text-[#18342A] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#176B4D]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          {error}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="bg-white rounded-2xl p-5 border border-[#E8F6EC] shadow-xs hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500">{card.title}</span>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-extrabold text-[#18342A]">{card.value}</p>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#176B4D] group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pending Approvals Section */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8F6EC] shadow-xs mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-[#18342A]">Pending Parking Location Approvals</h2>
          </div>
          <Link
            to="/admin/parking"
            className="text-xs font-bold text-[#176B4D] hover:underline flex items-center gap-1"
          >
            View All Parking <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingLocations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm font-semibold text-gray-500">No pending approvals at present.</p>
            <p className="text-xs text-gray-400 mt-1">All registered parking locations are reviewed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Location Name</th>
                  <th className="py-3 px-4">City / Area</th>
                  <th className="py-3 px-4">Total Slots</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingLocations.slice(0, 5).map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#18342A]">{loc.name}</td>
                    <td className="py-3.5 px-4 text-gray-600">{loc.city}, {loc.area}</td>
                    <td className="py-3.5 px-4 text-gray-600 font-semibold">{loc.totalSlots} slots</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                        {loc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to="/admin/parking"
                        className="px-3 py-1.5 bg-[#176B4D] hover:bg-[#12543c] text-white text-[11px] font-bold rounded-xl shadow-xs transition-all"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Administrative Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#E8F6EC]/50 border border-[#72C98B]/30 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-[#18342A] mb-1">User Audit Console</h3>
          <p className="text-xs text-gray-600 mb-3">View registered drivers, owners, staff, and system admins.</p>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#176B4D] hover:underline"
          >
            Manage Users <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-[#18342A] mb-1">Platform Bookings Audit</h3>
          <p className="text-xs text-gray-600 mb-3">Monitor active reservations and past parking sessions.</p>
          <Link
            to="/admin/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline"
          >
            View Bookings <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-purple-50/50 border border-purple-200/50 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-[#18342A] mb-1">Financial Transactions</h3>
          <p className="text-xs text-gray-600 mb-3">Audit wallet top-ups, booking charges, and refunds.</p>
          <Link
            to="/admin/payments"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:underline"
          >
            View Transactions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};
