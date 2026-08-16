import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { Card } from '../../components/ui/Card';
import { parkingApi } from '../../api/parkingApi';
import { ParkingLocation, ParkingSlot } from '@parkease/shared';
import { SelectDropdown } from '../../components/ui/SelectDropdown';

export const StaffSlotsPage: React.FC = () => {
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const res = await parkingApi.getOwnerLocations();
        setLocations(res || []);
        if (res && res.length > 0) {
          setSelectedLocationId(res[0].id);
        }
      } catch {
        // Handled in API client
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    if (!selectedLocationId) return;
    const fetchSlots = async () => {
      try {
        const res = await parkingApi.getSlots(selectedLocationId);
        setSlots(res || []);
      } catch {
        setSlots([]);
      }
    };
    fetchSlots();
  }, [selectedLocationId]);

  return (
    <StaffLayout
      title="Parking Slot Occupancy Visualizer"
      subtitle="Visual layout grid for monitoring real-time slot availability and occupied bays."
    >
      <div className="space-y-6">
        {/* Location Selector */}
        {locations.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-[#E8F6EC] shadow-2xs flex items-center justify-between gap-4">
            <label className="text-xs font-extrabold text-[#18342A] uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#176B4D]" /> Select Assigned Parking Hub:
            </label>
            <div className="w-72">
              <SelectDropdown
                options={locations.map((loc) => ({
                  value: loc.id,
                  label: `${loc.name} (${loc.city})`,
                  description: `${loc.totalSlots} Total Slots`,
                }))}
                value={selectedLocationId}
                onChange={(val) => setSelectedLocationId(val)}
                size="sm"
              />
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-4 bg-white rounded-2xl border border-gray-100 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500" />
            <span>AVAILABLE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-blue-500" />
            <span>RESERVED</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-rose-500" />
            <span>OCCUPIED</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-gray-400" />
            <span>MAINTENANCE / DISABLED</span>
          </div>
        </div>

        {/* Visual Slots Grid */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-xs text-gray-500 font-medium">Loading slots...</p>
          </div>
        ) : slots.length === 0 ? (
          <Card className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-300">
            <p className="text-xs text-gray-500">No slot layout found for the selected parking location.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {slots.map((slot) => {
              const isAvailable = slot.status === 'AVAILABLE';
              const isOccupied = slot.status === 'OCCUPIED';
              const isReserved = slot.status === 'RESERVED';

              return (
                <div
                  key={slot.id}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col justify-between h-24 ${
                    isAvailable
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : isOccupied
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : isReserved
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-gray-100 border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-[10px] font-bold block text-gray-500 uppercase">{slot.floor}</span>
                  <span className="text-lg font-black tracking-tight">{slot.slotNumber}</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider block">
                    {slot.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StaffLayout>
  );
};
