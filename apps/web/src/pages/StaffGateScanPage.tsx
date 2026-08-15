import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, ArrowRightLeft, CheckCircle2, AlertCircle, RefreshCw, Car } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { qrApi } from '../api/qrApi';
import { StaffLayout } from '../components/staff/StaffLayout';

export const StaffGateScanPage: React.FC = () => {
  const [scanType, setScanType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [payloadInput, setPayloadInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcessScan = async () => {
    if (!payloadInput.trim()) {
      alert('Please enter or scan a valid QR pass payload string.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (scanType === 'ENTRY') {
        const res = await qrApi.scanEntry(payloadInput.trim());
        setResult(res);
      } else {
        const res = await qrApi.scanExit(payloadInput.trim());
        setResult(res);
      }
    } catch (err: any) {
      setError(err?.message || 'QR Verification failed');
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
              scanType === 'ENTRY'
                ? 'bg-[#176B4D] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
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
              scanType === 'EXIT'
                ? 'bg-[#176B4D] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" /> EXIT GATE SCAN
          </button>
        </div>

        {/* Input Payload Form */}
        <div className="space-y-3 max-w-xl mx-auto">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Scan or Enter Payload String ({scanType} GATE)
          </label>
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
              onClick={handleProcessScan}
              disabled={loading}
              className="bg-[#176B4D] hover:bg-[#12543c] text-white font-bold px-6 rounded-2xl flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              {loading ? 'Verifying...' : 'Validate Gate Pass'}
            </Button>
          </div>
        </div>

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
                  {scanType === 'ENTRY' ? 'ENTRY APPROVED' : 'EXIT COMPLETED'}
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
                  <span className="text-base font-black text-emerald-950">₹{result.overstay_charges.toFixed(2)}</span>
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
