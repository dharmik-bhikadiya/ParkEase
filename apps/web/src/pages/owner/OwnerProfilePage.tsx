import React from 'react';
import { UserIcon, Mail, Phone, ShieldCheck, Building2 } from 'lucide-react';
import { OwnerLayout } from '../../components/owner/OwnerLayout';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';

export const OwnerProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <OwnerLayout
      title="Owner Account & Settings"
      subtitle="View your business administrator profile, account credentials, and platform role."
    >
      <div className="max-w-2xl space-y-6">
        <Card className="p-6 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-6">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
            <div className="w-16 h-16 rounded-3xl bg-[#E8F6EC] text-[#176B4D] font-black flex items-center justify-center text-2xl shadow-xs">
              {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'PO'}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#18342A]">{user?.fullName || 'Parking Owner'}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wide mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> PARKING OWNER ROLE
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs font-medium">
            <div>
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <div className="flex items-center gap-2 p-3 bg-[#F7F9F5] rounded-xl border border-gray-200 text-[#18342A] font-bold">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <span>{user?.fullName || 'Not specified'}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2 p-3 bg-[#F7F9F5] rounded-xl border border-gray-200 text-[#18342A] font-bold">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{user?.email || 'Not specified'}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                Mobile Phone Number
              </label>
              <div className="flex items-center gap-2 p-3 bg-[#F7F9F5] rounded-xl border border-gray-200 text-[#18342A] font-bold">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{user?.phoneNumber || 'Not specified'}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                Account ID / Identifier
              </label>
              <div className="flex items-center gap-2 p-3 bg-[#F7F9F5] rounded-xl border border-gray-200 font-mono text-gray-600">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span>{user?.id || '—'}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </OwnerLayout>
  );
};
