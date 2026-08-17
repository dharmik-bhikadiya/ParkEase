import React from 'react';

export interface ParkEaseAnimatedLogoProps {
  className?: string;
  size?: number; // height of emblem/logo in px
  variant?: 'full' | 'symbol' | 'symbol-only';
  showSubtitle?: boolean;
  animated?: boolean;
}

/**
 * Official ParkEase Logo Component.
 * Renders the exact high-resolution original ParkEase 3D 'P' emblem and official brand typography PNG assets.
 */
export const ParkEaseAnimatedLogo: React.FC<ParkEaseAnimatedLogoProps> = ({
  className = '',
  size = 42,
  variant = 'symbol',
  showSubtitle: _showSubtitle = true,
  animated = false,
}) => {
  if (variant === 'symbol-only') {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src="/parkease-symbol.png"
          alt="ParkEase Emblem"
          style={{ height: size, width: 'auto' }}
          className={`object-contain transition-transform duration-300 ${
            animated ? 'hover:scale-105 filter drop-shadow-md' : ''
          }`}
        />
      </div>
    );
  }

  if (variant === 'symbol') {
    return (
      <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
        {/* 3D 'P' Emblem Symbol */}
        <img
          src="/parkease-symbol.png"
          alt="ParkEase Emblem"
          style={{ height: size, width: 'auto' }}
          className={`object-contain transition-transform duration-300 ${
            animated ? 'hover:scale-105 filter drop-shadow-md' : ''
          }`}
        />
        {/* Official Stylized ParkEase Brand Typography Image */}
        <img
          src="/parkease-text-logo.png"
          alt="ParkEase"
          style={{ height: Math.round(size * 0.82), width: 'auto' }}
          className="object-contain"
        />
      </div>
    );
  }

  // Full Logo Variant
  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <img
        src="/parkease-logo.png"
        alt="ParkEase - PARK • BOOK • MOVE"
        style={{ height: size, width: 'auto' }}
        className={`object-contain transition-transform duration-300 ${
          animated ? 'hover:scale-102 filter drop-shadow-md' : ''
        }`}
      />
    </div>
  );
};
