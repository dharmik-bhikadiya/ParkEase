import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  QrCode,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Car,
  Camera,
  CameraOff,
  Zap,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { qrApi } from '../api/qrApi';
import { bookingApi } from '../api/booking';
import { StaffLayout } from '../components/staff/StaffLayout';
import { Booking } from '@parkease/shared';

// Web Audio API beep sound generator
const playGateBeep = (isSuccess: boolean) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isSuccess ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(isSuccess ? 880 : 220, ctx.currentTime);

    if (isSuccess) {
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    }

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignore audio autoplay restrictions
  }
};

export const StaffGateScanPage: React.FC = () => {
  const [scanType, setScanType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [payloadInput, setPayloadInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Barrier Gate Visual State
  const [isBarrierOpen, setIsBarrierOpen] = useState<boolean>(false);

  // Quick Demo / Test Bookings State
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  // Load recent bookings for quick test pass simulation
  useEffect(() => {
    const loadQuickPasses = async () => {
      try {
        const bookings = await bookingApi.getOwnerBookings();
        setRecentBookings(bookings.slice(0, 5));
      } catch {
        // Fallback to my-bookings if not owner
        try {
          const myB = await bookingApi.getMyBookings();
          setRecentBookings(myB.slice(0, 5));
        } catch {
          // Ignore
        }
      }
    };
    loadQuickPasses();
  }, []);


  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);

      // Start BarcodeDetector loop if supported by browser
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawVal = barcodes[0].rawValue;
                if (rawVal && rawVal !== payloadInput) {
                  setPayloadInput(rawVal);
                  stopCamera();
                  executeScanWithPayload(rawVal);
                }
              }
            } catch {
              // Detection loop frame skip
            }
          }
        }, 500);
      }
    } catch (err: any) {
      setCameraError('Unable to access camera. Please check camera permissions or use manual payload entry.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const executeScanWithPayload = async (payloadToScan: string) => {
    if (!payloadToScan.trim()) {
      alert('Please enter or scan a valid QR pass payload string.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let res;
      if (scanType === 'ENTRY') {
        res = await qrApi.scanEntry(payloadToScan.trim());
      } else {
        res = await qrApi.scanExit(payloadToScan.trim());
      }
      setResult(res);
      playGateBeep(true);
      setIsBarrierOpen(true);
      setTimeout(() => setIsBarrierOpen(false), 5000);
    } catch (err: any) {
      playGateBeep(false);
      setError(err?.message || 'QR Verification failed: Invalid pass or expired session.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Test Pass: generate a pass for a selected booking and scan it
  const handleSimulatePass = async (booking: Booking) => {
    setLoading(true);
    setError(null);
    try {
      const passes = await qrApi.getBookingQrPasses(booking.id);
      const targetPass = passes.find((p) => p.type === scanType) || passes[0];
      if (targetPass?.qr_payload) {
        setPayloadInput(targetPass.qr_payload);
        await executeScanWithPayload(targetPass.qr_payload);
      } else {
        setError('No QR pass found for this booking.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate pass for simulation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StaffLayout
      title="Barrier Gate Scanner Hub"
      subtitle="Verify driver QR passes, authorize gate entry, and process parking session exits."
    >
      <div className="space-y-6 max-w-4xl">
        {/* Visual Barrier Gate Simulation Status */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8F6EC] shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                isBarrierOpen ? 'bg-emerald-500 text-white animate-bounce' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Barrier Boom Status
              </span>
              <h3 className="text-lg font-black text-[#18342A]">
                {isBarrierOpen ? '🟢 BOOM ARM LIFTED (ACCESS GRANTED)' : '🔴 BOOM ARM DOWN (GATE LOCKED)'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full ${
                isBarrierOpen
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {isBarrierOpen ? 'PASS SENSOR ACTIVE' : 'AWAITING SCAN'}
            </span>
          </div>
        </div>

        {/* Control Card */}
        <Card className="p-6 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-6">
          {/* Toggle Mode */}
          <div className="flex bg-[#F7F9F5] p-1.5 rounded-2xl border border-gray-100 max-w-md mx-auto">
            <button
              onClick={() => {
                setScanType('ENTRY');
                setResult(null);
                setError(null);
              }}
              className={`flex-1 py-3 text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all ${
                scanType === 'ENTRY' ? 'bg-[#176B4D] text-white shadow-md' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" /> ENTRY GATE SCAN
            </button>
            <button
              onClick={() => {
                setScanType('EXIT');
                setResult(null);
                setError(null);
              }}
              className={`flex-1 py-3 text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all ${
                scanType === 'EXIT' ? 'bg-[#176B4D] text-white shadow-md' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" /> EXIT GATE SCAN
            </button>
          </div>

          {/* Camera Scanner Viewfinder */}
          <div className="max-w-xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#176B4D]" /> Optical Camera Scanner
              </label>

              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  isCameraActive
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-[#E8F6EC] text-[#176B4D] border border-[#72C98B]/40 hover:bg-[#72C98B]/20'
                }`}
              >
                {isCameraActive ? (
                  <>
                    <CameraOff className="w-3.5 h-3.5" /> Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" /> Start Live Camera
                  </>
                )}
              </button>
            </div>

            {/* Live Camera Feed */}
            {isCameraActive && (
              <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-[#176B4D] aspect-video flex items-center justify-center shadow-lg">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-52 h-52 border-2 border-[#72C98B] rounded-2xl relative shadow-2xl">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400" />
                    <div className="w-full h-0.5 bg-emerald-400 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-md" />
                  </div>
                </div>
                <span className="absolute bottom-3 text-white text-[11px] font-bold bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                  Point camera at Driver's QR Pass
                </span>
              </div>
            )}

            {cameraError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium">
                {cameraError}
              </div>
            )}

            {/* Manual Payload String Input */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] text-gray-500 font-semibold block">Or paste / type QR pass string:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={payloadInput}
                  onChange={(e) => setPayloadInput(e.target.value)}
                  placeholder="e.g. PARKEASE|uuid|ENTRY|iso_time:signature"
                  className="flex-1 px-4 py-3 bg-[#F7F9F5] border border-gray-200 rounded-2xl font-mono text-xs font-bold text-gray-800 focus:outline-none focus:border-[#176B4D]"
                />
                <Button
                  variant="primary"
                  onClick={() => executeScanWithPayload(payloadInput)}
                  disabled={loading || !payloadInput.trim()}
                  className="bg-[#176B4D] hover:bg-[#12543c] text-white font-bold px-6 rounded-2xl flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                  {loading ? 'Verifying...' : 'Validate Pass'}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Demo Test Passes for Testing */}
          {recentBookings.length > 0 && (
            <div className="p-4 bg-[#F7F9F5] rounded-2xl border border-gray-200 max-w-xl mx-auto space-y-2.5">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                🧪 Quick 1-Click Pass Tester (Active Bookings)
              </span>
              <div className="space-y-1.5">
                {recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center justify-between text-xs font-semibold hover:border-[#176B4D] transition-colors"
                  >
                    <div>
                      <span className="font-mono text-gray-900 font-bold block">{b.vehicleNumber}</span>
                      <span className="text-[10px] text-gray-400">
                        Slot {b.slotNumber || 'Bay'} • ₹{b.totalAmount}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSimulatePass(b)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-[#176B4D] text-white rounded-lg text-[11px] font-bold hover:bg-[#12543c] transition-all"
                    >
                      Scan {scanType} Pass →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Success Feedback */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-4 max-w-xl mx-auto text-emerald-900"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-lg font-black text-emerald-950">
                    {scanType === 'ENTRY' ? 'ENTRY APPROVED — GATE OPEN' : 'EXIT COMPLETED — GATE OPEN'}
                  </h4>
                  <p className="text-xs font-semibold text-emerald-800">{result.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-bold pt-2 border-t border-emerald-200/60">
                <div className="p-3 bg-white/70 rounded-2xl">
                  <span className="text-emerald-700 block text-[10px] uppercase">Vehicle Number</span>
                  <span className="text-sm font-extrabold flex items-center gap-1">
                    <Car className="w-4 h-4 text-emerald-700" /> {result.vehicle_number}
                  </span>
                </div>
                <div className="p-3 bg-white/70 rounded-2xl">
                  <span className="text-emerald-700 block text-[10px] uppercase">Assigned Slot</span>
                  <span className="text-sm font-extrabold text-emerald-900">{result.slot_number}</span>
                </div>
                {result.overstay_charges !== undefined && (
                  <div className="p-3 bg-white/70 rounded-2xl col-span-2">
                    <span className="text-emerald-700 block text-[10px] uppercase">Overstay Charges Due</span>
                    <span className="text-base font-black text-emerald-950">
                      ₹{result.overstay_charges.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Verification Error Feedback */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-3 max-w-xl mx-auto"
            >
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </Card>
      </div>
    </StaffLayout>
  );
};
