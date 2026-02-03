
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { adminGet, adminPost, adminPut, adminDelete } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LeadershipMember {
  id: string;
  name: string;
  position: string;
  phone?: string;
  address?: string;
  location?: string;
  order?: number;
}

export default function ManageLeadershipScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<LeadershipMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState<LeadershipMember | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    phone: '',
    address: '',
    location: '',
    order: '',
  });

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const checkAdminAuth = useCallback(async () => {
    console.log('[ManageLeadership] Checking admin authentication');
    try {
      const password = await AsyncStorage.getItem('admin_password');
      const secretCode = await AsyncStorage.getItem('admin_secret_code');
      
      const webPassword = Platform.OS === 'web' ? localStorage.getItem('admin_password') : null;
      const webSecretCode = Platform.OS === 'web' ? localStorage.getItem('admin_secret_code') : null;
      
      const hasCredentials = (password && secretCode) || (webPassword && webSecretCode);
      
      if (hasCredentials) {
        console.log('[ManageLeadership] Admin credentials found');
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('[ManageLeadership] No admin credentials, redirecting to login');
        router.replace('/admin/login');
        return false;
      }
    } catch (error) {
      console.error('[ManageLeadership] Error checking admin auth:', error);
      router.replace('/admin/login');
      return false;
    }
  }, [router]);

  const loadMembers = useCallback(async () => {
    console.log('[ManageLeadership] Loading leadership members');
    try {
      const response = await adminGet<LeadershipMember[]>('/api/leadership');
      setMembers(response || []);
      console.log('[ManageLeadership] Loaded', response?.length || 0, 'members');
    } catch (error) {
      console.error('[ManageLeadership] Error loading members:', error);
      showModal('Erreur', 'Impossible de charger les dirigeants', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initScreen = async () => {
      const authenticated = await checkAdminAuth();
      if (authenticated) {
        loadMembers();
      }
    };
    
    initScreen();
  }, [checkAdminAuth, loadMembers]);

  const onRefresh = useCallback(() => {
    console.log('[ManageLeadership] Refreshing members');
    setRefreshing(true);
    loadMembers();
  }, [loadMembers]);

  const handleCreate = () => {
    console.log('[ManageLeadership] Creating new member');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEditing(true);
    setCurrentMember(null);
    setFormData({ name: '', position: '', phone: '', address: '', location: '', order: '' });
  };

  const handleEdit = (member: LeadershipMember) => {
    console.log('[ManageLeadership] Editing member:', member.id);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditing(true);
    setCurrentMember(member);
    setFormData({
      name: member.name,
      position: member.position,
      phone: member.phone || '',
      address: member.address || '',
      location: member.location || '',
      order: member.order?.toString() || '',
    });
  };

  const handleSave = async () => {
    console.log('[ManageLeadership] Saving member');
    
    if (!formData.name.trim() || !formData.position.trim()) {
      showModal('Erreur', 'Le nom et le poste sont obligatoires', 'error');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        position: formData.position,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        location: formData.location || undefined,
        order: formData.order ? parseInt(formData.order) : undefined,
      };

      if (currentMember) {
        await adminPut(`/api/admin/leadership/${currentMember.id}`, payload);
      } else {
        await adminPost('/api/admin/leadership', payload);
      }

      showModal('Succès', 'Dirigeant enregistré avec succès', 'success');
      setEditing(false);
      loadMembers();
    } catch (error: any) {
      console.error('[ManageLeadership] Error saving member:', error);
      showModal('Erreur', error?.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (member: LeadershipMember) => {
    console.log('[ManageLeadership] Deleting member:', member.id);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    setLoading(true);

    try {
      await adminDelete(`/api/admin/leadership/${member.id}`);
      showModal('Succès', 'Dirigeant supprimé avec succès', 'success');
      loadMembers();
    } catch (error: any) {
      console.error('[ManageLeadership] Error deleting member:', error);
      showModal('Erreur', error?.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('[ManageLeadership] Canceling edit');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditing(false);
    setCurrentMember(null);
    setFormData({ name: '', position: '', phone: '', address: '', location: '', order: '' });
  };

  if (!isAuthenticated || (loading && !refreshing && !editing)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (editing) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: currentMember ? 'Modifier le Dirigeant' : 'Nouveau Dirigeant',
            headerShown: true,
            headerBackTitle: 'Retour',
          }}
        />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom complet"
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Poste *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Président, Vice-président..."
                placeholderTextColor={colors.textSecondary}
                value={formData.position}
                onChangeText={(text) => setFormData({ ...formData, position: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="+223 XX XX XX XX"
                placeholderTextColor={colors.textSecondary}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Adresse complète"
                placeholderTextColor={colors.textSecondary}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Localisation (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Bamako, Mali"
                placeholderTextColor={colors.textSecondary}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ordre d&apos;affichage (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="1, 2, 3..."
                placeholderTextColor={colors.textSecondary}
                value={formData.order}
                onChangeText={(text) => setFormData({ ...formData, order: text })}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Gérer la Direction',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add-circle"
              size={24}
              color={colors.background}
            />
            <Text style={styles.createButtonText}>Nouveau Dirigeant</Text>
          </TouchableOpacity>
        </View>

        {members.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="person.2.fill"
              android_material_icon_name="people"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>Aucun dirigeant</Text>
            <Text style={styles.emptyStateSubtext}>Ajoutez votre premier dirigeant</Text>
          </View>
        ) : (
          <View style={styles.membersList}>
            {members.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberItemHeader}>
                  <Text style={styles.memberItemName}>{member.name}</Text>
                  <Text style={styles.memberItemPosition}>{member.position}</Text>
                </View>
                {member.location && (
                  <Text style={styles.memberItemLocation}>{member.location}</Text>
                )}
                {member.phone && (
                  <Text style={styles.memberItemPhone}>{member.phone}</Text>
                )}
                <View style={styles.memberItemActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(member)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      ios_icon_name="pencil"
                      android_material_icon_name="edit"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.editButtonText}>Modifier</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(member)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={18}
                      color={colors.error}
                    />
                    <Text style={styles.deleteButtonText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 40,
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
    padding: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
    marginLeft: 8,
  },
  membersList: {
    paddingHorizontal: 20,
  },
  memberItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  memberItemHeader: {
    marginBottom: 8,
  },
  memberItemName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  memberItemPosition: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  memberItemLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  memberItemPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  memberItemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  editButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  deleteButtonText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
});
