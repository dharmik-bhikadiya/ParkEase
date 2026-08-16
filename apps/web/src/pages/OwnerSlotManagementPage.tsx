import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  X,
  Layers,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { parkingApi } from '../api/parkingApi';
import { ParkingLocation, ParkingSlot, SlotStatus, VehicleType } from '@parkease/shared';
import { OwnerLayout } from '../components/owner/OwnerLayout';
import { SelectDropdown } from '../components/ui/SelectDropdown';

export const OwnerSlotManagementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

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
      <OwnerLayout>
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm font-semibold text-gray-600">Loading Visual Slot Layout...</p>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout
      title={`Visual Slot Management — ${parking?.name || 'Parking Hub'}`}
      subtitle="Click any slot square below to block, unblock, change vehicle type, or set maintenance status."
    >
      <div className="space-y-6">

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
                  <SelectDropdown<string>
                    label="Allowed Vehicle Type"
                    options={[
                      { value: 'CAR', label: 'CAR (Standard)' },
                      { value: 'BIKE', label: 'BIKE (Two Wheeler)' },
                      { value: 'SUV', label: 'SUV (Large)' },
                      { value: 'EV', label: 'EV (Electric Vehicle)' },
                    ]}
                    value={vehicleType}
                    onChange={(val) => setVehicleType(val as any)}
                    size="sm"
                  />
                </div>

                <div>
                  <SelectDropdown<string>
                    label="Operational Slot Status"
                    options={[
                      { value: 'AVAILABLE', label: 'AVAILABLE (Open for drivers)' },
                      { value: 'OCCUPIED', label: 'OCCUPIED (Vehicle currently parked)' },
                      { value: 'RESERVED', label: 'RESERVED (Hold state)' },
                      { value: 'BLOCKED', label: 'BLOCKED (Manually disabled by owner)' },
                      { value: 'MAINTENANCE', label: 'MAINTENANCE (Under repair)' },
                    ]}
                    value={slotStatus}
                    onChange={(val) => setSlotStatus(val as any)}
                    size="sm"
                  />
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
    </OwnerLayout>
  );
};
