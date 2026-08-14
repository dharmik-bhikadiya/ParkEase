import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Edit2,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { parkingApi } from '../api/parkingApi';
import { ParkingLocation, ParkingSlot, SlotStatus, VehicleType } from '@parkease/shared';

export const OwnerSlotManagementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [parking, setParking] = useState<ParkingLocation | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Slot Form State
  const [slotNumber, setSlotNumber] = useState<string>('');
  const [floor, setFloor] = useState<string>('Ground');
  const [section, setSection] = useState<string>('Section A');
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.CAR);
  const [slotStatus, setSlotStatus] = useState<SlotStatus>(SlotStatus.AVAILABLE);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const pData = await parkingApi.getParkingById(id);
      setParking(pData);
      const sData = await parkingApi.getSlots(id);
      setSlots(sData);
    } catch {
      // Handled in API client
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const openEditModal = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    setSlotNumber(slot.slotNumber);
    setFloor(slot.floor || 'Ground');
    setSection(slot.section || 'Section A');
    setVehicleType(slot.vehicleType || VehicleType.CAR);
    setSlotStatus(slot.status);
    setIsEditModalOpen(true);
  };

  const handleUpdateSlot = async () => {
    if (!id || !selectedSlot) return;
    try {
      await parkingApi.updateSlot(id, selectedSlot.id, {
        slotNumber,
        floor,
        section,
        vehicleType,
        status: slotStatus,
      });
      setIsEditModalOpen(false);
      loadData();
    } catch {
      setIsEditModalOpen(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!id || !slotNumber) return;
    try {
      await parkingApi.createSlot(id, {
        slotNumber,
        floor,
        section,
        vehicleType,
        status: slotStatus,
      });
      setIsCreateModalOpen(false);
      loadData();
    } catch {
      setIsCreateModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F5] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-[#176B4D] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-semibold text-gray-600">Loading Visual Slot Layout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F5] py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/owner/dashboard')}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#176B4D] hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Owner Dashboard
      </button>

      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F6EC] text-[#176B4D] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Interactive Grid Control
          </div>
          <h1 className="text-3xl font-extrabold text-[#18342A] tracking-tight">
            Visual Slot Management — {parking?.name}
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Click any slot square below to block, unblock, change vehicle type, or set maintenance status.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setSlotNumber(`A${slots.length + 1}`);
            setIsCreateModalOpen(true);
          }}
          className="bg-[#176B4D] hover:bg-[#12543c] text-white font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add Extra Slot
        </Button>
      </div>

      {/* STATUS COLOR LEGEND BAR */}
      <Card className="p-4 bg-white border border-[#E8F6EC] shadow-xs rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
          <span className="text-gray-500 font-extrabold uppercase text-[11px] tracking-wider">Status Legend:</span>

          <div className="flex flex-wrap items-center gap-5">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-[#E8F6EC] border-2 border-[#72C98B]" />
              AVAILABLE (Soft Green)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-gray-200 border-2 border-gray-400" />
              OCCUPIED (Gray)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-emerald-200 border-2 border-emerald-500" />
              RESERVED (Light Green)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-rose-100 border-2 border-rose-400" />
              BLOCKED (Soft Red)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-amber-100 border-2 border-amber-400" />
              MAINTENANCE (Soft Amber)
            </span>
          </div>
        </div>
      </Card>

      {/* VISUAL SLOT LAYOUT GRID */}
      <Card className="p-6 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-lg font-extrabold text-[#18342A] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#176B4D]" /> Active Slot Array ({slots.length} Total)
          </h2>
          <span className="text-xs text-gray-500 font-medium">Click slot card to configure</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {slots.map((slot) => {
            let bgStyle = 'bg-[#E8F6EC] border-[#72C98B] text-[#176B4D] hover:ring-2 hover:ring-[#176B4D]/30';
            if (slot.status === 'OCCUPIED') bgStyle = 'bg-gray-100 border-gray-300 text-gray-600';
            if (slot.status === 'RESERVED') bgStyle = 'bg-emerald-100 border-emerald-400 text-emerald-800';
            if (slot.status === 'BLOCKED') bgStyle = 'bg-rose-50 border-rose-300 text-rose-700';
            if (slot.status === 'MAINTENANCE') bgStyle = 'bg-amber-50 border-amber-300 text-amber-800';

            return (
              <motion.div
                key={slot.id}
                whileHover={{ scale: 1.04 }}
                onClick={() => openEditModal(slot)}
                className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all shadow-xs space-y-1 ${bgStyle}`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span>{slot.floor}</span>
                  <Edit2 className="w-3 h-3 text-gray-400" />
                </div>
                <div className="text-xl font-extrabold tracking-tight">{slot.slotNumber}</div>
                <span className="text-[10px] font-extrabold block uppercase tracking-wider">{slot.status}</span>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* EDIT SLOT MODAL */}
      <AnimatePresence>
        {isEditModalOpen && selectedSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-extrabold text-[#18342A]">
                  Configure Slot {selectedSlot.slotNumber}
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-bold">
                <div>
                  <label className="text-gray-600 block mb-1">Slot Identifier Number</label>
                  <Input value={slotNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlotNumber(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 block mb-1">Floor Level</label>
                    <Input value={floor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFloor(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-gray-600 block mb-1">Section</label>
                    <Input value={section} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSection(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="text-gray-600 block mb-1">Allowed Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVehicleType(e.target.value as any)}
                    className="w-full p-2.5 bg-[#F7F9F5] border border-gray-200 rounded-xl text-xs font-bold text-[#18342A] outline-none"
                  >
                    <option value="CAR">CAR (Standard)</option>
                    <option value="BIKE">BIKE (Two Wheeler)</option>
                    <option value="SUV">SUV (Large)</option>
                    <option value="EV">EV (Electric Vehicle)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-600 block mb-1">Operational Slot Status</label>
                  <select
                    value={slotStatus}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSlotStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-[#F7F9F5] border border-gray-200 rounded-xl text-xs font-bold text-[#18342A] outline-none"
                  >
                    <option value="AVAILABLE">AVAILABLE (Open for drivers)</option>
                    <option value="OCCUPIED">OCCUPIED (Vehicle currently parked)</option>
                    <option value="RESERVED">RESERVED (Hold state)</option>
                    <option value="BLOCKED">BLOCKED (Manually disabled by owner)</option>
                    <option value="MAINTENANCE">MAINTENANCE (Under repair)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleUpdateSlot} className="bg-[#176B4D] text-white">
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE SLOT MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-extrabold text-[#18342A]">Add New Parking Slot</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-bold">
                <div>
                  <label className="text-gray-600 block mb-1">Slot Identifier Number</label>
                  <Input value={slotNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlotNumber(e.target.value)} placeholder="e.g. A25" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 block mb-1">Floor Level</label>
                    <Input value={floor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFloor(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-gray-600 block mb-1">Section</label>
                    <Input value={section} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSection(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleCreateSlot} className="bg-[#176B4D] text-white">
                  Create Slot
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
