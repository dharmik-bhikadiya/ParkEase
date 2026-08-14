import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  CreditCard,
  Building2,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { walletApi } from '../api/walletApi';
import { Wallet, WalletTransaction, TransactionType } from '@parkease/shared';

export const WalletPage: React.FC = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Top-Up Modal State
  const [showTopupModal, setShowTopupModal] = useState<boolean>(false);
  const [topupAmount, setTopupAmount] = useState<number>(500);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [submittingTopup, setSubmittingTopup] = useState<boolean>(false);
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [wData, tData] = await Promise.all([
        walletApi.getWallet(),
        walletApi.getTransactions(),
      ]);
      setWallet(wData);
      setTransactions(tData || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleTopup = async () => {
    if (topupAmount <= 0) {
      alert('Top-up amount must be greater than zero');
      return;
    }

    setSubmittingTopup(true);
    try {
      const updatedWallet = await walletApi.topupWallet(topupAmount, paymentMethod);
      setWallet(updatedWallet);
      const tData = await walletApi.getTransactions();
      setTransactions(tData || []);
      setTopupSuccess(`Successfully added ₹${topupAmount} to your wallet!`);
      setShowTopupModal(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to complete top-up');
    } finally {
      setSubmittingTopup(false);
    }
  };

  const getTransactionBadge = (type: TransactionType) => {
    switch (type) {
      case TransactionType.TOPUP:
      case TransactionType.REFUND:
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Credit
          </span>
        );
      case TransactionType.BOOKING_PAYMENT:
      case TransactionType.OVERSTAY_CHARGE:
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Debit
          </span>
        );
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">{type}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#18342A] flex items-center gap-3">
            <WalletIcon className="w-8 h-8 text-[#176B4D]" /> ParkEase Digital Wallet
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Seamless instant payments, automatic refunds, and transaction tracking.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setTopupSuccess(null);
            setShowTopupModal(true);
          }}
          className="bg-[#176B4D] hover:bg-[#12543c] text-white font-extrabold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-md"
        >
          <PlusCircle className="w-5 h-5" /> Add Money to Wallet
        </Button>
      </div>

      {topupSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {topupSuccess}
          </span>
          <button onClick={() => setTopupSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Balance Card */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 bg-gradient-to-br from-[#18342A] via-[#176B4D] to-[#12543c] text-white rounded-3xl shadow-xl space-y-6 relative overflow-hidden border border-[#72C98B]/30">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <WalletIcon className="w-48 h-48 text-white" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#72C98B]">Digital Balance</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>

            <div>
              <span className="text-xs font-medium text-gray-300">Available Balance</span>
              <div className="text-4xl font-black tracking-tight text-white mt-1">
                ₹{wallet ? wallet.balance.toFixed(2) : '0.00'}
                <span className="text-sm font-semibold text-[#72C98B] ml-2">{wallet?.currency || 'INR'}</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold text-gray-200 block uppercase tracking-wider">
                Instant Top-Up Presets
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[100, 200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setTopupAmount(amt);
                      setShowTopupModal(true);
                    }}
                    className="py-2 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-xl text-xs font-extrabold text-white transition-all border border-white/20"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Transaction History Section */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-[#18342A] flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#176B4D]" /> Transaction Log
              </h2>
              <span className="text-xs font-bold text-gray-400">{transactions.length} Total</span>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-3 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-2 text-xs text-gray-500">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <WalletIcon className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-bold text-[#18342A]">No Transactions Yet</p>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Top up your wallet to make instant parking reservations without entering payment details every time.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 bg-[#F7F9F5] rounded-2xl border border-gray-100 flex items-center justify-between gap-3 text-xs font-medium hover:border-[#72C98B] transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        {getTransactionBadge(t.type)}
                        <span className="font-extrabold text-[#18342A]">{t.description}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 block">
                        {new Date(t.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-sm font-black ${
                          t.amount >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {t.amount >= 0 ? `+₹${t.amount}` : `-₹${Math.abs(t.amount)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* TOPUP MODAL */}
      <AnimatePresence>
        {showTopupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-xl font-extrabold text-[#18342A]">Top Up Wallet Balance</h3>
                <button
                  onClick={() => setShowTopupModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Amount Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Enter Top-Up Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Number(e.target.value))}
                    min={10}
                    step={50}
                    className="w-full px-4 py-3 bg-[#F7F9F5] border border-gray-200 rounded-xl font-extrabold text-xl text-gray-800 focus:outline-none focus:border-[#176B4D]"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-2">
                  {[100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(amt)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                        topupAmount === amt
                          ? 'bg-[#176B4D] text-white border-[#176B4D]'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`p-3 rounded-2xl border text-center font-bold text-xs space-y-1 transition-all ${
                        paymentMethod === 'UPI'
                          ? 'bg-[#E8F6EC] border-[#72C98B] text-[#176B4D]'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 mx-auto text-[#176B4D]" />
                      <span>UPI Instant</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`p-3 rounded-2xl border text-center font-bold text-xs space-y-1 transition-all ${
                        paymentMethod === 'CARD'
                          ? 'bg-[#E8F6EC] border-[#72C98B] text-[#176B4D]'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mx-auto text-[#176B4D]" />
                      <span>Credit/Debit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('NETBANKING')}
                      className={`p-3 rounded-2xl border text-center font-bold text-xs space-y-1 transition-all ${
                        paymentMethod === 'NETBANKING'
                          ? 'bg-[#E8F6EC] border-[#72C98B] text-[#176B4D]'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      <Building2 className="w-5 h-5 mx-auto text-[#176B4D]" />
                      <span>NetBanking</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowTopupModal(false)} className="w-1/2">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleTopup}
                  disabled={submittingTopup}
                  className="w-1/2 bg-[#176B4D] hover:bg-[#12543c] text-white font-bold"
                >
                  {submittingTopup ? 'Processing...' : `Add ₹${topupAmount}`}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
