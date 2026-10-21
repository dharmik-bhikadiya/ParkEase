import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Wallet as WalletIcon,
  CreditCard,
  Building2,
  Zap,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
  Copy,
  Check,
  Banknote,
  ShieldCheck,
  Clock,
  Smartphone,
  X,
} from 'lucide-react';

import { Button } from '../ui/Button';
import { bookingApi } from '../../api/booking';
import { paymentApi } from '../../api/paymentApi';
import { walletApi } from '../../api/walletApi';
import { qrApi, QrPassItem } from '../../api/qrApi';
import { ParkingLocation, ParkingSlot, Wallet } from '@parkease/shared';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: ParkingSlot;
  parking: ParkingLocation;
  durationHours: number;
  vehicleNumber: string;
  totalAmount: number;
  onSuccess: (bookingData: any, entryQrPass: QrPassItem | null) => void;
}

export type PaymentMethodTab = 'UPI_QR' | 'WALLET' | 'UPI_ID' | 'CARD' | 'NET_BANKING' | 'PAY_AT_GATE';

const POPULAR_BANKS = [
  { id: 'HDFC', name: 'HDFC Bank', code: '024' },
  { id: 'SBI', name: 'State Bank of India', code: '002' },
  { id: 'ICICI', name: 'ICICI Bank', code: '009' },
  { id: 'AXIS', name: 'Axis Bank', code: '015' },
  { id: 'KOTAK', name: 'Kotak Mahindra', code: '028' },
  { id: 'PNB', name: 'Punjab National', code: '030' },
];

