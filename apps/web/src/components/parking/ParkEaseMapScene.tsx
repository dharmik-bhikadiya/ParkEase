import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation, CheckCircle } from 'lucide-react';
import { ParkEaseJourneyCar } from './ParkEaseJourneyCar';

export interface ParkingSpot {
  id: string;
  name: string;
  price: string;
  slots: number;
  x: number;
  y: number;
  isPopular?: boolean;
}

export interface ParkEaseMapSceneProps {
  progress?: number; // 0 to 1 scroll animation progress
  selectedSpotId?: string;
  onSelectSpot?: (spot: ParkingSpot) => void;
  className?: string;
}

export const PARKING_SPOTS: ParkingSpot[] = [
  { id: 'spot-1', name: 'ParkEase Central Mall', price: '₹25/hr', slots: 12, x: 780, y: 200, isPopular: true },
  { id: 'spot-2', name: 'Tech Park Plaza', price: '₹20/hr', slots: 8, x: 430, y: 410 },
  { id: 'spot-3', name: 'Metro Station Hub', price: '₹18/hr', slots: 15, x: 650, y: 350 },
  { id: 'spot-4', name: 'Civic Center Garage', price: '₹32/hr', slots: 5, x: 200, y: 200 },
  { id: 'spot-5', name: 'Grand Valet Hub', price: '₹40/hr', slots: 3, x: 630, y: 200 },
];

