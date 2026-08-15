import React, { useState, useEffect } from 'react';
import { Users, Building2, Mail, Phone, Info } from 'lucide-react';
import { OwnerLayout } from '../../components/owner/OwnerLayout';
import { Card } from '../../components/ui/Card';
import { apiClient } from '../../api/client';

interface OwnerStaffMember {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  assignedLocationName?: string;
  assignedLocationId?: string;
  status?: string;
}

export const OwnerStaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<OwnerStaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        // Fetch staff members associated with owner's locations
        const res = await apiClient.get('/users/me/staff');
        if (res.data?.data) {
          setStaffList(res.data.data);
        }
      } catch {
        // API fallback if endpoint returns empty or is not configured
        setStaffList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  return (
    <OwnerLayout
      title="Parking Staff Management"
      subtitle="View and manage operational staff members assigned to your parking locations."
    >
      <div className="space-y-6">
        {/* Information Banner */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
          <Info className="w-5 h-5 text-[#176B4D] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm mb-0.5">Staff Assignment Control</span>
            Parking staff members handle live barrier gate entry/exit verification and slot occupancy at your assigned parking hubs.
          </div>
        </div>

        {/* Staff Cards Grid / Empty State */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-xs text-gray-500 font-medium">Loading staff members...</p>
          </div>
        ) : staffList.length === 0 ? (
          <Card className="p-12 text-center space-y-4 bg-white rounded-3xl border border-dashed border-gray-300">
            <Users className="w-12 h-12 text-gray-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#18342A]">No Staff Assigned</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                No staff members are currently assigned to your parking locations. Contact platform administration to invite or assign parking gate operators.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffList.map((member) => (
              <Card
                key={member.id}
                className="p-5 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#E8F6EC] text-[#176B4D] font-black flex items-center justify-center text-sm">
                    {member.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#18342A] text-sm">{member.fullName}</h4>
                    <span className="text-[10px] font-extrabold text-[#176B4D] bg-[#E8F6EC] px-2 py-0.5 rounded-full inline-block mt-0.5">
                      PARKING STAFF
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{member.email}</span>
                  </div>
                  {member.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{member.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[#18342A] font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-[#176B4D]" />
                    <span>{member.assignedLocationName || 'All Owner Hubs'}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};
