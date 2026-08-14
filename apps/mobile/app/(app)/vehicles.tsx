import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { mobileTheme } from '../../src/constants/theme';
import { UserVehicle, VehicleType } from '@parkease/shared';
import { mobileApiFetch } from '../../src/api/client';

export default function MobileVehiclesScreen() {
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<UserVehicle | null>(null);

  // Form State
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.CAR);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [isEv, setIsEv] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const res = await mobileApiFetch('/users/me/vehicles');
      if (res?.success && res?.data) {
        setVehicles(res.data);
      }
    } catch {
      // Ignore initial vehicle fetch failure if unauthenticated
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openAddModal = () => {
    setEditingVehicle(null);
    setVehicleType(VehicleType.CAR);
    setRegistrationNumber('');
    setNickname('');
    setIsEv(false);
    setIsDefault(vehicles.length === 0);
    setIsModalOpen(true);
  };

  const openEditModal = (v: UserVehicle) => {
    setEditingVehicle(v);
    setVehicleType(v.vehicleType);
    setRegistrationNumber(v.registrationNumber);
    setNickname(v.nickname || '');
    setIsEv(v.isEv);
    setIsDefault(v.isDefault);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!registrationNumber.trim()) {
      setError('Registration number is required');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      if (editingVehicle) {
        await mobileApiFetch(`/users/me/vehicles/${editingVehicle.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            vehicle_type: vehicleType,
            registration_number: registrationNumber,
            nickname,
            is_ev: isEv,
            is_default: isDefault,
          }),
        });
      } else {
        await mobileApiFetch('/users/me/vehicles', {
          method: 'POST',
          body: JSON.stringify({
            vehicle_type: vehicleType,
            registration_number: registrationNumber,
            nickname,
            is_ev: isEv,
            is_default: isDefault,
          }),
        });
      }
      setIsModalOpen(false);
      await fetchVehicles();
    } catch (err: any) {
      setError(err.message || 'Failed to save vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mobileApiFetch(`/users/me/vehicles/${id}`, { method: 'DELETE' });
      await fetchVehicles();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete vehicle');
    }
  };

  const handleSetDefault = async (v: UserVehicle) => {
    try {
      await mobileApiFetch(`/users/me/vehicles/${v.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_default: true }),
      });
      await fetchVehicles();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to set default vehicle');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>My Vehicles</Text>
          <Text style={styles.headerSubtitle}>Registered vehicles for fast parking pass</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={mobileTheme.colors.darkGreen} style={{ marginTop: 40 }} />
      ) : vehicles.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Vehicles Registered</Text>
          <Text style={styles.emptyText}>Add your vehicle for automated barrier gate entry.</Text>
          <TouchableOpacity style={styles.addBtnLarge} onPress={openAddModal}>
            <Text style={styles.addBtnLargeText}>Add Vehicle Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.grid}>
          {vehicles.map((v) => (
            <View key={v.id} style={[styles.vehicleCard, v.isDefault && styles.vehicleCardDefault]}>
              <View style={styles.cardHeader}>
                <Text style={styles.vehicleTitle}>{v.nickname || v.registrationNumber}</Text>
                <Text style={styles.vehicleReg}>{v.registrationNumber}</Text>
              </View>

              <View style={styles.badgeRow}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{v.vehicleType}</Text>
                </View>
                {v.isEv && (
                  <View style={styles.evBadge}>
                    <Text style={styles.evBadgeText}>⚡ EV</Text>
                  </View>
                )}
                {v.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>★ Primary</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                {!v.isDefault ? (
                  <TouchableOpacity onPress={() => handleSetDefault(v)}>
                    <Text style={styles.setDefaultText}>Set Default</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.primaryText}>Default Vehicle</Text>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => openEditModal(v)} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(v.id)} style={styles.actionBtnDelete}>
                    <Text style={styles.actionBtnDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Add / Edit Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Registration Number</Text>
              <TextInput
                style={styles.input}
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                placeholder="MH 02 CL 1234"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nickname (Optional)</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="My Car"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={styles.typeSelector}>
                {[VehicleType.CAR, VehicleType.SUV, VehicleType.BIKE, VehicleType.EV].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, vehicleType === t && styles.typeBtnActive]}
                    onPress={() => setVehicleType(t)}
                  >
                    <Text style={[styles.typeBtnText, vehicleType === t && styles.typeBtnTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={[styles.checkbox, isEv && styles.checkboxChecked]}
                onPress={() => setIsEv(!isEv)}
              >
                <Text style={styles.checkboxText}>{isEv ? '✓' : ''}</Text>
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Electric Vehicle (EV Charging Spot)</Text>
            </View>

            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={[styles.checkbox, isDefault && styles.checkboxChecked]}
                onPress={() => setIsDefault(!isDefault)}
              >
                <Text style={styles.checkboxText}>{isDefault ? '✓' : ''}</Text>
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Set as Default Vehicle</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={isSubmitting}>
                <Text style={styles.saveBtnText}>{isSubmitting ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: mobileTheme.spacing.md,
    backgroundColor: mobileTheme.colors.background,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666666',
  },
  addBtn: {
    backgroundColor: mobileTheme.colors.darkGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: mobileTheme.borderRadius.md,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: mobileTheme.borderRadius.lg,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F6EC',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  addBtnLarge: {
    backgroundColor: mobileTheme.colors.darkGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: mobileTheme.borderRadius.md,
  },
  addBtnLargeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  grid: {
    gap: 12,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: mobileTheme.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F6EC',
    elevation: 2,
  },
  vehicleCardDefault: {
    borderColor: mobileTheme.colors.primaryGreen,
    borderWidth: 1.5,
  },
  cardHeader: {
    marginBottom: 8,
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
  },
  vehicleReg: {
    fontSize: 12,
    color: '#888888',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  typeBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#555555',
  },
  evBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  evBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  defaultBadge: {
    backgroundColor: mobileTheme.colors.darkGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  setDefaultText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: mobileTheme.colors.darkGreen,
  },
  primaryText: {
    fontSize: 12,
    color: '#888888',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
  actionBtnText: {
    fontSize: 12,
    color: mobileTheme.colors.textDark,
    fontWeight: '600',
  },
  actionBtnDelete: {
    padding: 4,
  },
  actionBtnDeleteText: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: mobileTheme.borderRadius.lg,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#FFEDED',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: mobileTheme.colors.textDark,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: mobileTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 6,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: mobileTheme.colors.softGreen,
    borderColor: mobileTheme.colors.darkGreen,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666666',
  },
  typeBtnTextActive: {
    color: mobileTheme.colors.darkGreen,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#AAAAAA',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: mobileTheme.colors.darkGreen,
    borderColor: mobileTheme.colors.darkGreen,
  },
  checkboxText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  checkboxLabel: {
    fontSize: 13,
    color: mobileTheme.colors.textDark,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: mobileTheme.borderRadius.md,
  },
  cancelBtnText: {
    color: '#666666',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: mobileTheme.colors.darkGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: mobileTheme.borderRadius.md,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
