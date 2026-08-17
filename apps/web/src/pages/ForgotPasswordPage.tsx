import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { ParkEaseAnimatedLogo } from '../components/brand/ParkEaseAnimatedLogo';

export const ForgotPasswordPage: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await apiClient.post('/auth/forgot-password', { email_or_phone: emailOrPhone });
      setIsSubmitted(true);
      if (res.data?.data?.reset_token) {
        setResetToken(res.data.data.reset_token);
      }
    } catch (err: any) {
      setError(err.message || 'Request failed. Please try again.');
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
              <ParkEaseAnimatedLogo size={52} variant="full" />
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-[#18342A] mb-2 tracking-tight">Forgot Password</h1>
          <p className="text-sm text-gray-600">Enter your registered email or mobile to receive password reset instructions</p>
        </div>

        {isSubmitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#E8F6EC] text-[#176B4D] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-[#18342A]">Instructions Dispatched</h3>
            <p className="text-sm text-gray-600">
              If an account is associated with <span className="font-semibold text-[#18342A]">{emailOrPhone}</span>, password reset details have been sent.
            </p>

            {resetToken && (
              <div className="mt-4 p-4 bg-[#E8F6EC] rounded-2xl border border-[#72C98B]/30 text-left">
                <p className="text-xs font-semibold text-[#176B4D] uppercase tracking-wider mb-1">
                  Development Mock Token Notice
                </p>
                <p className="text-xs text-gray-700 mb-3">
                  In local dev environment without live SMTP/SMS providers, your reset link token is:
                </p>
                <button
                  onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                  className="w-full py-2 bg-[#176B4D] text-white text-xs font-semibold rounded-xl hover:bg-[#12543c] transition-all"
                >
                  Proceed to Reset Password Screen
                </button>
              </div>
            )}

            <div className="pt-4">
              <Link to="/login" className="text-sm font-semibold text-[#176B4D] hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#176B4D] hover:bg-[#12543c] text-white font-semibold rounded-2xl shadow-lg shadow-[#176B4D]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-6"
              >
                {isSubmitting ? 'Sending Request...' : 'Send Reset Link'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            <div className="mt-8 text-center border-t border-gray-100 pt-6">
              <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-[#18342A]">
                Remembered your password? <span className="text-[#176B4D] hover:underline">Sign In</span>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
