import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL, getBearerToken } from '@/utils/api';
import { Colors } from '@/constants/Colors';

const C = Colors.light;

interface Member {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  membership_type?: string;
  membership_number?: string;
  member_number?: string;
  status?: string;
  created_at?: string;
}

function getMemberDisplayName(m: Member): string {
  if (m.full_name) return m.full_name;
  const parts = [m.first_name, m.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '—';
}

function getMemberNumber(m: Member): string {
  return m.membership_number ?? m.member_number ?? '';
}

function getStatusColor(status?: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active') return '#16a34a';
  if (s === 'pending') return '#D97706';
  if (s === 'suspended') return '#DC2626';
  return C.textSecondary;
}

function getStatusLabel(status?: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active') return 'Actif';
  if (s === 'pending') return 'En attente';
  if (s === 'suspended') return 'Suspendu';
  return status ? String(status) : 'Inconnu';
}

function getMembershipTypeLabel(type?: string): string {
  if (!type) return '—';
  const t = type.toLowerCase();
  if (t === 'standard') return 'Standard';
  if (t === 'actif') return 'Actif';
  if (t === 'sympathisant') return 'Sympathisant';
  return String(type);
}

function getInitials(name: string): string {
  const parts = (name || '').trim().split(' ');
  if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  return (name || '?').charAt(0).toUpperCase();
}

function MemberRow({ item }: { item: Member }) {
  const displayName = getMemberDisplayName(item);
  const memberNum = getMemberNumber(item);
  const statusColor = getStatusColor(item.status);
  const statusLabel = getStatusLabel(item.status);
  const typeLabel = getMembershipTypeLabel(item.membership_type);
  const initials = getInitials(displayName);
  const monoFont = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: statusColor + '20' }]}>
        <Text style={[styles.avatarText, { color: statusColor }]}>{initials}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        {!!memberNum && (
          <Text style={[styles.memberNum, { fontFamily: monoFont }]}>{memberNum}</Text>
        )}
        {!!item.email && (
          <View style={styles.metaRow}>
            <Ionicons name="mail-outline" size={11} color={C.textTertiary} style={{ marginRight: 3 }} />
            <Text style={styles.meta} numberOfLines={1}>{item.email}</Text>
          </View>
        )}
        {!!item.phone && (
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={11} color={C.textTertiary} style={{ marginRight: 3 }} />
            <Text style={styles.meta} numberOfLines={1}>{item.phone}</Text>
          </View>
        )}
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {!!item.membership_type && (
          <Text style={styles.typeText}>{typeLabel}</Text>
        )}
      </View>
    </View>
  );
}

export default function MembersListScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async (isRefresh = false) => {
    console.log('[MembersList] GET /api/members');
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const token = await getBearerToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-admin-password': 'admin123',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BACKEND_URL}/api/members`, { headers });
      if (!res.ok) {
        const text = await res.text();
        console.error('[MembersList] HTTP error', res.status, text.slice(0, 200));
        throw new Error(`Erreur ${res.status}`);
      }
      const data = await res.json();
      const list: Member[] = Array.isArray(data) ? data : (data.members ?? data.data ?? []);
      console.log('[MembersList] Chargé', list.length, 'membres');
      setMembers(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[MembersList] Fetch failed:', msg);
      setError('Impossible de charger les membres. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh every time the screen comes into focus so new registrations appear
  useFocusEffect(
    useCallback(() => {
      fetchMembers(false);
    }, [fetchMembers])
  );

  const onRefresh = useCallback(() => {
    console.log('[MembersList] Pull-to-refresh déclenché');
    setRefreshing(true);
    fetchMembers(true);
  }, [fetchMembers]);

  const countLabel = `${members.length} adhérent${members.length !== 1 ? 's' : ''}`;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Liste des membres',
          headerStyle: { backgroundColor: C.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Chargement des membres...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={C.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              console.log('[MembersList] Bouton Réessayer appuyé');
              fetchMembers(false);
            }}
          >
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MemberRow item={item} />}
          contentContainerStyle={[
            styles.list,
            members.length === 0 && styles.listEmpty,
          ]}
          ListHeaderComponent={
            members.length > 0 ? (
              <View style={styles.countRow}>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{countLabel}</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={56} color={C.textTertiary} />
              <Text style={styles.emptyTitle}>Aucun membre</Text>
              <Text style={styles.emptySubtitle}>
                Les membres apparaîtront ici après inscription.
              </Text>
            </View>
          }
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
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: C.background,
  },
  loadingText: {
    fontSize: 15,
    color: C.textSecondary,
  },
  list: {
    padding: 12,
    backgroundColor: C.background,
  },
  listEmpty: {
    flexGrow: 1,
  },
  countRow: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.primaryMuted,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  memberNum: {
    fontSize: 11,
    color: C.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    color: C.textSecondary,
    flex: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: 8,
    gap: 4,
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
  typeText: {
    fontSize: 11,
    color: C.textTertiary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    color: C.danger,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});
