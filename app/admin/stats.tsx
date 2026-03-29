
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '@/utils/api';

interface RegionStat {
  region: string;
  count: number;
}

interface GenderStat {
  gender: string;
  count: number;
}

interface MemberRow {
  id: string;
  member_number: string;
  membership_number?: string;
  full_name: string;
  region: string;
  commune: string;
  phone?: string;
  status: 'active' | 'pending' | 'suspended';
  created_at: string;
}

interface StatsData {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  by_region: RegionStat[];
  by_gender: GenderStat[];
  recent_registrations: number;
  members_list: MemberRow[];
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  pending: 'En attente',
  suspended: 'Suspendu',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  pending: '#f59e0b',
  suspended: '#ef4444',
};

const AVATAR_COLORS = ['#2d6a4f', '#1e6091', '#7b2d8b', '#b5451b', '#1a6b4a', '#5c4a1e'];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = (name || '').trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name || '?')[0].toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const bg = STATUS_COLORS[status] ?? '#888';
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg + '25' }]}>
      <View style={[styles.statusDot, { backgroundColor: bg }]} />
      <Text style={[styles.statusBadgeText, { color: bg }]}>{label}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const router = useRouter();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchStats = useCallback(async () => {
    console.log('[Stats] GET /api/stats/members');
    setError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stats/members`, {
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': 'admin123',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
      }
      const json: StatsData = await res.json();
      console.log('[Stats] Données chargées — total:', json.total, 'membres_list:', json.members_list?.length ?? 0);
      setData(json);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('[Stats] Erreur:', err.message);
      if (err.name === 'AbortError') {
        setError('Délai dépassé. Vérifiez votre connexion.');
      } else {
        setError(err.message || 'Impossible de charger les statistiques.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(async () => {
    console.log('[Stats] Actualisation');
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  const handleMemberPress = (member: MemberRow) => {
    const memberNum = member.member_number || member.membership_number || '';
    console.log('[Stats] Membre appuyé:', member.id, member.full_name);
    router.push({
      pathname: '/admin/member-detail/[id]' as any,
      params: {
        id: member.id,
        full_name: member.full_name,
        member_number: memberNum,
        region: member.region || '',
        commune: member.commune || '',
        phone: member.phone || '',
        status: member.status,
        created_at: member.created_at,
      },
    });
  };

  const filteredMembers = (data?.members_list ?? []).filter((m) => {
    const q = search.toLowerCase();
    const num = (m.member_number || m.membership_number || '').toLowerCase();
    return (
      (m.full_name || '').toLowerCase().includes(q) ||
      num.includes(q) ||
      (m.region || '').toLowerCase().includes(q)
    );
  });

  const maxRegionCount = (data?.by_region ?? []).reduce((max, r) => Math.max(max, r.count), 1);

  const maleCount = (data?.by_gender ?? []).find((g) => g.gender === 'M' || g.gender === 'male')?.count ?? 0;
  const femaleCount = (data?.by_gender ?? []).find((g) => g.gender === 'F' || g.gender === 'female')?.count ?? 0;
  const genderTotal = maleCount + femaleCount || 1;
  const malePct = Math.round((maleCount / genderTotal) * 100);
  const femalePct = Math.round((femaleCount / genderTotal) * 100);
  const malePctStr = `${malePct}%`;
  const femalePctStr = `${femalePct}%`;

  const totalStr = String(data?.total ?? 0);
  const activeStr = String(data?.active ?? 0);
  const pendingStr = String(data?.pending ?? 0);
  const suspendedStr = String(data?.suspended ?? 0);
  const recentStr = String(data?.recent_registrations ?? 0);
  const memberCountLabel = `${filteredMembers.length} adhérent${filteredMembers.length !== 1 ? 's' : ''}`;

  const screenOptions = {
    title: 'Statistiques des Militants',
    headerShown: true,
    headerStyle: { backgroundColor: '#0f1f14' as any },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: { fontWeight: 'bold' as const },
    headerRight: () => (
      <TouchableOpacity onPress={() => { console.log('[Stats] Bouton refresh appuyé'); onRefresh(); }} style={{ marginRight: 16 }}>
        <Ionicons name="refresh" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    ),
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2d6a4f" />
          <Text style={styles.loadingText}>Chargement des statistiques...</Text>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={52} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStats}>
            <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2d6a4f" colors={['#2d6a4f']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1 — KPI Cards */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#2d6a4f30' }]}>
              <Ionicons name="people" size={22} color="#4ade80" />
            </View>
            <Text style={[styles.kpiNumber, { color: '#4ade80' }]}>{totalStr}</Text>
            <Text style={styles.kpiLabel}>Total membres</Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiCardActive]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#22c55e25' }]}>
              <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
            </View>
            <Text style={[styles.kpiNumber, { color: '#22c55e' }]}>{activeStr}</Text>
            <Text style={styles.kpiLabel}>Actifs</Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiCardPending]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#f59e0b25' }]}>
              <Ionicons name="time" size={22} color="#f59e0b" />
            </View>
            <Text style={[styles.kpiNumber, { color: '#f59e0b' }]}>{pendingStr}</Text>
            <Text style={styles.kpiLabel}>En attente</Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiCardSuspended]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#ef444425' }]}>
              <Ionicons name="close-circle" size={22} color="#ef4444" />
            </View>
            <Text style={[styles.kpiNumber, { color: '#ef4444' }]}>{suspendedStr}</Text>
            <Text style={styles.kpiLabel}>Suspendus</Text>
          </View>
        </View>

        {/* Section 2 — Inscriptions récentes */}
        <View style={styles.recentBanner}>
          <View style={styles.recentBannerLeft}>
            <Ionicons name="trending-up" size={24} color="#4ade80" style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.recentBannerTitle}>Inscriptions récentes</Text>
              <Text style={styles.recentBannerSub}>30 derniers jours</Text>
            </View>
          </View>
          <Text style={styles.recentBannerNumber}>{recentStr}</Text>
        </View>

        {/* Section 3 — Répartition par région */}
        {(data?.by_region ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Répartition par région</Text>
            {(data?.by_region ?? []).map((r) => {
              const pct = Math.max(4, (r.count / maxRegionCount) * 100);
              const pctStr = `${pct}%`;
              const regionPct = Math.round((r.count / (data?.total || 1)) * 100);
              const regionPctStr = `${regionPct}%`;
              return (
                <View key={r.region} style={styles.regionRow}>
                  <View style={styles.regionRowTop}>
                    <Text style={styles.regionName} numberOfLines={1}>{r.region || 'Inconnue'}</Text>
                    <View style={styles.regionRowRight}>
                      <Text style={styles.regionPct}>{regionPctStr}</Text>
                      <Text style={styles.regionCount}>{String(r.count)}</Text>
                    </View>
                  </View>
                  <View style={styles.regionBarWrap}>
                    <View style={[styles.regionBar, { width: pctStr as any }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Section 4 — Répartition par genre */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Répartition par genre</Text>
          <View style={styles.genderBlock}>
            <View style={styles.genderRowHeader}>
              <View style={styles.genderLabelRow}>
                <View style={[styles.genderDot, { backgroundColor: '#2d6a4f' }]} />
                <Text style={styles.genderLabel}>Hommes</Text>
              </View>
              <View style={styles.genderStats}>
                <Text style={styles.genderCount}>{String(maleCount)}</Text>
                <Text style={styles.genderPct}>{malePctStr}</Text>
              </View>
            </View>
            <View style={styles.progressBarWrap}>
              <View style={[styles.progressBarFill, { width: malePctStr as any, backgroundColor: '#2d6a4f' }]} />
            </View>
          </View>
          <View style={[styles.genderBlock, { marginTop: 14 }]}>
            <View style={styles.genderRowHeader}>
              <View style={styles.genderLabelRow}>
                <View style={[styles.genderDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.genderLabel}>Femmes</Text>
              </View>
              <View style={styles.genderStats}>
                <Text style={styles.genderCount}>{String(femaleCount)}</Text>
                <Text style={styles.genderPct}>{femalePctStr}</Text>
              </View>
            </View>
            <View style={styles.progressBarWrap}>
              <View style={[styles.progressBarFill, { width: femalePctStr as any, backgroundColor: '#f59e0b' }]} />
            </View>
          </View>
        </View>

        {/* Section 5 — Liste complète */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Liste des adhérents</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{memberCountLabel}</Text>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#6b7280" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Nom, numéro, région..."
              placeholderTextColor="#6b7280"
              value={search}
              onChangeText={(t) => {
                console.log('[Stats] Recherche:', t);
                setSearch(t);
              }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          {filteredMembers.map((member) => {
            const memberNum = member.member_number || member.membership_number || '';
            const initials = getInitials(member.full_name);
            const avatarColor = getAvatarColor(member.full_name);
            const locationText = [member.commune, member.region].filter(Boolean).join(', ') || '—';
            return (
              <TouchableOpacity
                key={member.id}
                style={styles.memberRow}
                onPress={() => handleMemberPress(member)}
                activeOpacity={0.75}
              >
                <View style={[styles.memberAvatar, { backgroundColor: avatarColor + '30' }]}>
                  <Text style={[styles.memberAvatarText, { color: avatarColor }]}>{initials}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName} numberOfLines={1}>{member.full_name}</Text>
                  <Text style={styles.memberNumber}>{memberNum}</Text>
                  <Text style={styles.memberLocation} numberOfLines={1}>{locationText}</Text>
                </View>
                <View style={styles.memberRight}>
                  <StatusBadge status={member.status} />
                  <Ionicons name="chevron-forward" size={14} color="#6b7280" style={{ marginTop: 4 }} />
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredMembers.length === 0 && (
            <View style={styles.emptySearch}>
              <Ionicons name="people-outline" size={40} color="#4b5563" />
              <Text style={styles.emptySearchText}>Aucun militant trouvé</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    width: '47.5%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  kpiCardPrimary: { borderTopWidth: 2, borderTopColor: '#2d6a4f' },
  kpiCardActive: { borderTopWidth: 2, borderTopColor: '#22c55e' },
  kpiCardPending: { borderTopWidth: 2, borderTopColor: '#f59e0b' },
  kpiCardSuspended: { borderTopWidth: 2, borderTopColor: '#ef4444' },
  kpiIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiNumber: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  // Recent banner
  recentBanner: {
    backgroundColor: '#1a2e1f',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2d6a4f40',
  },
  recentBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  recentBannerSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  recentBannerNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#4ade80',
    letterSpacing: -1,
  },
  // Section
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#e5e7eb',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  countBadge: {
    backgroundColor: '#2d6a4f25',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2d6a4f40',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4ade80',
  },
  // Region bars
  regionRow: {
    marginBottom: 12,
  },
  regionRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  regionName: {
    flex: 1,
    fontSize: 13,
    color: '#d1d5db',
    fontWeight: '600',
    marginRight: 8,
  },
  regionRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regionPct: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  regionCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4ade80',
    minWidth: 24,
    textAlign: 'right',
  },
  regionBarWrap: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  regionBar: {
    height: '100%',
    backgroundColor: '#2d6a4f',
    borderRadius: 4,
  },
  // Gender
  genderBlock: {},
  genderRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  genderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
  },
  genderStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genderCount: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  genderPct: {
    fontSize: 14,
    fontWeight: '800',
    color: '#e5e7eb',
  },
  progressBarWrap: {
    height: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#e5e7eb',
  },
  // Member rows
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  memberAvatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 2,
  },
  memberNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ade80',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  memberLocation: {
    fontSize: 12,
    color: '#6b7280',
  },
  memberRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptySearchText: {
    fontSize: 14,
    color: '#6b7280',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    padding: 32,
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    fontSize: 15,
    color: '#9ca3af',
  },
  errorText: {
    fontSize: 15,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
