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
import { useRouter } from 'expo-router';
import { mobileWalletApi } from '../../src/api/wallet';
import { Wallet, WalletTransaction } from '@parkease/shared';

import { DigitalMetricDisplay } from '../../src/components/DigitalMetricDisplay';

export default function WalletScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [topupAmount, setTopupAmount] = useState<string>('500');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const [w, t] = await Promise.all([
        mobileWalletApi.getWallet(),
        mobileWalletApi.getTransactions(),
      ]);
      setWallet(w);
      setTransactions(t || []);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const handleTopup = async () => {
    const amt = parseFloat(topupAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid top-up amount');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await mobileWalletApi.topupWallet(amt, 'UPI');
      setWallet(updated);
      const t = await mobileWalletApi.getTransactions();
      setTransactions(t || []);
      Alert.alert('Success', `₹${amt} added to your ParkEase digital wallet!`);
    } catch (err: any) {
      Alert.alert('Top-Up Failed', err?.message || 'Transaction could not be completed');
    } finally {
      setSubmitting(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ParkEase Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Balance Hero Card with Digital Clock Typography */}
        <View style={styles.balanceCard}>
          <DigitalMetricDisplay
            label="AVAILABLE WALLET BALANCE"
            value={`₹${wallet ? wallet.balance.toFixed(2) : '0.00'}`}
            subtitle={`CURRENCY: ${wallet?.currency || 'INR'} • SECURE ACCOUNT`}
            variant="emerald"
            size="giant"
          />
        </View>

        {/* Top-Up Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Instant Top-Up</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={topupAmount}
              onChangeText={setTopupAmount}
              keyboardType="numeric"
              placeholder="e.g. 500"
            />
          </View>

          <View style={styles.chipRow}>
            {['100', '200', '500', '1000'].map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => setTopupAmount(amt)}
                style={[styles.chip, topupAmount === amt && styles.chipActive]}
              >
                <Text style={[styles.chipText, topupAmount === amt && styles.chipTextActive]}>
                  +₹{amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.topupBtn}
            onPress={handleTopup}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.topupBtnText}>Add Money (UPI / Card)</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>No wallet transactions yet.</Text>
          ) : (
            transactions.map((t) => (
              <View key={t.id} style={styles.txnItem}>
                <View style={styles.txnLeft}>
                  <Text style={styles.txnDesc}>{t.description}</Text>
                  <Text style={styles.txnDate}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txnAmount,
                    t.amount >= 0 ? styles.txnCredit : styles.txnDebit,
                  ]}
                >
                  {t.amount >= 0 ? `+₹${t.amount}` : `-₹${Math.abs(t.amount)}`}
                </Text>
              </View>
            ))
          )}
        </View>
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
  balanceCard: {
    backgroundColor: '#18342A',
    borderRadius: 20,
    padding: 20,
    gap: 6,
  },
  balanceTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#72C98B',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  currencyText: {
    fontSize: 14,
    color: '#72C98B',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F6EC',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18342A',
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
    paddingVertical: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8F6EC',
    backgroundColor: '#F7F9F5',
  },
  chipActive: {
    backgroundColor: '#176B4D',
    borderColor: '#176B4D',
  },
  chipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#18342A',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  topupBtn: {
    backgroundColor: '#176B4D',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  topupBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
  txnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  txnLeft: {
    gap: 2,
    flex: 1,
  },
  txnDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18342A',
  },
  txnDate: {
    fontSize: 10,
    color: '#888888',
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txnCredit: {
    color: '#176B4D',
  },
  txnDebit: {
    color: '#DC2626',
  },
});
