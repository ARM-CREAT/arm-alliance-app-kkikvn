
import { Stack, useRouter } from 'expo-router';
import { Modal } from '@/components/ui/Modal';
import * as Haptics from 'expo-haptics';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet, apiPost } from '@/utils/api';
import { colors } from '@/styles/commonStyles';

interface Member {
  id: string;
  fullName: string;
  membershipNumber: string;
  commune: string;
  profession: string;
  phone: string;
  email?: string;
  status: 'pending' | 'active' | 'suspended';
  role: string;
  createdAt: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  memberCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  memberName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FFA50020',
  },
  statusActive: {
    backgroundColor: '#34C75920',
  },
  statusSuspended: {
    backgroundColor: '#FF3B3020',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextPending: {
    color: '#FFA500',
  },
  statusTextActive: {
    color: '#34C759',
  },
  statusTextSuspended: {
    color: '#FF3B30',
  },
  memberNumber: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  memberInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  memberActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  approveButton: {
    backgroundColor: '#34C75920',
    borderColor: '#34C759',
  },
  suspendButton: {
    backgroundColor: '#FFA50020',
    borderColor: '#FFA500',
  },
  activateButton: {
    backgroundColor: '#34C75920',
    borderColor: '#34C759',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  approveButtonText: {
    color: '#34C759',
  },
  suspendButtonText: {
    color: '#FFA500',
  },
  activateButtonText: {
    color: '#34C759',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

export default function AdminMembersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [members, searchQuery, statusFilter]);

  const loadMembers = async () => {
    console.log('[AdminMembers] Loading members');
    try {
      const data = await apiGet<Member[]>('/api/membership');
      console.log('[AdminMembers] Members loaded:', data);
      setMembers(data);
    } catch (error: any) {
      console.error('[AdminMembers] Error loading members:', error);
      showModalFunc('Erreur', 'Impossible de charger les membres.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.fullName.toLowerCase().includes(query) ||
        m.membershipNumber.toLowerCase().includes(query) ||
        m.commune.toLowerCase().includes(query) ||
        m.profession.toLowerCase().includes(query)
      );
    }

    setFilteredMembers(filtered);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMembers();
  }, []);

  const showModalFunc = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm', callback?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalCallback(() => callback);
    setShowModal(true);
  };

  const handleUpdateStatus = (memberId: string, newStatus: 'active' | 'suspended') => {
    const actionText = newStatus === 'active' ? 'activer' : 'suspendre';
    console.log(`[AdminMembers] Requesting confirmation to ${actionText} member:`, memberId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    showModalFunc(
      'Confirmer l\'action',
      `Êtes-vous sûr de vouloir ${actionText} ce membre?`,
      'confirm',
      async () => {
        console.log(`[AdminMembers] Updating member status to ${newStatus}:`, memberId);
        try {
          await apiPut(`/api/membership/${memberId}/status`, { status: newStatus === 'active' ? 'approved' : 'rejected' });
          console.log('[AdminMembers] Member status updated successfully');
          showModalFunc('Succès', `Membre ${actionText === 'activer' ? 'activé' : 'suspendu'} avec succès!`, 'success');
          await loadMembers();
        } catch (error: any) {
          console.error('[AdminMembers] Error updating member status:', error);
          showModalFunc('Erreur', error.message || 'Impossible de mettre à jour le statut du membre.', 'error');
        }
      }
    );
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.statusPending;
      case 'active':
        return styles.statusActive;
      case 'suspended':
        return styles.statusSuspended;
      default:
        return styles.statusPending;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.statusTextPending;
      case 'active':
        return styles.statusTextActive;
      case 'suspended':
        return styles.statusTextSuspended;
      default:
        return styles.statusTextPending;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'active':
        return 'Actif';
      case 'suspended':
        return 'Suspendu';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const stats = {
    total: members.length,
    pending: members.filter(m => m.status === 'pending').length,
    active: members.filter(m => m.status === 'active').length,
    suspended: members.filter(m => m.status === 'suspended').length,
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Gestion des Membres',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Gestion des Membres',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Membres du Parti</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher un membre..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FFA500' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#34C759' }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FF3B30' }]}>{stats.suspended}</Text>
            <Text style={styles.statLabel}>Suspendus</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.filterButtonText, statusFilter === 'all' && styles.filterButtonTextActive]}>
              Tous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'pending' && styles.filterButtonActive]}
            onPress={() => setStatusFilter('pending')}
          >
            <Text style={[styles.filterButtonText, statusFilter === 'pending' && styles.filterButtonTextActive]}>
              En attente
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'active' && styles.filterButtonActive]}
            onPress={() => setStatusFilter('active')}
          >
            <Text style={[styles.filterButtonText, statusFilter === 'active' && styles.filterButtonTextActive]}>
              Actifs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'suspended' && styles.filterButtonActive]}
            onPress={() => setStatusFilter('suspended')}
          >
            <Text style={[styles.filterButtonText, statusFilter === 'suspended' && styles.filterButtonTextActive]}>
              Suspendus
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {filteredMembers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="person.3" android_material_icon_name="group" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aucun membre trouvé' : 'Aucun membre dans cette catégorie'}
              </Text>
            </View>
          ) : (
            filteredMembers.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberHeader}>
                  <Text style={styles.memberName}>{member.fullName}</Text>
                  <View style={[styles.statusBadge, getStatusBadgeStyle(member.status)]}>
                    <Text style={[styles.statusText, getStatusTextStyle(member.status)]}>
                      {getStatusText(member.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.memberNumber}>N° {member.membershipNumber}</Text>

                <View style={styles.memberInfo}>
                  <IconSymbol ios_icon_name="briefcase" android_material_icon_name="work" size={14} color={colors.textSecondary} />
                  <Text style={styles.memberInfoText}>{member.profession}</Text>
                </View>

                <View style={styles.memberInfo}>
                  <IconSymbol ios_icon_name="location" android_material_icon_name="location-on" size={14} color={colors.textSecondary} />
                  <Text style={styles.memberInfoText}>{member.commune}</Text>
                </View>

                <View style={styles.memberInfo}>
                  <IconSymbol ios_icon_name="phone" android_material_icon_name="phone" size={14} color={colors.textSecondary} />
                  <Text style={styles.memberInfoText}>{member.phone}</Text>
                </View>

                <View style={styles.memberInfo}>
                  <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={14} color={colors.textSecondary} />
                  <Text style={styles.memberInfoText}>Inscrit le {formatDate(member.createdAt)}</Text>
                </View>

                <View style={styles.memberActions}>
                  {member.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleUpdateStatus(member.id, 'active')}
                    >
                      <Text style={[styles.actionButtonText, styles.approveButtonText]}>Approuver</Text>
                    </TouchableOpacity>
                  )}
                  {member.status === 'active' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.suspendButton]}
                      onPress={() => handleUpdateStatus(member.id, 'suspended')}
                    >
                      <Text style={[styles.actionButtonText, styles.suspendButtonText]}>Suspendre</Text>
                    </TouchableOpacity>
                  )}
                  {member.status === 'suspended' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.activateButton]}
                      onPress={() => handleUpdateStatus(member.id, 'active')}
                    >
                      <Text style={[styles.actionButtonText, styles.activateButtonText]}>Réactiver</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <Modal
          visible={showModal}
          onClose={() => {
            setShowModal(false);
            if (modalCallback) {
              modalCallback();
              setModalCallback(null);
            }
          }}
          title={modalTitle}
          message={modalMessage}
          type={modalType}
        />
      </View>
    </>
  );
}
