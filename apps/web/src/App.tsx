import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingPage } from './routes/AppRoutes';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { VehiclesPage } from './pages/VehiclesPage';

// Pages
import { FindParkingPage } from './pages/FindParkingPage';
import { ParkingDetailsPage } from './pages/ParkingDetailsPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { WalletPage } from './pages/WalletPage';

// Owner Sub-pages
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { OwnerLocationsPage } from './pages/owner/OwnerLocationsPage';
import { AddParkingPage } from './pages/AddParkingPage';
import { OwnerSlotManagementPage } from './pages/OwnerSlotManagementPage';
import { OwnerBookingsPage } from './pages/owner/OwnerBookingsPage';
import { OwnerStaffPage } from './pages/owner/OwnerStaffPage';
import { OwnerRevenuePage } from './pages/owner/OwnerRevenuePage';
import { OwnerProfilePage } from './pages/owner/OwnerProfilePage';

// Staff Sub-pages
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage';
import { StaffGateScanPage } from './pages/StaffGateScanPage';
import { StaffSessionsPage } from './pages/staff/StaffSessionsPage';
import { StaffSlotsPage } from './pages/staff/StaffSlotsPage';
import { StaffProfilePage } from './pages/staff/StaffProfilePage';

// Admin Sub-pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminParkingPage } from './pages/AdminParkingPage';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { UserRole } from '@parkease/shared';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isDedicatedLayout =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/owner') ||
    location.pathname.startsWith('/staff');

  return (
    <div className="min-h-screen bg-[#F7F9F5] flex flex-col font-sans">
      {!isDedicatedLayout && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/find-parking" element={<FindParkingPage />} />
          <Route path="/parking/:id" element={<ParkingDetailsPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <ProtectedRoute>
                <VehiclesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            }
          />

          {/* Owner Sub-routes */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <OwnerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <OwnerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/locations"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <OwnerLocationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/parking/new"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <AddParkingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/parking/:id/slots"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <OwnerSlotManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/bookings"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <OwnerBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/staff"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <OwnerStaffPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/revenue"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <OwnerRevenuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/profile"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <OwnerProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Staff Sub-routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_STAFF, UserRole.STAFF, UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_STAFF, UserRole.STAFF, UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/gate-scan"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_STAFF, UserRole.STAFF, UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <StaffGateScanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/sessions"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_STAFF, UserRole.STAFF, UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <StaffSessionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/slots"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_STAFF, UserRole.STAFF, UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <StaffSlotsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/profile"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARKING_STAFF, UserRole.STAFF, UserRole.PARKING_OWNER, UserRole.ADMIN]}>
                <StaffProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Dedicated Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/owners"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminUsersPage initialRoleFilter="PARKING_OWNER" titleOverride="Parking Owners Audit" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminUsersPage initialRoleFilter="PARKING_STAFF" titleOverride="Staff Members Audit" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/parking"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminParkingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminPaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isDedicatedLayout && (
        <footer className="bg-white border-t border-[#E8F6EC] py-8 text-center text-sm text-gray-500">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} ParkEase Inc. All rights reserved.</p>
            <div className="flex gap-6 text-[#18342A] font-medium">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">Contact Support</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
