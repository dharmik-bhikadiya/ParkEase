import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Sliders, ArrowUpRight, Search, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { OwnerLayout } from '../../components/owner/OwnerLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { parkingApi } from '../../api/parkingApi';
import { ParkingLocation } from '@parkease/shared';

export const OwnerLocationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED'>('ALL');

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const res = await parkingApi.getOwnerLocations();
        setLocations(res || []);
      } catch {
        // Handled in API client
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || loc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <OwnerLayout
      title="My Parking Locations"
      subtitle="View, edit, and configure all parking hubs registered under your owner account."
    >
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E8F6EC] shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search location by name, city, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F9F5] border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#72C98B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#F7F9F5] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none text-[#18342A]"
            >
              <option value="ALL">All Statuses ({locations.length})</option>
              <option value="ACTIVE">Approved / Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <Button
              variant="primary"
              onClick={() => navigate('/owner/parking/new')}
              className="bg-[#176B4D] hover:bg-[#12543c] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Location
            </Button>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-xs text-gray-500 font-medium">Fetching parking locations...</p>
          </div>
        ) : filteredLocations.length === 0 ? (
          <Card className="p-12 text-center space-y-4 bg-white rounded-3xl border border-dashed border-gray-300">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#18342A]">No Parking Locations Found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'No location matches your filter parameters. Clear search or filters to see all.'
                  : 'You have not registered any parking location yet. Click below to get started.'}
              </p>
            </div>
            {searchTerm || statusFilter !== 'ALL' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                className="text-xs font-bold text-[#176B4D]"
              >
                Clear Search & Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => navigate('/owner/parking/new')}
                className="bg-[#176B4D] text-white text-xs font-bold"
              >
                Add Your First Location
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((loc) => {
              const isApproved = (loc.status as string) === 'ACTIVE' || (loc.status as string) === 'APPROVED';
              const isPending = (loc.status as string) === 'PENDING_APPROVAL';

              return (
                <Card
                  key={loc.id}
                  className="p-5 bg-white border border-[#E8F6EC] shadow-sm hover:shadow-md rounded-3xl space-y-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#F7F9F5] text-gray-600 uppercase tracking-wider">
                        {loc.parkingType.replace('_', ' ')}
                      </span>
                      <h3 className="font-extrabold text-lg text-[#18342A] mt-1">{loc.name}</h3>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md shrink-0 uppercase tracking-wider flex items-center gap-1 ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isPending
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                      {isPending && <Clock className="w-3 h-3 text-amber-700" />}
                      {!isApproved && !isPending && <XCircle className="w-3 h-3 text-rose-700" />}
                      {loc.status}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-gray-600 space-y-1">
                    <p className="truncate">📍 {loc.address}, {loc.city}</p>
                    <p>🕒 {loc.openingTime} - {loc.closingTime}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#F7F9F5] rounded-2xl text-xs">
                    <div>
                      <span className="text-gray-400 block font-semibold text-[10px]">Total Capacity</span>
                      <span className="font-extrabold text-[#18342A] text-sm">{loc.totalSlots} Slots</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-semibold text-[10px]">Available</span>
                      <span className="font-extrabold text-[#176B4D] text-sm">{loc.availableSlots} Free</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/owner/parking/${loc.id}/slots`)}
                      className="flex-1 text-xs font-bold py-2 border-[#176B4D] text-[#176B4D] hover:bg-[#E8F6EC]"
                    >
                      <Sliders className="w-3.5 h-3.5 mr-1" /> Manage Slots
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/parking/${loc.id}`)}
                      className="bg-[#176B4D] text-white text-xs font-bold py-2 px-3"
                      title="View Public Details"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};
