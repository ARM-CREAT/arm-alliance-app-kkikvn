
import { Stack, useRouter } from 'expo-router';
import { Modal } from '@/components/ui/Modal';
import * as Haptics from 'expo-haptics';
import React, { useState, useEffect, useCallback } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '@/styles/commonStyles';

interface LeadershipMember {
  id: string;
  name: string;
  position: string;
  phone?: string;
  address?: string;
  location?: string;
  order?: number;
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
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
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  memberPosition: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: colors.primary + '20',
  },
  deleteButton: {
    backgroundColor: '#FF3B3020',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editButtonText: {
    color: colors.primary,
  },
  deleteButtonText: {
    color: '#FF3B30',
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
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    maxWidth: 500,
    width: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.card,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: colors.text,
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
});

export default function AdminLeadershipScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<LeadershipMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<LeadershipMember | null>(null);
  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formOrder, setFormOrder] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    console.log('[AdminLeadership] Loading leadership members');
    try {
      const data = await apiGet<LeadershipMember[]>('/api/leadership');
      console.log('[AdminLeadership] Members loaded:', data);
      setMembers(data);
    } catch (error: any) {
      console.error('[AdminLeadership] Error loading members:', error);
      showModalFunc('Erreur', 'Impossible de charger les membres de la direction.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  const handleAdd = () => {
    console.log('[AdminLeadership] Opening add member form');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingMember(null);
    setFormName('');
    setFormPosition('');
    setFormPhone('');
    setFormAddress('');
    setFormLocation('');
    setFormOrder('');
    setShowEditModal(true);
  };

  const handleEdit = (item: LeadershipMember) => {
    console.log('[AdminLeadership] Opening edit form for member:', item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingMember(item);
    setFormName(item.name);
    setFormPosition(item.position);
    setFormPhone(item.phone || '');
    setFormAddress(item.address || '');
    setFormLocation(item.location || '');
    setFormOrder(item.order?.toString() || '');
    setShowEditModal(true);
  };

  const handleCancel = () => {
    console.log('[AdminLeadership] Cancelling form');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowEditModal(false);
    setEditingMember(null);
  };

  const handleSubmit = async () => {
    console.log('[AdminLeadership] Submitting form');
    
    if (!formName.trim() || !formPosition.trim()) {
      showModalFunc('Erreur', 'Veuillez remplir le nom et le poste.', 'warning');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    try {
      const memberData = {
        name: formName.trim(),
        position: formPosition.trim(),
        phone: formPhone.trim() || undefined,
        address: formAddress.trim() || undefined,
        location: formLocation.trim() || undefined,
        order: formOrder.trim() ? parseInt(formOrder.trim()) : undefined,
      };

      if (editingMember) {
        await apiPut(`/api/leadership/${editingMember.id}`, memberData);
      } else {
        await apiPost('/api/leadership', memberData);
      }

      const successMessage = editingMember ? 'Membre modifié avec succès!' : 'Membre ajouté avec succès!';
      console.log('[AdminLeadership]', successMessage);
      
      setShowEditModal(false);
      setEditingMember(null);
      showModalFunc('Succès', successMessage, 'success');
      await loadMembers();
    } catch (error: any) {
      console.error('[AdminLeadership] Error submitting member:', error);
      showModalFunc('Erreur', error.message || 'Impossible de sauvegarder le membre.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    console.log('[AdminLeadership] Requesting delete confirmation for member:', id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    showModalFunc(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce membre de la direction?',
      'confirm',
      async () => {
        console.log('[AdminLeadership] Deleting member:', id);
        try {
          await apiDelete(`/api/leadership/${id}`);
          console.log('[AdminLeadership] Member deleted successfully');
          showModalFunc('Succès', 'Membre supprimé avec succès!', 'success');
          await loadMembers();
        } catch (error: any) {
          console.error('[AdminLeadership] Error deleting member:', error);
          showModalFunc('Erreur', error.message || 'Impossible de supprimer le membre.', 'error');
        }
      }
    );
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Gestion de la Direction',
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
          title: 'Gestion de la Direction',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Direction</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={18} color={colors.primary} />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {members.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="person.3" android_material_icon_name="group" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Aucun membre de la direction</Text>
            </View>
          ) : (
            members.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberPosition}>{member.position}</Text>
                
                {member.phone && (
                  <View style={styles.memberInfo}>
                    <IconSymbol ios_icon_name="phone" android_material_icon_name="phone" size={16} color={colors.textSecondary} />
                    <Text style={styles.memberInfoText}>{member.phone}</Text>
                  </View>
                )}
                
                {member.location && (
                  <View style={styles.memberInfo}>
                    <IconSymbol ios_icon_name="location" android_material_icon_name="location-on" size={16} color={colors.textSecondary} />
                    <Text style={styles.memberInfoText}>{member.location}</Text>
                  </View>
                )}
                
                {member.address && (
                  <View style={styles.memberInfo}>
                    <IconSymbol ios_icon_name="house" android_material_icon_name="home" size={16} color={colors.textSecondary} />
                    <Text style={styles.memberInfoText}>{member.address}</Text>
                  </View>
                )}

                <View style={styles.memberActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEdit(member)}
                  >
                    <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={16} color={colors.primary} />
                    <Text style={[styles.actionButtonText, styles.editButtonText]}>Modifier</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(member.id)}
                  >
                    <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={16} color="#FF3B30" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Supprimer</Text>
                  </TouchableOpacity>
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

        <Modal
          visible={showEditModal}
          onClose={handleCancel}
          title=""
          message=""
          type="info"
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingMember ? 'Modifier le membre' : 'Nouveau membre'}
              </Text>

              <Text style={styles.inputLabel}>Nom complet *</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="Nom du membre"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Poste *</Text>
              <TextInput
                style={styles.input}
                value={formPosition}
                onChangeText={setFormPosition}
                placeholder="Président, Vice-président, etc."
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={formPhone}
                onChangeText={setFormPhone}
                placeholder="+223 XX XX XX XX"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Lieu</Text>
              <TextInput
                style={styles.input}
                value={formLocation}
                onChangeText={setFormLocation}
                placeholder="Bamako, Mali"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Adresse</Text>
              <TextInput
                style={styles.input}
                value={formAddress}
                onChangeText={setFormAddress}
                placeholder="Adresse complète"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Ordre d'affichage</Text>
              <TextInput
                style={styles.input}
                value={formOrder}
                onChangeText={setFormOrder}
                placeholder="1, 2, 3..."
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancel}
                  disabled={submitting}
                >
                  <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalButtonText, styles.submitButtonText]}>
                      {editingMember ? 'Modifier' : 'Ajouter'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </>
  );
}
