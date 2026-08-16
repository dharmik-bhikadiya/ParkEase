import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Star,
  Shield,
  Video,
  Zap,
  Car,
  Bike,
  ArrowLeft,
  CheckCircle2,
  X,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { parkingApi } from '../api/parkingApi';
import { bookingApi } from '../api/booking';
import { useAuth } from '../context/AuthContext';
import { ParkingLocation, ParkingSlot, SlotStatus } from '@parkease/shared';

export const ParkingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [parking, setParking] = useState<ParkingLocation | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSlotsModal, setShowSlotsModal] = useState<boolean>(false);
  const [activeFloorFilter, setActiveFloorFilter] = useState<string>('ALL');

  // Booking Modal State
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState<string>('GJ01AB1234');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const pData = await parkingApi.getParkingById(id);
        setParking(pData);
        const sData = await parkingApi.getSlots(id);
        setSlots(sData);
      } catch {
        // Handled in API wrapper
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F5] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-[#176B4D] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-semibold text-gray-600">Loading Parking Location Details...</p>
      </div>
    );
  }

  if (!parking) {
    return (
      <div className="min-h-screen bg-[#F7F9F5] flex flex-col items-center justify-center p-6 space-y-4">
        <h2 className="text-xl font-bold text-[#18342A]">Parking location not found</h2>
        <Button onClick={() => navigate('/find-parking')}>Back to Discovery</Button>
      </div>
    );
  }

  const pricing = parking.pricing || {
    id: 'p-1',
    locationId: parking.id,
    bikeHourlyPrice: 10,
    carHourlyPrice: 20,
    suvHourlyPrice: 30,
    evHourlyPrice: 25,
  };

  const floors = Array.from(new Set(slots.map((s) => s.floor || 'Ground')));
  const filteredSlots = activeFloorFilter === 'ALL' ? slots : slots.filter((s) => s.floor === activeFloorFilter);
  const availableSlotsCount = slots.filter((s) => s.status === SlotStatus.AVAILABLE).length;

  const handleSelectSlotForBooking = (slot: ParkingSlot) => {
    if (slot.status !== SlotStatus.AVAILABLE) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedSlot(slot);
    setBookingError(null);
  };

  const handleConfirmReservation = async () => {
    if (!selectedSlot || !parking) return;
    if (!vehicleNumber.trim()) {
      setBookingError('Please enter a valid vehicle registration number');
      return;
    }

    setSubmittingBooking(true);
    setBookingError(null);

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

    try {
      const result = await bookingApi.createBooking({
        location_id: parking.id,
        slot_id: selectedSlot.id,
        vehicle_number: vehicleNumber.toUpperCase().trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });

      setBookingSuccessData(result);
      setSelectedSlot(null);
      // Reload slots
      const updatedSlots = await parkingApi.getSlots(parking.id);
      setSlots(updatedSlots);
    } catch (err: any) {
      setBookingError(err?.message || 'Failed to create reservation. Please try again.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/find-parking')}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#176B4D] hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Discovery
      </button>

      {/* 1. HERO SECTION & IMAGES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden shadow-lg bg-gray-900 border border-[#176B4D]/20">
            <img
              src={parking.images?.[0] || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1200'}
              alt={parking.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#176B4D] text-white text-xs font-bold uppercase tracking-wider">
                  {parking.parkingType.replace('_', ' ')}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current text-amber-400" /> {parking.rating.toFixed(1)} Rating
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{parking.name}</h1>
              <p className="text-xs sm:text-sm text-gray-200 flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-[#72C98B]" /> {parking.address}, {parking.area}, {parking.city}
              </p>
            </div>
          </div>
        </div>

        {/* OVERVIEW SUMMARY CARD */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-6 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-gray-500">Starting From</span>
                <div className="text-3xl font-extrabold text-[#18342A]">
                  ₹{pricing.carHourlyPrice}
                  <span className="text-sm font-normal text-gray-500">/hr</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-500">Available Slots</span>
                <div className="text-base font-extrabold text-[#176B4D] flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {availableSlotsCount} / {slots.length} Available
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs font-medium text-[#18342A]">
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#176B4D]" /> Operating Hours
                </span>
                <span className="font-bold">{parking.openingTime} - {parking.closingTime}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Distance</span>
                <span className="font-bold">{(parking.distanceKm || 0.5).toFixed(1)} km away</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500">Status</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {parking.status}
                </span>
              </div>
            </div>

            {/* PRIMARY ACTION BUTTON */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowSlotsModal(true)}
              className="w-full bg-[#176B4D] hover:bg-[#12543c] text-white font-extrabold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2"
            >
              <Layers className="w-5 h-5" /> Reserve Parking Slot
            </Button>
          </Card>
        </div>
      </div>

      {/* 2. DESCRIPTION & VEHICLE PRICING MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-3">
            <h3 className="text-lg font-bold text-[#18342A]">About Parking Location</h3>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              {parking.description ||
                'Conveniently located parking facility equipped with standard modern infrastructure, security personnel, and automated slot allocation systems.'}
            </p>
          </Card>

          <Card className="p-6 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-[#18342A] flex items-center gap-2">
              <Car className="w-5 h-5 text-[#176B4D]" /> Vehicle Hourly Rates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-[#F7F9F5] rounded-2xl border border-[#E8F6EC] text-center space-y-1">
                <Bike className="w-5 h-5 text-[#176B4D] mx-auto" />
                <span className="text-xs font-semibold text-gray-500 block">Bike</span>
                <span className="text-lg font-extrabold text-[#18342A]">₹{pricing.bikeHourlyPrice}</span>
                <span className="text-[10px] text-gray-400 block">/ hour</span>
              </div>

              <div className="p-4 bg-[#E8F6EC] rounded-2xl border border-[#72C98B]/50 text-center space-y-1">
                <Car className="w-5 h-5 text-[#176B4D] mx-auto" />
                <span className="text-xs font-semibold text-[#176B4D] block">Car (Standard)</span>
                <span className="text-lg font-extrabold text-[#18342A]">₹{pricing.carHourlyPrice}</span>
                <span className="text-[10px] text-[#176B4D] block">/ hour</span>
              </div>

              <div className="p-4 bg-[#F7F9F5] rounded-2xl border border-[#E8F6EC] text-center space-y-1">
                <Car className="w-5 h-5 text-[#176B4D] mx-auto scale-110" />
                <span className="text-xs font-semibold text-gray-500 block">SUV / Large</span>
                <span className="text-lg font-extrabold text-[#18342A]">₹{pricing.suvHourlyPrice}</span>
                <span className="text-[10px] text-gray-400 block">/ hour</span>
              </div>

              <div className="p-4 bg-[#F7F9F5] rounded-2xl border border-[#E8F6EC] text-center space-y-1">
                <Zap className="w-5 h-5 text-emerald-600 mx-auto" />
                <span className="text-xs font-semibold text-gray-500 block">EV Vehicle</span>
                <span className="text-lg font-extrabold text-[#18342A]">₹{pricing.evHourlyPrice}</span>
                <span className="text-[10px] text-gray-400 block">/ hour</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-[#18342A]">Verified Facilities</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#F7F9F5] rounded-xl text-sm font-semibold">
                <span className="flex items-center gap-2.5 text-[#18342A]">
                  <Video className="w-4 h-4 text-[#176B4D]" /> 24/7 CCTV Surveillance
                </span>
                {parking.cctv ? <CheckCircle2 className="w-5 h-5 text-[#176B4D]" /> : <span className="text-xs text-gray-400">N/A</span>}
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F7F9F5] rounded-xl text-sm font-semibold">
                <span className="flex items-center gap-2.5 text-[#18342A]">
                  <Shield className="w-4 h-4 text-[#176B4D]" /> Guarded Security
                </span>
                {parking.security ? <CheckCircle2 className="w-5 h-5 text-[#176B4D]" /> : <span className="text-xs text-gray-400">N/A</span>}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 3. VISUAL SLOTS LAYOUT MODAL */}
      <AnimatePresence>
        {showSlotsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#18342A]">Select Parking Slot to Reserve</h3>
                  <p className="text-xs text-gray-500">
                    Click on any GREEN (Available) slot to proceed with instant reservation
                  </p>
                </div>
                <button
                  onClick={() => setShowSlotsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Color Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold bg-[#F7F9F5] p-3 rounded-2xl">
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#E8F6EC] border border-[#72C98B]" />
                  Available (Click to Book)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-gray-200 border border-gray-400" />
                  Occupied
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-200 border border-emerald-500" />
                  Reserved
                </span>
              </div>

              {/* Floor Tabs Filter */}
              {floors.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveFloorFilter('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${
                      activeFloorFilter === 'ALL'
                        ? 'bg-[#176B4D] text-white border-[#176B4D]'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    All Floors
                  </button>
                  {floors.map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFloorFilter(f)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${
                        activeFloorFilter === f
                          ? 'bg-[#176B4D] text-white border-[#176B4D]'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              {/* Slot Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {filteredSlots.map((slot) => {
                  const isAvailable = slot.status === SlotStatus.AVAILABLE;
                  let bgStyle = 'bg-[#E8F6EC] border-[#72C98B] text-[#176B4D] cursor-pointer hover:bg-[#d8f0e0] hover:scale-105';
                  if (slot.status === SlotStatus.OCCUPIED) bgStyle = 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed opacity-60';
                  if (slot.status === SlotStatus.RESERVED) bgStyle = 'bg-emerald-100 border-emerald-400 text-emerald-800 cursor-not-allowed opacity-60';
                  if (slot.status === SlotStatus.BLOCKED) bgStyle = 'bg-rose-50 border-rose-300 text-rose-700 cursor-not-allowed opacity-60';
                  if (slot.status === SlotStatus.MAINTENANCE) bgStyle = 'bg-amber-50 border-amber-300 text-amber-700 cursor-not-allowed opacity-60';

                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (isAvailable) {
                          setShowSlotsModal(false);
                          handleSelectSlotForBooking(slot);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-center font-extrabold transition-all shadow-xs space-y-0.5 ${bgStyle}`}
                    >
                      <span className="text-xs uppercase tracking-wider block font-bold text-gray-400">
                        {slot.floor}
                      </span>
                      <div className="text-lg">{slot.slotNumber}</div>
                      <span className="text-[10px] uppercase font-bold block">{slot.status}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. RESERVATION DRAWER / MODAL */}
      <AnimatePresence>
        {selectedSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#18342A]">Reserve Slot {selectedSlot.slotNumber}</h3>
                  <p className="text-xs text-gray-500">{parking.name}</p>
                </div>
                <button onClick={() => setSelectedSlot(null)} className="p-2 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bookingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Vehicle Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Vehicle Registration Number
                  </label>
                  <div className="relative">
                    <Car className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. GJ01AB1234"
                      className="w-full pl-11 pr-4 py-3 bg-[#F7F9F5] border border-gray-200 rounded-xl font-bold uppercase text-gray-800 focus:outline-none focus:border-[#176B4D]"
                    />
                  </div>
                </div>

                {/* Duration Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Parking Duration (Hours)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 5].map((hrs) => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => setDurationHours(hrs)}
                        className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                          durationHours === hrs
                            ? 'bg-[#176B4D] text-white border-[#176B4D]'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {hrs} {hrs === 1 ? 'Hour' : 'Hours'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cost Estimation Breakdown */}
                <div className="p-4 bg-[#F7F9F5] rounded-2xl border border-gray-200 space-y-2 text-xs font-medium text-gray-600">
                  <div className="flex justify-between">
                    <span>Hourly Rate</span>
                    <span className="font-bold text-gray-800">₹{pricing.carHourlyPrice} / hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Selected Duration</span>
                    <span className="font-bold text-gray-800">{durationHours} Hours</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-sm">
                    <span className="font-extrabold text-[#18342A]">Total Amount Payable</span>
                    <span className="font-extrabold text-xl text-[#176B4D]">
                      ₹{durationHours * pricing.carHourlyPrice}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setSelectedSlot(null)} className="w-1/2">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmReservation}
                  disabled={submittingBooking}
                  className="w-1/2 bg-[#176B4D] hover:bg-[#12543c] text-white font-bold"
                >
                  {submittingBooking ? 'Confirming...' : 'Confirm Reservation'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. BOOKING SUCCESS CONFIRMATION MODAL */}
      <AnimatePresence>
        {bookingSuccessData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-5"
            >
              <div className="w-16 h-16 bg-emerald-100 text-[#176B4D] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[#18342A]">Reservation Confirmed!</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Your parking slot has been reserved successfully.
                </p>
              </div>

              <div className="p-4 bg-[#F7F9F5] rounded-2xl border border-gray-200 text-left space-y-2 text-xs font-semibold text-gray-700">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-400">Booking ID</span>
                  <span className="font-mono text-gray-900 font-bold">{bookingSuccessData.id.substring(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Slot Number</span>
                  <span className="text-[#176B4D] font-extrabold">{bookingSuccessData.slot_number || 'A-101'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vehicle</span>
                  <span>{bookingSuccessData.vehicle_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Hours</span>
                  <span>{bookingSuccessData.total_hours} Hours</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-extrabold">
                  <span className="text-gray-900">Total Amount</span>
                  <span className="text-[#176B4D]">₹{bookingSuccessData.total_amount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setBookingSuccessData(null)} className="w-1/2">
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setBookingSuccessData(null);
                    navigate('/bookings');
                  }}
                  className="w-1/2 bg-[#176B4D] hover:bg-[#12543c] text-white font-bold"
                >
                  View My Bookings
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
