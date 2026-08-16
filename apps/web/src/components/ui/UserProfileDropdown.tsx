import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Calendar,
  Wallet as WalletIcon,
  Car,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Building2,
  Lock,
} from 'lucide-react';
import { User, UserRole } from '@parkease/shared';

export interface UserProfileDropdownProps {
  user: User;
  walletBalance?: number | null;
  onLogout: () => Promise<void>;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  user,
  walletBalance,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleItemClick = () => {
    setIsOpen(false);
  };

  const handleLogoutClick = async () => {
    setIsOpen(false);
    await onLogout();
    navigate('/login');
  };

  const isAdmin = user.role === UserRole.ADMIN;
  const isOwner = user.role === UserRole.PARKING_OWNER;

  return (
    <div ref={dropdownRef} className="relative inline-block text-left" onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pl-2 rounded-2xl bg-white border border-[#E8F6EC] hover:border-[#72C98B] shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#72C98B]/50"
      >
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-9 h-9 rounded-full object-cover border-2 border-[#72C98B]/50 shadow-2xs"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#E8F6EC] text-[#176B4D] font-extrabold flex items-center justify-center text-sm border border-[#72C98B]/40 shadow-2xs">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>

        <div className="text-left hidden sm:block">
          <p className="text-xs font-bold text-[#18342A] leading-tight truncate max-w-[120px]">
            {user.fullName}
          </p>
          <p className="text-[10px] font-semibold text-[#176B4D] uppercase tracking-wider">
            {user.role}
          </p>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#176B4D] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {/* Floating Animated Profile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2.5 w-64 z-50 bg-white/95 backdrop-blur-md rounded-3xl border border-[#E8F6EC] p-2 shadow-2xl shadow-[#176B4D]/15 focus:outline-none"
          >
            {/* Header Info */}
            <div className="p-3 bg-[#F7F9F5] rounded-2xl border border-[#E8F6EC] mb-1.5 flex items-center gap-3">
              <div className="relative shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-[#72C98B]"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#E8F6EC] text-[#176B4D] font-extrabold flex items-center justify-center text-base border border-[#72C98B]">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div className="overflow-hidden flex-1">
                <h4 className="text-sm font-extrabold text-[#18342A] truncate leading-tight">
                  {user.fullName}
                </h4>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#176B4D] text-white uppercase tracking-wider">
                    {user.role}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                    ● Active
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Links */}
            <div className="space-y-0.5 py-1">
              <Link
                to="/profile"
                onClick={handleItemClick}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#18342A] hover:bg-[#E8F6EC]/70 hover:text-[#176B4D] transition-colors"
              >
                <UserIcon className="w-4 h-4 text-[#176B4D]" /> My Profile
              </Link>

              {isAdmin ? (
                <Link
                  to="/admin"
                  onClick={handleItemClick}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#18342A] hover:bg-[#E8F6EC]/70 hover:text-[#176B4D] transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Admin Console
                </Link>
              ) : isOwner ? (
                <Link
                  to="/owner"
                  onClick={handleItemClick}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#18342A] hover:bg-[#E8F6EC]/70 hover:text-[#176B4D] transition-colors"
                >
                  <Building2 className="w-4 h-4 text-[#176B4D]" /> Owner Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/bookings"
                    onClick={handleItemClick}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#18342A] hover:bg-[#E8F6EC]/70 hover:text-[#176B4D] transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-[#176B4D]" /> My Bookings
                  </Link>

                  <Link
                    to="/wallet"
                    onClick={handleItemClick}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#18342A] hover:bg-[#E8F6EC]/70 hover:text-[#176B4D] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <WalletIcon className="w-4 h-4 text-[#176B4D]" /> ParkEase Wallet
                    </div>
                    {walletBalance !== undefined && walletBalance !== null && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ₹{walletBalance.toFixed(0)}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/vehicles"
                    onClick={handleItemClick}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#18342A] hover:bg-[#E8F6EC]/70 hover:text-[#176B4D] transition-colors"
                  >
                    <Car className="w-4 h-4 text-[#176B4D]" /> My Vehicles
                  </Link>
                </>
              )}

              <Link
                to="/profile"
                onClick={handleItemClick}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#18342A] hover:bg-[#E8F6EC]/70 hover:text-[#176B4D] transition-colors"
              >
                <Lock className="w-4 h-4 text-[#176B4D]" /> Security & Password
              </Link>
            </div>

            {/* Divider */}
            <div className="my-1 border-t border-gray-100" />

            {/* Logout Action */}
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
