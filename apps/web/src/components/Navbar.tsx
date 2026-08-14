import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, User as UserIcon, LogOut, Search, Building2, ShieldCheck, Calendar, Wallet as WalletIcon, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ParkEaseAnimatedLogo } from './brand/ParkEaseAnimatedLogo';
import { UserRole } from '@parkease/shared';
import { walletApi } from '../api/walletApi';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      walletApi.getWallet().then((w) => setWalletBalance(w.balance)).catch(() => {});
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isOwner = user && [UserRole.PARKING_OWNER, UserRole.PARKING_STAFF, UserRole.STAFF, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role as any);
  const isAdmin = user && [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role as any);

  return (
    <header className="sticky top-0 z-50 bg-[#F7F9F5]/90 backdrop-blur-md border-b border-[#E8F6EC] px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <ParkEaseAnimatedLogo size={42} variant="symbol" />
          <span className="text-2xl font-black text-[#18342A] tracking-tight">
            Park<span className="text-[#176B4D]">Ease</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#18342A]">
          <Link to="/find-parking" className="relative py-1 flex items-center gap-1.5 hover:text-[#176B4D] transition-colors">
            <Search className="w-4 h-4 text-[#176B4D]" /> Find Parking
          </Link>

          {user && (
            <>
              <Link to="/bookings" className="relative py-1 flex items-center gap-1.5 hover:text-[#176B4D] transition-colors">
                <Calendar className="w-4 h-4 text-[#176B4D]" /> My Bookings
              </Link>
              <Link to="/wallet" className="relative py-1 flex items-center gap-1.5 hover:text-[#176B4D] transition-colors">
                <WalletIcon className="w-4 h-4 text-[#176B4D]" /> Wallet
                {walletBalance !== null && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ₹{walletBalance.toFixed(0)}
                  </span>
                )}
              </Link>
            </>
          )}

          {isOwner && (
            <>
              <Link to="/owner/dashboard" className="relative py-1 flex items-center gap-1.5 hover:text-[#176B4D] transition-colors">
                <Building2 className="w-4 h-4 text-[#176B4D]" /> Owner Hub
              </Link>
              <Link to="/staff/gate-scan" className="relative py-1 flex items-center gap-1.5 hover:text-[#176B4D] transition-colors">
                <QrCode className="w-4 h-4 text-[#176B4D]" /> Gate Scanner
              </Link>
            </>
          )}

          {isAdmin && (
            <Link to="/admin/parking" className="relative py-1 flex items-center gap-1.5 hover:text-[#176B4D] transition-colors">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Admin Approvals
            </Link>
          )}

          {user && (
            <>
              <Link to="/vehicles" className="relative py-1 flex items-center gap-1.5 hover:text-[#176B4D] transition-colors">
                <Car className="w-4 h-4 text-[#176B4D]" /> Vehicles
              </Link>
              <Link to="/profile" className="relative py-1 flex items-center gap-1.5 hover:text-[#176B4D] transition-colors">
                <UserIcon className="w-4 h-4 text-[#176B4D]" /> Profile
              </Link>
            </>
          )}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-[#E8F6EC] text-[#176B4D] border border-[#72C98B]/30">
                {user.role}
              </span>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-[#18342A]">{user.fullName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-[#176B4D] hover:text-[#12543c] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#176B4D] hover:bg-[#12543c] rounded-xl shadow-sm transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
