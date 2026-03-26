
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { AnimatedPressable } from '@/components/AnimatedPressable';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';
const ADMIN_HEADERS = { 'Content-Type': 'application/json', 'x-admin-password': 'admin123' };

interface Member {
  id: string;
  member_number: string;
  full_name: string;
  phone: string;
  commune: string;
  status: string;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
}

type FilterTab = 'all' | 'active' | 'pending' | 'suspended';

function getStatusColor(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active') return '#1B7A3E';
  if (s === 'pending') return '#D97706';
  if (s === 'suspended') return '#DC2626';
  return colors.textSecondary;
}

function getStatusLabel(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active') return 'Actif';
  if (s === 'pending') return 'En attente';
  if (s === 'suspended') return 'Suspendu';
  return String(status || '—');
}

function getInitials(fullName: string): string {
  const parts = (fullName || '').trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return (fullName || '?').charAt(0).toUpperCase();
}

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

function AnimatedMemberRow({
  item,
  index,
  onLongPress,
}: {
  item: Member;
  index: number;
  onLongPress: (member: Member) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: Math.min(index * 40, 400),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: Math.min(index * 40, 400),
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusColor = getStatusColor(item.status);
  const statusLabel = getStatusLabel(item.status);
  const initials = getInitials(item.full_name);
  const dateStr = formatDate(item.created_at);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <AnimatedPressable
        style={styles.memberCard}
        onLongPress={() => {
          console.log('[MembersList] Long-press sur membre:', item.full_name, item.id);
          onLongPress(item);
        }}
        delayLongPress={400}
      >
        <View style={styles.memberCardRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName} numberOfLines={1}>{item.full_name}</Text>
            <Text style={styles.memberNumber}>{item.member_number}</Text>
            <View style={styles.memberDetailRow}>
              <Text style={styles.memberDetailIcon}>📞</Text>
              <Text style={styles.memberDetailText} numberOfLines={1}>{item.phone || '—'}</Text>
            </View>
            <View style={styles.memberDetailRow}>
              <Text style={styles.memberDetailIcon}>📍</Text>
              <Text style={styles.memberDetailText} numberOfLines={1}>{item.commune || '—'}</Text>
            </View>
            <View style={styles.memberDetailRow}>
              <Text style={styles.memberDetailIcon}>📅</Text>
              <Text style={styles.memberDetailText}>{dateStr}</Text>
            </View>
          </View>
          <View style={styles.memberRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function SkeletonRow() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonInfo}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '60%', marginTop: 6 }]} />
        <View style={[styles.skeletonLine, { width: '70%', marginTop: 6 }]} />
        <View style={[styles.skeletonLine, { width: '50%', marginTop: 6 }]} />
      </View>
      <View style={styles.skeletonRight}>
        <View style={styles.skeletonBadge} />
      </View>
    </Animated.View>
  );
}

