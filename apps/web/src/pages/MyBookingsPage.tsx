import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  CheckCircle2,
  XCircle,
  AlertCircle,
  QrCode,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { bookingApi } from '../api/booking';
import { qrApi, QrPassItem } from '../api/qrApi';
import { Booking, BookingStatus } from '@parkease/shared';

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // QR Modal state
  const [selectedBookingForQr, setSelectedBookingForQr] = useState<Booking | null>(null);
  const [qrPasses, setQrPasses] = useState<QrPassItem[]>([]);
  const [loadingQr, setLoadingQr] = useState<boolean>(false);
  const [activeQrType, setActiveQrType] = useState<'ENTRY' | 'EXIT'>('ENTRY');

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingApi.getMyBookings();
      setBookings(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleOpenQrModal = async (booking: Booking) => {
    setSelectedBookingForQr(booking);
    setLoadingQr(true);
    try {
      const passes = await qrApi.getBookingQrPasses(booking.id);
      setQrPasses(passes);
      // Auto-set tab to EXIT if active, else ENTRY
      setActiveQrType(booking.status === BookingStatus.ACTIVE ? 'EXIT' : 'ENTRY');
    } catch (err: any) {
      alert(err?.message || 'Failed to load QR pass');
    } finally {
      setLoadingQr(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    setCancellingId(bookingId);
    try {
      await bookingApi.cancelBooking(bookingId);
      await fetchBookings();
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ACTIVE') return b.status === BookingStatus.ACTIVE;
    if (activeTab === 'UPCOMING') return b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING;
    if (activeTab === 'COMPLETED') return b.status === BookingStatus.COMPLETED;
    if (activeTab === 'CANCELLED') return b.status === BookingStatus.CANCELLED || b.status === BookingStatus.EXPIRED;
    return true;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
      case BookingStatus.PENDING:
        return (
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Upcoming
          </span>
        );
      case BookingStatus.ACTIVE:
        return (
          <span className="px-3 py-1 bg-green-100 text-[#176B4D] border border-[#72C98B] text-xs font-bold rounded-full flex items-center gap-1 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Active Session
          </span>
        );
      case BookingStatus.COMPLETED:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" /> Completed
          </span>
        );
      case BookingStatus.CANCELLED:
        return (
          <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-500" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
            {status}
          </span>
        );
    }
  };

  const activeQrPass = qrPasses.find((p) => p.type === activeQrType);

  return (
    <div className="min-h-screen bg-[#F7F9F5] py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18342A] flex items-center gap-3">
            <Calendar className="w-8 h-8 text-[#176B4D]" /> My Parking Reservations
          </h1>
          <p className="text-sm text-gray-600 font-medium mt-1">
            Manage your active, upcoming, and past parking spot bookings
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/find-parking')}
          className="bg-[#176B4D] hover:bg-[#12543c] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs"
        >
          Book New Parking
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        {(['ALL', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-[#176B4D] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab === 'ALL' ? 'All Bookings' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-600">Loading your reservations...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredBookings.length === 0 && (
        <Card className="p-12 bg-white border border-[#E8F6EC] text-center space-y-4 rounded-3xl">
          <div className="w-16 h-16 bg-[#E8F6EC] text-[#176B4D] rounded-full flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#18342A]">No Reservations Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {activeTab === 'ALL'
              ? 'You have not booked any parking slots yet. Search nearby parking to make your first reservation!'
              : `No ${activeTab.toLowerCase()} bookings available.`}
          </p>
          <Button onClick={() => navigate('/find-parking')}>Find Nearby Parking</Button>
        </Card>
      )}

      {/* Bookings List */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredBookings.map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="p-6 bg-white border border-[#E8F6EC] hover:border-[#72C98B] transition-all rounded-3xl shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gray-400">ID: {b.id.substring(0, 8)}</span>
                        {getStatusBadge(b.status)}
                      </div>
                      <h3 className="text-lg font-bold text-[#18342A]">{b.locationName || 'ParkEase Location'}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#176B4D]" /> {b.locationAddress || 'Vadodara'}
                      </p>
                    </div>

                    <div className="text-right sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                      <span className="text-2xl font-extrabold text-[#18342A]">₹{b.totalAmount}</span>
                      <span className="text-xs font-semibold text-gray-500">{b.totalHours} hrs duration</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
                    <div className="p-3 bg-[#F7F9F5] rounded-2xl border border-gray-100 space-y-0.5">
                      <span className="text-gray-400 block font-semibold">Slot Number</span>
                      <span className="text-sm font-extrabold text-[#176B4D]">{b.slotNumber || 'A-101'}</span>
                    </div>

                    <div className="p-3 bg-[#F7F9F5] rounded-2xl border border-gray-100 space-y-0.5">
                      <span className="text-gray-400 block font-semibold">Vehicle</span>
                      <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-[#176B4D]" /> {b.vehicleNumber}
                      </span>
                    </div>

                    <div className="p-3 bg-[#F7F9F5] rounded-2xl border border-gray-100 space-y-0.5">
                      <span className="text-gray-400 block font-semibold">Start Time</span>
                      <span className="text-xs font-bold text-gray-700">
                        {new Date(b.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div className="p-3 bg-[#F7F9F5] rounded-2xl border border-gray-100 space-y-0.5">
                      <span className="text-gray-400 block font-semibold">End Time</span>
                      <span className="text-xs font-bold text-gray-700">
                        {new Date(b.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-wrap justify-end gap-3">
                    {(b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING || b.status === BookingStatus.ACTIVE) && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenQrModal(b)}
                        className="bg-[#176B4D] hover:bg-[#12543c] text-white font-bold flex items-center gap-1.5 rounded-xl shadow-xs"
                      >
                        <QrCode className="w-4 h-4" /> View QR Pass
                      </Button>
                    )}

                    {(b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING) && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cancellingId === b.id}
                        onClick={() => handleCancelBooking(b.id)}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold rounded-xl"
                      >
                        {cancellingId === b.id ? 'Cancelling...' : 'Cancel Reservation'}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* QR PASS MODAL */}
      <AnimatePresence>
        {selectedBookingForQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-5 text-center"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#176B4D]" />
                  <h3 className="text-lg font-bold text-[#18342A]">Secure Gate QR Pass</h3>
                </div>
                <button
                  onClick={() => setSelectedBookingForQr(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Entry/Exit Selector */}
              <div className="flex bg-[#F7F9F5] p-1 rounded-2xl border border-gray-100">
                <button
                  onClick={() => setActiveQrType('ENTRY')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                    activeQrType === 'ENTRY'
                      ? 'bg-[#176B4D] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ENTRY QR PASS
                </button>
                <button
                  onClick={() => setActiveQrType('EXIT')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                    activeQrType === 'EXIT'
                      ? 'bg-[#176B4D] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  EXIT QR PASS
                </button>
              </div>

              {loadingQr ? (
                <div className="py-12 space-y-2">
                  <div className="w-8 h-8 border-3 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-500">Generating secure pass...</p>
                </div>
              ) : activeQrPass ? (
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-2xl border-2 border-[#176B4D] inline-block shadow-md">
                    <QRCodeSVG
                      value={activeQrPass.qr_payload}
                      size={180}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <div>
                    <span className="text-xs font-mono text-gray-400 block truncate px-4">
                      {activeQrPass.qr_payload.substring(0, 32)}...
                    </span>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      {activeQrPass.is_used ? (
                        <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full">
                          Pass Already Scanned (Used)
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                          Valid for Barrier Gate Scan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6">No QR pass generated yet.</p>
              )}

              <Button variant="outline" onClick={() => setSelectedBookingForQr(null)} className="w-full">
                Close
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
