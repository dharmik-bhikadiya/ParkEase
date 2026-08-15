import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { ParkEaseAnimatedLogo } from '../components/brand/ParkEaseAnimatedLogo';

export const LoginPage: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const loggedInUser = await login({ emailOrPhone, password });
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (loggedInUser.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (loggedInUser.role === 'PARKING_OWNER') {
        navigate('/owner/dashboard', { replace: true });
      } else if (loggedInUser.role === 'PARKING_STAFF' || loggedInUser.role === 'STAFF') {
        navigate('/staff/gate-scan', { replace: true });
      } else {
        navigate('/find-parking', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F9F5] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#E8F6EC] shadow-xl shadow-[#176B4D]/5"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Link to="/" className="inline-block transition-transform hover:scale-105" title="ParkEase Home">
              <ParkEaseAnimatedLogo size={54} variant="symbol" />
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-[#18342A] mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-gray-600">Sign in to manage your bookings and vehicles</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-6">
          <GoogleSignInButton onError={(msg) => setError(msg)} />

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Or continue with email
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-2">
              Email or Mobile Number
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="name@example.com or 9876543210"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#72C98B] focus:border-transparent text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-[#18342A] uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-[#176B4D] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#72C98B] focus:border-transparent text-sm font-medium transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#176B4D] hover:bg-[#12543c] text-white font-semibold rounded-2xl shadow-lg shadow-[#176B4D]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-6"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#176B4D] hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
