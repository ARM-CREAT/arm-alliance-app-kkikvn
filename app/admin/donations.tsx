
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles/commonStyles';
import { BACKEND_URL } from '@/utils/api';

interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number | string;
  currency: string;
  contributionType: string;
  paymentMethod: string;
  status: string;
}

interface DonationStats {
  totalCount: number;
  totalAmount: number | string;
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.success,
  cancelled: colors.error,
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
};

const FILTER_OPTIONS = ['all', 'pending', 'confirmed', 'cancelled'];

export default function AdminDonationsScreen() {
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const checkAuth = useCallback(async () => {
    const password = await AsyncStorage.getItem('admin_password');
    if (!password) {
      router.replace('/admin/login');
    }
  }, [router]);

  const getAdminHeaders = async () => {
    const password = await AsyncStorage.getItem('admin_password');
    return {
      'Content-Type': 'application/json',
      'x-admin-password': password || '',
    };
  };

  const fetchData = useCallback(async () => {
    console.log('[Admin Donations] Fetching donations and stats');
    try {
      const headers = await getAdminHeaders();
      const [donationsRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/donations`, { headers }),
        fetch(`${BACKEND_URL}/api/admin/donations/stats`, { headers }),
      ]);

      if (!donationsRes.ok) {
        const text = await donationsRes.text();
        throw new Error(`Erreur ${donationsRes.status}: ${text}`);
      }
      const donationsData = await donationsRes.json();
      const list = Array.isArray(donationsData) ? donationsData : (donationsData.donations || []);
      setDonations(list);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      setError('');
    } catch (e: any) {
      console.error('[Admin Donations] Fetch error:', e.message);
      setError(e.message);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    checkAuth();
    loadData();
  }, [checkAuth, loadData]);

  const openStatusModal = (donation: Donation) => {
    console.log('[Admin Donations] Open status modal for id:', donation.id);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDonation(donation);
    setShowStatusModal(true);
  };

  const openDeleteModal = (id: string) => {
    console.log('[Admin Donations] Open delete confirm for id:', id);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedDonation) return;
    console.log('[Admin Donations] PUT /api/admin/donations/' + selectedDonation.id + '/status → ' + newStatus);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const headers = await getAdminHeaders();
      const response = await fetch(`${BACKEND_URL}/api/admin/donations/${selectedDonation.id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text}`);
      }
      setShowStatusModal(false);
      await fetchData();
    } catch (e: any) {
      console.error('[Admin Donations] Status change error:', e.message);
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    console.log('[Admin Donations] DELETE /api/admin/donations/' + deletingId);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const headers = await getAdminHeaders();
      const response = await fetch(`${BACKEND_URL}/api/admin/donations/${deletingId}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text}`);
      }
      setShowDeleteModal(false);
      setDeletingId(null);
      await fetchData();
    } catch (e: any) {
      console.error('[Admin Donations] Delete error:', e.message);
      Alert.alert('Erreur', e.message);
    }
  };

  const filteredDonations = filter === 'all' ? donations : donations.filter((d) => d.status === filter);

  const totalAmount = stats ? Number(stats.totalAmount).toFixed(2) : '0.00';
  const totalCount = stats ? stats.totalCount : 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Dons & Contributions',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {/* Stats Banner */}
          {stats && (
            <View style={styles.statsBanner}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalCount}</Text>
                <Text style={styles.statLabel}>Total dons</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalAmount}</Text>
                <Text style={styles.statLabel}>Montant total</Text>
              </View>
            </View>
          )}

          {/* Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {FILTER_OPTIONS.map((f) => {
              const isActive = filter === f;
              const label = f === 'all' ? 'Tous' : STATUS_LABELS[f] || f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => {
                    console.log('[Admin Donations] Filter changed to:', f);
                    setFilter(f);
                  }}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : filteredDonations.length === 0 ? (
            <Text style={styles.emptyText}>Aucun don trouvé.</Text>
          ) : (
            filteredDonations.map((donation) => {
              const statusColor = STATUS_COLORS[donation.status] || colors.textSecondary;
              const statusLabel = STATUS_LABELS[donation.status] || donation.status;
              const amountDisplay = Number(donation.amount).toFixed(2);
              return (
                <View key={donation.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{donation.donorName}</Text>
                    <View style={[styles.badge, { backgroundColor: statusColor }]}>
                      <Text style={styles.badgeText}>{statusLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardMeta}>{donation.donorEmail}</Text>
                  <View style={styles.cardRow}>
                    <Text style={styles.amountText}>
                      {amountDisplay}
                      {' '}
                      {donation.currency}
                    </Text>
                    <Text style={styles.cardMeta}>{donation.contributionType}</Text>
                  </View>
                  <Text style={styles.cardMeta}>{donation.paymentMethod}</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openStatusModal(donation)}>
                      <Text style={styles.editBtnText}>Statut</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => openDeleteModal(donation.id)}>
                      <Text style={styles.deleteBtnText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Status Modal */}
      <Modal visible={showStatusModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Changer le statut</Text>
            {STATUS_OPTIONS.map((s) => {
              const isSelected = selectedDonation?.status === s;
              const statusColor = STATUS_COLORS[s];
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusOption, isSelected && styles.statusOptionActive]}
                  onPress={() => handleStatusChange(s)}
                  disabled={saving}
                >
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusOptionText, isSelected && styles.statusOptionTextActive]}>
                    {STATUS_LABELS[s]}
                  </Text>
                  {saving && isSelected && <ActivityIndicator size="small" color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowStatusModal(false)} disabled={saving}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmContainer}>
            <Text style={styles.modalTitle}>Supprimer ce don ?</Text>
            <Text style={styles.confirmText}>Cette action est irréversible.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={handleDelete}>
                <Text style={styles.saveBtnText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: 60 },
  list: { padding: 16 },
  errorText: { color: colors.error, textAlign: 'center', marginTop: 20 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
  statsBanner: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  filterRow: { marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.backgroundAlt,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 13, color: colors.textSecondary },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 1, marginRight: 8 },
  cardMeta: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  amountText: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  editBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  deleteBtn: { flex: 1, backgroundColor: colors.error, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  deleteBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  confirmContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    margin: 32,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  confirmText: { fontSize: 15, color: colors.textSecondary, marginBottom: 20 },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: colors.backgroundAlt,
  },
  statusOptionActive: { backgroundColor: colors.primary + '20', borderWidth: 1, borderColor: colors.primary },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  statusOptionText: { fontSize: 15, color: colors.text, flex: 1 },
  statusOptionTextActive: { fontWeight: '600', color: colors.primary },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  saveBtnText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  deleteConfirmBtn: { flex: 1, backgroundColor: colors.error, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
});
