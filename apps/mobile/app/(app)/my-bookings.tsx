import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { mobileBookingApi } from '../../src/api/booking';
import { mobileQrApi, MobileQrPassItem } from '../../src/api/qr';
import { Booking, BookingStatus } from '@parkease/shared';

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // QR Pass Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [qrPasses, setQrPasses] = useState<MobileQrPassItem[]>([]);
  const [loadingQr, setLoadingQr] = useState<boolean>(false);
  const [activeType, setActiveType] = useState<'ENTRY' | 'EXIT'>('ENTRY');

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mobileBookingApi.getMyBookings();
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

  const handleOpenQrPass = async (booking: Booking) => {
    setSelectedBooking(booking);
    setLoadingQr(true);
    try {
      const passes = await mobileQrApi.getBookingQrPasses(booking.id);
      setQrPasses(passes);
      setActiveType(booking.status === BookingStatus.ACTIVE ? 'EXIT' : 'ENTRY');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to fetch QR pass');
    } finally {
      setLoadingQr(false);
    }
  };

  const handleCancel = (bookingId: string) => {
    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this reservation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await mobileBookingApi.cancelBooking(bookingId);
              fetchBookings();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to cancel reservation');
            }
          },
        },
      ]
    );
  };

  const activePass = qrPasses.find((p) => p.type === activeType);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reservations</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#176B4D" />
            <Text style={styles.subText}>Loading reservations...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Parking Reservations</Text>
            <Text style={styles.subText}>You haven't booked any parking slots yet.</Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(app)/find-parking')}
            >
              <Text style={styles.actionBtnText}>Find Parking Near Me</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bookings.map((b) => (
            <View key={b.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.locationName}>{b.locationName || 'ParkEase Location'}</Text>
                  <Text style={styles.subText}>{b.locationAddress || 'Vadodara'}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{b.status}</Text>
                </View>
              </View>

              <View style={styles.grid}>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Slot</Text>
                  <Text style={styles.infoValue}>{b.slotNumber || 'A-101'}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Vehicle</Text>
                  <Text style={styles.infoValue}>{b.vehicleNumber}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>{b.totalHours} hrs</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Total</Text>
                  <Text style={styles.infoPrice}>₹{b.totalAmount}</Text>
                </View>
              </View>

              <View style={styles.btnRow}>
                {(b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING || b.status === BookingStatus.ACTIVE) && (
                  <TouchableOpacity
                    style={styles.qrBtn}
                    onPress={() => handleOpenQrPass(b)}
                  >
                    <Text style={styles.qrBtnText}>View QR Pass</Text>
                  </TouchableOpacity>
                )}

                {(b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING) && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(b.id)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* QR PASS MODAL */}
      <Modal
        visible={!!selectedBooking}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedBooking(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Barrier Gate QR Pass</Text>
            <Text style={styles.modalSub}>Present at parking gate scanner</Text>

            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.modalTab, activeType === 'ENTRY' && styles.modalTabActive]}
                onPress={() => setActiveType('ENTRY')}
              >
                <Text style={[styles.modalTabText, activeType === 'ENTRY' && styles.modalTabTextActive]}>
                  ENTRY PASS
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalTab, activeType === 'EXIT' && styles.modalTabActive]}
                onPress={() => setActiveType('EXIT')}
              >
                <Text style={[styles.modalTabText, activeType === 'EXIT' && styles.modalTabTextActive]}>
                  EXIT PASS
                </Text>
              </TouchableOpacity>
            </View>

            {loadingQr ? (
              <ActivityIndicator size="large" color="#176B4D" style={{ marginVertical: 20 }} />
            ) : activePass ? (
              <View style={styles.qrPayloadBox}>
                <Text style={styles.qrPassTag}>{activePass.type} PASS ACTIVE</Text>
                <Text style={styles.qrPayloadText} numberOfLines={4}>
                  {activePass.qr_payload}
                </Text>
                <Text style={styles.qrStatusText}>
                  {activePass.is_used ? 'Status: ALREADY USED' : 'Status: VALID FOR GATE'}
                </Text>
              </View>
            ) : (
              <Text style={styles.subText}>No QR pass found</Text>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectedBooking(null)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    gap: 14,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  subText: {
    fontSize: 12,
    color: '#666666',
  },
  errorCard: {
    backgroundColor: '#FDF2F2',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },
  errorText: {
    color: '#9B1C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F6EC',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18342A',
  },
  actionBtn: {
    backgroundColor: '#176B4D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F6EC',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18342A',
  },
  badge: {
    backgroundColor: '#E8F6EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#176B4D',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F7F9F5',
    padding: 10,
    borderRadius: 12,
  },
  infoBox: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#18342A',
    marginTop: 2,
  },
  infoPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#176B4D',
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  qrBtn: {
    backgroundColor: '#176B4D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  qrBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F8B4B4',
    backgroundColor: '#FFF5F5',
  },
  cancelBtnText: {
    color: '#C81E1E',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18342A',
  },
  modalSub: {
    fontSize: 12,
    color: '#666666',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F7F9F5',
    padding: 4,
    borderRadius: 12,
    width: '100%',
  },
  modalTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  modalTabActive: {
    backgroundColor: '#176B4D',
  },
  modalTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#666666',
  },
  modalTabTextActive: {
    color: '#FFFFFF',
  },
  qrPayloadBox: {
    backgroundColor: '#F7F9F5',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8F6EC',
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  qrPassTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#176B4D',
  },
  qrPayloadText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#18342A',
    textAlign: 'center',
  },
  qrStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#176B4D',
  },
  closeBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },
});
