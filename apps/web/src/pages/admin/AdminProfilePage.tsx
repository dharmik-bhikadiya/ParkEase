import React from 'react';
import { ShieldCheck, Mail, Phone } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

export const AdminProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <AdminLayout
      title="Administrator Profile"
      subtitle="Your active administrator security credential details."
    >
      <div className="max-w-xl bg-white rounded-3xl p-8 border border-[#E8F6EC] shadow-xs">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#176B4D] text-white font-black text-2xl flex items-center justify-center shadow-md">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-[#18342A]">{user?.fullName || 'Administrator'}</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                <ShieldCheck className="w-3 h-3 text-emerald-700" /> ADMIN
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4 text-xs font-semibold">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50">
            <Mail className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p>
              <p className="text-gray-800">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50">
            <Phone className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Mobile Contact</p>
              <p className="text-gray-800">{user?.phoneNumber || 'Not configured'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Privilege Authority Level</p>
              <p className="text-emerald-800 font-extrabold">ADMIN (Highest Platform Administrator)</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
