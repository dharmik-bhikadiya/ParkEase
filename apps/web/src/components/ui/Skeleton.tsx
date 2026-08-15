import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 rounded-md',
    rectangular: 'rounded-2xl',
    circular: 'rounded-full',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'skeleton-shimmer bg-gray-200/80',
          variantStyles[variant],
          className
        )
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3 w-full">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs">
        <Skeleton variant="circular" className="w-8 h-8 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/3 h-4" />
          <Skeleton variant="text" className="w-1/2 h-3" />
        </div>
        <Skeleton variant="rectangular" className="w-20 h-8 shrink-0" />
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <Skeleton variant="circular" className="w-10 h-10" />
          <Skeleton variant="rectangular" className="w-16 h-6" />
        </div>
        <Skeleton variant="text" className="w-3/4 h-5" />
        <Skeleton variant="text" className="w-1/2 h-4" />
        <Skeleton variant="rectangular" className="w-full h-10 mt-4" />
      </div>
    ))}
  </div>
);
