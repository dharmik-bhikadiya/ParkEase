import React from 'react';
import { OwnerLayout } from '../../components/owner/OwnerLayout';
import { OwnerProfileView } from '../../components/profile/OwnerProfileView';

export const OwnerProfilePage: React.FC = () => {
  return (
    <OwnerLayout
      title="Owner Account & Settings"
      subtitle="Manage your parking business operations, facilities portfolio, and account credentials."
    >
      <OwnerProfileView />
    </OwnerLayout>
  );
};
