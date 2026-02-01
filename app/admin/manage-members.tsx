
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet, authenticatedPut } from '@/utils/api';
import * as Haptics from 'expo-haptics';

interface Member {
  id: string;
  fullName: string;
  membershipNumber: string;
  commune: string;
  profession: string;
  phone: string;
  email?: string;
  status: 'pending' | 'active' | 'suspended';
  role: 'militant' | 'collecteur' | 'superviseur' | 'administrateur';
  createdAt: string;
}

export default function ManageMembersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error' | 'confirm',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [members, searchQuery, filterStatus]);

  const loadMembers = async () => {
    console.log('[ManageMembers] Loading members');
    setLoading(true);

    try {
      const response = await authenticatedGet('/api/admin/members');
      console.log('[ManageMembers] Members loaded:', response);
      setMembers(response);
    } catch (error: any) {
      console.error('[ManageMembers] Error loading members:', error);
      showModal('Erreur', error?.message || 'Impossible de charger les membres', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const filterMembers = () => {
    let filtered = members;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(m => m.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.fullName.toLowerCase().includes(query) ||
          m.membershipNumber.toLowerCase().includes(query) ||
          m.commune.toLowerCase().includes(query)
      );
    }

    setFilteredMembers(filtered);
  };

  const showModal = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm',
    onConfirm?: () => void
  ) => {
    setModalConfig({
      title,
      message,
      type,
      onConfirm: onConfirm || (() => {}),
    });
    setModalVisible(true);
  };

  const handleUpdateStatus = async (memberId: string, newStatus: 'active' | 'suspended') => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    showModal(
      'Confirmer',
      `Voulez-vous vraiment ${newStatus === 'active' ? 'activer' : 'suspendre'} ce membre ?`,
      'confirm',
      async () => {
        setModalVisible(false);
        try {
          await authenticatedPut(`/api/admin/members/${memberId}/status`, { status: newStatus });
          showModal('Succès', 'Statut mis à jour avec succès', 'success');
          await loadMembers();
        } catch (error: any) {
          console.error('[ManageMembers] Error updating status:', error);
          showModal('Erreur', error?.message || 'Impossible de mettre à jour le statut', 'error');
        }
      }
    );
  };

  const handleUpdateRole = async (memberId: string, newRole: Member['role']) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    showModal(
      'Confirmer',
      `Voulez-vous vraiment changer le rôle de ce membre en "${newRole}" ?`,
      'confirm',
      async () => {
        setModalVisible(false);
        try {
          await authenticatedPut(`/api/admin/members/${memberId}/role`, { role: newRole });
          showModal('Succès', 'Rôle mis à jour avec succès', 'success');
          await loadMembers();
        } catch (error: any) {
          console.error('[ManageMembers] Error updating role:', error);
          showModal('Erreur', error?.message || 'Impossible de mettre à jour le rôle', 'error');
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      active: '#10B981',
      pending: '#F59E0B',
      suspended: '#EF4444',
    };
    return statusColors[status as keyof typeof statusColors] || colors.textSecondary;
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      active: 'Actif',
      pending: 'En attente',
      suspended: 'Suspendu',
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  const getRoleText = (role: string) => {
    const roleTexts = {
      militant: 'Militant',
      collecteur: 'Collecteur',
      superviseur: 'Superviseur',
      administrateur: 'Administrateur',
    };
    return roleTexts[role as keyof typeof roleTexts] || role;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Gérer les Membres',
            headerShown: true,
            headerBackTitle: 'Retour',
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Gérer les Membres',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />

      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom, numéro..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {(['all', 'pending', 'active', 'suspended'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive,
                ]}
              >
                {status === 'all' ? 'Tous' : getStatusText(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredMembers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="person.3"
              android_material_icon_name="group"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>Aucun membre trouvé</Text>
          </View>
        ) : (
          <View style={styles.membersList}>
            {filteredMembers.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberHeader}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.fullName}</Text>
                    <Text style={styles.memberNumber}>{member.membershipNumber}</Text>
                    <Text style={styles.memberDetails}>
                      {member.commune} • {member.profession}
                    </Text>
                    <Text style={styles.memberContact}>{member.phone}</Text>
                  </View>
                  <View style={styles.memberBadges}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(member.status) }]}>
                      <Text style={styles.badgeText}>{getStatusText(member.status)}</Text>
                    </View>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{getRoleText(member.role)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.memberActions}>
                  {member.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleUpdateStatus(member.id, 'active')}
                    >
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.actionButtonText}>Approuver</Text>
                    </TouchableOpacity>
                  )}
                  {member.status === 'active' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.suspendButton]}
                      onPress={() => handleUpdateStatus(member.id, 'suspended')}
                    >
                      <IconSymbol
                        ios_icon_name="pause"
                        android_material_icon_name="block"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.actionButtonText}>Suspendre</Text>
                    </TouchableOpacity>
                  )}
                  {member.status === 'suspended' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleUpdateStatus(member.id, 'active')}
                    >
                      <IconSymbol
                        ios_icon_name="play"
                        android_material_icon_name="play-arrow"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.actionButtonText}>Réactiver</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.roleButton]}
                    onPress={() => {
                      setSelectedMember(member);
                      // Show role selection modal
                      showModal(
                        'Changer le rôle',
                        'Sélectionnez un nouveau rôle pour ce membre',
                        'info'
                      );
                    }}
                  >
                    <IconSymbol
                      ios_icon_name="person.badge.key"
                      android_material_icon_name="admin-panel-settings"
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionButtonText}>Rôle</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalVisible(false)}
        onConfirm={modalConfig.onConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 16,
  },
  membersList: {
    padding: 16,
  },
  memberCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  memberNumber: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  memberContact: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  memberBadges: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
  },
  roleBadgeText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  suspendButton: {
    backgroundColor: '#EF4444',
  },
  roleButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
