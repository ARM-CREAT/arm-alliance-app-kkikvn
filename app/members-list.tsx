import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { BACKEND_URL } from '@/utils/api';

const PRIMARY = '#4CAF50';

interface Member {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  membership_number?: string;
  commune?: string;
  region?: string;
  profession?: string;
  role?: string;
  qr_code?: string;
  city?: string;
  country?: string;
  membership_type?: string;
  status: string;
  created_at: string;
}

function getStatusColor(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'approved') return '#16a34a';
  if (s === 'pending') return '#D97706';
  if (s === 'rejected') return '#DC2626';
  return '#666';
}

function getStatusLabel(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'approved') return 'Approuvé';
  if (s === 'pending') return 'En attente';
  if (s === 'rejected') return 'Rejeté';
  return String(status || '—');
}

function getMembershipTypeLabel(type?: string): string {
  if (!type) return '';
  const t = type.toLowerCase();
  if (t === 'standard') return 'Standard';
  if (t === 'actif') return 'Actif';
  if (t === 'sympathisant') return 'Sympathisant';
  return type;
}

function getDisplayName(member: Member): string {
  return member.full_name || member.name || '—';
}

function getInitials(name: string): string {
  const parts = (name || '').trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return (name || '?').charAt(0).toUpperCase();
}

export default function MembersListScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [pending, setPending] = useState(0);
  const [approved, setApproved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async (isRefresh = false) => {
    console.log('[MembersList] GET /api/member-profiles');
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/member-profiles`);
      if (!res.ok) {
        const text = await res.text();
        console.error('[MembersList] Erreur HTTP', res.status, text.slice(0, 120));
        throw new Error(`Erreur ${res.status}`);
      }
      const data: Member[] = await res.json();
      console.log('[MembersList] Réponse reçue');

      const list: Member[] = Array.isArray(data) ? data : [];
      const totalCount = list.length;
      const pendingCount = list.filter((m) => (m.status || '').toLowerCase() === 'pending').length;
      const approvedCount = list.filter((m) => (m.status || '').toLowerCase() === 'approved').length;

      console.log('[MembersList] Membres chargés:', list.length, '| total:', totalCount, '| pending:', pendingCount, '| approved:', approvedCount);
      setMembers(list);
      setTotal(totalCount);
      setPending(pendingCount);
      setApproved(approvedCount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[MembersList] Erreur chargement:', msg);
      setError('Impossible de charger les membres. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMembers(false);
  }, [loadMembers]);

  const onRefresh = useCallback(() => {
    console.log('[MembersList] Pull-to-refresh');
    setRefreshing(true);
    loadMembers(true);
  }, [loadMembers]);

  const approvedMembers = members.filter((m) => {
    const s = (m.status || '').toLowerCase();
    return s === 'approved' || s === 'active';
  });

  const totalStr = String(total);
  const pendingStr = String(pending);
  const approvedStr = String(approved);

  const renderItem = ({ item }: { item: Member }) => {
    const displayName = getDisplayName(item);
    const initials = getInitials(displayName);
    const statusColor = getStatusColor(item.status);
    const statusLabel = getStatusLabel(item.status);
    const membershipLabel = getMembershipTypeLabel(item.membership_type);
    const locationParts = [item.commune, item.region].filter(Boolean);
    const locationText = locationParts.join(', ');

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.avatar, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.avatarText, { color: statusColor }]}>{initials}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.memberName} numberOfLines={1}>{displayName}</Text>
            {!!locationText && (
              <Text style={styles.memberLocation} numberOfLines={1}>{locationText}</Text>
            )}
            {!!membershipLabel && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{membershipLabel}</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Membres ARM',
          headerShown: true,
          headerStyle: { backgroundColor: PRIMARY },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: 'Retour',
        }}
      />

      <View style={styles.container}>
        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalStr}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FCD34D' }]}>{pendingStr}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#86EFAC' }]}>{approvedStr}</Text>
            <Text style={styles.statLabel}>Approuvés</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Chargement des membres...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                console.log('[MembersList] Bouton Réessayer appuyé');
                loadMembers(false);
              }}
            >
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={approvedMembers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              approvedMembers.length === 0 && styles.listContentEmpty,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={PRIMARY}
                colors={[PRIMARY]}
              />
            }
            ListEmptyComponent={
              <View style={styles.centerBox}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>Aucun membre approuvé</Text>
                <Text style={styles.emptySubtitle}>
                  Les membres approuvés apparaîtront ici.
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
    backgroundColor: '#f5f5f5',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 4,
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  memberLocation: {
    fontSize: 13,
    color: '#666',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: PRIMARY + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});
