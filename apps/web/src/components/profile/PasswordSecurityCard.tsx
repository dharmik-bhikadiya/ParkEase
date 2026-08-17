import React, { useState } from 'react';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const PasswordSecurityCard: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const hasPassword = Boolean(
    user?.hasPassword ?? user?.has_password ?? (user?.authProvider !== 'google' && !user?.googleId)
  );

  // Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);

    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPwdError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/users/me/create-password', {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPwdSuccess('Password created successfully! You can now log in with either Google or Email & Password.');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (err: any) {
      setPwdError(err.message || 'Failed to create password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPwdError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.patch('/users/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPwdSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-white border border-[#E8F6EC] rounded-3xl shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <Lock className="w-5 h-5 text-[#176B4D]" />
        <h3 className="text-sm font-extrabold text-[#18342A]">Password & Security</h3>
      </div>

      {/* Google Account Status Badge */}
      {(user?.googleId || user?.google_id || user?.authProvider === 'google' || user?.auth_provider === 'google') && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Google Account Status</span>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">
            Connected
          </span>
        </div>
      )}

      {/* Password Status Banner */}
      {!hasPassword ? (
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
              <Lock className="w-4 h-4 text-amber-600" /> No Password Set
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
              Google Only
            </span>
          </div>
          <p className="text-[11px] text-amber-700 font-medium">
            You currently log in using Google. Set a password below to enable Email & Password login on your account.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Password Status</span>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">
            Password Set
          </span>
        </div>
      )}

      {/* Success & Error Banners */}
      {pwdSuccess && (
        <div className="p-3 rounded-xl bg-[#E8F6EC] text-[#176B4D] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {pwdSuccess}
        </div>
      )}
      {pwdError && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {pwdError}
        </div>
      )}

      {/* Form: Create Password OR Change Password */}
      {!hasPassword ? (
        <form onSubmit={handleCreatePassword} className="space-y-3.5 text-xs">
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-[#18342A] text-xs">Create ParkEase Password</h4>
            <p className="text-[11px] text-gray-500 font-medium">
              After setting a password, both Google Sign-In and Email + Password login will work for your account.
            </p>
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPwd ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] font-semibold text-gray-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPwd ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] font-semibold text-gray-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isSubmitting}
            fullWidth
            variant="primary"
            className="py-2.5"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" /> Create Password
          </Button>
        </form>
      ) : (
        <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPwd ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] font-semibold text-gray-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPwd ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] font-semibold text-gray-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPwd ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#72C98B] font-semibold text-gray-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isSubmitting}
            fullWidth
            variant="secondary"
            className="py-2.5"
          >
            <Lock className="w-3.5 h-3.5 mr-1.5" /> Change Password
          </Button>
        </form>
      )}
    </Card>
  );
};
