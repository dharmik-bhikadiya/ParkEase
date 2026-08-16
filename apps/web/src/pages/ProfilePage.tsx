import React from 'react';
import { UserRole } from '@parkease/shared';
import { useAuth } from '../context/AuthContext';
import { DriverProfileView } from '../components/profile/DriverProfileView';
import { OwnerProfileView } from '../components/profile/OwnerProfileView';
import { StaffProfileView } from '../components/profile/StaffProfileView';
import { AdminProfileView } from '../components/profile/AdminProfileView';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case UserRole.PARKING_OWNER:
      return (
        <div className="min-h-[85vh] bg-[#F7F9F5] p-6 md:p-12">
          <OwnerProfileView />
        </div>
      );
    case UserRole.PARKING_STAFF:
    case UserRole.STAFF:
      return (
        <div className="min-h-[85vh] bg-[#F7F9F5] p-6 md:p-12">
          <StaffProfileView />
        </div>
      );
    case UserRole.ADMIN:
      return (
        <div className="min-h-[85vh] bg-[#F7F9F5] p-6 md:p-12">
          <AdminProfileView />
        </div>
      );
    case UserRole.DRIVER:
    default:
      return (
        <div className="min-h-[85vh] bg-[#F7F9F5] p-6 md:p-12">
          <DriverProfileView />
        </div>
      );
  }
};
