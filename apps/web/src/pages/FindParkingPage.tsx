import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Star,
  Zap,
  Shield,
  Video,
  Warehouse,
  X,
  ArrowUpDown,
  Compass,
  ChevronRight,
  Layers,
  Car,
  Building2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SelectDropdown, DropdownOption } from '../components/ui/SelectDropdown';
import { parkingApi } from '../api/parkingApi';
import { ParkingLocation, SearchParkingParams } from '@parkease/shared';

const SORT_OPTIONS: DropdownOption<'distance' | 'price' | 'availability' | 'rating'>[] = [
  { value: 'distance', label: 'Nearest First', description: 'Closest distance to location', icon: <MapPin className="w-4 h-4" /> },
  { value: 'price', label: 'Lowest Price', description: 'Affordable hourly rates', icon: <ArrowUpDown className="w-4 h-4" /> },
  { value: 'availability', label: 'Most Slots', description: 'Maximum free parking slots', icon: <Layers className="w-4 h-4" /> },
  { value: 'rating', label: 'Highest Rating', description: 'Top customer reviewed lots', icon: <Star className="w-4 h-4 text-amber-500" /> },
];

const CITY_OPTIONS: DropdownOption[] = [
  { value: '', label: 'All Cities', description: 'Search across Gujarat & India' },
  { value: 'Ahmedabad', label: 'Ahmedabad', description: 'SG Highway, Station, Airport' },
  { value: 'Vadodara', label: 'Vadodara', description: 'Alkapuri, Station, Sayajigunj' },
  { value: 'Surat', label: 'Surat', description: 'Ring Road, Vesu, Station' },
  { value: 'Rajkot', label: 'Rajkot', description: 'Kalawad Road, Yagnik Road' },
];

const VEHICLE_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'ALL', label: 'All Vehicles', description: 'Show all parking spots', icon: <Car className="w-4 h-4" /> },
  { value: 'CAR', label: 'Car / Sedan / SUV', description: '4-Wheeler parking slots', icon: <Car className="w-4 h-4" /> },
  { value: 'BIKE', label: 'Motorbike / Scooter', description: '2-Wheeler parking slots' },
  { value: 'EV', label: 'EV Electric Vehicle', description: 'Spots with charging stations', icon: <Zap className="w-4 h-4 text-emerald-600" /> },
];

const PARKING_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'ALL', label: 'All Categories', description: 'Malls, Stations, Airports & more', icon: <Building2 className="w-4 h-4" /> },
  { value: 'RAILWAY_STATION', label: 'Railway Station', description: '24/7 guarded station parking' },
  { value: 'AIRPORT', label: 'Airport Terminal', description: 'Long & short term airport parking' },
  { value: 'BUS_STAND', label: 'Central Bus Stand', description: 'Convenient bus terminal parking' },
  { value: 'MALL', label: 'Shopping Mall', description: 'Covered mall parking' },
  { value: 'HOSPITAL', label: 'Hospital & Medical', description: 'Emergency & visitor parking' },
  { value: 'CINEMA', label: 'Cinema & Multiplex', description: 'Entertainment hub parking' },
  { value: 'TOURIST_PLACE', label: 'Tourist Destination', description: 'Sightseeing & heritage parking' },
];

