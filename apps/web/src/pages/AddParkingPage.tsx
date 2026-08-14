import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  MapPin,
  Shield,
  Clock,
  Car,
  Layers,
  Image as ImageIcon,
  Sparkles,
  Send,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { parkingApi } from '../api/parkingApi';
import { ParkingType, CreateParkingRequest } from '@parkease/shared';

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Building2 },
  { id: 2, title: 'Location', icon: MapPin },
  { id: 3, title: 'Facilities', icon: Shield },
  { id: 4, title: 'Hours', icon: Clock },
  { id: 5, title: 'Pricing', icon: Car },
  { id: 6, title: 'Slots', icon: Layers },
  { id: 7, title: 'Images', icon: ImageIcon },
  { id: 8, title: 'Review', icon: Send },
];

export const AddParkingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<CreateParkingRequest>({
    name: '',
    description: '',
    parkingType: ParkingType.RAILWAY_STATION,
    address: '',
    city: 'Vadodara',
    area: 'Sayajiganj',
    latitude: 22.3106,
    longitude: 73.1812,
    images: ['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800'],
    openingTime: '06:00',
    closingTime: '23:00',
    coveredParking: true,
    security: true,
    cctv: true,
    evCharging: false,
    wheelchairAccess: true,
    washroom: true,
    bikeHourlyPrice: 10,
    carHourlyPrice: 20,
    suvHourlyPrice: 30,
    evHourlyPrice: 25,
    totalSlots: 20,
    initialSlotsConfig: {
      floorCount: 2,
      slotsPerFloor: 10,
      sections: ['Section A', 'Section B'],
    },
  });

  const updateField = (field: keyof CreateParkingRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.name) {
      setErrorMsg('Please enter a parking location name');
      return;
    }
    if (currentStep === 2 && (!formData.address || !formData.city)) {
      setErrorMsg('Please fill in complete address and city');
      return;
    }
    setErrorMsg('');
    setCurrentStep((prev) => Math.min(8, prev + 1));
  };

  const handlePrev = () => {
    setErrorMsg('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmitForApproval = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await parkingApi.createParking(formData);
      navigate('/owner/dashboard');
    } catch (err: any) {
      navigate('/owner/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/owner/dashboard')}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#176B4D] hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel & Return to Dashboard
      </button>

      {/* HEADER & STEPPER PROGRESS BAR */}
      <div className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F6EC] text-[#176B4D] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> 8-Step Owner Setup Wizard
          </div>
          <h1 className="text-3xl font-extrabold text-[#18342A] tracking-tight">Register Parking Location</h1>
          <p className="text-xs text-gray-500 font-medium">
            Submitted parking lots will be marked as <span className="font-bold text-amber-600">PENDING_APPROVAL</span> until verified by Admin.
          </p>
        </div>

        {/* Stepper Steps Header */}
        <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2 border-b border-gray-200">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div
                key={step.id}
                onClick={() => isCompleted && setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#176B4D] text-white shadow-xs'
                    : isCompleted
                    ? 'bg-[#E8F6EC] text-[#176B4D]'
                    : 'bg-white text-gray-400 border border-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{step.title}</span>
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#176B4D]" />}
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
          {errorMsg}
        </div>
      )}

      {/* STEP FORM CONTAINERS */}
      <Card className="p-6 sm:p-8 bg-white border border-[#E8F6EC] shadow-sm rounded-3xl space-y-6">
        {/* STEP 1: BASIC INFO */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold text-[#18342A] border-b border-gray-100 pb-3">
              Step 1: Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Parking Location Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Sayajiganj Railway Junction Multi-Level Parking"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  placeholder="Describe your parking facility, entrance points, and special landmarks..."
                  className="w-full p-3 bg-[#F7F9F5] border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#176B4D]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Parking Category / Type</label>
                <select
                  value={formData.parkingType}
                  onChange={(e) => updateField('parkingType', e.target.value)}
                  className="w-full p-3 bg-[#F7F9F5] border border-gray-200 rounded-xl text-sm font-bold text-[#18342A] outline-none"
                >
                  <option value="RAILWAY_STATION">Railway Station</option>
                  <option value="AIRPORT">Airport</option>
                  <option value="BUS_STAND">Bus Stand</option>
                  <option value="MALL">Shopping Mall</option>
                  <option value="HOSPITAL">Hospital</option>
                  <option value="CINEMA">Cinema/Multiplex</option>
                  <option value="TOURIST_PLACE">Tourist Destination</option>
                  <option value="OTHER">Other / Commercial</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold text-[#18342A] border-b border-gray-100 pb-3">
              Step 2: Geographical Location
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Street Address *</label>
                <Input
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="e.g. Opposite Platform 1, Station Road"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">City *</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="e.g. Vadodara"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Area / Locality *</label>
                  <Input
                    value={formData.area}
                    onChange={(e) => updateField('area', e.target.value)}
                    placeholder="e.g. Sayajiganj"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Latitude Coordinate</label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => updateField('latitude', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Longitude Coordinate</label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => updateField('longitude', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: FACILITIES */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold text-[#18342A] border-b border-gray-100 pb-3">
              Step 3: Parking Facilities & Amenities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-semibold">
              <label className="flex items-center gap-3 p-4 bg-[#F7F9F5] border rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.cctv}
                  onChange={(e) => updateField('cctv', e.target.checked)}
                  className="w-5 h-5 accent-[#176B4D] rounded"
                />
                24/7 CCTV Surveillance
              </label>

              <label className="flex items-center gap-3 p-4 bg-[#F7F9F5] border rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.security}
                  onChange={(e) => updateField('security', e.target.checked)}
                  className="w-5 h-5 accent-[#176B4D] rounded"
                />
                Guarded Security Personnel
              </label>

              <label className="flex items-center gap-3 p-4 bg-[#F7F9F5] border rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.coveredParking}
                  onChange={(e) => updateField('coveredParking', e.target.checked)}
                  className="w-5 h-5 accent-[#176B4D] rounded"
                />
                Covered Roofing Structure
              </label>

              <label className="flex items-center gap-3 p-4 bg-[#F7F9F5] border rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.evCharging}
                  onChange={(e) => updateField('evCharging', e.target.checked)}
                  className="w-5 h-5 accent-[#176B4D] rounded"
                />
                EV Vehicle Fast Chargers
              </label>

              <label className="flex items-center gap-3 p-4 bg-[#F7F9F5] border rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.wheelchairAccess}
                  onChange={(e) => updateField('wheelchairAccess', e.target.checked)}
                  className="w-5 h-5 accent-[#176B4D] rounded"
                />
                Wheelchair Accessible Ramps
              </label>

              <label className="flex items-center gap-3 p-4 bg-[#F7F9F5] border rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.washroom}
                  onChange={(e) => updateField('washroom', e.target.checked)}
                  className="w-5 h-5 accent-[#176B4D] rounded"
                />
                Restroom / Washroom Facility
              </label>
            </div>
          </div>
        )}

        {/* STEP 4: OPERATING HOURS */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold text-[#18342A] border-b border-gray-100 pb-3">
              Step 4: Operating Hours
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Opening Time</label>
                <Input
                  type="time"
                  value={formData.openingTime}
                  onChange={(e) => updateField('openingTime', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Closing Time</label>
                <Input
                  type="time"
                  value={formData.closingTime}
                  onChange={(e) => updateField('closingTime', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: VEHICLE PRICING */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold text-[#18342A] border-b border-gray-100 pb-3">
              Step 5: Vehicle Hourly Pricing Matrix (₹/hr)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Two Wheeler / Bike Rate (₹/hr)</label>
                <Input
                  type="number"
                  value={formData.bikeHourlyPrice}
                  onChange={(e) => updateField('bikeHourlyPrice', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Four Wheeler / Car Rate (₹/hr)</label>
                <Input
                  type="number"
                  value={formData.carHourlyPrice}
                  onChange={(e) => updateField('carHourlyPrice', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">SUV / Large Vehicle Rate (₹/hr)</label>
                <Input
                  type="number"
                  value={formData.suvHourlyPrice}
                  onChange={(e) => updateField('suvHourlyPrice', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">EV Charging Vehicle Rate (₹/hr)</label>
                <Input
                  type="number"
                  value={formData.evHourlyPrice}
                  onChange={(e) => updateField('evHourlyPrice', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: SLOTS CONFIG */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold text-[#18342A] border-b border-gray-100 pb-3">
              Step 6: Slot Capacity & Layout Setup
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Total Physical Slots *</label>
                <Input
                  type="number"
                  value={formData.totalSlots}
                  onChange={(e) => updateField('totalSlots', parseInt(e.target.value, 10) || 10)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Floor Levels Count</label>
                <Input
                  type="number"
                  value={formData.initialSlotsConfig?.floorCount || 1}
                  onChange={(e) =>
                    updateField('initialSlotsConfig', {
                      ...formData.initialSlotsConfig,
                      floorCount: parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: IMAGES */}
        {currentStep === 7 && (
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold text-[#18342A] border-b border-gray-100 pb-3">
              Step 7: Parking Images
            </h2>
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-600 block">Primary Image URL</label>
              <Input
                value={formData.images?.[0] || ''}
                onChange={(e) => updateField('images', [e.target.value])}
                placeholder="https://images.unsplash.com/photo-1506521781263-d8422e82f27a"
              />
              {formData.images?.[0] && (
                <div className="h-44 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={formData.images[0]} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 8: REVIEW & SUBMIT */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-xl font-extrabold text-[#18342A]">Step 8: Final Review & Submission</h2>
              <p className="text-xs text-gray-500">Please review all submitted details before requesting Admin approval.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold p-4 bg-[#F7F9F5] rounded-2xl border border-[#E8F6EC]">
              <div>
                <span className="text-gray-400 block font-bold">Name:</span>
                <span className="text-[#18342A] text-sm">{formData.name}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-bold">Type:</span>
                <span className="text-[#18342A] text-sm">{formData.parkingType}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-bold">Address:</span>
                <span className="text-[#18342A]">{formData.address}, {formData.city}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-bold">Total Capacity:</span>
                <span className="text-[#176B4D] font-extrabold text-sm">{formData.totalSlots} Slots</span>
              </div>
              <div>
                <span className="text-gray-400 block font-bold">Hourly Rates:</span>
                <span className="text-[#18342A]">Car: ₹{formData.carHourlyPrice}/hr | Bike: ₹{formData.bikeHourlyPrice}/hr</span>
              </div>
              <div>
                <span className="text-gray-400 block font-bold">Initial Status:</span>
                <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">PENDING_APPROVAL</span>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION CONTROLS */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </Button>

          {currentStep < 8 ? (
            <Button
              variant="primary"
              onClick={handleNext}
              className="bg-[#176B4D] hover:bg-[#12543c] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmitForApproval}
              disabled={submitting}
              className="bg-[#176B4D] hover:bg-[#12543c] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md"
            >
              <Send className="w-4 h-4" /> Submit for Approval
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
