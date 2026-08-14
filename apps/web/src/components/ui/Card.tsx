import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'soft' | 'bordered';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  hoverEffect = true,
  ...props
}) => {
  const baseStyles = 'bg-white rounded-3xl p-6 transition-all duration-300';
  
  const variants = {
    default: 'shadow-soft-md border border-parkease-border/60',
    soft: 'bg-parkease-soft/60 border border-parkease-primary/20',
    bordered: 'border-2 border-parkease-border shadow-none',
  };

  const hoverStyles = hoverEffect ? 'hover:shadow-soft-lg hover:-translate-y-1' : '';

  return (
    <div
      className={twMerge(clsx(baseStyles, variants[variant], hoverStyles, className))}
      {...props}
    >
      {children}
    </div>
  );
};
