
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@/utils/api-helpers';

interface Member {
  id: string;
  fullName: string;
  membershipNumber: string;
  commune: string;
  profession?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  role?: string;
  createdAt?: string;
  joinedAt?: string;
}

interface Stats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  expired: number;
}

function normalizeStatus(status: string): 'pending' | 'active' | 'suspended' | 'expired' {
  if (status === 'approved' || status === 'active') return 'active';
  if (status === 'pending') return 'pending';
  if (status === 'suspended' || status === 'rejected') return 'suspended';
  return 'expired';
}

function computeStats(members: Member[]): Stats {
  return {
    total: members.length,
    active: members.filter(m => normalizeStatus(m.status) === 'active').length,
    pending: members.filter(m => normalizeStatus(m.status) === 'pending').length,
    suspended: members.filter(m => normalizeStatus(m.status) === 'suspended').length,
    expired: members.filter(m => normalizeStatus(m.status) === 'expired').length,
  };
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function getStatusLabel(status: string): string {
  const n = normalizeStatus(status);
  switch (n) {
    case 'active': return 'Actif';
    case 'pending': return 'En attente';
    case 'suspended': return 'Suspendu';
    case 'expired': return 'Expiré';
    default: return status;
  }
}

function getStatusColor(status: string): string {
  const n = normalizeStatus(status);
  switch (n) {
    case 'active': return '#34C759';
    case 'pending': return '#FF9500';
    case 'suspended': return '#FF3B30';
    case 'expired': return '#8E8E93';
    default: return '#8E8E93';
  }
}

type FilterStatus = 'all' | 'active' | 'pending' | 'suspended' | 'expired';

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'active', label: 'Actifs' },
  { key: 'pending', label: 'En attente' },
  { key: 'suspended', label: 'Suspendus' },
  { key: 'expired', label: 'Expirés' },
];

