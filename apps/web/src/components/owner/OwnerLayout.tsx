import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Calendar,
  Users,
  CircleDollarSign,
  UserIcon,
  Globe,
  LogOut,
  Bell,
  ChevronRight,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ParkEaseAnimatedLogo } from '../brand/ParkEaseAnimatedLogo';

interface OwnerLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const OwnerLayout: React.FC<OwnerLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navSections = [
    {
      group: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/owner', icon: LayoutDashboard },
      ],
    },
    {
      group: 'MY PARKING',
      items: [
        { label: 'Locations', path: '/owner/locations', icon: Building2 },
        { label: 'Add Parking', path: '/owner/parking/new', icon: PlusCircle },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        { label: 'Bookings', path: '/owner/bookings', icon: Calendar },
        { label: 'Staff', path: '/owner/staff', icon: Users },
      ],
    },
    {
      group: 'FINANCE',
      items: [
        { label: 'Revenue', path: '/owner/revenue', icon: CircleDollarSign },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { label: 'Profile', path: '/owner/profile', icon: UserIcon },
        { label: 'Main Site (Home)', path: '/', icon: Globe },
      ],
    },
  ];

  const bottomNavItems = [
    { label: 'Dashboard', path: '/owner', icon: LayoutDashboard },
    { label: 'Locations', path: '/owner/locations', icon: Building2 },
    { label: 'Bookings', path: '/owner/bookings', icon: Calendar },
    { label: 'Revenue', path: '/owner/revenue', icon: CircleDollarSign },
  ];

  const isActivePath = (path: string) => {
    if (path === '/owner') {
      return location.pathname === '/owner' || location.pathname === '/owner/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] flex flex-col font-sans antialiased text-[#18342A]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8F6EC] px-4 md:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-[#E8F6EC]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/owner" className="flex items-center gap-2.5 group">
              <ParkEaseAnimatedLogo size={36} variant="symbol" />
              <span className="text-xl font-black text-[#18342A] tracking-tight">
                Park<span className="text-[#176B4D]">Ease</span>
              </span>
            </Link>

            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wide">
              <Shield className="w-3.5 h-3.5 text-emerald-700" /> OWNER HUB
            </span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#176B4D] hover:bg-[#E8F6EC] rounded-xl transition-all border border-[#72C98B]/40 shadow-2xs"
              title="Return to Main Customer Platform"
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
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-[#18342A] leading-tight">
                    {user.fullName || 'Parking Owner'}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold transition-all cursor-pointer"
                  title="Sign out of Owner Hub"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-600" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop Sidebar */}
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

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full p-6 space-y-6 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <ParkEaseAnimatedLogo size={32} variant="symbol" />
                    <span className="font-black text-lg text-[#18342A]">Owner Hub</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <nav className="space-y-4 pt-4">
                  {navSections.map((sec) => (
                    <div key={sec.group}>
                      <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-3 mb-1">
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
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                active
                                  ? 'bg-[#E8F6EC] text-[#176B4D] font-bold'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${active ? 'text-[#176B4D]' : 'text-gray-400'}`} />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-50 text-red-700 font-bold rounded-xl flex items-center justify-center gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 lg:pb-8">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 className="text-2xl md:text-3xl font-black text-[#18342A] tracking-tight">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8F6EC] px-4 py-2 flex justify-around items-center shadow-lg">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                active ? 'text-[#176B4D] font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-[#176B4D]' : 'text-gray-400'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
