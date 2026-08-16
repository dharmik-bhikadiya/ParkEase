import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminProfileView } from '../../components/profile/AdminProfileView';

export const AdminProfilePage: React.FC = () => {
  return (
    <AdminLayout
      title="Platform Administrator Profile"
      subtitle="Super-administrator account authority, platform telemetry summary, and system tools."
    >
      <AdminProfileView />
    </AdminLayout>
  );
};
