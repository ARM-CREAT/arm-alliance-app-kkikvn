
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { BACKEND_URL } from '@/utils/api-helpers';

interface Membership {
  id: string;
  full_name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  telephone?: string;
  created_at?: string;
  createdAt?: string;
  joined_at?: string;
  status?: string;
}

function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusColor(status: string | undefined): string {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'actif') return '#1B5E20';
  if (s === 'pending' || s === 'en attente') return '#E65100';
  if (s === 'inactive' || s === 'inactif') return '#757575';
  return '#1565C0';
}

function getStatusLabel(status: string | undefined): string {
  const s = (status || '').toLowerCase();
  if (s === 'active') return 'Actif';
  if (s === 'pending') return 'En attente';
  if (s === 'inactive') return 'Inactif';
  return status || 'Actif';
}

export default function AdminMembershipsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadMemberships = useCallback(async () => {
    console.log('[AdminMemberships] GET /api/admin/memberships');
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/memberships`);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Erreur ${res.status}: ${errText}`);
      }
      const data = await res.json();
      const list: Membership[] = Array.isArray(data) ? data : (data?.memberships ?? data?.members ?? []);
      console.log('[AdminMemberships] Memberships loaded:', list.length);
      setMemberships(list);
    } catch (err: any) {
      console.error('[AdminMemberships] Error loading memberships:', err);
      setError(err.message || 'Impossible de charger les adhésions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  const onRefresh = useCallback(() => {
    console.log('[AdminMemberships] Pull-to-refresh triggered');
    setRefreshing(true);
    loadMemberships();
  }, [loadMemberships]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Adhésions', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: 'bold' } }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des adhésions...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Adhésions',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <View style={styles.container}>
        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{memberships.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {memberships.filter(m => (m.status || '').toLowerCase() === 'active' || (m.status || '').toLowerCase() === 'actif' || !m.status).length}
            </Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {memberships.filter(m => (m.status || '').toLowerCase() === 'pending' || (m.status || '').toLowerCase() === 'en attente').length}
            </Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={40} color="#DC3545" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => { setLoading(true); loadMemberships(); }}
            >
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          >
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.colHeader, styles.colName]}>Nom complet</Text>
              <Text style={[styles.colHeader, styles.colEmail]}>Email</Text>
              <Text style={[styles.colHeader, styles.colDate]}>Date</Text>
              <Text style={[styles.colHeader, styles.colStatus]}>Statut</Text>
            </View>

            {memberships.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol ios_icon_name="person.3" android_material_icon_name="group" size={56} color={colors.textSecondary} />
                <Text style={styles.emptyText}>Aucune adhésion enregistrée</Text>
              </View>
            ) : (
              memberships.map((member, index) => {
                const fullName = member.full_name || member.fullName || '—';
                const phone = member.phone || member.telephone || '—';
                const dateStr = formatDate(member.joined_at || member.created_at || member.createdAt);
                const statusLabel = getStatusLabel(member.status);
                const statusColor = getStatusColor(member.status);
                const isEven = index % 2 === 0;

                return (
                  <View key={member.id || index} style={[styles.tableRow, isEven && styles.tableRowEven]}>
                    <View style={styles.colName}>
                      <Text style={styles.cellName} numberOfLines={1}>{fullName}</Text>
                      <Text style={styles.cellPhone} numberOfLines={1}>{phone}</Text>
                    </View>
                    <View style={styles.colEmail}>
                      <Text style={styles.cellEmail} numberOfLines={2}>{member.email || '—'}</Text>
                    </View>
                    <View style={styles.colDate}>
                      <Text style={styles.cellDate}>{dateStr}</Text>
                    </View>
                    <View style={styles.colStatus}>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 12, fontSize: 15, color: colors.textSecondary },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  errorText: { fontSize: 15, color: '#DC3545', textAlign: 'center', lineHeight: 22 },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  colHeader: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  tableRowEven: { backgroundColor: colors.backgroundAlt },
  colName: { flex: 2.2, paddingRight: 6 },
  colEmail: { flex: 2.5, paddingRight: 6 },
  colDate: { flex: 1.5, paddingRight: 4 },
  colStatus: { flex: 1.3, alignItems: 'flex-end' },
  cellName: { fontSize: 13, fontWeight: '600', color: colors.text },
  cellPhone: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  cellEmail: { fontSize: 12, color: colors.textSecondary },
  cellDate: { fontSize: 11, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  ...(Platform.OS === 'android' ? {} : {}),
});
