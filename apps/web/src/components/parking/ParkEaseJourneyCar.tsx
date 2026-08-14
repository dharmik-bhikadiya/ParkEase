import React from 'react';

export interface ParkEaseJourneyCarProps {
  className?: string;
  size?: number; // scale width
}

/**
 * High-fidelity top-view white luxury sedan vector graphic.
 * 100% crisp vector SVG without any image backgrounds, borders, or square frames.
 */
export const ParkEaseJourneyCar: React.FC<ParkEaseJourneyCarProps> = ({
  className = '',
  size = 48,
}) => {
  const aspect = 1.95; // height to width ratio for sleek sedan
  const width = size;
  const height = size * aspect;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 195"
      className={`select-none overflow-visible ${className}`}
      style={{ filter: 'drop-shadow(0px 6px 10px rgba(24, 52, 42, 0.22))' }}
    >
      <defs>
        {/* Dark Tint Glass Gradient */}
        <linearGradient id="sedanGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="50%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* White Body Metallic Highlights */}
        <linearGradient id="sedanBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="25%" stopColor="#FFFFFF" />
          <stop offset="75%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        {/* Tail Light Red Glow */}
        <radialGradient id="tailLightGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </radialGradient>
      </defs>

      {/* 1. SIDE MIRRORS */}
      {/* Left Mirror */}
      <path
        d="M 16 62 Q 8 62 10 74 Q 18 72 20 66 Z"
        fill="url(#sedanBodyGrad)"
        stroke="#CBD5E1"
        strokeWidth="1"
      />
      {/* Right Mirror */}
      <path
        d="M 84 62 Q 92 62 90 74 Q 82 72 80 66 Z"
        fill="url(#sedanBodyGrad)"
        stroke="#CBD5E1"
        strokeWidth="1"
      />

      {/* 2. MAIN AERODYNAMIC WHITE SEDAN BODY */}
      <path
        d="M 50 8 
           C 68 8, 80 20, 84 45 
           C 88 70, 87 130, 84 160 
           C 82 178, 70 188, 50 188 
           C 30 188, 18 178, 16 160 
           C 13 130, 12 70, 16 45 
           C 20 20, 32 8, 50 8 Z"
        fill="url(#sedanBodyGrad)"
        stroke="#CBD5E1"
        strokeWidth="1.8"
      />

      {/* 3. HOOD & TRUNK CONTOUR LINES */}
      <path d="M 28 36 C 36 28, 64 28, 72 36" fill="none" stroke="#E2E8F0" strokeWidth="1.2" />
      <path d="M 50 12 L 50 26" fill="none" stroke="#E2E8F0" strokeWidth="1" />

      {/* 4. FRONT WINDSHIELD */}
      <path
        d="M 26 48 C 36 43, 64 43, 74 48 L 78 68 C 66 65, 34 65, 22 68 Z"
        fill="url(#sedanGlassGrad)"
        stroke="#0F172A"
        strokeWidth="1"
      />
      {/* Windshield Wiper Details */}
      <path d="M 32 66 L 48 62" stroke="#64748B" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M 54 66 L 70 62" stroke="#64748B" strokeWidth="0.8" strokeLinecap="round" />

      {/* 5. CABIN / ROOF / PANORAMIC GLASS */}
      <path
        d="M 23 72 L 77 72 L 75 140 L 25 140 Z"
        fill="url(#sedanBodyGrad)"
        stroke="#CBD5E1"
        strokeWidth="1"
      />
      {/* Black Side Windows Line */}
      <path d="M 24 74 L 26 138" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 76 74 L 74 138" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
      {/* Sunroof Frame */}
      <rect x="34" y="80" width="32" height="34" rx="4" fill="url(#sedanGlassGrad)" opacity="0.9" />

      {/* 6. REAR WINDSHIELD */}
      <path
        d="M 27 144 C 36 141, 64 141, 73 144 L 70 165 C 60 168, 40 168, 30 165 Z"
        fill="url(#sedanGlassGrad)"
        stroke="#0F172A"
        strokeWidth="1"
      />
      {/* Rear Defroster Lines */}
      <line x1="32" y1="149" x2="68" y2="149" stroke="#475569" strokeWidth="0.5" />
      <line x1="34" y1="154" x2="66" y2="154" stroke="#475569" strokeWidth="0.5" />
      <line x1="36" y1="159" x2="64" y2="159" stroke="#475569" strokeWidth="0.5" />

      {/* 7. RED TAIL LIGHTS */}
      <path
        d="M 18 172 Q 26 182 34 184 L 28 186 Q 16 184 18 172 Z"
        fill="url(#tailLightGlow)"
        stroke="#DC2626"
        strokeWidth="0.8"
      />
      <path
        d="M 82 172 Q 74 182 66 184 L 72 186 Q 84 184 82 172 Z"
        fill="url(#tailLightGlow)"
        stroke="#DC2626"
        strokeWidth="0.8"
      />

      {/* 8. HEADLIGHT ACCENTS (FRONT) */}
      <path d="M 20 18 Q 28 12 34 16" fill="none" stroke="#72C98B" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 80 18 Q 72 12 66 16" fill="none" stroke="#72C98B" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
