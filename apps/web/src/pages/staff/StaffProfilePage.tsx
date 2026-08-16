import React from 'react';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { StaffProfileView } from '../../components/profile/StaffProfileView';

export const StaffProfilePage: React.FC = () => {
  return (
    <StaffLayout
      title="Staff Gate Operations & Credentials"
      subtitle="View your gate pass authorization details, duty quick tools, and account security."
    >
      <StaffProfileView />
    </StaffLayout>
  );
};
