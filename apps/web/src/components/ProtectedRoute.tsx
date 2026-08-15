import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@parkease/shared';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#176B4D]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user.role as UserRole);
    if (!hasRole) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-bold text-[#18342A] mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You do not have permission to view this page.</p>
          <a href="/profile" className="px-6 py-2.5 bg-[#176B4D] text-white rounded-xl font-medium shadow-sm hover:bg-[#12543c] transition-all">
            Return to Profile
          </a>
        </div>
      );
    }
  }

  return children;
};
