import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Search, RefreshCw } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { User, UserRole } from '@parkease/shared';

interface AdminUsersPageProps {
  initialRoleFilter?: string;
  titleOverride?: string;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ initialRoleFilter, titleOverride }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRole = initialRoleFilter || searchParams.get('role') || 'ALL';

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsers(activeRole === 'ALL' ? undefined : activeRole);
      setUsers(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch user accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeRole]);

  const handleRoleChange = (role: string) => {
    if (role === 'ALL') {
      searchParams.delete('role');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ role });
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phoneNumber || '').toLowerCase().includes(q)
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case UserRole.PARKING_OWNER:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case UserRole.PARKING_STAFF:
      case UserRole.STAFF:
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AdminLayout
      title={titleOverride || (activeRole === 'PARKING_OWNER' ? 'Parking Owners' : activeRole === 'PARKING_STAFF' ? 'Staff Members' : 'User Accounts')}
      subtitle="Audit and view registered drivers, owners, staff, and system administrators."
    >
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8F6EC] shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or mobile..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#72C98B]"
          />
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { label: 'All Users', key: 'ALL' },
            { label: 'Drivers', key: 'USER' },
            { label: 'Owners', key: 'PARKING_OWNER' },
            { label: 'Staff', key: 'PARKING_STAFF' },
            { label: 'Admins', key: 'ADMIN' },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => handleRoleChange(pill.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeRole === pill.key
                  ? 'bg-[#176B4D] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {pill.label}
            </button>
          ))}

          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-[#176B4D] hover:bg-gray-100 rounded-xl transition-all"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-[#E8F6EC] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-[#176B4D] mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">Loading user accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-600">No user accounts found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Mobile</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-[#18342A]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#E8F6EC] text-[#176B4D] font-black flex items-center justify-center text-xs">
                          {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span>{u.fullName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-medium">{u.email}</td>
                    <td className="py-4 px-6 text-gray-600 font-medium">{u.phoneNumber || 'N/A'}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-[10px] text-gray-400">
                      {u.id.substring(0, 8)}...
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
