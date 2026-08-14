import React, { useEffect, useRef, useState } from 'react';
import { ParkEaseJourneyCar } from '../parking/ParkEaseJourneyCar';

export interface ParkEaseAnimatedLogoProps {
  className?: string;
  size?: number; // height/width of emblem in px
  variant?: 'full' | 'symbol';
  showSubtitle?: boolean;
  animated?: boolean; // toggle car animation (defaults to false as requested)
}

/**
 * High-fidelity ParkEase logo component.
 * Features a 100% SVG 3D 'P' emblem with a curved asphalt road ribbon and location pin.
 * In 'full' variant, typography ("ParkEase") sits side-by-side next to the logo emblem.
 */
export const ParkEaseAnimatedLogo: React.FC<ParkEaseAnimatedLogoProps> = ({
  className = '',
  size = 180,
  variant = 'full',
  showSubtitle = true,
  animated = false,
}) => {
  const pathRef = useRef<SVGPathElement>(null);

  // Motion path string inside 500x500 viewBox
  const motionPathD = "M 175 390 C 185 330, 225 275, 270 240 C 330 205, 385 150, 360 95 C 340 45, 260 55, 245 95";

  // Car state: default position matches Reference 1 (mid-curve on road)
  const [carState, setCarState] = useState<{
    x: number;
    y: number;
    angle: number;
    progress: number;
    isPausingTop: boolean;
  }>({
    x: 270,
    y: 240,
    angle: 42,
    progress: 0.45,
    isPausingTop: false,
  });

  useEffect(() => {
    // If static (animation off), position car accurately on curve and return
    if (!animated) {
      if (pathRef.current) {
        const path = pathRef.current;
        const totalLength = path.getTotalLength();
        const pt = path.getPointAtLength(totalLength * 0.45);
        const pNext = path.getPointAtLength(totalLength * 0.45 + 1.5);
        const dx = pNext.x - pt.x;
        const dy = pNext.y - pt.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        setCarState({
          x: pt.x,
          y: pt.y,
          angle: angle,
          progress: 0.45,
          isPausingTop: false,
        });
      }
      return;
    }

    // Reduced motion check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    let animationFrameId: number;
    let startTime: number | null = null;

    const DRIVE_UP_DURATION = 4.0;
    const PAUSE_TOP_DURATION = 0.8;
    const DRIVE_DOWN_DURATION = 4.0;
    const PAUSE_BOTTOM_DURATION = 0.5;
    const TOTAL_CYCLE = DRIVE_UP_DURATION + PAUSE_TOP_DURATION + DRIVE_DOWN_DURATION + PAUSE_BOTTOM_DURATION;

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const cycleTime = elapsed % TOTAL_CYCLE;

      let progress = 0;
      let isMovingUp = true;
      let isPausingTop = false;

      if (cycleTime < DRIVE_UP_DURATION) {
        const rawT = cycleTime / DRIVE_UP_DURATION;
        progress = easeInOutCubic(rawT);
        isMovingUp = true;
      } else if (cycleTime < DRIVE_UP_DURATION + PAUSE_TOP_DURATION) {
        progress = 1.0;
        isMovingUp = false;
        isPausingTop = true;
      } else if (cycleTime < DRIVE_UP_DURATION + PAUSE_TOP_DURATION + DRIVE_DOWN_DURATION) {
        const rawT = (cycleTime - DRIVE_UP_DURATION - PAUSE_TOP_DURATION) / DRIVE_DOWN_DURATION;
        const easedT = easeInOutCubic(rawT);
        progress = 1.0 - easedT;
        isMovingUp = false;
      } else {
        progress = 0.0;
        isMovingUp = true;
      }

      if (pathRef.current) {
        const path = pathRef.current;
        const totalLength = path.getTotalLength();
        const currentDist = progress * totalLength;
        const pt = path.getPointAtLength(currentDist);

        const delta = 1.2;
        let angle = 0;

        if (isPausingTop) {
          const pPrev = path.getPointAtLength(totalLength - delta);
          const dx = pt.x - pPrev.x;
          const dy = pt.y - pPrev.y;
          angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        } else if (isMovingUp) {
          const targetDist = Math.min(totalLength, currentDist + delta);
          const pNext = path.getPointAtLength(targetDist);
          const dx = pNext.x - pt.x;
          const dy = pNext.y - pt.y;
          angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        } else {
          const targetDist = Math.max(0, currentDist - delta);
          const pNext = path.getPointAtLength(targetDist);
          const dx = pNext.x - pt.x;
          const dy = pNext.y - pt.y;
          angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        }

        setCarState({
          x: pt.x,
          y: pt.y,
          angle: angle,
          progress: progress,
          isPausingTop: isPausingTop,
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [animated]);

  return (
    <div className={`inline-flex flex-row items-center gap-3 sm:gap-4 select-none ${className}`}>
      {/* 3D EMBLEM + CAR SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible filter drop-shadow-md shrink-0"
      >
        <defs>
          {/* Main 3D Emerald "P" Body Gradient */}
          <linearGradient id="pBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="30%" stopColor="#176B4D" />
            <stop offset="70%" stopColor="#0F5132" />
            <stop offset="100%" stopColor="#063E26" />
          </linearGradient>

          {/* Glossy Top Rim Highlight */}
          <linearGradient id="pRimHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#22C55E" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#176B4D" stopOpacity="0.2" />
          </linearGradient>

          {/* Road Asphalt Gradient */}
          <linearGradient id="roadAsphalt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#042E20" />
            <stop offset="50%" stopColor="#064E3B" />
            <stop offset="100%" stopColor="#022C22" />
          </linearGradient>

          {/* Soft Green Glow under moving car */}
          <radialGradient id="carTrailGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#176B4D" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#176B4D" stopOpacity="0" />
          </radialGradient>

          {/* Parking Pin Gradient */}
          <linearGradient id="pinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="40%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>

          {/* Soft Shadow Blur filter */}
          <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#0F5132" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* 0. GROUND BASE SHADOW */}
        <ellipse cx="250" cy="435" rx="130" ry="16" fill="#0F5132" opacity="0.18" className="blur-sm" />

        {/* 1. LOGO BACKGROUND — 3D GREEN "P" OUTER SHELL */}
        <g filter="url(#logoShadow)">
          <path
            d="M 152 418 
               C 150 250, 152 140, 168 100 
               C 185 55, 240 38, 315 48 
               C 390 58, 425 110, 418 185 
               C 410 260, 345 295, 275 282 
               C 230 274, 205 320, 205 370 
               C 205 410, 185 422, 152 418 Z"
            fill="url(#pBodyGrad)"
            stroke="#15803D"
            strokeWidth="3"
          />

          <path
            d="M 168 100 
               C 185 55, 240 38, 315 48 
               C 375 56, 405 100, 405 160"
            fill="none"
            stroke="url(#pRimHighlight)"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </g>

        {/* 2. CURVED ROAD SURFACE */}
        <path
          d="M 160 415 
             C 170 335, 210 270, 270 240 
             C 335 205, 395 155, 370 90 
             C 350 38, 255 50, 235 95 
             C 220 130, 250 155, 270 140 
             C 310 110, 340 160, 290 200 
             C 235 240, 195 285, 185 415 Z"
          fill="url(#roadAsphalt)"
          stroke="#065F46"
          strokeWidth="2"
        />

        {/* 3. ROAD DASHED CENTER LINE */}
        <path
          d={motionPathD}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeDasharray="10 10"
          strokeOpacity="0.85"
          strokeLinecap="round"
        />

        {/* HIDDEN SVG MOTION PATH */}
        <path
          ref={pathRef}
          id="parkeaseMotionPath"
          d={motionPathD}
          fill="none"
          stroke="none"
        />

        {/* 4. SOFT GREEN LIGHT TRAIL */}
        {animated && carState.progress > 0.02 && carState.progress < 0.98 && (
          <circle
            cx={carState.x}
            cy={carState.y}
            r="28"
            fill="url(#carTrailGlow)"
            className="transition-opacity duration-300"
          />
        )}

        {/* 5. WHITE CAR LAYER */}
        <g
          transform={`translate(${carState.x}, ${carState.y}) rotate(${carState.angle})`}
          style={{ transition: animated ? 'transform 0.03s linear' : 'none' }}
        >
          <g transform="translate(-17, -33)">
            <ParkEaseJourneyCar size={34} />
          </g>
        </g>

        {/* 6. PARKING PIN / DESTINATION MARKER */}
        <g transform="translate(245, 95)">
          {carState.isPausingTop && (
            <>
              <circle cx="0" cy="-20" r="32" fill="#22C55E" opacity="0.25" className="animate-ping" />
              <circle cx="0" cy="-20" r="42" fill="#4ADE80" opacity="0.15" className="animate-pulse" />
            </>
          )}

          <path
            d="M 0 0 
               C -18 -14, -22 -32, -22 -42 
               C -22 -55, -12 -65, 0 -65 
               C 12 -65, 22 -55, 22 -42 
               C 22 -32, 18 -14, 0 0 Z"
            fill="url(#pinGrad)"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            className="filter drop-shadow-md"
          />

          <circle cx="0" cy="-42" r="12" fill="#FFFFFF" />

          <text
            x="0"
            y="-37"
            textAnchor="middle"
            fill="#064E3B"
            fontSize="15"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            P
          </text>
        </g>
      </svg>

      {/* BRAND TYPOGRAPHY (WRITTEN SIDE-BY-SIDE NEXT TO LOGO) */}
      {variant === 'full' && (
        <div className="flex flex-col text-left space-y-0.5">
          <div className="flex items-center gap-0.5">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-[#18342A] tracking-tight leading-none">
              Park
            </span>
            <span className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-[#176B4D] via-[#22C55E] to-[#4ADE80] bg-clip-text text-transparent tracking-tight leading-none">
              Ease
            </span>
          </div>

          {showSubtitle && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] sm:text-xs font-extrabold text-[#176B4D] tracking-[0.2em] uppercase whitespace-nowrap">
                PARK SMART • MOVE EASY
              </span>
              <div className="h-[1.5px] w-6 bg-gradient-to-r from-[#176B4D]/40 to-transparent" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
