import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '@/utils/api-helpers';
import * as Haptics from 'expo-haptics';

const ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'x-admin-password': 'admin123',
};

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(dateString);
  }
}

function getStatusColor(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active') return '#22c55e';
  if (s === 'pending') return '#f59e0b';
  if (s === 'suspended') return '#ef4444';
  return '#9ca3af';
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

function getInitials(name: string): string {
  const parts = (name || '').trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name || '?')[0].toUpperCase();
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Ionicons name={icon as any} size={16} color="#6b7280" style={{ marginRight: 10 }} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

export default function MemberDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    full_name: string;
    member_number: string;
    membership_number: string;
    region: string;
    commune: string;
    phone: string;
    email: string;
    profession: string;
    gender: string;
    date_of_birth: string;
    status: string;
    created_at: string;
  }>();

  const [status, setStatus] = useState(params.status || 'pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const memberNumber = params.member_number || params.membership_number || '';
  const fullName = params.full_name || 'Membre';
  const initials = getInitials(fullName);
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);
  const genderLabel = getGenderLabel(params.gender);
  const dateStr = formatDate(params.created_at);
  const dobStr = params.date_of_birth || '—';

  const isActive = status.toLowerCase() === 'active';
  const isPending = status.toLowerCase() === 'pending';

  const handleApprove = async () => {
    console.log('[MemberDetail] Bouton Approuver appuyé — id:', params.id);
    setActionLoading('approve');
    try {
      const res = await fetch(`${BACKEND_URL}/api/members/${params.id}`, {
        method: 'PUT',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ status: 'active' }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
      }
      console.log('[MemberDetail] Statut mis à jour -> active');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus('active');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[MemberDetail] Erreur approbation:', msg);
      Alert.alert('Erreur', msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async () => {
    console.log('[MemberDetail] Bouton Suspendre appuyé — id:', params.id);
    setActionLoading('suspend');
    try {
      const res = await fetch(`${BACKEND_URL}/api/members/${params.id}`, {
        method: 'PUT',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ status: 'suspended' }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
      }
      console.log('[MemberDetail] Statut mis à jour -> suspended');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus('suspended');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[MemberDetail] Erreur suspension:', msg);
      Alert.alert('Erreur', msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = () => {
    console.log('[MemberDetail] Bouton Supprimer appuyé — id:', params.id);
    Alert.alert(
      'Supprimer le membre',
      `Êtes-vous sûr de vouloir supprimer "${fullName}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('[MemberDetail] DELETE /api/members/' + params.id);
            setActionLoading('delete');
            try {
              const res = await fetch(`${BACKEND_URL}/api/members/${params.id}`, {
                method: 'DELETE',
                headers: ADMIN_HEADERS,
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
              }
              console.log('[MemberDetail] Membre supprimé:', params.id);
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error('[MemberDetail] Erreur suppression:', msg);
              Alert.alert('Erreur', msg);
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Détail du membre',
          headerShown: true,
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: '#0f1f14' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: statusColor + '25' }]}>
            <Text style={[styles.avatarText, { color: statusColor }]}>{initials}</Text>
          </View>
          <Text style={styles.fullName}>{fullName}</Text>
          <Text style={styles.memberNumberText}>{memberNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '25' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations personnelles</Text>
          <InfoRow icon="call-outline" label="Téléphone" value={params.phone || '—'} />
          <InfoRow icon="mail-outline" label="Email" value={params.email || '—'} />
          <InfoRow icon="person-outline" label="Sexe" value={genderLabel} />
          <InfoRow icon="calendar-outline" label="Date de naissance" value={dobStr} />
          <InfoRow icon="briefcase-outline" label="Profession" value={params.profession || '—'} />
        </View>

        {/* Location card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Localisation</Text>
          <InfoRow icon="map-outline" label="Région" value={params.region || '—'} />
          <InfoRow icon="location-outline" label="Commune" value={params.commune || '—'} />
        </View>

        {/* Membership card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Adhésion</Text>
          <InfoRow icon="card-outline" label="Numéro" value={memberNumber || '—'} />
          <InfoRow icon="time-outline" label="Inscrit le" value={dateStr} />
          <InfoRow icon="shield-checkmark-outline" label="Statut" value={statusLabel} />
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Actions</Text>

          {!isActive && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={handleApprove}
              disabled={actionLoading !== null}
              activeOpacity={0.85}
            >
              {actionLoading === 'approve' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.actionBtnText}>Approuver</Text>
            </TouchableOpacity>
          )}

          {isActive && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.suspendBtn]}
              onPress={handleSuspend}
              disabled={actionLoading !== null}
              activeOpacity={0.85}
            >
              {actionLoading === 'suspend' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="pause-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.actionBtnText}>Suspendre</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDelete}
            disabled={actionLoading !== null}
            activeOpacity={0.85}
          >
            {actionLoading === 'delete' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.actionBtnText}>Supprimer</Text>
          </TouchableOpacity>
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
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
  },
  fullName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f3f4f6',
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  memberNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4ade80',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  actionsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#e5e7eb',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 15,
  },
  approveBtn: {
    backgroundColor: '#16a34a',
  },
  suspendBtn: {
    backgroundColor: '#d97706',
  },
  deleteBtn: {
    backgroundColor: '#dc2626',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
