
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedGet } from '@/utils/api';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  membership_date: string;
  status: string;
}

interface MembersResponse {
  members: Member[];
  total: number;
}

type FilterTab = 'all' | 'active' | 'inactive';

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateString);
  }
}

function getStatusColor(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'actif') return '#34C759';
  return '#FF3B30';
}

function getStatusLabel(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'actif') return 'Actif';
  if (s === 'inactive' || s === 'inactif') return 'Inactif';
  return String(status || '—');
}

function getInitials(firstName: string, lastName: string): string {
  const f = (firstName || '').charAt(0).toUpperCase();
  const l = (lastName || '').charAt(0).toUpperCase();
  return f + l || '?';
}

// Animated list item with staggered entrance
function AnimatedMemberRow({
  item,
  index,
}: {
  item: Member;
  index: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: Math.min(index * 50, 400),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: Math.min(index * 50, 400),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const statusColor = getStatusColor(item.status);
  const statusLabel = getStatusLabel(item.status);
  const initials = getInitials(item.first_name, item.last_name);
  const fullName = [item.first_name, item.last_name].filter(Boolean).join(' ') || '—';
  const dateStr = formatDate(item.membership_date);
  const emailStr = item.email || '—';

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View style={styles.memberCard}>
        <View style={styles.memberCardRow}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {/* Info */}
          <View style={styles.memberInfo}>
            <Text style={styles.memberName} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.memberEmail} numberOfLines={1}>
              {emailStr}
            </Text>
          </View>

          {/* Right side: badge + date */}
          <View style={styles.memberRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
            <Text style={styles.memberDate}>{dateStr}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// Skeleton loader row
function SkeletonRow() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonInfo}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '60%', marginTop: 6 }]} />
      </View>
      <View style={styles.skeletonRight}>
        <View style={styles.skeletonBadge} />
        <View style={[styles.skeletonLine, { width: 48, marginTop: 6 }]} />
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

  const loadMembers = useCallback(async (tab?: FilterTab) => {
    const currentTab = tab ?? activeTab;
    const endpoint =
      currentTab === 'all'
        ? '/api/members'
        : `/api/members?status=${currentTab === 'active' ? 'active' : 'inactive'}`;

    console.log('[MembersList] GET', endpoint);
    setError(null);

    try {
      const data = await authenticatedGet<MembersResponse>(endpoint);
      const list: Member[] = data?.members ?? (Array.isArray(data) ? data : []);
      const count: number = data?.total ?? list.length;
      console.log('[MembersList] Members loaded:', list.length, '/ total:', count);
      setAllMembers(list);
      setTotal(count);
    } catch (err: any) {
      console.error('[MembersList] Error loading members:', err);
      setError(err.message || 'Impossible de charger les adhérents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    loadMembers(activeTab);
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    console.log('[MembersList] Pull-to-refresh triggered');
    setRefreshing(true);
    loadMembers(activeTab);
  }, [activeTab, loadMembers]);

  const handleTabPress = (tab: FilterTab) => {
    console.log('[MembersList] User tapped filter tab:', tab);
    setSearchQuery('');
    setActiveTab(tab);
  };

  const handleSearchChange = (text: string) => {
    console.log('[MembersList] Search query changed:', text);
    setSearchQuery(text);
  };

  const handleRetry = () => {
    console.log('[MembersList] User tapped retry');
    setLoading(true);
    loadMembers(activeTab);
  };

  // Client-side search filter
  const filteredMembers = allMembers.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    return fullName.includes(q) || (m.email || '').toLowerCase().includes(q);
  });

  const tabs: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' },
  ];

  const totalLabel = `${total} adhérent${total !== 1 ? 's' : ''}`;
  const filteredCount = filteredMembers.length;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Adhérents',
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
              placeholder="Rechercher par nom ou email..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  console.log('[MembersList] User cleared search');
                  setSearchQuery('');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter tabs */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTabPress(tab.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Count header */}
        {!loading && !error && (
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {searchQuery.trim() ? `${filteredCount} résultat${filteredCount !== 1 ? 's' : ''}` : totalLabel}
            </Text>
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.skeletonContainer}>
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={44}
              color={colors.danger}
            />
            <Text style={styles.errorTitle}>Impossible de charger les adhérents</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredMembers}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <AnimatedMemberRow item={item} index={index} />
            )}
            contentContainerStyle={[
              styles.listContent,
              filteredMembers.length === 0 && styles.listContentEmpty,
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
                  <IconSymbol
                    ios_icon_name="person.3"
                    android_material_icon_name="group"
                    size={32}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery.trim() ? 'Aucun résultat' : 'Aucun adhérent'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery.trim()
                    ? 'Essayez un autre nom ou email.'
                    : 'Les adhérents apparaîtront ici.'}
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
    backgroundColor: colors.backgroundAlt,
  },
  // Search
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
    backgroundColor: colors.backgroundAlt,
    borderRadius: 10,
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
  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    gap: 4,
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  // Count row
  countRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  // List
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flex: 1,
  },
  // Member card
  memberCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  memberCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
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
  },
  memberEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  memberRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  memberDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  // Skeleton
  skeletonContainer: {
    padding: 12,
    gap: 8,
  },
  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  skeletonInfo: {
    flex: 1,
  },
  skeletonLine: {
    height: 13,
    borderRadius: 6,
    backgroundColor: colors.border,
    width: '80%',
  },
  skeletonRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  skeletonBadge: {
    width: 44,
    height: 20,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
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
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
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
