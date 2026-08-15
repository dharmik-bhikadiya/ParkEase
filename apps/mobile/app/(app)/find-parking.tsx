import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { mobileApiFetch } from '../../src/api/client';

const MOCK_PARKING_LOCATIONS = [
  {
    id: 'loc-1',
    name: 'Vadodara Station Multi-Level Hub',
    address: 'Station Road, Sayajiganj, Vadodara',
    rating: 4.8,
    availableSlots: 34,
    totalSlots: 120,
    price: 20,
    type: 'RAILWAY_STATION',
    distance: '0.3 km',
  },
  {
    id: 'loc-2',
    name: 'Ahmedabad Terminal 2 Smart Park',
    address: 'Airport Road, Hansol, Ahmedabad',
    rating: 4.9,
    availableSlots: 68,
    totalSlots: 250,
    price: 40,
    type: 'AIRPORT',
    distance: '1.5 km',
  },
  {
    id: 'loc-3',
    name: 'Inorbit Mall Covered Parking',
    address: 'Gorwa Road, Subhanpura, Vadodara',
    rating: 4.6,
    availableSlots: 45,
    totalSlots: 180,
    price: 30,
    type: 'MALL',
    distance: '2.1 km',
  },
];

import { DigitalMetricDisplay } from '../../src/components/DigitalMetricDisplay';

export default function FindParkingScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<any[]>(MOCK_PARKING_LOCATIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const data = await mobileApiFetch('/parking/search');
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          address: `${item.address || ''}, ${item.city || ''}`.trim(),
          rating: item.rating || 4.5,
          availableSlots: item.available_slots || item.availableSlots || 20,
          totalSlots: item.total_slots || item.totalSlots || 100,
          price: item.pricing?.car_hourly_price || item.pricing?.carHourlyPrice || 20,
          type: item.parking_type || item.parkingType || 'PUBLIC',
          distance: `${(item.distance_km || 0.5).toFixed(1)} km`,
        }));
        setLocations(formatted);
      }
    } catch {
      // Fallback to MOCK_PARKING_LOCATIONS if offline
    } finally {
      setLoading(false);
    }
  };

  const filtered = locations.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Parking</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location, station, airport..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading ? (
          <View style={{ paddingVertical: 30, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#176B4D" />
          </View>
        ) : (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(`/(app)/parking-details?id=${item.id}` as any)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.starText}>⭐</Text>
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <Text style={styles.pinText}>📍</Text>
                <Text style={styles.addressText}>{item.address}</Text>
              </View>

              <View style={styles.footerRow}>
                <DigitalMetricDisplay
                  label="FREE SLOTS"
                  value={`${item.availableSlots}`}
                  subtitle={`OUT OF ${item.totalSlots}`}
                  size="sm"
                  variant="emerald"
                />
                <DigitalMetricDisplay
                  label="HOURLY RATE"
                  value={`₹${item.price}`}
                  subtitle="PER HOUR"
                  size="sm"
                  variant="dark"
                />
              </View>
            </TouchableOpacity>
          ))
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F6EC',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#18342A',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8F6EC',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#18342A',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F6EC',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18342A',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F6EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  starText: {
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#176B4D',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  pinText: {
    fontSize: 12,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F7F9F5',
  },
  slotsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#176B4D',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18342A',
  },
});
