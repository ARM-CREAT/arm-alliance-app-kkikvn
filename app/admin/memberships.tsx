import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { BACKEND_URL } from '@/utils/api-helpers';

const C = Colors.light;
const ADMIN_PASSWORD = 'admin123';

interface Member {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  location: string;
  created_at: string;
}

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

function getInitials(firstName: string, lastName: string): string {
  const f = (firstName || '').charAt(0).toUpperCase();
  const l = (lastName || '').charAt(0).toUpperCase();
  return f + l || '?';
}

export default function AdminMembershipsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async (isRefresh = false) => {
    console.log('[AdminMemberships] GET /api/members');
    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      const [membersRes, countRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/members`, {
          headers: { 'x-admin-password': ADMIN_PASSWORD },
        }),
        fetch(`${BACKEND_URL}/api/members/count`),
      ]);

      if (!membersRes.ok) {
        const text = await membersRes.text();
        console.log('[AdminMemberships] Erreur HTTP', membersRes.status, text);
        throw new Error(`Erreur ${membersRes.status}: impossible de charger les membres`);
      }

      const membersData: Member[] = await membersRes.json();
      console.log('[AdminMemberships] Membres chargés:', membersData.length);
      setMembers(Array.isArray(membersData) ? membersData : []);

      if (countRes.ok) {
        const countData = await countRes.json();
        setTotalCount(typeof countData.count === 'number' ? countData.count : null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log('[AdminMemberships] Erreur:', message);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMembers(false);
    }, [loadMembers])
  );

  const onRefresh = useCallback(() => {
    console.log('[AdminMemberships] Pull-to-refresh déclenché');
    setRefreshing(true);
    loadMembers(true);
  }, [loadMembers]);

  const displayCount = totalCount !== null ? String(totalCount) : String(members.length);

  const renderItem = ({ item }: { item: Member }) => {
    const initials = getInitials(item.first_name, item.last_name);
    const fullName = `${item.first_name} ${item.last_name}`.trim();
    const dateStr = formatDate(item.created_at);

    return (
      <View style={styles.memberCard}>
        <View style={styles.memberCardRow}>
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>{initials}</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName} numberOfLines={1}>{fullName}</Text>
            <Text style={styles.memberNumber}>{item.member_number}</Text>
            <View style={styles.memberMetaRow}>
              <Ionicons name="call-outline" size={11} color={C.textTertiary} style={{ marginRight: 3 }} />
              <Text style={styles.memberMeta} numberOfLines={1}>{item.phone || '—'}</Text>
            </View>
            <View style={styles.memberMetaRow}>
              <Ionicons name="location-outline" size={11} color={C.textTertiary} style={{ marginRight: 3 }} />
              <Text style={styles.memberMeta} numberOfLines={1}>{item.location || '—'}</Text>
            </View>
          </View>
          <View style={styles.memberRight}>
            <Text style={styles.memberDate}>{dateStr}</Text>
          </View>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View style={styles.statsBar}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{displayCount}</Text>
        <Text style={styles.statLabel}>Total membres</Text>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={56} color={C.textTertiary} />
      <Text style={styles.emptyText}>Aucun membre inscrit</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Adhésions',
          headerStyle: { backgroundColor: C.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                console.log('[AdminMemberships] Bouton Réessayer appuyé');
                loadMembers(false);
              }}
            >
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmpty}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[C.primary]}
                tintColor={C.primary}
              />
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
    backgroundColor: C.background,
  },
  statsBar: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: C.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    color: C.danger,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: C.textSecondary,
    textAlign: 'center',
  },
  memberCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  memberCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.primary,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  memberNumber: {
    fontSize: 12,
    color: C.primary,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 0.5,
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberMeta: {
    fontSize: 12,
    color: C.textSecondary,
    flex: 1,
  },
  memberRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: 8,
  },
  memberDate: {
    fontSize: 11,
    color: C.textTertiary,
    fontWeight: '500',
  },
});
