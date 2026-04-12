import React, { useState, useCallback, useMemo } from 'react';
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
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { BACKEND_URL } from '@/utils/api';

const Haptics = {
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
};

const C = Colors.light;
const ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'x-admin-password': 'admin123',
};
const ADMIN_DELETE_HEADERS = {
  'x-admin-password': 'admin123',
};

type FilterStatus = 'all' | 'pending' | 'active' | 'suspended';

interface Member {
  id: string;
  membership_number?: string;
  member_number?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone: string;
  email?: string;
  commune?: string;
  region?: string;
  profession?: string;
  date_of_birth?: string;
  gender?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

function getMemberDisplayName(m: Member): string {
  if (m.full_name) return m.full_name;
  const parts = [m.first_name, m.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '—';
}

function getMemberNumber(m: Member): string {
  return m.membership_number ?? m.member_number ?? '';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function getInitials(fullName: string): string {
  const name = fullName || '';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return (name || '?').charAt(0).toUpperCase();
}

function getStatusColor(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active') return '#16a34a';
  if (s === 'pending') return '#D97706';
  if (s === 'suspended') return '#DC2626';
  return C.textSecondary;
}

function getStatusLabel(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active') return 'Actif';
  if (s === 'pending') return 'En attente';
  if (s === 'suspended') return 'Suspendu';
  return String(status || 'Inconnu');
}

function getGenderLabel(gender?: string): string {
  if (!gender) return '—';
  const g = gender.toLowerCase();
  if (g === 'male' || g === 'homme') return 'Homme';
  if (g === 'female' || g === 'femme') return 'Femme';
  return gender;
}

// ─── Member Detail Modal ─────────────────────────────────────────────────────

interface DetailModalProps {
  member: Member | null;
  visible: boolean;
  onClose: () => void;
  onApprove: (member: Member) => void;
  onReject: (member: Member) => void;
  onDelete: (member: Member) => void;
  actionLoading: string | null;
}

function DetailModal({ member, visible, onClose, onApprove, onReject, onDelete, actionLoading }: DetailModalProps) {
  if (!member) return null;

  const statusColor = getStatusColor(member.status);
  const statusLabel = getStatusLabel(member.status);
  const displayName = getMemberDisplayName(member);
  const memberNum = getMemberNumber(member);
  const initials = getInitials(displayName);
  const isApproved = (member.status || '').toLowerCase() === 'active';
  const isRejected = (member.status || '').toLowerCase() === 'suspended';
  const genderLabel = getGenderLabel(member.gender);
  const dateStr = formatDate(member.created_at);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={detailStyles.overlay}>
        <View style={detailStyles.sheet}>
          {/* Handle */}
          <View style={detailStyles.handle} />

          {/* Header */}
          <View style={detailStyles.header}>
            <View style={[detailStyles.avatar, { backgroundColor: statusColor + '22' }]}>
              <Text style={[detailStyles.avatarText, { color: statusColor }]}>{initials}</Text>
            </View>
            <View style={detailStyles.headerInfo}>
              <Text style={detailStyles.name} numberOfLines={2}>{displayName}</Text>
              <Text style={detailStyles.memberNumber}>{memberNum}</Text>
              <View style={[detailStyles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                <Text style={[detailStyles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>
            <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={C.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={detailStyles.body} showsVerticalScrollIndicator={false}>
            {/* Info rows */}
            <View style={detailStyles.infoCard}>
              <DetailRow icon="call-outline" label="Téléphone" value={member.phone || '—'} />
              <DetailRow icon="mail-outline" label="Email" value={member.email || '—'} />
              <DetailRow icon="location-outline" label="Commune" value={member.commune || '—'} />
              <DetailRow icon="map-outline" label="Région" value={member.region || '—'} />
              <DetailRow icon="briefcase-outline" label="Profession" value={member.profession || '—'} />
              <DetailRow icon="calendar-outline" label="Date de naissance" value={member.date_of_birth || '—'} />
              <DetailRow icon="person-outline" label="Sexe" value={genderLabel} />
              <DetailRow icon="time-outline" label="Inscrit le" value={dateStr} last />
            </View>

            {/* Action buttons */}
            <View style={detailStyles.actions}>
              {!isApproved && (
                <TouchableOpacity
                  style={[detailStyles.actionBtn, detailStyles.approveBtn]}
                  onPress={() => onApprove(member)}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'approve' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
                  )}
                  <Text style={detailStyles.actionBtnText}>Approuver</Text>
                </TouchableOpacity>
              )}
              {!isRejected && (
                <TouchableOpacity
                  style={[detailStyles.actionBtn, detailStyles.rejectBtn]}
                  onPress={() => onReject(member)}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'reject' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="close-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
                  )}
                  <Text style={detailStyles.actionBtnText}>Rejeter</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[detailStyles.actionBtn, detailStyles.deleteBtn]}
                onPress={() => onDelete(member)}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'delete' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                )}
                <Text style={detailStyles.actionBtnText}>Supprimer</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[detailStyles.detailRow, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon as any} size={15} color={C.textTertiary} style={{ marginRight: 10, marginTop: 1 }} />
      <Text style={detailStyles.detailLabel}>{label}</Text>
      <Text style={detailStyles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

// ─── Member Card ─────────────────────────────────────────────────────────────

function MemberCard({ item, onPress }: { item: Member; onPress: (m: Member) => void }) {
  const statusColor = getStatusColor(item.status);
  const statusLabel = getStatusLabel(item.status);
  const displayName = getMemberDisplayName(item);
  const memberNum = getMemberNumber(item);
  const initials = getInitials(displayName);
  const dateStr = formatDate(item.created_at);
  const locationParts = [item.commune, item.region].filter(Boolean);
  const locationText = locationParts.length > 0 ? locationParts.join(', ') : '—';

  return (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => {
        console.log('[AdminMemberships] Carte membre appuyée:', displayName, item.id);
        onPress(item);
      }}
      activeOpacity={0.75}
    >
      <View style={styles.memberCardRow}>
        <View style={[styles.memberAvatar, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.memberAvatarText, { color: statusColor }]}>{initials}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.memberNumber}>{memberNum}</Text>
          <View style={styles.memberMetaRow}>
            <Ionicons name="call-outline" size={11} color={C.textTertiary} style={{ marginRight: 3 }} />
            <Text style={styles.memberMeta} numberOfLines={1}>{item.phone || '—'}</Text>
          </View>
          {locationParts.length > 0 && (
            <View style={styles.memberMetaRow}>
              <Ionicons name="location-outline" size={11} color={C.textTertiary} style={{ marginRight: 3 }} />
              <Text style={styles.memberMeta} numberOfLines={1}>{locationText}</Text>
            </View>
          )}
        </View>
        <View style={styles.memberRight}>
          <Text style={styles.memberDate}>{dateStr}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={C.textTertiary} style={{ marginTop: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'active', label: 'Actifs' },
  { value: 'suspended', label: 'Suspendus' },
];

interface MemberStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
}

export default function AdminMembershipsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadMembers = useCallback(async (isRefresh = false) => {
    console.log('[AdminMemberships] GET /api/member-profiles');
    if (!isRefresh) setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const membersRes = await fetch(`${BACKEND_URL}/api/member-profiles`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!membersRes.ok) {
        const text = await membersRes.text();
        console.error('[AdminMemberships] Erreur HTTP membres', membersRes.status, text.slice(0, 200));
        throw new Error(`Erreur ${membersRes.status}: impossible de charger les adhérents`);
      }

      const data = await membersRes.json();
      console.log('[AdminMemberships] Réponse brute:', JSON.stringify(data).slice(0, 300));
      const list: Member[] = Array.isArray(data) ? data : (data.members ?? data.data ?? []);
      console.log('[AdminMemberships] Adhérents chargés:', list.length);
      setMembers(list);

      // Derive stats from the list since member_profiles has no separate stats endpoint
      const derivedStats: MemberStats = {
        total: list.length,
        active: list.filter((m) => (m.status || '').toLowerCase() === 'active').length,
        pending: list.filter((m) => (m.status || '').toLowerCase() === 'pending').length,
        suspended: list.filter((m) => (m.status || '').toLowerCase() === 'suspended').length,
      };
      console.log('[AdminMemberships] Stats dérivées:', JSON.stringify(derivedStats));
      setStats(derivedStats);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('[AdminMemberships] Timeout 30s');
        const msg = 'La requête a expiré. Vérifiez votre connexion et réessayez.';
        setError(msg);
        Alert.alert('Erreur', msg);
      } else {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[AdminMemberships] Erreur:', message);
        setError(message);
        Alert.alert('Erreur', message);
      }
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

  // Client-side filtering
  const filteredMembers = useMemo(() => {
    let list = members;

    // Status filter
    if (activeFilter !== 'all') {
      list = list.filter((m) => (m.status || '').toLowerCase() === activeFilter);
    }

    // Search filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((m) => {
        const name = getMemberDisplayName(m).toLowerCase();
        const phone = (m.phone || '').toLowerCase();
        const num = getMemberNumber(m).toLowerCase();
        const commune = (m.commune || '').toLowerCase();
        const region = (m.region || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || num.includes(q) || commune.includes(q) || region.includes(q);
      });
    }

    return list;
  }, [members, activeFilter, searchQuery]);

  // Stats: prefer API stats, fall back to derived counts
  const totalAll = stats?.total ?? members.length;
  const totalPending = stats?.pending ?? members.filter((m) => (m.status || '').toLowerCase() === 'pending').length;
  const totalApproved = stats?.active ?? members.filter((m) => (m.status || '').toLowerCase() === 'active').length;
  const totalRejected = stats?.suspended ?? members.filter((m) => (m.status || '').toLowerCase() === 'suspended').length;

  const handleOpenDetail = (member: Member) => {
    setSelectedMember(member);
    setDetailVisible(true);
  };

  const handleCloseDetail = () => {
    setDetailVisible(false);
    setSelectedMember(null);
    setActionLoading(null);
  };

  const handleApprove = async (member: Member) => {
    console.log('[AdminMemberships] PATCH /api/members/' + member.id + '/status -> approved');
    setActionLoading('approve');
    try {
      const res = await fetch(`${BACKEND_URL}/api/members/${member.id}/status`, {
        method: 'PATCH',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ status: 'approved' }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
      }
      console.log('[AdminMemberships] Statut mis à jour -> active:', member.id);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, status: 'active' } : m));
      setSelectedMember((prev) => prev ? { ...prev, status: 'active' } : prev);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AdminMemberships] Erreur approbation:', msg);
      Alert.alert('Erreur', msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (member: Member) => {
    console.log('[AdminMemberships] PATCH /api/members/' + member.id + '/status -> rejected');
    setActionLoading('reject');
    try {
      const res = await fetch(`${BACKEND_URL}/api/members/${member.id}/status`, {
        method: 'PATCH',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ status: 'rejected' }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
      }
      console.log('[AdminMemberships] Statut mis à jour -> suspended:', member.id);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, status: 'suspended' } : m));
      setSelectedMember((prev) => prev ? { ...prev, status: 'suspended' } : prev);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AdminMemberships] Erreur rejet:', msg);
      Alert.alert('Erreur', msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (member: Member) => {
    const displayName = getMemberDisplayName(member);
    console.log('[AdminMemberships] Demande suppression:', member.id, displayName);
    Alert.alert(
      'Supprimer l\'adhérent',
      `Êtes-vous sûr de vouloir supprimer "${displayName}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('[AdminMemberships] DELETE /api/members/' + member.id);
            setActionLoading('delete');
            try {
              const res = await fetch(`${BACKEND_URL}/api/members/${member.id}`, {
                method: 'DELETE',
                headers: ADMIN_DELETE_HEADERS,
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
              }
              console.log('[AdminMemberships] Adhérent supprimé:', member.id);
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setMembers((prev) => prev.filter((m) => m.id !== member.id));
              handleCloseDetail();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error('[AdminMemberships] Erreur suppression:', msg);
              Alert.alert('Erreur', msg);
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const countLabel = `${filteredMembers.length} adhérent${filteredMembers.length !== 1 ? 's' : ''}`;

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

      <DetailModal
        member={selectedMember}
        visible={detailVisible}
        onClose={handleCloseDetail}
        onApprove={handleApprove}
        onReject={handleReject}
        onDelete={handleDelete}
        actionLoading={actionLoading}
      />

      <View style={styles.container}>
        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalAll}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FCD34D' }]}>{totalPending}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#86EFAC' }]}>{totalApproved}</Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FCA5A5' }]}>{totalRejected}</Text>
            <Text style={styles.statLabel}>Suspendus</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={17} color={C.textSecondary} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Nom, téléphone, numéro, commune..."
              placeholderTextColor={C.textTertiary}
              value={searchQuery}
              onChangeText={(t) => {
                console.log('[AdminMemberships] Recherche:', t);
                setSearchQuery(t);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  console.log('[AdminMemberships] Recherche effacée');
                  setSearchQuery('');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={17} color={C.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter tabs */}
        <View style={styles.tabBar}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => {
                  console.log('[AdminMemberships] Filtre sélectionné:', tab.value);
                  setActiveFilter(tab.value);
                }}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Chargement des adhésions...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={52} color={C.danger} />
            <Text style={styles.errorTitle}>Impossible de charger les adhérents</Text>
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
            data={filteredMembers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MemberCard item={item} onPress={handleOpenDetail} />
            )}
            ListHeaderComponent={
              <View style={styles.countRow}>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{countLabel}</Text>
                </View>
                <Text style={styles.tapHint}>Appuyez pour voir les détails</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={56} color={C.textTertiary} />
                <Text style={styles.emptyTitle}>Aucun membre trouvé</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery.trim()
                    ? 'Aucun résultat pour cette recherche.'
                    : 'Les adhérents apparaîtront ici après inscription.'}
                </Text>
              </View>
            }
            contentContainerStyle={[
              styles.listContent,
              filteredMembers.length === 0 && styles.listContentEmpty,
            ]}
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: C.primary,
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
    fontSize: 10,
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
  searchContainer: {
    backgroundColor: C.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    padding: 0,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: C.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textSecondary,
  },
  tabTextActive: {
    color: C.primary,
    fontWeight: '700',
  },
  countRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countBadge: {
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
  tapHint: {
    fontSize: 11,
    color: C.textTertiary,
    fontStyle: 'italic',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  listContentEmpty: {
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
    gap: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: C.primary,
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
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
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
  memberCard: {
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
    minWidth: 0,
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
    gap: 6,
  },
  memberDate: {
    fontSize: 11,
    color: C.textTertiary,
    fontWeight: '500',
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
});

const detailStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
    lineHeight: 22,
  },
  memberNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 0.5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
    flexShrink: 0,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  infoCard: {
    backgroundColor: C.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  detailLabel: {
    fontSize: 13,
    color: C.textSecondary,
    fontWeight: '600',
    width: 120,
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    fontWeight: '500',
    textAlign: 'right',
  },
  actions: {
    gap: 10,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
  },
  approveBtn: {
    backgroundColor: '#16a34a',
  },
  rejectBtn: {
    backgroundColor: '#D97706',
  },
  deleteBtn: {
    backgroundColor: '#DC2626',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