export const FindParkingPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedSpot, setSelectedSpot] = useState<ParkingLocation | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Filters State
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('ALL');
  const [selectedParkingType, setSelectedParkingType] = useState<string>('ALL');
  const [maxPrice, setMaxPrice] = useState<number>(100);
  const [filterCovered, setFilterCovered] = useState<boolean>(false);
  const [filterCctv, setFilterCctv] = useState<boolean>(false);
  const [filterEv, setFilterEv] = useState<boolean>(false);
  const [filterSecurity, setFilterSecurity] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'availability' | 'rating'>('distance');

  const fetchParkingLocations = async () => {
    setLoading(true);
    try {
      const combinedQuery = [searchQuery, selectedCity].filter(Boolean).join(' ');
      const params: SearchParkingParams = {
        query: combinedQuery || undefined,
        vehicleType: selectedVehicleType !== 'ALL' ? (selectedVehicleType as any) : undefined,
        parkingType: selectedParkingType !== 'ALL' ? (selectedParkingType as any) : undefined,
        maxPrice: maxPrice < 100 ? maxPrice : undefined,
        coveredParking: filterCovered || undefined,
        cctv: filterCctv || undefined,
        evCharging: filterEv || undefined,
        security: filterSecurity || undefined,
        minRating: minRating > 0 ? minRating : undefined,
        sortBy: sortBy,
      };
      const res = await parkingApi.searchParking(params);
      setLocations(res);
      if (res.length > 0 && !selectedSpot) {
        setSelectedSpot(res[0]);
      }
    } catch {
      // Handled in API client
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingLocations();
  }, [selectedCity, selectedVehicleType, selectedParkingType, maxPrice, filterCovered, filterCctv, filterEv, filterSecurity, minRating, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParkingLocations();
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      {/* 1. TOP HEADER & SEARCH BAR */}
      <div className="relative z-40 space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F6EC] text-[#176B4D] text-xs font-bold border border-[#72C98B]/30 mb-2">
            <Compass className="w-3.5 h-3.5" />
            Live Parking Discovery
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#18342A] tracking-tight">
            Find & Explore Parking
          </h1>
          <p className="text-sm text-[#18342A]/70 font-normal">
            Real-time slot availability, verified amenities, and transparent hourly pricing.
          </p>
        </div>

        {/* Search Bar Component */}
        <Card className="p-3 bg-white border border-[#176B4D]/20 shadow-md shadow-[#18342A]/5 rounded-2xl overflow-visible">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center gap-2.5 w-full px-4 py-2.5 bg-[#F7F9F5] rounded-xl border border-transparent focus-within:border-[#176B4D]/40 focus-within:bg-white transition-all">
              <MapPin className="w-5 h-5 text-[#176B4D] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destination, city, area (e.g. Vadodara Station, Airport, Mall)..."
                className="bg-transparent border-none outline-none w-full text-[#18342A] placeholder-gray-400 font-medium text-sm"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto shrink-0">
              {/* City Selection Dropdown */}
              <div className="w-full sm:w-44">
                <SelectDropdown
                  options={CITY_OPTIONS}
                  value={selectedCity}
                  onChange={(val) => setSelectedCity(val)}
                  placeholder="All Cities"
                  size="sm"
                />
              </div>

              {/* Sort By Dropdown */}
              <div className="w-full sm:w-44">
                <SelectDropdown
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={(val) => setSortBy(val as any)}
                  size="sm"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[#176B4D] hover:bg-[#12543c] text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-xs"
              >
                <Search className="w-3.5 h-3.5" /> Search
              </Button>

              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer shrink-0 ${
                  isFilterOpen || filterCovered || filterCctv || filterEv || filterSecurity || minRating > 0
                    ? 'bg-[#E8F6EC] border-[#176B4D] text-[#176B4D]'
                    : 'bg-white border-[#E8F6EC] text-[#18342A] hover:border-[#72C98B]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </form>
        </Card>
      </div>

      {/* 2. FILTER COLLAPSIBLE PANEL */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-30 overflow-visible"
          >
            <Card className="p-5 bg-white border border-[#72C98B]/30 shadow-xs rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-[#18342A] text-base flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#176B4D]" /> Advanced Filters
                </h3>
                <button
                  onClick={() => {
                    setSelectedCity('');
                    setSelectedVehicleType('ALL');
                    setSelectedParkingType('ALL');
                    setMaxPrice(100);
                    setFilterCovered(false);
                    setFilterCctv(false);
                    setFilterEv(false);
                    setFilterSecurity(false);
                    setMinRating(0);
                  }}
                  className="text-xs font-bold text-[#176B4D] hover:underline cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Vehicle Type Filter Dropdown */}
                <div>
                  <SelectDropdown
                    label="Vehicle Type"
                    options={VEHICLE_TYPE_OPTIONS}
                    value={selectedVehicleType}
                    onChange={(val) => setSelectedVehicleType(val)}
                    size="sm"
                  />
                </div>

                {/* Parking Category Filter Dropdown */}
                <div>
                  <SelectDropdown
                    label="Location Type"
                    options={PARKING_TYPE_OPTIONS}
                    value={selectedParkingType}
                    onChange={(val) => setSelectedParkingType(val)}
                    size="sm"
                  />
                </div>

                {/* Amenities Toggles */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Amenities</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={filterCovered}
                        onChange={(e) => setFilterCovered(e.target.checked)}
                        className="accent-[#176B4D] rounded"
                      />
                      Covered
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={filterCctv}
                        onChange={(e) => setFilterCctv(e.target.checked)}
                        className="accent-[#176B4D] rounded"
                      />
                      CCTV 24/7
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={filterEv}
                        onChange={(e) => setFilterEv(e.target.checked)}
                        className="accent-[#176B4D] rounded"
                      />
                      EV Charging
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={filterSecurity}
                        onChange={(e) => setFilterSecurity(e.target.checked)}
                        className="accent-[#176B4D] rounded"
                      />
                      Guarded
                    </label>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Minimum Rating</label>
                  <div className="flex gap-1.5">
                    {[0, 4.0, 4.5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(r)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          minRating === r
                            ? 'bg-[#176B4D] text-white border-[#176B4D]'
                            : 'bg-white text-[#18342A] border-[#E8F6EC] hover:border-[#72C98B]'
                        }`}
                      >
                        {r === 0 ? 'Any' : `⭐ ${r}+`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. PARKING CARDS LIST (FULL WIDTH) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-[#18342A]">
            Showing <span className="text-[#176B4D]">{locations.length}</span> Verified Parking Hubs
          </span>
        </div>

        {loading ? (
          <div className="space-y-4 py-8 text-center">
            <div className="w-8 h-8 border-3 border-[#176B4D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 font-medium">Discovering nearby parking lots...</p>
          </div>
        ) : locations.length === 0 ? (
          <Card className="p-8 text-center space-y-3 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-base font-bold text-[#18342A]">No parking locations found</p>
            <p className="text-xs text-gray-500">Try adjusting your search location or clearing filters.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedVehicleType('ALL');
                setSelectedParkingType('ALL');
                fetchParkingLocations();
              }}
            >
              Reset Search
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {locations.map((spot) => {
              const startingPrice = spot.pricing?.carHourlyPrice || 20;

              return (
                <motion.div
                  key={spot.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => navigate(`/parking/${spot.id}`)}
                  className="cursor-pointer"
                >
                  <Card
                    variant="location"
                    hoverEffect
                    className="space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      {/* Image Thumbnail */}
                      <div className="relative w-full sm:w-44 h-32 rounded-2xl overflow-hidden shrink-0 bg-gray-100">
                        <img
                          src={spot.images?.[0] || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800'}
                          alt={spot.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md bg-[#18342A]/85 backdrop-blur-xs text-[10px] font-extrabold text-white uppercase tracking-wider">
                          {spot.parkingType.replace('_', ' ')}
                        </div>
                      </div>

                      {/* Parking Card Content */}
                      <div className="flex-1 space-y-2.5 w-full">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-extrabold text-lg text-[#18342A] tracking-tight leading-snug">
                              {spot.name}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-[#176B4D] shrink-0" />
                              {spot.address}, {spot.city}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 bg-[#E8F6EC] px-2.5 py-1 rounded-lg text-[#176B4D] text-xs font-bold shrink-0">
                            <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                            {spot.rating.toFixed(1)}
                          </div>
                        </div>

                        {/* Key Metrics Badges */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-gray-500">
                            📍 {(spot.distanceKm || 0.5).toFixed(1)} km away
                          </span>
                          <span className="text-gray-300">•</span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              spot.availableSlots > 10
                                ? 'bg-[#E8F6EC] text-[#176B4D]'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {spot.availableSlots} / {spot.totalSlots} slots free
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="font-extrabold text-[#18342A]">
                            From ₹{startingPrice}/hr
                          </span>
                        </div>

                        {/* Amenities List */}
                        <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-600 pt-2 border-t border-gray-100">
                          {spot.cctv && (
                            <span className="flex items-center gap-1 text-[#176B4D]">
                              <Video className="w-3 h-3" /> CCTV
                            </span>
                          )}
                          {spot.security && (
                            <span className="flex items-center gap-1 text-[#176B4D]">
                              <Shield className="w-3 h-3" /> Security
                            </span>
                          )}
                          {spot.coveredParking && (
                            <span className="flex items-center gap-1 text-[#176B4D]">
                              <Warehouse className="w-3 h-3" /> Covered
                            </span>
                          )}
                          {spot.evCharging && (
                            <span className="flex items-center gap-1 text-[#176B4D]">
                              <Zap className="w-3 h-3 text-emerald-600" /> EV
                            </span>
                          )}
                        </div>

                        {/* Primary View Button */}
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-gray-400">
                            Hours: {spot.openingTime} - {spot.closingTime}
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/parking/${spot.id}`);
                            }}
                            className="bg-[#176B4D] hover:bg-[#12543c] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-xs"
                          >
                            View Parking <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
