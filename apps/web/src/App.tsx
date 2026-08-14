import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingPage } from './routes/AppRoutes';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { VehiclesPage } from './pages/VehiclesPage';

// Phase 2B, Phase 3, Phase 4 & Phase 5 Pages
import { FindParkingPage } from './pages/FindParkingPage';
import { ParkingDetailsPage } from './pages/ParkingDetailsPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { WalletPage } from './pages/WalletPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { AddParkingPage } from './pages/AddParkingPage';
import { OwnerSlotManagementPage } from './pages/OwnerSlotManagementPage';
import { AdminParkingPage } from './pages/AdminParkingPage';
import { StaffGateScanPage } from './pages/StaffGateScanPage';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#F7F9F5] flex flex-col font-sans">
        <Navbar />
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
            <Route
              path="/staff/gate-scan"
              element={
                <ProtectedRoute>
                  <StaffGateScanPage />
                </ProtectedRoute>
              }
            />

            {/* Owner & Admin Routes */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute>
                  <OwnerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/parking/new"
              element={
                <ProtectedRoute>
                  <AddParkingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/parking/:id/slots"
              element={
                <ProtectedRoute>
                  <OwnerSlotManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/parking"
              element={
                <ProtectedRoute>
                  <AdminParkingPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
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
      </div>
    </AuthProvider>
  );
};

export default App;
