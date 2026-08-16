import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, MapPin, Zap, QrCode, CreditCard, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ParkEaseMapScene, PARKING_SPOTS } from '../components/parking/ParkEaseMapScene';
import { ParkEaseJourneyScene } from '../components/parking/ParkEaseJourneyScene';

export const LandingPage: React.FC = () => {
  const [selectedSpotId, setSelectedSpotId] = useState<string>('spot-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Independent car journey progress state [0..1]
  const [carProgress, setCarProgress] = useState<number>(0);
  const [isCarParked, setIsCarParked] = useState<boolean>(false);

  // Scroll to top on mount / refresh to prevent page jump
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Wheel listener: locks vertical page scroll at top until car reaches destination spot
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // If at top of page and car has not parked yet
      if (window.scrollY <= 15 && !isCarParked) {
        if (e.deltaY > 0) {
          // Drive car forward, prevent vertical page scroll
          e.preventDefault();
          setCarProgress((prev) => {
            const next = Math.min(1, prev + e.deltaY * 0.0015);
            if (next >= 0.98) {
              setIsCarParked(true);
              return 1;
            }
            return next;
          });
        } else if (e.deltaY < 0 && carProgress > 0) {
          // Reverse car if user scrolls up at top of page
          e.preventDefault();
          setCarProgress((prev) => Math.max(0, prev + e.deltaY * 0.0015));
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isCarParked, carProgress]);

  return (
    <div className="relative w-full max-w-full overflow-x-hidden space-y-6 pb-12 bg-[#F7F9F5]">
      {/* Ambient Radial Background Glow */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.35, 0.5, 0.35],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute top-[-140px] left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-radial from-[#72C98B]/25 via-[#176B4D]/10 to-transparent blur-3xl rounded-full"
      />

      {/* 1. HERO SECTION: 100% Locked Page - Only Car Moves */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">

          {/* LEFT COLUMN: Clean Typography & Destination Search (STATIC & LOCKED) */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F6EC] text-[#176B4D] text-xs font-semibold tracking-wide border border-[#72C98B]/30 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#176B4D]" />
              Next-Gen Mobility Parking Platform
            </motion.div>

            <div className="-space-y-0.5 sm:-space-y-1">
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#18342A] tracking-tight leading-[1.05]"
              >
                Effortless Parking
              </motion.h1>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#18342A] tracking-tight leading-[1.05]"
              >
                Reservation
              </motion.h1>

              <div className="relative z-10 inline-block -mt-3 sm:-mt-4 lg:-mt-5 pt-0.5">
                {/* Accent text sitting directly on off-white background with NO pill/box */}
                <motion.span
                  initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#176B4D] tracking-tight leading-[1.02] inline-block drop-shadow-xs"
                >
                  Everywhere You Go
                </motion.span>

                {/* Thin Animated Light Green Underline */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-[3.5px] bg-[#72C98B] rounded-full mt-1 origin-left w-full shadow-xs"
                />
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base text-[#18342A]/75 font-normal leading-relaxed max-w-md pt-1"
            >
              Find, reserve, and park with confidence wherever you go. Touchless QR access and automated wallet billing included.
            </motion.p>

            {/* Destination Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="pt-1"
            >
              <Card className="p-2.5 bg-white border border-[#176B4D]/20 shadow-md shadow-[#18342A]/5 rounded-2xl flex flex-col sm:flex-row items-center gap-2.5">
                <div className="flex items-center gap-2.5 w-full px-3 py-2 bg-[#F7F9F5] rounded-xl border border-transparent focus-within:border-[#176B4D]/30 focus-within:bg-white transition-all">
                  <MapPin className="w-4 h-4 text-[#176B4D] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search destination or location..."
                    className="bg-transparent border-none outline-none w-full text-[#18342A] placeholder-gray-400 font-medium text-sm"
                  />
                </div>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 whitespace-nowrap bg-[#176B4D] hover:bg-[#12543c] text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Search className="w-4 h-4" /> Find Parking
                </Button>
              </Card>
            </motion.div>

            {/* Quick Hub Switcher */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-0.5 space-y-1"
            >
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Select Nearby Hub:</p>
              <div className="flex flex-wrap gap-2">
                {PARKING_SPOTS.slice(0, 3).map((spot) => (
                  <button
                    key={spot.id}
                    onClick={() => {
                      setSelectedSpotId(spot.id);
                      setCarProgress(0);
                      setIsCarParked(false);
                    }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      selectedSpotId === spot.id
                        ? 'bg-[#176B4D] text-white shadow-xs'
                        : 'bg-white text-[#18342A] border border-[#E8F6EC] hover:border-[#72C98B]'
                    }`}
                  >
                    {spot.name} • <span className={selectedSpotId === spot.id ? 'text-[#72C98B]' : 'text-[#176B4D]'}>{spot.price}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Map Hero with Scroll-Controlled Car */}
          <div className="lg:col-span-7">
            <ParkEaseMapScene
              progress={carProgress}
              selectedSpotId={selectedSpotId}
              onSelectSpot={(spot) => {
                setSelectedSpotId(spot.id);
                setCarProgress(0);
                setIsCarParked(false);
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. LOWER DETAILS SECTION */}
      {/* Scrollable lower details revealed smoothly when user continues scrolling after car parks */}
      <div className="relative z-20 space-y-8 pt-4 bg-[#F7F9F5]">
        {/* CLEAN 4-CARD JOURNEY SECTION */}
        <ParkEaseJourneyScene />

        {/* FEATURE CARDS */}
        <section className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
            >
              <Card className="flex flex-col gap-4 p-6 bg-white border border-[#E8F6EC] hover:border-[#72C98B]/50 hover:-translate-y-1 shadow-xs hover:shadow-md transition-all duration-200 group rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F6EC] flex items-center justify-center text-[#176B4D] group-hover:scale-105 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#18342A]">Real-Time Slots</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Live slot tracking ensures you drive straight to an open parking space without hassle.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="flex flex-col gap-4 p-6 bg-white border border-[#E8F6EC] hover:border-[#72C98B]/50 hover:-translate-y-1 shadow-xs hover:shadow-md transition-all duration-200 group rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F6EC] flex items-center justify-center text-[#176B4D] group-hover:scale-105 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#18342A]">Touchless Entry</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Scan dynamic QR passes at entry and exit gates for instant, automated gate control.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="flex flex-col gap-4 p-6 bg-white border border-[#E8F6EC] hover:border-[#72C98B]/50 hover:-translate-y-1 shadow-xs hover:shadow-md transition-all duration-200 group rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F6EC] flex items-center justify-center text-[#176B4D] group-hover:scale-105 transition-transform">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#18342A]">In-App Wallet</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Seamless auto-billing, instant top-ups, transaction logs, and overstay protections.
                </p>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};
