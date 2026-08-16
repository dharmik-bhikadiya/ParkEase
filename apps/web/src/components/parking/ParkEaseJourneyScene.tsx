import React from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, QrCode, CreditCard, Navigation } from 'lucide-react';

export interface JourneyStep {
  step: string;
  title: string;
  desc: string;
  icon: React.ElementType;
}

export const JOURNEY_STEPS: JourneyStep[] = [
  { step: '01', title: 'Search', desc: 'Find live open spots near your destination.', icon: Search },
  { step: '02', title: 'Reserve', desc: 'Lock in your slot with instant confirmation.', icon: CheckCircle2 },
  { step: '03', title: 'Park', desc: 'Touchless QR scan at gate entry.', icon: QrCode },
  { step: '04', title: 'Exit', desc: 'Automated wallet payment on exit.', icon: CreditCard },
];

export const ParkEaseJourneyScene: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-8">
      {/* SECTION HEADER */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-3xl mx-auto space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F6EC] text-[#176B4D] text-xs font-bold border border-[#72C98B]/30 shadow-xs">
          <Navigation className="w-3.5 h-3.5 text-[#176B4D]" />
          End-to-End Mobility
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#18342A] tracking-tight">
          From search to parking — ParkEase handles the journey.
        </h2>
        <p className="text-sm text-[#18342A]/70 font-normal">
          Experience effortless urban parking in 4 simple steps.
        </p>
      </motion.div>

      {/* 4 EQUAL DIMENSION JOURNEY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {JOURNEY_STEPS.map((step, idx) => {
          const StepIcon = step.icon;

          return (
            <motion.div
              key={step.step}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="p-6 rounded-2xl border border-[#E8F6EC] bg-white shadow-xs hover:border-[#72C98B] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-[200px] relative overflow-hidden group hover:-translate-y-1"
            >
              {/* Large Faded Step Number in Top Right */}
              <span className="text-6xl sm:text-7xl font-black absolute top-1 right-3 select-none text-slate-200/80 group-hover:text-[#176B4D]/20 transition-colors duration-300 pointer-events-none leading-none">
                {step.step}
              </span>

              {/* Card Icon & Header */}
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#E8F6EC] text-[#176B4D] flex items-center justify-center mb-3 group-hover:bg-[#176B4D] group-hover:text-white transition-colors duration-300">
                  <StepIcon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#18342A] tracking-tight">{step.title}</h3>
              </div>

              {/* Card Description */}
              <p className="text-xs text-[#18342A]/75 font-normal leading-relaxed">
                {step.desc}
              </p>

              {/* Bottom Subtle Accent Bar */}
              <div className="h-1 rounded-full w-full bg-[#E8F6EC] group-hover:bg-[#72C98B] transition-colors duration-300" />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
