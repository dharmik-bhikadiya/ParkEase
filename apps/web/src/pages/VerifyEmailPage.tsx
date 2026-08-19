import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ParkEaseAnimatedLogo } from '../components/brand/ParkEaseAnimatedLogo';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Resend Cooldown Countdown (60 seconds)
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifyEmail, resendVerification, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in and verified
  useEffect(() => {
    if (user?.is_verified || user?.isVerified) {
      navigate('/profile');
    }
  }, [user, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Mask email for privacy (e.g. dhar***@gmail.com)
  const maskEmail = (str: string) => {
    if (!str || !str.includes('@')) return str;
    const [name, domain] = str.split('@');
    if (name.length <= 3) {
      return `${name.charAt(0)}***@${domain}`;
    }
    return `${name.slice(0, 3)}***@${domain}`;
  };

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle single character digit input
  const handleChange = (index: number, value: string) => {
    setError(null);
    setResendMessage(null);
    const digit = value.replace(/\D/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input field
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleVerify(fullOtp);
      }
    }
  };

  // Handle backspace key navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle paste listener for 6-digit code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    setResendMessage(null);
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const digits = pasteData.split('');
    const newOtp = [...otp];
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);

    // Focus last pasted input or next empty input
    const focusIndex = Math.min(digits.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (pasteData.length === 6) {
      handleVerify(pasteData);
    }
  };

  // Execute OTP Verification
  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join('');
    setError(null);
    setResendMessage(null);

    if (!email) {
      setError('Please provide a valid email address.');
      return;
    }

    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsSubmitting(true);

    try {
      await verifyEmail(email, code);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Verification failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Resend OTP
  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setError(null);
    setResendMessage(null);
    setIsResending(true);

    try {
      await resendVerification(email);
      setResendMessage('A new 6-digit code has been sent to your email.');
      setCooldown(60);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to resend code. Please wait.';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F9F5] flex items-center justify-center p-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#E8F6EC] shadow-xl shadow-[#176B4D]/5 text-center"
      >
        <div className="flex justify-center mb-6">
          <Link to="/" title="ParkEase Home">
            <ParkEaseAnimatedLogo size={52} variant="full" />
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6"
            >
              <div className="w-16 h-16 bg-[#E8F6EC] text-[#176B4D] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#72C98B]">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <h2 className="text-2xl font-bold text-[#18342A] mb-2">Email Verified!</h2>
              <p className="text-sm text-gray-600 mb-6">
                Your ParkEase account is active and verified. Redirecting to profile...
              </p>
              <button
                onClick={() => navigate('/profile')}
                className="w-full py-3.5 bg-[#176B4D] text-white font-semibold rounded-2xl shadow-lg shadow-[#176B4D]/20 flex items-center justify-center gap-2"
              >
                Continue to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-14 h-14 bg-[#E8F6EC] text-[#176B4D] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#72C98B]/40">
                <Mail className="w-7 h-7" />
              </div>

              <h1 className="text-2xl font-bold text-[#18342A] mb-1.5">Verify Your Email</h1>
              <p className="text-sm text-gray-600 mb-6">
                We've sent a verification code to{' '}
                <span className="font-semibold text-[#18342A] inline-block">{maskEmail(email)}</span>.
                <span className="block mt-1 font-medium text-[#18342A]">Enter the 6-digit code from your email to verify your account.</span>
              </p>

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-xs text-left"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Resend Success Message */}
              {resendMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-[#176B4D] shrink-0" />
                  <span>{resendMessage}</span>
                </motion.div>
              )}

              {/* 6 Digit OTP Inputs */}
              <div className="flex justify-between gap-2 sm:gap-3 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold rounded-2xl border transition-all focus:outline-none ${
                      digit
                        ? 'border-[#176B4D] bg-[#E8F6EC]/30 text-[#176B4D] ring-2 ring-[#72C98B]/40'
                        : 'border-gray-200 focus:border-[#72C98B] focus:ring-2 focus:ring-[#72C98B]/30'
                    }`}
                  />
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={isSubmitting || otp.join('').length !== 6}
                className="w-full py-4 bg-[#176B4D] hover:bg-[#12543c] text-white font-semibold rounded-2xl shadow-lg shadow-[#176B4D]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mb-6"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying Code...
                  </span>
                ) : (
                  <>
                    Verify Email
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Resend Cooldown & Action */}
              <div className="text-center pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#176B4D] hover:underline disabled:opacity-50 disabled:no-underline transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
