import React, { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full space-y-1">
      {label && <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</label>}
      <input
        className={`w-full px-3.5 py-2.5 bg-[#F7F9F5] border border-gray-200 rounded-xl text-sm font-medium text-[#18342A] placeholder-gray-400 outline-none focus:border-[#176B4D] focus:bg-white transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
    </div>
  );
};
