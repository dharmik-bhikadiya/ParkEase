import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  MapPin,
  Calendar,
  CreditCard,
  BarChart3,
  User as UserIcon,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ParkEaseAnimatedLogo } from '../brand/ParkEaseAnimatedLogo';

import { UserProfileDropdown } from '../ui/UserProfileDropdown';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navSections = [
    {
      group: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      group: 'MANAGEMENT',
      items: [
        { label: 'Users', path: '/admin/users', icon: Users },
        { label: 'Owners', path: '/admin/owners', icon: Building2 },
        { label: 'Staff', path: '/admin/staff', icon: UserCheck },
        { label: 'Parking', path: '/admin/parking', icon: MapPin },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        { label: 'Bookings', path: '/admin/bookings', icon: Calendar },
      ],
    },
    {
      group: 'FINANCE',
      items: [
        { label: 'Payments', path: '/admin/payments', icon: CreditCard },
      ],
    },
    {
      group: 'ANALYTICS',
      items: [
        { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { label: 'Profile', path: '/admin/profile', icon: UserIcon },
        { label: 'Main Site (Home)', path: '/', icon: Globe },
      ],
    },
  ];

  const bottomNavItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Parking', path: '/admin/parking', icon: MapPin },
    { label: 'Bookings', path: '/admin/bookings', icon: Calendar },
  ];

  const isActivePath = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] flex flex-col font-sans antialiased text-[#18342A]">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#F7F9F5]/90 backdrop-blur-md border-b border-[#E8F6EC] px-4 md:px-8 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & ADMIN Badge */}
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2.5 group">
              <ParkEaseAnimatedLogo size={36} variant="symbol" />
              <span className="text-xl font-black text-[#18342A] tracking-tight">
                Park<span className="text-[#176B4D]">Ease</span>
              </span>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-[#E8F6EC] text-[#176B4D] border border-[#72C98B] uppercase tracking-wide shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#176B4D]" /> ADMIN
            </span>
          </div>

          {/* Right Section: Main Site Button, Notifications, Admin Badge, Profile, Logout */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#176B4D] hover:bg-[#E8F6EC] rounded-xl transition-all border border-[#72C98B]/40 shadow-2xs"
              title="Return to Main Platform / Home Page"
            >
              <Globe className="w-3.5 h-3.5 text-[#176B4D]" />
              <span className="hidden sm:inline">Go to Home</span>
            </Link>

            <div className="relative hidden sm:block">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-[#176B4D] hover:bg-[#E8F6EC] rounded-xl transition-all cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500"></span>
              </button>
            </div>

            {user && (
              <UserProfileDropdown
                user={user}
                onLogout={handleLogout}
              />
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#18342A] hover:bg-[#E8F6EC] rounded-xl lg:hidden transition-all cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-[#E8F6EC] bg-white/70 py-6 px-4 shrink-0 min-h-[calc(100vh-61px)]">
          <nav className="space-y-6">
            {navSections.map((sec) => (
              <div key={sec.group}>
                <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-3 mb-2">
                  {sec.group}
                </h3>
                <div className="space-y-1">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          active
                            ? 'bg-[#E8F6EC] text-[#176B4D] font-bold shadow-xs'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-[#18342A]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-[#176B4D]' : 'text-gray-400'}`} />
                        <span className="flex-1">{item.label}</span>
                        {active && <ChevronRight className="w-3.5 h-3.5 text-[#176B4D]" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 className="text-2xl md:text-3xl font-extrabold text-[#18342A] tracking-tight">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-600 font-medium mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Mobile Slide-Over Menu (When Menu Button clicked) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-4/5 max-w-xs bg-white h-full p-6 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="font-extrabold text-sm text-[#18342A]">ADMIN NAVIGATION</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {navSections.map((sec) => (
                <div key={sec.group}>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{sec.group}</h4>
                  <div className="space-y-1">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActivePath(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                            active
                              ? 'bg-[#E8F6EC] text-[#176B4D] font-bold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-semibold rounded-xl text-xs"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sticky Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8F6EC] px-3 py-2 flex items-center justify-around shadow-lg">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                active ? 'text-[#176B4D] bg-[#E8F6EC]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-xl text-gray-400 hover:text-gray-600"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </div>
    </div>
  );
};
