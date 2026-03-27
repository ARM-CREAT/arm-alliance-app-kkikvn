
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { RefreshCw, Search, Users, UserCheck, Clock, UserX } from 'lucide-react-native';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

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
  full_name: string;
  region: string;
  commune: string;
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
  active: '#16A34A',
  pending: '#D97706',
  suspended: '#DC2626',
};

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const bg = STATUS_COLORS[status] ?? colors.textTertiary;
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg + '20' }]}>
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
    console.log('[Stats] Chargement des statistiques des militants');
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stats/members`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} — ${txt.slice(0, 100)}`);
      }
      const json: StatsData = await res.json();
      console.log('[Stats] Données chargées — total:', json.total);
      setData(json);
    } catch (err: any) {
      console.error('[Stats] Erreur:', err.message);
      setError('Impossible de charger les statistiques.');
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
    console.log('[Stats] Membre appuyé:', member.id, member.full_name);
    router.push({ pathname: '/admin/member-detail/[id]' as any, params: { id: member.id } });
  };

  const filteredMembers = data?.members_list.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.member_number.toLowerCase().includes(q)
    );
  }) ?? [];

  const maxRegionCount = data?.by_region.reduce((max, r) => Math.max(max, r.count), 1) ?? 1;

  const maleCount = data?.by_gender.find((g) => g.gender === 'M')?.count ?? 0;
  const femaleCount = data?.by_gender.find((g) => g.gender === 'F')?.count ?? 0;
  const genderTotal = maleCount + femaleCount || 1;
  const malePct = Math.round((maleCount / genderTotal) * 100);
  const femalePct = Math.round((femaleCount / genderTotal) * 100);

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Statistiques des Militants',
            headerShown: true,
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des statistiques...</Text>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Statistiques des Militants',
            headerShown: true,
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStats}>
            <RefreshCw size={16} color="#FFFFFF" />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Statistiques des Militants',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
            <Users size={22} color={colors.primary} />
            <Text style={[styles.summaryNumber, { color: colors.primary }]}>{String(data?.total ?? 0)}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardActive]}>
            <UserCheck size={22} color="#16A34A" />
            <Text style={[styles.summaryNumber, { color: '#16A34A' }]}>{String(data?.active ?? 0)}</Text>
            <Text style={styles.summaryLabel}>Actifs</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardPending]}>
            <Clock size={22} color="#D97706" />
            <Text style={[styles.summaryNumber, { color: '#D97706' }]}>{String(data?.pending ?? 0)}</Text>
            <Text style={styles.summaryLabel}>En attente</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardSuspended]}>
            <UserX size={22} color="#DC2626" />
            <Text style={[styles.summaryNumber, { color: '#DC2626' }]}>{String(data?.suspended ?? 0)}</Text>
            <Text style={styles.summaryLabel}>Suspendus</Text>
          </View>
        </View>

        {/* Recent Registrations */}
        <View style={styles.recentBox}>
          <Text style={styles.recentLabel}>Inscriptions récentes (30j)</Text>
          <Text style={styles.recentNumber}>{String(data?.recent_registrations ?? 0)}</Text>
        </View>

        {/* By Region */}
        {data?.by_region && data.by_region.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Répartition par région</Text>
            {data.by_region.map((r) => {
              const barWidth = Math.max(4, (r.count / maxRegionCount) * 100);
              const barWidthStr = `${barWidth}%`;
              return (
                <View key={r.region} style={styles.regionRow}>
                  <Text style={styles.regionName} numberOfLines={1}>{r.region}</Text>
                  <View style={styles.regionBarWrap}>
                    <View style={[styles.regionBar, { width: barWidthStr as any }]} />
                  </View>
                  <Text style={styles.regionCount}>{String(r.count)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* By Gender */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Répartition par genre</Text>
          <View style={styles.genderRow}>
            <Text style={styles.genderLabel}>Hommes</Text>
            <Text style={styles.genderPct}>{malePct}%</Text>
          </View>
          <View style={styles.progressBarWrap}>
            <View style={[styles.progressBarFill, { width: `${malePct}%` as any, backgroundColor: colors.primary }]} />
          </View>
          <View style={[styles.genderRow, { marginTop: 12 }]}>
            <Text style={styles.genderLabel}>Femmes</Text>
            <Text style={styles.genderPct}>{femalePct}%</Text>
          </View>
          <View style={styles.progressBarWrap}>
            <View style={[styles.progressBarFill, { width: `${femalePct}%` as any, backgroundColor: '#D97706' }]} />
          </View>
        </View>

        {/* Members List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liste Complète des Militants</Text>
          <View style={styles.searchBar}>
            <Search size={16} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par nom ou numéro..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={(t) => {
                console.log('[Stats] Recherche:', t);
                setSearch(t);
              }}
            />
          </View>

          {filteredMembers.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={styles.memberRow}
              onPress={() => handleMemberPress(member)}
              activeOpacity={0.8}
            >
              <View style={styles.memberLeft}>
                <Text style={styles.memberNumber}>{member.member_number}</Text>
                <Text style={styles.memberName}>{member.full_name}</Text>
                <Text style={styles.memberRegion}>{member.region}</Text>
              </View>
              <StatusBadge status={member.status} />
            </TouchableOpacity>
          ))}

          {filteredMembers.length === 0 && (
            <View style={styles.emptySearch}>
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
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  summaryCardPrimary: {
    borderTopWidth: 3,
    borderTopColor: colors.primary,
  },
  summaryCardActive: {
    borderTopWidth: 3,
    borderTopColor: '#16A34A',
  },
  summaryCardPending: {
    borderTopWidth: 3,
    borderTopColor: '#D97706',
  },
  summaryCardSuspended: {
    borderTopWidth: 3,
    borderTopColor: '#DC2626',
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  recentBox: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  recentNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.accent,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  regionName: {
    width: 90,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  regionBarWrap: {
    flex: 1,
    height: 10,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 5,
    overflow: 'hidden',
  },
  regionBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  regionCount: {
    width: 30,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  genderPct: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarWrap: {
    height: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  memberLeft: {
    flex: 1,
    marginRight: 12,
  },
  memberNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  memberRegion: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptySearchText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 32,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