const UPI_APPS = [
  { name: 'Google Pay', color: '#4285F4' },
  { name: 'PhonePe', color: '#5f259f' },
  { name: 'Paytm', color: '#002e6e' },
  { name: 'BHIM UPI', color: '#00796b' },
  { name: 'Cred', color: '#1a1a1a' },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  slot,
  parking,
  durationHours,
  vehicleNumber,
  totalAmount,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<PaymentMethodTab>('UPI_QR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Wallet State
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [quickTopupSuccess, setQuickTopupSuccess] = useState<string | null>(null);

  // UPI QR State
  const [countdown, setCountdown] = useState<number>(300); // 5 minutes
  const [copiedUpi, setCopiedUpi] = useState(false);

  // UPI ID State
  const [upiId, setUpiId] = useState('');
  const [upiWaitingPrompt, setUpiWaitingPrompt] = useState(false);

  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  // Net Banking State
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Load wallet balance on mount / modal open
  useEffect(() => {
    if (isOpen) {
      walletApi
        .getWallet()
        .then((w) => setWallet(w))
        .catch(() => setWallet(null));
      setCountdown(300);
      setErrorMessage(null);
      setUpiWaitingPrompt(false);
      setShowOtpScreen(false);
    }
  }, [isOpen]);


  // Countdown timer for UPI QR
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && activeTab === 'UPI_QR' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, activeTab, countdown]);

  if (!isOpen) return null;

  const upiPayload = `upi://pay?pa=parkease.pay@okhdfcbank&pn=ParkEase%20Smart%20Parking&am=${totalAmount.toFixed(
    2
  )}&cu=INR&tn=Slot%20Reservation%20${slot.slotNumber}`;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('parkease.pay@okhdfcbank');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Format Card Number (adds space every 4 digits)
  const handleCardNumberChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    const chunks = cleaned.match(/.{1,4}/g);
    setCardNumber(chunks ? chunks.join(' ') : cleaned);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  // Quick Wallet Topup if balance is insufficient
  const handleQuickTopup = async (amountToAdd: number) => {
    try {
      setIsProcessing(true);
      const updated = await walletApi.topupWallet(amountToAdd, 'UPI_INSTANT');
      setWallet(updated);
      setQuickTopupSuccess(`Added ₹${amountToAdd} to wallet! Ready to pay.`);
      setTimeout(() => setQuickTopupSuccess(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Quick top-up failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Core Booking Execution
  const executeFinalBooking = async (paymentMethodUsed: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

    try {
      // 1. Create Slot Booking in Database
      const booking = await bookingApi.createBooking({
        location_id: parking.id,
        slot_id: slot.id,
        vehicle_number: vehicleNumber.toUpperCase().trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });

      // 2. Create / Record Payment
      if (paymentMethodUsed === 'WALLET') {
        try {
          await walletApi.payWithWallet(booking.id, totalAmount);
        } catch {
          // Fallback to payment order if direct pay endpoint fails
          await paymentApi.createPaymentOrder(booking.id, 'WALLET');
        }
      } else if (paymentMethodUsed !== 'PAY_AT_GATE') {

        const order = await paymentApi.createPaymentOrder(
          booking.id,
          paymentMethodUsed === 'UPI_QR' || paymentMethodUsed === 'UPI_ID'
            ? 'UPI'
            : paymentMethodUsed === 'CARD'
            ? 'CREDIT_CARD'
            : 'NET_BANKING'
        );
        if (order?.payment_id) {
          await paymentApi.verifyPayment(order.payment_id, `SIGN-${Date.now()}-${booking.id.substring(0, 6)}`);
        }
      }

      // 3. Fetch or Create Gate Passes for QR entry
      let entryPass: QrPassItem | null = null;
      try {
        const passes = await qrApi.getBookingQrPasses(booking.id);
        entryPass = passes.find((p) => p.type === 'ENTRY') || passes[0] || null;
      } catch (qrErr) {
        console.warn('Pass retrieval pending:', qrErr);
      }

      // 4. Return to parent with success
      onSuccess(booking, entryPass);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex items-center justify-center min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] sm:max-h-[90vh] border border-[#E8F6EC] my-auto overflow-hidden"
      >
        {/* Header - Fixed at Top */}
        <div className="bg-[#18342A] text-white px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#176B4D] text-[#72C98B] font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                Bay {slot.slotNumber}
              </span>
              <span className="text-xs text-gray-300 font-medium truncate max-w-[200px] sm:max-w-none">
                | {parking.name}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#72C98B] shrink-0" /> Secure Checkout & Gate Pass
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Cancel and close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Pricing & Reservation Summary Ribbon - Fixed under header */}
        <div className="bg-[#F7F9F5] px-5 py-2.5 sm:px-6 sm:py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-4 text-gray-700">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Vehicle Plate</span>
              <span className="font-mono font-black text-[#18342A] text-sm">{vehicleNumber}</span>
            </div>
            <div className="border-l border-gray-300 pl-4">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Duration</span>
              <span className="font-bold text-[#18342A]">
                {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Amount Payable</span>
            <span className="text-xl sm:text-2xl font-black text-[#176B4D]">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Payment Method Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Tab 1: UPI QR */}
              <button
                type="button"
                onClick={() => setActiveTab('UPI_QR')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-center gap-2.5 sm:gap-3 transition-all ${
                  activeTab === 'UPI_QR'
                    ? 'border-[#176B4D] bg-[#E8F6EC]/60 ring-2 ring-[#72C98B]/30'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'UPI_QR' ? 'bg-[#176B4D] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black block text-[#18342A] truncate">UPI QR Code</span>
                  <span className="text-[10px] text-gray-500 font-medium block truncate">Instant Scan & Pay</span>
                </div>
              </button>

              {/* Tab 2: ParkEase Wallet */}
              <button
                type="button"
                onClick={() => setActiveTab('WALLET')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-center gap-2.5 sm:gap-3 transition-all ${
                  activeTab === 'WALLET'
                    ? 'border-[#176B4D] bg-[#E8F6EC]/60 ring-2 ring-[#72C98B]/30'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'WALLET' ? 'bg-[#176B4D] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <WalletIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black block text-[#18342A] truncate">ParkEase Wallet</span>
                  <span className="text-[10px] text-emerald-700 font-bold block truncate">
                    Bal: ₹{wallet ? wallet.balance.toFixed(0) : '0'}
                  </span>
                </div>
              </button>

              {/* Tab 3: UPI ID (VPA) */}
              <button
                type="button"
                onClick={() => setActiveTab('UPI_ID')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-center gap-2.5 sm:gap-3 transition-all ${
                  activeTab === 'UPI_ID'
                    ? 'border-[#176B4D] bg-[#E8F6EC]/60 ring-2 ring-[#72C98B]/30'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'UPI_ID' ? 'bg-[#176B4D] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black block text-[#18342A] truncate">UPI ID / Apps</span>
                  <span className="text-[10px] text-gray-500 font-medium block truncate">GPay, PhonePe</span>
                </div>
              </button>

              {/* Tab 4: Credit / Debit Card */}
              <button
                type="button"
                onClick={() => setActiveTab('CARD')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-center gap-2.5 sm:gap-3 transition-all ${
                  activeTab === 'CARD'
                    ? 'border-[#176B4D] bg-[#E8F6EC]/60 ring-2 ring-[#72C98B]/30'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'CARD' ? 'bg-[#176B4D] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black block text-[#18342A] truncate">Cards</span>
                  <span className="text-[10px] text-gray-500 font-medium block truncate">Visa, RuPay, MC</span>
                </div>
              </button>

              {/* Tab 5: Net Banking */}
              <button
                type="button"
                onClick={() => setActiveTab('NET_BANKING')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-center gap-2.5 sm:gap-3 transition-all ${
                  activeTab === 'NET_BANKING'
                    ? 'border-[#176B4D] bg-[#E8F6EC]/60 ring-2 ring-[#72C98B]/30'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'NET_BANKING' ? 'bg-[#176B4D] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black block text-[#18342A] truncate">Net Banking</span>
                  <span className="text-[10px] text-gray-500 font-medium block truncate">SBI, HDFC, ICICI</span>
                </div>
              </button>

              {/* Tab 6: Pay at Gate */}
              <button
                type="button"
                onClick={() => setActiveTab('PAY_AT_GATE')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-center gap-2.5 sm:gap-3 transition-all ${
                  activeTab === 'PAY_AT_GATE'
                    ? 'border-[#176B4D] bg-[#E8F6EC]/60 ring-2 ring-[#72C98B]/30'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'PAY_AT_GATE' ? 'bg-[#176B4D] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black block text-[#18342A] truncate">Pay at Gate</span>
                  <span className="text-[10px] text-amber-700 font-bold block truncate">Pay on Arrival</span>
                </div>
              </button>
            </div>
          </div>

          {/* TAB CONTENT PANELS */}
          <div className="bg-[#F7F9F5] p-5 rounded-3xl border border-gray-200">
            {/* 1. UPI QR CODE PANEL */}
            {activeTab === 'UPI_QR' && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600 border-b border-gray-200 pb-2">
                  <span className="flex items-center gap-1.5 text-[#176B4D]">
                    <Smartphone className="w-4 h-4" /> Scan with any UPI app
                  </span>
                  <span className="font-mono text-rose-600 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Valid for: {formatTimer(countdown)}
                  </span>
                </div>

                <div className="py-1 flex flex-col items-center">
                  <div className="p-3 bg-white rounded-2xl border-2 border-[#176B4D] shadow-md inline-block">
                    <QRCodeSVG value={upiPayload} size={150} level="H" includeMargin={false} />
                  </div>
                  <p className="text-xs font-mono font-bold text-gray-700 mt-1">₹{totalAmount.toFixed(2)}</p>
                </div>

                {/* Supported Apps Badges */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {UPI_APPS.map((app) => (
                    <span
                      key={app.name}
                      className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 shadow-2xs"
                    >
                      {app.name}
                    </span>
                  ))}
                </div>

                {/* UPI ID copy */}
                <div className="flex items-center justify-center gap-2 pt-1 text-xs">
                  <span className="text-gray-500">UPI ID:</span>
                  <span className="font-mono font-bold text-[#18342A]">parkease.pay@okhdfcbank</span>
                  <button
                    onClick={handleCopyUpi}
                    className="p-1 text-gray-400 hover:text-[#176B4D] rounded-md transition-colors"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <Button
                  variant="primary"
                  onClick={() => executeFinalBooking('UPI_QR')}
                  disabled={isProcessing}
                  className="w-full bg-[#176B4D] hover:bg-[#12543c] text-white font-extrabold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Payment...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#72C98B]" /> I Have Paid ₹{totalAmount.toFixed(2)} — Issue Gate Pass
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* 2. WALLET PANEL */}
            {activeTab === 'WALLET' && (
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-2xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E8F6EC] text-[#176B4D] flex items-center justify-center">
                      <WalletIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 uppercase font-bold block">Available Balance</span>
                      <span className="text-2xl font-black text-[#18342A] font-mono">
                        ₹{wallet ? wallet.balance.toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>

                  {wallet && wallet.balance >= totalAmount ? (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sufficient Balance
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Low Balance
                    </span>
                  )}
                </div>

                {quickTopupSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {quickTopupSuccess}
                  </div>
                )}

                {/* If low balance, Quick Topup */}
                {wallet && wallet.balance < totalAmount && (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-2">
                    <span className="font-bold text-amber-900 block">
                      Shortfall: ₹{(totalAmount - wallet.balance).toFixed(2)}. Quick top-up to proceed:
                    </span>
                    <div className="flex items-center gap-2">
                      {[100, 200, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleQuickTopup(amt)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-bold text-amber-900 hover:bg-amber-100 transition-all text-xs"
                        >
                          + Add ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="primary"
                  onClick={() => executeFinalBooking('WALLET')}
                  disabled={isProcessing || !wallet || wallet.balance < totalAmount}
                  className="w-full bg-[#176B4D] hover:bg-[#12543c] text-white font-extrabold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Debiting Wallet...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> Pay ₹{totalAmount.toFixed(2)} with Wallet
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* 3. UPI ID (VPA) PANEL */}
            {activeTab === 'UPI_ID' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Enter UPI ID (Virtual Payment Address)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobile@ybl or username@okhdfcbank"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#176B4D]"
                  />
                </div>

                {/* Quick handle pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 font-bold">Quick:</span>
                  {['@okhdfcbank', '@okaxis', '@ybl', '@paytm', '@ibl'].map((handle) => (
                    <button
                      key={handle}
                      type="button"
                      onClick={() => {
                        const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId || 'username';
                        setUpiId(`${prefix}${handle}`);
                      }}
                      className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] font-bold text-gray-600 hover:border-[#176B4D]"
                    >
                      {handle}
                    </button>
                  ))}
                </div>

                {upiWaitingPrompt && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-900 space-y-1">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Payment request sent to {upiId}!</span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Open your UPI app and approve the request for ₹{totalAmount.toFixed(2)}.
                    </p>
                  </div>
                )}

                <Button
                  variant="primary"
                  onClick={() => {
                    if (!upiId.trim() || !upiId.includes('@')) {
                      setErrorMessage('Please enter a valid UPI ID (e.g. username@bank)');
                      return;
                    }
                    setUpiWaitingPrompt(true);
                    setTimeout(() => {
                      executeFinalBooking('UPI_ID');
                    }, 2000);
                  }}
                  disabled={isProcessing}
                  className="w-full bg-[#176B4D] hover:bg-[#12543c] text-white font-extrabold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Verifying UPI Approval...' : `Send UPI Request for ₹${totalAmount.toFixed(2)}`}
                </Button>
              </div>
            )}

            {/* 4. CREDIT / DEBIT CARD PANEL */}
            {activeTab === 'CARD' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      placeholder="4532 •••• •••• 8901"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-mono font-bold text-gray-800 focus:outline-none focus:border-[#176B4D]"
                    />
                    <CreditCard className="w-5 h-5 text-gray-400 absolute right-4 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="e.g. AMIT SHARMA"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold uppercase text-gray-800 focus:outline-none focus:border-[#176B4D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      placeholder="12/28"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-mono font-bold text-gray-800 focus:outline-none focus:border-[#176B4D]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      CVV / CVC
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="•••"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-mono font-bold text-gray-800 focus:outline-none focus:border-[#176B4D]"
                    />
                  </div>
                </div>

                {showOtpScreen ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-emerald-900 block">
                      3D Secure OTP verification sent to registered phone (Simulated: 123456)
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:outline-none"
                    />
                    <Button
                      variant="primary"
                      onClick={() => executeFinalBooking('CARD')}
                      disabled={isProcessing}
                      className="w-full bg-[#176B4D] hover:bg-[#12543c] text-white font-bold"
                    >
                      {isProcessing ? 'Authorizing Card...' : 'Confirm OTP & Pay'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 12) {
                        setErrorMessage('Please enter a valid 16-digit card number.');
                        return;
                      }
                      setShowOtpScreen(true);
                      setOtpInput('123456');
                    }}
                    disabled={isProcessing}
                    className="w-full bg-[#176B4D] hover:bg-[#12543c] text-white font-extrabold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" /> Pay ₹{totalAmount.toFixed(2)} with Card
                  </Button>
                )}
              </div>
            )}

            {/* 5. NET BANKING PANEL */}
            {activeTab === 'NET_BANKING' && (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Select Your Bank
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {POPULAR_BANKS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBank(b.id)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        selectedBank === b.id
                          ? 'border-[#176B4D] bg-white ring-2 ring-[#72C98B]/30'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <Building2
                        className={`w-5 h-5 mx-auto mb-1 ${
                          selectedBank === b.id ? 'text-[#176B4D]' : 'text-gray-400'
                        }`}
                      />
                      <span className="text-xs font-bold block text-gray-800">{b.name}</span>
                    </button>
                  ))}
                </div>

                <Button
                  variant="primary"
                  onClick={() => executeFinalBooking('NET_BANKING')}
                  disabled={isProcessing}
                  className="w-full bg-[#176B4D] hover:bg-[#12543c] text-white font-extrabold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Connecting to Bank...' : `Proceed to ${selectedBank} NetBanking`}
                </Button>
              </div>
            )}

            {/* 6. PAY AT GATE PANEL */}
            {activeTab === 'PAY_AT_GATE' && (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
                  <Banknote className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-[#18342A]">Reserve Now, Pay on Arrival</h4>
                  <p className="text-xs text-gray-600 max-w-sm mx-auto">
                    Your spot will be locked immediately. You can pay ₹{totalAmount.toFixed(2)} via Cash, UPI, or Card
                    directly at the gate barrier.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-gray-200 text-xs text-left font-medium text-gray-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant Barrier Gate QR pass issued
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free cancellation before entry
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => executeFinalBooking('PAY_AT_GATE')}
                  disabled={isProcessing}
                  className="w-full bg-[#176B4D] hover:bg-[#12543c] text-white font-extrabold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Locking Spot...' : 'Confirm Reservation & Get Gate Pass'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
