import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Search, RefreshCw, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole } from '@parkease/shared';

interface AdminUsersPageProps {
  initialRoleFilter?: string;
  titleOverride?: string;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ initialRoleFilter, titleOverride }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRole = initialRoleFilter || searchParams.get('role') || 'ALL';
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Deletion Modal State
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);

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

  const handleDeleteUser = async () => {
    if (!selectedUserForDelete) return;
    setIsDeleting(true);
    setDeleteModalError(null);
    try {
      await adminApi.deleteUser(selectedUserForDelete.id);
      setSelectedUserForDelete(null);
      await fetchUsers();
    } catch (err: any) {
      setDeleteModalError(err.message || 'Failed to delete user account.');
    } finally {
      setIsDeleting(false);
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
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const isCurrentAdminSelf = u.id === currentAdmin?.id;

                  return (
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
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedUserForDelete(u)}
                          disabled={isCurrentAdminSelf}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isCurrentAdminSelf
                              ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                              : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 shadow-2xs'
                          }`}
                          title={isCurrentAdminSelf ? 'Cannot delete your active Admin account here' : `Delete ${u.fullName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Delete User Confirmation Modal */}
      {selectedUserForDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-red-100 shadow-2xl space-y-6">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-[#18342A]">Delete User Account?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-red-700">{selectedUserForDelete.fullName}</strong> (<span className="font-mono">{selectedUserForDelete.email}</span>)?
              </p>
              <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                All associated user data (vehicles, wallet, bookings, passes) will be removed permanently.
              </p>
            </div>

            {deleteModalError && (
              <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {deleteModalError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedUserForDelete(null);
                  setDeleteModalError(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
