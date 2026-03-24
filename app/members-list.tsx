
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { AnimatedPressable } from '@/components/AnimatedPressable';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

interface Member {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  commune?: string;
  membershipNumber: string;
  status: string;
  joinedAt?: string;
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

function AnimatedMemberRow({ item, index }: { item: Member; index: number }) {
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
  const initials = getInitials(item.fullName || `${item.firstName} ${item.lastName}`);
  const displayName = item.fullName || [item.firstName, item.lastName].filter(Boolean).join(' ') || '—';
  const phoneStr = item.phone || '—';
  const communeStr = item.commune || '—';

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View style={styles.memberCard}>
        <View style={styles.memberCardRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName} numberOfLines={1}>{displayName}</Text>
            <View style={styles.memberDetailRow}>
              <Text style={styles.memberDetailIcon}>📞</Text>
              <Text style={styles.memberDetailText} numberOfLines={1}>{phoneStr}</Text>
            </View>
            <View style={styles.memberDetailRow}>
              <Text style={styles.memberDetailIcon}>📍</Text>
              <Text style={styles.memberDetailText} numberOfLines={1}>{communeStr}</Text>
            </View>
            <Text style={styles.memberNumber}>{item.membershipNumber}</Text>
          </View>
          <View style={styles.memberRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>
      </View>
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
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const buildUrl = (tab: FilterTab, search: string) => {
    const params: string[] = [];
    if (tab !== 'all') params.push(`status=${tab}`);
    if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
    return `${BACKEND_URL}/api/members${params.length ? '?' + params.join('&') : ''}`;
  };

  const loadMembers = useCallback(async (tab?: FilterTab, search?: string) => {
    const currentTab = tab ?? activeTab;
    const currentSearch = search ?? searchQuery;
    const url = buildUrl(currentTab, currentSearch);

    console.log('[MembersList] GET', url);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        console.error('[MembersList] Erreur:', response.status, text);
        throw new Error(`Erreur ${response.status}`);
      }
      const data = await response.json();
      const list: Member[] = data?.members ?? (Array.isArray(data) ? data : []);
      const count: number = data?.total ?? list.length;
      console.log('[MembersList] Adhérents chargés:', list.length, '/ total:', count);
      setAllMembers(list);
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
    loadMembers(activeTab, searchQuery);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    console.log('[MembersList] Pull-to-refresh');
    setRefreshing(true);
    loadMembers(activeTab, searchQuery);
  }, [activeTab, searchQuery, loadMembers]);

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
    loadMembers(activeTab, searchQuery);
  };

  const tabs: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'active', label: 'Actifs' },
    { value: 'pending', label: 'En attente' },
    { value: 'suspended', label: 'Suspendus' },
  ];

  const totalLabel = `${total} adhérent${total !== 1 ? 's' : ''} inscrits`;

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
            data={allMembers}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <AnimatedMemberRow item={item} index={index} />
            )}
            contentContainerStyle={[
              styles.listContent,
              allMembers.length === 0 && styles.listContentEmpty,
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
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  countRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  memberNumber: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
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
