import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@parkease/shared';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        fullName,
        email,
        phoneNumber,
        password,
        confirmPassword,
        role,
      });
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify input data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F9F5] flex items-center justify-center p-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-white rounded-3xl p-8 border border-[#E8F6EC] shadow-xl shadow-[#176B4D]/5"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#18342A] mb-2 tracking-tight">Create ParkEase Account</h1>
          <p className="text-sm text-gray-600">Join ParkEase to reserve slots and manage vehicles effortlessly</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-6">
          <GoogleSignInButton onError={(msg) => setError(msg)} text="Sign up with Google" />

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Or register with email
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#72C98B] focus:border-transparent text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#72C98B] focus:border-transparent text-sm font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#72C98B] focus:border-transparent text-sm font-medium transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
              Account Role
            </label>
            <div className="relative">
              <Shield className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#72C98B] focus:border-transparent text-sm font-medium bg-white transition-all"
              >
                <option value={UserRole.USER}>Driver / Regular User</option>
                <option value={UserRole.PARKING_OWNER}>Parking Location Owner</option>
                <option value={UserRole.PARKING_STAFF}>Parking Field Staff</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#72C98B] focus:border-transparent text-sm font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18342A] uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#72C98B] focus:border-transparent text-sm font-medium transition-all"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 pt-1">
            Password must be at least 8 characters with 1 uppercase letter, 1 lowercase letter & 1 number.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#176B4D] hover:bg-[#12543c] text-white font-semibold rounded-2xl shadow-lg shadow-[#176B4D]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-6"
          >
            {isSubmitting ? 'Registering...' : 'Register Account'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#176B4D] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