export default function MembershipStatsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMembers = useCallback(async () => {
    console.log('[MembershipStats] Fetching members');
    setError(null);
    try {
      const password = await AsyncStorage.getItem('admin_password') || '';
      let result: Member[] | null = null;

      // Try admin endpoint first
      try {
        console.log('[MembershipStats] GET /api/admin/members');
        const res = await fetch(`${BACKEND_URL}/api/admin/members`, {
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': password,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            result = data;
            console.log('[MembershipStats] Loaded from /api/admin/members:', data.length, 'members');
          }
        } else {
          console.warn('[MembershipStats] /api/admin/members returned', res.status);
        }
      } catch (adminErr: any) {
        console.warn('[MembershipStats] /api/admin/members failed:', adminErr.message);
      }

      // Fallback to /api/membership
      if (!result) {
        console.log('[MembershipStats] Falling back to GET /api/membership');
        const res = await fetch(`${BACKEND_URL}/api/membership`, {
          headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        });
        if (res.ok) {
          const data = await res.json();
          result = Array.isArray(data) ? data : [];
          console.log('[MembershipStats] Loaded from /api/membership:', result.length, 'members');
        } else {
          const errText = await res.text();
          throw new Error(`Erreur ${res.status}: ${errText}`);
        }
      }

      setMembers(result || []);
    } catch (err: any) {
      console.error('[MembershipStats] Failed to load members:', err.message);
      setError(err.message || 'Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();

    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      console.log('[MembershipStats] Auto-refresh triggered');
      loadMembers();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadMembers]);

  const onRefresh = useCallback(() => {
    console.log('[MembershipStats] Pull-to-refresh triggered');
    setRefreshing(true);
    loadMembers();
  }, [loadMembers]);

  const handleCall = (phone: string) => {
    console.log('[MembershipStats] User tapped call button for phone:', phone);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    console.log('[MembershipStats] User tapped email button for email:', email);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${email}`);
  };

  const handleFilterPress = (key: FilterStatus) => {
    console.log('[MembershipStats] Filter changed to:', key);
    if (Platform.OS === 'ios') Haptics.selectionAsync();
    setFilter(key);
  };

  const stats = computeStats(members);

  const filteredMembers = members.filter(m => {
    const normalized = normalizeStatus(m.status);
    const matchesFilter = filter === 'all' || normalized === filter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (m.fullName ?? '').toLowerCase().includes(q) ||
      (m.email ?? '').toLowerCase().includes(q) ||
      (m.phone ?? '').includes(q) ||
      (m.commune ?? '').toLowerCase().includes(q) ||
      (m.membershipNumber ?? '').toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const filteredCount = filteredMembers.length;

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Statistiques Adhésion',
            headerShown: true,
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
          }}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Statistiques Adhésion',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          stickyHeaderIndices={[1]}
        >
          {/* ── STATS BANNER ── */}
          <View style={styles.statsBanner}>
            <View style={styles.totalBlock}>
              <Text style={styles.totalNumber}>{stats.total}</Text>
              <Text style={styles.totalLabel}>Adhérents au total</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statPill, { borderColor: '#34C759' }]}>
                <Text style={[styles.statPillNumber, { color: '#34C759' }]}>{stats.active}</Text>
                <Text style={styles.statPillLabel}>Actifs</Text>
              </View>
              <View style={[styles.statPill, { borderColor: '#FF9500' }]}>
                <Text style={[styles.statPillNumber, { color: '#FF9500' }]}>{stats.pending}</Text>
                <Text style={styles.statPillLabel}>En attente</Text>
              </View>
              <View style={[styles.statPill, { borderColor: '#FF3B30' }]}>
                <Text style={[styles.statPillNumber, { color: '#FF3B30' }]}>{stats.suspended}</Text>
                <Text style={styles.statPillLabel}>Suspendus</Text>
              </View>
              <View style={[styles.statPill, { borderColor: '#8E8E93' }]}>
                <Text style={[styles.statPillNumber, { color: '#8E8E93' }]}>{stats.expired}</Text>
                <Text style={styles.statPillLabel}>Expirés</Text>
              </View>
            </View>
          </View>

          {/* ── STICKY SEARCH + FILTERS ── */}
          <View style={styles.stickyBar}>
            <View style={styles.searchRow}>
              <IconSymbol
                ios_icon_name="magnifyingglass"
                android_material_icon_name="search"
                size={16}
                color={colors.textSecondary}
              />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher nom, email, téléphone..."
                placeholderTextColor={colors.textSecondary}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
              {FILTERS.map(f => {
                const isActive = filter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => handleFilterPress(f.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── ERROR STATE ── */}
          {error && (
            <View style={styles.errorBox}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); loadMembers(); }}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── RESULTS COUNT ── */}
          {!error && (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {filteredCount} adhérent{filteredCount !== 1 ? 's' : ''}
                {filter !== 'all' ? ` · ${FILTERS.find(f => f.key === filter)?.label}` : ''}
                {search.trim() ? ` · "${search.trim()}"` : ''}
              </Text>
            </View>
          )}

          {/* ── MEMBER CARDS ── */}
          {!error && filteredMembers.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="person.3"
                android_material_icon_name="group"
                size={56}
                color={colors.border}
              />
              <Text style={styles.emptyTitle}>Aucun adhérent trouvé</Text>
              <Text style={styles.emptySubtitle}>
                {search.trim() ? 'Essayez un autre terme de recherche.' : 'Aucun membre dans cette catégorie.'}
              </Text>
            </View>
          )}

          {!error && filteredMembers.map(member => {
            const statusColor = getStatusColor(member.status);
            const statusLabel = getStatusLabel(member.status);
            const joinDate = formatDate(member.joinedAt ?? member.createdAt ?? '');

            return (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>
                      {member.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.memberName}>{member.fullName}</Text>
                    <Text style={styles.memberNumber}>N° {member.membershipNumber}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.contactGrid}>
                  <View style={styles.contactRow}>
                    <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={14} color={colors.primary} />
                    <Text style={styles.contactValue}>{member.phone}</Text>
                    <TouchableOpacity style={styles.contactAction} onPress={() => handleCall(member.phone)} activeOpacity={0.7}>
                      <Text style={styles.contactActionText}>Appeler</Text>
                    </TouchableOpacity>
                  </View>

                  {member.email ? (
                    <View style={styles.contactRow}>
                      <IconSymbol ios_icon_name="envelope.fill" android_material_icon_name="email" size={14} color={colors.primary} />
                      <Text style={styles.contactValue} numberOfLines={1}>{member.email}</Text>
                      <TouchableOpacity style={styles.contactAction} onPress={() => handleEmail(member.email!)} activeOpacity={0.7}>
                        <Text style={styles.contactActionText}>Email</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <View style={styles.contactRow}>
                    <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={14} color={colors.textSecondary} />
                    <Text style={styles.contactValueSecondary}>{member.commune}</Text>
                  </View>

                  {member.address ? (
                    <View style={styles.contactRow}>
                      <IconSymbol ios_icon_name="house.fill" android_material_icon_name="home" size={14} color={colors.textSecondary} />
                      <Text style={styles.contactValueSecondary}>{member.address}</Text>
                    </View>
                  ) : null}

                  <View style={styles.contactRow}>
                    <IconSymbol ios_icon_name="briefcase.fill" android_material_icon_name="work" size={14} color={colors.textSecondary} />
                    <Text style={styles.contactValueSecondary}>{member.profession}</Text>
                  </View>

                  <View style={styles.contactRow}>
                    <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={14} color={colors.textSecondary} />
                    <Text style={styles.contactValueSecondary}>Inscrit le {joinDate}</Text>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={styles.bottomPad} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F7' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: colors.textSecondary },
  statsBanner: { backgroundColor: colors.primary, paddingTop: 24, paddingBottom: 28, paddingHorizontal: 20 },
  totalBlock: { alignItems: 'center', marginBottom: 20 },
  totalNumber: { fontSize: 72, fontWeight: '800', color: '#FFFFFF', lineHeight: 76 },
  totalLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statPill: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, borderWidth: 1.5, paddingVertical: 10, alignItems: 'center' },
  statPillNumber: { fontSize: 22, fontWeight: '800' },
  statPillLabel: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginTop: 2, textAlign: 'center' },
  stickyBar: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: 12, paddingBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 3 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F4F7', borderRadius: 10, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 8, gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, padding: 0 },
  filterScroll: { flexGrow: 0 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF' },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  filterChipTextActive: { color: '#FFFFFF' },
  errorBox: { margin: 16, backgroundColor: '#FFF3F3', borderRadius: 12, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#FFCDD2' },
  errorText: { fontSize: 14, color: colors.accent, textAlign: 'center' },
  retryButton: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: colors.accent, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  resultsHeader: { paddingHorizontal: 16, paddingVertical: 12 },
  resultsCount: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  memberCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: colors.primary },
  cardHeaderInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '700', color: colors.text },
  memberNumber: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  contactGrid: { padding: 16, gap: 10 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactValue: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
  contactValueSecondary: { flex: 1, fontSize: 14, color: colors.textSecondary },
  contactAction: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.primary + '15', borderRadius: 6 },
  contactActionText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  bottomPad: { height: 16 },
});
