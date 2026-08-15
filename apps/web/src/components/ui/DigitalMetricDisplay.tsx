import React from 'react';

interface DigitalMetricDisplayProps {
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: 'emerald' | 'dark' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'giant';
  className?: string;
}

export const DigitalMetricDisplay: React.FC<DigitalMetricDisplayProps> = ({
  label,
  value,
  subtitle,
  variant = 'emerald',
  size = 'lg',
  className = '',
}) => {
  const numberVariantClass =
    variant === 'white'
      ? 'digital-clock-number-white'
      : variant === 'dark'
      ? 'digital-clock-number-dark'
      : 'digital-clock-number';

  const sizeClasses = {
    sm: 'text-2xl sm:text-3xl',
    md: 'text-3xl sm:text-4xl',
    lg: 'text-4xl sm:text-5xl',
    xl: 'text-5xl sm:text-6xl',
    giant: 'text-6xl sm:text-7xl md:text-8xl',
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Small Uppercase Label */}
      <span className="digital-clock-label text-[10px] sm:text-xs text-emerald-700/80 dark:text-emerald-400/90 mb-1">
        {label}
      </span>

      {/* Primary Oversized Digital Clock Style Number */}
      <div className={`${sizeClasses[size]} ${numberVariantClass} tracking-tighter select-none my-0.5`}>
        {value}
      </div>

      {/* Optional Subtitle */}
      {subtitle && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          {subtitle}
        </span>
      )}
    </div>
  );
};
