import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { mobileParkingApi } from '../../src/api/parkingApi';
import { mobileBookingApi } from '../../src/api/booking';
import { ParkingLocation, ParkingSlot, SlotStatus } from '@parkease/shared';

export default function ParkingDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = (params.id as string) || '';

  const [parking, setParking] = useState<ParkingLocation | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState<string>('GJ01AB1234');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [booking, setBooking] = useState<boolean>(false);

  useEffect(() => {
    const loadDetails = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const pData = await mobileParkingApi.getParkingById(id);
        setParking(pData);
        const sData = await mobileParkingApi.getSlots(id);
        setSlots(sData);
      } catch {
        // Handled in API
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id]);

  const handleBookSlot = async () => {
    if (!selectedSlot || !parking) return;
    if (!vehicleNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a vehicle registration number');
      return;
    }

    setBooking(true);
    const start = new Date();
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    try {
      await mobileBookingApi.createBooking({
        location_id: parking.id,
        slot_id: selectedSlot.id,
        vehicle_number: vehicleNumber.toUpperCase().trim(),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });

      Alert.alert(
        'Reservation Successful!',
        `Slot ${selectedSlot.slotNumber} reserved for ${durationHours} hours.`,
        [
          {
            text: 'View My Bookings',
            onPress: () => router.push('/(app)/my-bookings'),
          },
        ]
      );
      setSelectedSlot(null);
      const sData = await mobileParkingApi.getSlots(parking.id);
      setSlots(sData);
    } catch (err: any) {
      Alert.alert('Reservation Error', err?.message || 'Failed to reserve slot');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#176B4D" />
        </View>
      </SafeAreaView>
    );
  }

  const locationName = parking?.name || 'Vadodara Station Multi-Level Hub';
  const address = parking ? `${parking.address}, ${parking.area}` : 'Sayajiganj, Vadodara';
  const availableCount = slots.filter((s) => s.status === SlotStatus.AVAILABLE).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parking Location</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroBox}>
          <Text style={styles.tag}>{parking?.parkingType || 'RAILWAY STATION'}</Text>
          <Text style={styles.title}>{locationName}</Text>
          <View style={styles.row}>
            <Text style={styles.pinText}>📍</Text>
            <Text style={styles.heroSub}>{address}</Text>
          </View>
        </View>

        {/* Real-time Slots Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Available Slot</Text>
            <Text style={styles.badgeText}>{availableCount} Available</Text>
          </View>

          <View style={styles.slotsGrid}>
            {slots.map((slot) => {
              const isAvailable = slot.status === SlotStatus.AVAILABLE;
              const isSelected = selectedSlot?.id === slot.id;

              return (
                <TouchableOpacity
                  key={slot.id}
                  disabled={!isAvailable}
                  onPress={() => setSelectedSlot(slot)}
                  style={[
                    styles.slotCard,
                    isAvailable && styles.slotAvailable,
                    !isAvailable && styles.slotDisabled,
                    isSelected && styles.slotSelected,
                  ]}
                >
                  <Text style={[styles.slotNumber, isSelected && styles.slotNumberSelected]}>
                    {slot.slotNumber}
                  </Text>
                  <Text style={styles.slotStatus}>{slot.status}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Slot Reservation Form */}
        {selectedSlot && (
          <View style={styles.bookingForm}>
            <Text style={styles.sectionTitle}>Book Slot {selectedSlot.slotNumber}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Number</Text>
              <TextInput
                style={styles.input}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                placeholder="e.g. GJ01AB1234"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Duration (Hours)</Text>
              <View style={styles.durationRow}>
                {[1, 2, 3, 5].map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setDurationHours(h)}
                    style={[styles.durBtn, durationHours === h && styles.durBtnActive]}
                  >
                    <Text style={[styles.durText, durationHours === h && styles.durTextActive]}>
                      {h} hr
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Est. Total Payable:</Text>
              <Text style={styles.priceVal}>
                ₹{durationHours * (parking?.pricing?.carHourlyPrice || 20)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleBookSlot}
              disabled={booking}
            >
              {booking ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Mobile Reservation</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F5',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F6EC',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 6,
    marginRight: 12,
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#18342A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18342A',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  heroBox: {
    backgroundColor: '#18342A',
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  tag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#72C98B',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinText: {
    fontSize: 12,
  },
  heroSub: {
    fontSize: 12,
    color: '#DDD',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F6EC',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18342A',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#176B4D',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    width: '23%',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  slotAvailable: {
    backgroundColor: '#E8F6EC',
    borderColor: '#72C98B',
  },
  slotDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  slotSelected: {
    backgroundColor: '#176B4D',
    borderColor: '#176B4D',
  },
  slotNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#176B4D',
  },
  slotNumberSelected: {
    color: '#FFFFFF',
  },
  slotStatus: {
    fontSize: 8,
    fontWeight: '700',
    color: '#666',
    marginTop: 2,
  },
  bookingForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#72C98B',
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18342A',
  },
  input: {
    backgroundColor: '#F7F9F5',
    borderWidth: 1,
    borderColor: '#E8F6EC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontWeight: 'bold',
    fontSize: 14,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8F6EC',
    backgroundColor: '#F7F9F5',
  },
  durBtnActive: {
    backgroundColor: '#176B4D',
    borderColor: '#176B4D',
  },
  durText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#18342A',
  },
  durTextActive: {
    color: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8F6EC',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18342A',
  },
  priceVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#176B4D',
  },
  confirmBtn: {
    backgroundColor: '#176B4D',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