export const ParkEaseMapScene: React.FC<ParkEaseMapSceneProps> = ({
  progress = 0,
  selectedSpotId = 'spot-1',
  onSelectSpot,
  className = '',
}) => {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLength, setPathLength] = useState<number>(900);
  // Initial car position aligned straight at starting point facing forward along the road
  const [carPos, setCarPos] = useState<{ x: number; y: number; angle: number }>({ x: 60, y: 530, angle: 90 });
  const activeSpot = useMemo(() => {
    return PARKING_SPOTS.find((s) => s.id === selectedSpotId) || PARKING_SPOTS[0];
  }, [selectedSpotId]);

  // Main SVG curved route path d (dynamically follows background road network into activeSpot)
  const routePathD = useMemo(() => {
    if (activeSpot.id === 'spot-1') {
      return "M 60 530 C 250 530, 280 410, 430 410 C 540 410, 580 350, 650 350 C 710 350, 750 250, 780 200";
    } else if (activeSpot.id === 'spot-2') {
      return "M 60 530 C 250 530, 280 410, 430 410";
    } else if (activeSpot.id === 'spot-3') {
      return "M 60 530 C 250 530, 280 410, 430 410 C 540 410, 580 350, 650 350";
    } else if (activeSpot.id === 'spot-4') {
      return "M 60 530 C 180 530, 200 400, 200 200";
    } else {
      return "M 60 530 C 250 530, 280 410, 430 410 C 540 410, 580 300, 630 200";
    }
  }, [activeSpot]);

  // Calculate car position and dynamic path length for 100% sync
  useEffect(() => {
    if (pathRef.current) {
      try {
        const totalLen = pathRef.current.getTotalLength();
        if (totalLen > 0 && Math.abs(totalLen - pathLength) > 1) {
          setPathLength(totalLen);
        }

        const targetLen = Math.min(Math.max(progress, 0), 1) * totalLen;
        const pt = pathRef.current.getPointAtLength(targetLen);

        let dx = 0;
        let dy = 0;

        if (targetLen >= totalLen - 3) {
          const ptPrev = pathRef.current.getPointAtLength(Math.max(targetLen - 3, 0));
          dx = pt.x - ptPrev.x;
          dy = pt.y - ptPrev.y;
        } else {
          const ptNext = pathRef.current.getPointAtLength(Math.min(targetLen + 5, totalLen));
          dx = ptNext.x - pt.x;
          dy = ptNext.y - pt.y;
        }

        // Calculate heading angle (car front pointing along tangent)
        const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

        setCarPos({ x: pt.x, y: pt.y, angle: angleDeg });
      } catch {
        // Fallback for non-browser environment
      }
    }
  }, [progress, routePathD, pathLength]);

  return (
    <div className={`relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden bg-[#F7F9F5] border border-[#E8F6EC] shadow-2xl shadow-[#176B4D]/10 flex items-center justify-center ${className}`}>
      {/* Soft Ambient Radial Background */}
      <div className="absolute inset-0 bg-radial from-[#72C98B]/15 via-transparent to-transparent pointer-events-none" />

      {/* SVG Vector Map Container */}
      <svg
        viewBox="0 0 1000 650"
        className="w-full h-full object-cover select-none"
        style={{ transform: `scale(${1 + progress * 0.03})`, transition: 'transform 0.3s ease-out' }}
      >
        <defs>
          {/* Soft Shadow for Cards & Pins */}
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#18342A" floodOpacity="0.08" />
          </filter>

          {/* Glowing Green Route Gradient */}
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#72C98B" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#42B96B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#176B4D" stopOpacity="1" />
          </linearGradient>

          {/* Building Pattern / Fills */}
          <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#EEF8F1" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* 1. MAP BASE TERRAIN */}
        <rect width="1000" height="650" fill="#F7F9F5" />

        {/* Green Spaces & Parks */}
        <path
          d="M 50 80 Q 180 40 220 180 T 100 320 Z"
          fill="#E2F5E8"
          opacity="0.75"
        />
        <path
          d="M 720 380 Q 880 340 920 520 T 780 600 Z"
          fill="#E2F5E8"
          opacity="0.6"
        />

        {/* 2. BUILDINGS & CITY BLOCKS */}
        <g stroke="#D5EFE0" strokeWidth="1.5">
          <rect x="80" y="100" width="100" height="70" rx="12" fill="url(#buildingGrad)" filter="url(#soft-shadow)" />
          <rect x="220" y="70" width="140" height="90" rx="14" fill="url(#buildingGrad)" filter="url(#soft-shadow)" />
          <rect x="420" y="80" width="110" height="80" rx="12" fill="url(#buildingGrad)" filter="url(#soft-shadow)" />
          <rect x="300" y="270" width="130" height="100" rx="16" fill="url(#buildingGrad)" filter="url(#soft-shadow)" />
          <rect x="740" y="70" width="160" height="110" rx="18" fill="url(#buildingGrad)" filter="url(#soft-shadow)" />
          <rect x="520" y="240" width="110" height="120" rx="14" fill="url(#buildingGrad)" filter="url(#soft-shadow)" />
          <rect x="140" y="380" width="140" height="90" rx="14" fill="url(#buildingGrad)" filter="url(#soft-shadow)" />
          <rect x="720" y="440" width="150" height="110" rx="16" fill="url(#buildingGrad)" filter="url(#soft-shadow)" />
        </g>

        {/* 3. ROAD NETWORK */}
        <g stroke="#E4F4E8" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 0 200 H 1000" />
          <path d="M 0 530 C 250 530, 280 410, 430 410 C 540 410, 580 350, 650 350 C 710 350, 750 250, 780 200" />
          <path d="M 200 0 V 650" />
          <path d="M 430 200 V 650" />
          <path d="M 630 0 V 650" />
          <path d="M 780 0 V 650" />
        </g>
        <g stroke="#FFFFFF" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9">
          <path d="M 0 200 H 1000" />
          <path d="M 0 530 C 250 530, 280 410, 430 410 C 540 410, 580 350, 650 350 C 710 350, 750 250, 780 200" />
          <path d="M 200 0 V 650" />
          <path d="M 430 200 V 650" />
          <path d="M 630 0 V 650" />
          <path d="M 780 0 V 650" />
        </g>

        <g stroke="#A8E2BB" strokeWidth="2" strokeDasharray="8,10" fill="none" opacity="0.7">
          <path d="M 0 200 H 1000" />
          <path d="M 0 530 C 250 530, 280 410, 430 410 C 540 410, 580 350, 650 350 C 710 350, 750 250, 780 200" />
          <path d="M 200 0 V 650" />
          <path d="M 430 200 V 650" />
          <path d="M 630 0 V 650" />
          <path d="M 780 0 V 650" />
        </g>

        {/* 4. HIGH-VISIBILITY GLOWING GREEN NAVIGATION ROUTE */}
        {/* Faint Guide Road Ahead of Car */}
        <path
          d={routePathD}
          fill="none"
          stroke="#D5EFE0"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />

        {/* Outer Glow Aura (Strictly 1:1 synced with car position) */}
        <path
          d={routePathD}
          fill="none"
          stroke="#72C98B"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.45"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
        />
        {/* Core Animated Green Route Path (Strictly 1:1 synced with car position) */}
        <path
          ref={pathRef}
          d={routePathD}
          fill="none"
          stroke="url(#routeGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
        />
        {/* White Inner Dashed Guidance Overlay (Strictly 1:1 synced with car position) */}
        <path
          d={routePathD}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8,10"
          opacity="0.9"
          strokeDashoffset={pathLength * (1 - progress)}
        />

        {/* START POINT ORIGIN MARKER */}
        <g transform="translate(60, 530)">
          <circle r="10" fill="#176B4D" stroke="#FFFFFF" strokeWidth="2.5" filter="url(#soft-shadow)" />
          <circle r="4" fill="#72C98B" />
          <foreignObject x="-45" y="14" width="90" height="24">
            <div className="bg-[#176B4D] text-[#E8F6EC] text-[10px] font-extrabold px-2 py-0.5 rounded-full text-center shadow-xs border border-[#72C98B]/40">
              START
            </div>
          </foreignObject>
        </g>

        {/* 5. PARKING MARKERS */}
        {PARKING_SPOTS.map((spot) => {
          const isSelected = spot.id === selectedSpotId;

          return (
            <g
              key={spot.id}
              onClick={() => onSelectSpot && onSelectSpot(spot)}
              className="cursor-pointer group"
              transform={`translate(${spot.x}, ${spot.y})`}
            >
              <circle r="22" fill="#72C98B" opacity="0.25">
                <animate attributeName="r" values="16;34;16" dur="2.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2.8s" repeatCount="indefinite" />
              </circle>
              {isSelected && (
                <circle r="36" fill="#176B4D" opacity="0.15">
                  <animate attributeName="r" values="24;46;24" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              <circle
                r={isSelected ? 18 : 14}
                fill={isSelected ? '#176B4D' : '#42B96B'}
                stroke="#FFFFFF"
                strokeWidth="3"
                filter="url(#soft-shadow)"
                style={{ transition: 'all 0.3s ease' }}
              />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize={isSelected ? '14' : '11'}
                fontWeight="bold"
                fontFamily="system-ui, sans-serif"
              >
                P
              </text>

              <foreignObject
                x="-65"
                y={isSelected ? '-78' : '-65'}
                width="130"
                height="54"
                style={{ overflow: 'visible', transition: 'all 0.3s ease' }}
              >
                <div
                  className={`px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 shadow-md ${
                    isSelected
                      ? 'bg-[#176B4D] border-[#72C98B] text-white scale-105 shadow-lg shadow-[#176B4D]/25'
                      : 'bg-white border-[#E8F6EC] text-[#18342A] hover:border-[#72C98B]'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-extrabold">{spot.price}</span>
                    {spot.isPopular && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-[#72C98B] text-[#18342A]' : 'bg-[#E8F6EC] text-[#176B4D]'}`}>
                        TOP
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${isSelected ? 'text-[#E8F6EC]' : 'text-gray-500'}`}>
                    {spot.slots} slots open
                  </span>
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* 6. TOP-VIEW WHITE LUXURY SEDAN COMPONENT */}
        <g
          transform={`translate(${carPos.x}, ${carPos.y}) rotate(${carPos.angle})`}
          style={{ transition: 'transform 0.05s linear' }}
        >
          <foreignObject
            x="-24"
            y="-46"
            width="48"
            height="94"
            style={{ overflow: 'visible', background: 'transparent', border: 'none', outline: 'none' }}
          >
            <ParkEaseJourneyCar size={48} />
          </foreignObject>
        </g>
      </svg>

      {/* Interactive Map Floating HUD Badge */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/90 backdrop-blur-md border border-[#E8F6EC] px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#E8F6EC] text-[#176B4D] flex items-center justify-center font-bold text-xs">
          <Navigation className="w-4 h-4 text-[#176B4D]" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#18342A]">{activeSpot.name}</p>
          <p className="text-[11px] text-gray-500 font-medium">
            {activeSpot.slots} slots available • <span className="text-[#176B4D] font-bold">{activeSpot.price}</span>
          </p>
        </div>
      </div>

      {/* Progress Indicator Toast (appears when scroll reaches 90%+) */}
      {progress >= 0.85 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute bottom-6 right-6 bg-[#176B4D] text-white px-5 py-3 rounded-2xl shadow-xl shadow-[#176B4D]/30 border border-[#72C98B]/40 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-[#72C98B]" />
          <div>
            <p className="text-xs font-extrabold tracking-wide">PARKING FOUND</p>
            <p className="text-[11px] text-[#E8F6EC]">{activeSpot.slots} slots ready for reservation</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
