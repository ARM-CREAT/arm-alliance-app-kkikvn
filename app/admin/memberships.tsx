import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { BACKEND_URL } from '@/utils/api-helpers';
import * as Haptics from 'expo-haptics';

const C = Colors.light;
const ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer admin123',
};

interface Membership {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  location: string;
  status: string;
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
  return (f + l) || '?';
}

function getStatusColor(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'actif') return C.success;
  if (s === 'pending' || s === 'en_attente') return C.warning;
  if (s === 'suspended' || s === 'suspendu') return C.danger;
  return C.textSecondary;
}

function getStatusLabel(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'actif') return 'Actif';
  if (s === 'pending' || s === 'en_attente') return 'En attente';
  if (s === 'suspended' || s === 'suspendu') return 'Suspendu';
  return status || 'Inconnu';
}

export default function AdminMembershipsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMemberships = useCallback(async (isRefresh = false) => {
    console.log('[AdminMemberships] GET /api/memberships');
    if (!isRefresh) setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${BACKEND_URL}/api/memberships`, {
        headers: ADMIN_HEADERS,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        console.error('[AdminMemberships] Erreur HTTP', res.status, text.slice(0, 200));
        throw new Error(`Erreur ${res.status}: impossible de charger les adhésions`);
      }

      const data = await res.json();
      const list: Membership[] = Array.isArray(data)
        ? data
        : (data.memberships ?? data.members ?? data.data ?? []);
      const count: number = typeof data.total === 'number'
        ? data.total
        : typeof data.count === 'number'
          ? data.count
          : list.length;

      console.log('[AdminMemberships] Adhésions chargées:', list.length, 'total:', count);
      setMemberships(list);
      setTotalCount(count);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('[AdminMemberships] Timeout 30s');
        setError('La requête a expiré. Vérifiez votre connexion et réessayez.');
      } else {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[AdminMemberships] Erreur:', message);
        setError(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMemberships(false);
    }, [loadMemberships])
  );

  const onRefresh = useCallback(() => {
    console.log('[AdminMemberships] Pull-to-refresh déclenché');
    setRefreshing(true);
    loadMemberships(true);
  }, [loadMemberships]);

  const handleStatusChange = (membership: Membership) => {
    const fullName = `${membership.first_name} ${membership.last_name}`.trim();
    console.log('[AdminMemberships] Changement statut pour:', membership.id, fullName);
    const currentStatus = (membership.status || '').toLowerCase();
    const newStatus = currentStatus === 'active' || currentStatus === 'actif' ? 'suspended' : 'active';
    const newLabel = newStatus === 'active' ? 'Actif' : 'Suspendu';

    Alert.alert(
      'Modifier le statut',
      `Changer le statut de "${fullName}" en "${newLabel}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            console.log('[AdminMemberships] PATCH /api/memberships/' + membership.id, 'status:', newStatus);
            try {
              const res = await fetch(`${BACKEND_URL}/api/memberships/${membership.id}`, {
                method: 'PATCH',
                headers: ADMIN_HEADERS,
                body: JSON.stringify({ status: newStatus }),
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
              }
              console.log('[AdminMemberships] Statut mis à jour:', membership.id, '->', newStatus);
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadMemberships(true);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error('[AdminMemberships] Erreur mise à jour statut:', msg);
              Alert.alert('Erreur', msg);
            }
          },
        },
      ]
    );
  };

  const displayCount = totalCount !== null ? String(totalCount) : String(memberships.length);

  const renderItem = ({ item }: { item: Membership }) => {
    const initials = getInitials(item.first_name, item.last_name);
    const fullName = `${item.first_name} ${item.last_name}`.trim();
    const dateStr = formatDate(item.created_at);
    const statusColor = getStatusColor(item.status);
    const statusLabel = getStatusLabel(item.status);

    return (
      <View style={styles.memberCard}>
        <View style={styles.memberCardRow}>
          <View style={[styles.memberAvatar, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.memberAvatarText, { color: statusColor }]}>{initials}</Text>
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
            <TouchableOpacity
              style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}
              onPress={() => handleStatusChange(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View style={styles.statsBar}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{displayCount}</Text>
        <Text style={styles.statLabel}>Total adhésions</Text>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={56} color={C.textTertiary} />
      <Text style={styles.emptyText}>Aucune adhésion enregistrée</Text>
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
            <Text style={styles.loadingText}>Chargement des adhésions...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                console.log('[AdminMemberships] Bouton Réessayer appuyé');
                loadMemberships(false);
              }}
            >
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={memberships}
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '800',
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
    gap: 8,
  },
  memberDate: {
    fontSize: 11,
    color: C.textTertiary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
