
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';

interface MemberRegistryEntry {
  id: string;
  fullName: string;
  membershipNumber: string;
  commune: string;
  status: 'pending' | 'active' | 'suspended';
  createdAt: string;
}

export default function MemberRegistryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<MemberRegistryEntry[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberRegistryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');

  const loadMembers = useCallback(async () => {
    console.log('[MemberRegistry] Loading member registry');
    setLoading(true);

    try {
      const response = await authenticatedGet<MemberRegistryEntry[]>('/api/admin/members');
      console.log('[MemberRegistry] Members loaded:', response);
      
      const sortedMembers = response.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setMembers(sortedMembers);
      setFilteredMembers(sortedMembers);
    } catch (error: any) {
      console.error('[MemberRegistry] Error loading members:', error);
      showModal('Erreur', error?.message || 'Impossible de charger le registre', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, members]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const filterMembers = () => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter(
      m =>
        m.fullName.toLowerCase().includes(query) ||
        m.membershipNumber.toLowerCase().includes(query) ||
        m.commune.toLowerCase().includes(query)
    );
    setFilteredMembers(filtered);
  };

  const showModal = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm'
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Registre des Membres',
            headerShown: true,
            headerBackTitle: 'Retour',
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement du registre...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Registre des Membres',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />

      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{members.length}</Text>
            <Text style={styles.statLabel}>Total Inscriptions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {members.filter(m => m.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>Cartes Actives</Text>
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou numéro..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
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
              ios_icon_name="doc.text"
              android_material_icon_name="description"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>Aucune inscription trouvée</Text>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.columnNumber]}>N°</Text>
              <Text style={[styles.tableHeaderText, styles.columnName]}>Nom Complet</Text>
              <Text style={[styles.tableHeaderText, styles.columnCard]}>N° Carte</Text>
              <Text style={[styles.tableHeaderText, styles.columnCommune]}>Commune</Text>
              <Text style={[styles.tableHeaderText, styles.columnStatus]}>Statut</Text>
              <Text style={[styles.tableHeaderText, styles.columnDate]}>Date</Text>
            </View>

            {/* Table Rows */}
            {filteredMembers.map((member, index) => (
              <View key={member.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.columnNumber]}>
                  {index + 1}
                </Text>
                <Text style={[styles.tableCell, styles.columnName]} numberOfLines={2}>
                  {member.fullName}
                </Text>
                <Text style={[styles.tableCell, styles.columnCard, styles.cardNumber]}>
                  {member.membershipNumber}
                </Text>
                <Text style={[styles.tableCell, styles.columnCommune]} numberOfLines={1}>
                  {member.commune}
                </Text>
                <View style={[styles.tableCell, styles.columnStatus]}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(member.status) },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {getStatusText(member.status)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.tableCell, styles.columnDate]}>
                  {formatDate(member.createdAt)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
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
    backgroundColor: colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 140,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
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
  tableContainer: {
    paddingHorizontal: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 60,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 13,
    color: colors.text,
  },
  columnNumber: {
    width: 40,
    textAlign: 'center',
  },
  columnName: {
    flex: 2,
    paddingHorizontal: 8,
  },
  columnCard: {
    flex: 1.5,
    paddingHorizontal: 4,
  },
  columnCommune: {
    flex: 1.5,
    paddingHorizontal: 4,
  },
  columnStatus: {
    flex: 1,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  columnDate: {
    flex: 1,
    paddingHorizontal: 4,
    fontSize: 11,
  },
  cardNumber: {
    fontWeight: '600',
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
