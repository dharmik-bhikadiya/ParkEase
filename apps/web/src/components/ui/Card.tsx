import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'soft' | 'bordered' | 'ticket' | 'financial' | 'operational' | 'feature' | 'location';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  hoverEffect = false,
  ...props
}) => {
  const baseStyles = 'bg-white transition-all duration-200';

  const variants = {
    default: 'rounded-2xl p-6 shadow-xs border border-[#E8F6EC]',
    soft: 'bg-[#F7F9F5] rounded-2xl p-6 border border-gray-200/80',
    bordered: 'border-2 border-[#176B4D]/20 rounded-2xl p-6 shadow-none',
    ticket: 'rounded-2xl p-6 shadow-sm border border-[#E8F6EC] border-l-4 border-l-[#176B4D] relative overflow-hidden',
    financial: 'rounded-2xl p-6 bg-gradient-to-br from-[#18342A] via-[#176B4D] to-[#12543c] text-white shadow-md border border-[#72C98B]/30 relative overflow-hidden',
    operational: 'rounded-xl p-5 bg-white border border-gray-200 shadow-2xs',
    feature: 'rounded-2xl p-6 bg-white border border-[#E8F6EC] bg-parking-grid relative',
    location: 'rounded-2xl p-5 bg-white border border-[#E8F6EC] hover:border-[#72C98B] shadow-xs',
  };

  const hoverStyles = hoverEffect ? 'hover:shadow-md hover:-translate-y-0.5 transition-all' : '';

  return (
    <div
      className={twMerge(clsx(baseStyles, variants[variant], hoverStyles, className))}
      {...props}
    >
      {children}
    </div>
  );
};