export default function MembersListScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const buildMembersUrl = (tab: FilterTab, search: string) => {
    const params: string[] = ['limit=50'];
    if (tab !== 'all') params.push(`status=${tab}`);
    if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
    return `${BACKEND_URL}/api/members?${params.join('&')}`;
  };

  const loadStats = useCallback(async () => {
    console.log('[MembersList] GET /api/members/stats');
    try {
      const res = await fetch(`${BACKEND_URL}/api/members/stats`, { headers: ADMIN_HEADERS });
      if (!res.ok) {
        const text = await res.text();
        console.error('[MembersList] Stats erreur:', res.status, text);
        return;
      }
      const data = await res.json();
      console.log('[MembersList] Stats chargées:', JSON.stringify(data));
      setStats(data);
    } catch (err: any) {
      console.error('[MembersList] Stats erreur réseau:', err.message);
    }
  }, []);

  const loadMembers = useCallback(async (tab?: FilterTab, search?: string) => {
    const currentTab = tab ?? activeTab;
    const currentSearch = search ?? searchQuery;
    const url = buildMembersUrl(currentTab, currentSearch);

    console.log('[MembersList] GET', url);
    setError(null);

    try {
      const res = await fetch(url, { headers: ADMIN_HEADERS });
      if (!res.ok) {
        const text = await res.text();
        console.error('[MembersList] Erreur:', res.status, text);
        throw new Error(`Erreur ${res.status}`);
      }
      const data = await res.json();
      console.log('[MembersList] Réponse brute:', JSON.stringify(data).slice(0, 300));
      // Handle both array response and wrapped { members: [] } response
      const list: Member[] = Array.isArray(data)
        ? data
        : (data?.members ?? data?.memberships ?? data?.data ?? []);
      // Normalise field names: some API versions return `name` instead of `full_name`
      const normalised: Member[] = list.map((m: any) => ({
        ...m,
        full_name: m.full_name || m.name || m.fullName || '',
        member_number: m.member_number || m.memberNumber || m.membership_number || '',
        phone: m.phone || m.telephone || '',
        commune: m.commune || m.city || '',
        status: m.status || 'pending',
      }));
      const count: number = data?.total ?? data?.count ?? normalised.length;
      console.log('[MembersList] Adhérents chargés:', normalised.length, '/ total:', count);
      setMembers(normalised);
      setTotal(count);
    } catch (err: any) {
      console.error('[MembersList] Erreur chargement:', err.message);
      setError(err.message || 'Impossible de charger les adhérents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStats(), loadMembers(activeTab, searchQuery)]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    console.log('[MembersList] Pull-to-refresh');
    setRefreshing(true);
    Promise.all([loadStats(), loadMembers(activeTab, searchQuery)]);
  }, [activeTab, searchQuery, loadStats, loadMembers]);

  const handleTabPress = (tab: FilterTab) => {
    console.log('[MembersList] Filtre sélectionné:', tab);
    setSearchQuery('');
    setActiveTab(tab);
  };

  const handleSearchSubmit = () => {
    console.log('[MembersList] Recherche soumise:', searchQuery);
    setLoading(true);
    loadMembers(activeTab, searchQuery);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setLoading(true);
      loadMembers(activeTab, '');
    }
  };

  const handleRetry = () => {
    console.log('[MembersList] Bouton Réessayer appuyé');
    setLoading(true);
    Promise.all([loadStats(), loadMembers(activeTab, searchQuery)]);
  };

  const handleChangeStatus = async (member: Member, newStatus: string) => {
    console.log('[MembersList] PUT /api/members/' + member.id, '->', newStatus);
    try {
      const res = await fetch(`${BACKEND_URL}/api/members/${member.id}`, {
        method: 'PUT',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('[MembersList] Erreur changement statut:', res.status, text);
        Alert.alert('Erreur', `Impossible de modifier le statut (${res.status})`);
        return;
      }
      console.log('[MembersList] Statut mis à jour avec succès:', member.full_name, '->', newStatus);
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m))
      );
      loadStats();
    } catch (err: any) {
      console.error('[MembersList] Erreur réseau changement statut:', err.message);
      Alert.alert('Erreur', 'Impossible de modifier le statut.');
    }
  };

  const handleLongPress = (member: Member) => {
    const options: { text: string; status?: string; style?: 'cancel' | 'destructive' }[] = [];

    if (member.status !== 'active') {
      options.push({ text: 'Activer', status: 'active' });
    }
    if (member.status !== 'pending') {
      options.push({ text: 'Mettre en attente', status: 'pending' });
    }
    if (member.status !== 'suspended') {
      options.push({ text: 'Suspendre', status: 'suspended', style: 'destructive' });
    }
    options.push({ text: 'Annuler', style: 'cancel' });

    Alert.alert(
      member.full_name,
      `Statut actuel : ${getStatusLabel(member.status)}\nChoisissez une action :`,
      options.map((opt) => ({
        text: opt.text,
        style: opt.style,
        onPress: opt.status
          ? () => {
              console.log('[MembersList] Action statut sélectionnée:', opt.text, 'pour', member.full_name);
              handleChangeStatus(member, opt.status!);
            }
          : undefined,
      }))
    );
  };

  const tabs: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'active', label: 'Actifs' },
    { value: 'pending', label: 'En attente' },
    { value: 'suspended', label: 'Suspendus' },
  ];

  const totalLabel = `${total} adhérent${total !== 1 ? 's' : ''}`;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Adhérents ARM',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: 'Retour',
        }}
      />

      <View style={styles.container}>
        {/* Stats bar */}
        {stats && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#1B7A3E' }]}>{stats.active}</Text>
              <Text style={styles.statLabel}>Actifs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#D97706' }]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>En attente</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#DC2626' }]}>{stats.suspended}</Text>
              <Text style={styles.statLabel}>Suspendus</Text>
            </View>
          </View>
        )}

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={18}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par nom, téléphone, commune..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <AnimatedPressable
                onPress={() => {
                  console.log('[MembersList] Recherche effacée');
                  setSearchQuery('');
                  setLoading(true);
                  loadMembers(activeTab, '');
                }}
                style={styles.clearBtn}
              >
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={18}
                  color={colors.textSecondary}
                />
              </AnimatedPressable>
            )}
          </View>
        </View>

        {/* Filter tabs */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <AnimatedPressable
                key={tab.value}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTabPress(tab.value)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Count header */}
        {!loading && !error && (
          <View style={styles.countRow}>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{totalLabel}</Text>
            </View>
            <Text style={styles.longPressHint}>Appui long pour modifier le statut</Text>
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.skeletonContainer}>
            {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconCircle}>
              <Text style={styles.errorIconText}>⚠️</Text>
            </View>
            <Text style={styles.errorTitle}>Impossible de charger les adhérents</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <AnimatedPressable style={styles.retryBtn} onPress={handleRetry}>
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </AnimatedPressable>
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <AnimatedMemberRow item={item} index={index} onLongPress={handleLongPress} />
            )}
            contentContainerStyle={[
              styles.listContent,
              members.length === 0 && styles.listContentEmpty,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyIconText}>👥</Text>
                </View>
                <Text style={styles.emptyTitle}>Aucun adhérent trouvé</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery.trim()
                    ? 'Essayez un autre nom, téléphone ou commune.'
                    : 'Les adhérents apparaîtront ici après inscription.'}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 4,
  },
  searchContainer: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  clearBtn: {
    padding: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  countRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  longPressHint: {
    fontSize: 11,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
    paddingTop: 4,
  },
  listContentEmpty: {
    flex: 1,
  },
  memberCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  memberCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  memberNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFC107',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  memberDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  memberDetailIcon: {
    fontSize: 11,
  },
  memberDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  memberRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  skeletonContainer: {
    padding: 12,
    gap: 8,
  },
  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceSecondary,
    marginRight: 12,
  },
  skeletonInfo: {
    flex: 1,
  },
  skeletonLine: {
    height: 13,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    width: '80%',
  },
  skeletonRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  skeletonBadge: {
    width: 60,
    height: 22,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  errorIconText: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyIconText: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});
