
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
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Stack } from 'expo-router';
import { Modal } from '@/components/ui/Modal';
import { IconSymbol } from '@/components/IconSymbol';
import { BACKEND_URL } from '@/utils/api';
import AsyncStorage from '@/lib/async-storage';
import { colors } from '@/styles/commonStyles';

const Haptics = {
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
};

interface LeadershipMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  photo_url?: string;
  bio?: string;
  order_index?: number;
}

const getAdminHeaders = async (): Promise<Record<string, string>> => {
  const password = await AsyncStorage.getItem('admin_password');
  return {
    'Content-Type': 'application/json',
    ...(password ? { 'x-admin-password': password } : {}),
  };
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.primary },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  addButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  addButtonText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  listContainer: { padding: 16 },
  memberCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  memberCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 },
  memberAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary + '20' },
  memberAvatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  memberAvatarInitial: { fontSize: 22, fontWeight: '700', color: colors.primary },
  memberCardInfo: { flex: 1 },
  memberName: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
  memberRole: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  memberBio: { fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 18 },
  memberActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  editButton: { backgroundColor: colors.primary + '20' },
  deleteButton: { backgroundColor: '#FF3B3020' },
  actionButtonText: { fontSize: 13, fontWeight: '600' },
  editButtonText: { color: colors.primary },
  deleteButtonText: { color: '#FF3B30' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 16 },
  editModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 999 },
  editModalWrapper: { justifyContent: 'flex-end' },
  editModalScroll: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.card, borderRadius: 8, padding: 12, fontSize: 15, color: colors.text, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  imagePreview: { width: 80, height: 80, borderRadius: 40, marginBottom: 16, alignSelf: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  cancelButton: { backgroundColor: colors.card },
  submitButton: { backgroundColor: colors.primary },
  modalButtonText: { fontSize: 15, fontWeight: '600' },
  cancelButtonText: { color: colors.text },
  submitButtonText: { color: '#FFFFFF' },
});

export default function AdminLeadershipScreen() {
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
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formOrderIndex, setFormOrderIndex] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadMembers = useCallback(async () => {
    console.log('[AdminLeadership] GET /api/direction');
    try {
      const headers = await getAdminHeaders();
      const response = await fetch(`${BACKEND_URL}/api/direction`, { headers });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text.slice(0, 120)}`);
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      console.log('[AdminLeadership] Members loaded:', list.length);
      setMembers(list);
    } catch (error: any) {
      console.error('[AdminLeadership] Error loading members:', error);
      showModalFunc('Erreur', 'Impossible de charger les membres de la direction: ' + error.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadMembers().finally(() => { if (!isMounted) return; });
    return () => { isMounted = false; };
  }, [loadMembers]);

  const onRefresh = useCallback(() => {
    console.log('[AdminLeadership] Pull-to-refresh triggered');
    setRefreshing(true);
    loadMembers();
  }, [loadMembers]);

  const showModalFunc = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm', callback?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalCallback(callback ? () => callback : null);
    setShowModal(true);
  };

  const handleAdd = () => {
    console.log('[AdminLeadership] User tapped Ajouter member');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingMember(null);
    setFormFirstName('');
    setFormLastName('');
    setFormRole('');
    setFormPhotoUrl('');
    setFormBio('');
    setFormOrderIndex('');
    setShowEditModal(true);
  };

  const handleEdit = (item: LeadershipMember) => {
    console.log('[AdminLeadership] User tapped Modifier member:', item.id);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingMember(item);
    setFormFirstName(item.first_name || '');
    setFormLastName(item.last_name || '');
    setFormRole(item.role || '');
    setFormPhotoUrl(item.photo_url || '');
    setFormBio(item.bio || '');
    setFormOrderIndex(item.order_index?.toString() || '');
    setShowEditModal(true);
  };

  const handleCancel = () => {
    console.log('[AdminLeadership] User tapped Annuler form');
    setShowEditModal(false);
    setEditingMember(null);
  };

  const handleSubmit = async () => {
    if (!formFirstName.trim() || !formLastName.trim() || !formRole.trim()) {
      showModalFunc('Erreur', 'Veuillez remplir le prénom, le nom et le rôle.', 'warning');
      return;
    }

    console.log('[AdminLeadership] User tapped save member, editing:', editingMember?.id ?? 'new');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    const memberData: Record<string, any> = {
      first_name: formFirstName.trim(),
      last_name: formLastName.trim(),
      role: formRole.trim(),
    };
    if (formPhotoUrl.trim()) memberData.photo_url = formPhotoUrl.trim();
    if (formBio.trim()) memberData.bio = formBio.trim();
    if (formOrderIndex.trim()) memberData.order_index = parseInt(formOrderIndex.trim(), 10);

    try {
      const headers = await getAdminHeaders();
      if (editingMember) {
        console.log('[AdminLeadership] PUT /api/direction/' + editingMember.id, memberData);
        const response = await fetch(`${BACKEND_URL}/api/direction/${editingMember.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(memberData),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Erreur ${response.status}: ${text.slice(0, 120)}`);
        }
        console.log('[AdminLeadership] Member updated successfully');
      } else {
        console.log('[AdminLeadership] POST /api/direction', memberData);
        const response = await fetch(`${BACKEND_URL}/api/direction`, {
          method: 'POST',
          headers,
          body: JSON.stringify(memberData),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Erreur ${response.status}: ${text.slice(0, 120)}`);
        }
        console.log('[AdminLeadership] Member created successfully');
      }

      const successMessage = editingMember ? 'Membre modifié avec succès!' : 'Membre ajouté avec succès!';
      setShowEditModal(false);
      setEditingMember(null);
      await loadMembers();
      showModalFunc('Succès', successMessage, 'success');
    } catch (error: any) {
      console.error('[AdminLeadership] Error submitting member:', error);
      showModalFunc('Erreur', error.message || 'Impossible de sauvegarder le membre.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    console.log('[AdminLeadership] User tapped Supprimer member:', id);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showModalFunc(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce membre de la direction?',
      'confirm',
      async () => {
        console.log('[AdminLeadership] DELETE /api/direction/' + id);
        try {
          const headers = await getAdminHeaders();
          const response = await fetch(`${BACKEND_URL}/api/direction/${id}`, {
            method: 'DELETE',
            headers,
          });
          if (!response.ok) {
            const text = await response.text();
            throw new Error(`Erreur ${response.status}: ${text.slice(0, 120)}`);
          }
          console.log('[AdminLeadership] Member deleted successfully');
          await loadMembers();
          showModalFunc('Succès', 'Membre supprimé avec succès!', 'success');
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
        <Stack.Screen options={{ headerShown: true, title: 'Gestion de la Direction', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Gestion de la Direction', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF' }} />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        >
          {members.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="person.3" android_material_icon_name="group" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Aucun membre de la direction</Text>
            </View>
          ) : (
            members.map((member) => {
              const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
              const initial = (member.first_name || member.last_name || '?').charAt(0).toUpperCase();
              return (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberCardTop}>
                    {member.photo_url ? (
                      <Image source={{ uri: member.photo_url }} style={styles.memberAvatar} />
                    ) : (
                      <View style={styles.memberAvatarPlaceholder}>
                        <Text style={styles.memberAvatarInitial}>{initial}</Text>
                      </View>
                    )}
                    <View style={styles.memberCardInfo}>
                      <Text style={styles.memberName}>{fullName}</Text>
                      <Text style={styles.memberRole}>{member.role}</Text>
                    </View>
                  </View>

                  {member.bio ? (
                    <Text style={styles.memberBio}>{member.bio}</Text>
                  ) : null}

                  <View style={styles.memberActions}>
                    <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleEdit(member)}>
                      <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={16} color={colors.primary} />
                      <Text style={[styles.actionButtonText, styles.editButtonText]}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(member.id)}>
                      <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={16} color="#FF3B30" />
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <Modal
          visible={showModal && modalType !== 'confirm'}
          onClose={() => setShowModal(false)}
          title={modalTitle}
          message={modalMessage}
          type={modalType}
        />
        <Modal
          visible={showModal && modalType === 'confirm'}
          onClose={() => setShowModal(false)}
          onConfirm={() => {
            setShowModal(false);
            if (modalCallback) {
              modalCallback();
              setModalCallback(null);
            }
          }}
          title={modalTitle}
          message={modalMessage}
          type="confirm"
          confirmText="Supprimer"
          cancelText="Annuler"
        />

        {showEditModal && (
          <View style={styles.editModalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.editModalWrapper}>
              <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>
                  {editingMember ? 'Modifier le membre' : 'Nouveau membre'}
                </Text>

                <Text style={styles.inputLabel}>Prénom *</Text>
                <TextInput
                  style={styles.input}
                  value={formFirstName}
                  onChangeText={setFormFirstName}
                  placeholder="Prénom"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.inputLabel}>Nom *</Text>
                <TextInput
                  style={styles.input}
                  value={formLastName}
                  onChangeText={setFormLastName}
                  placeholder="Nom de famille"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.inputLabel}>Rôle / Poste *</Text>
                <TextInput
                  style={styles.input}
                  value={formRole}
                  onChangeText={setFormRole}
                  placeholder="Président, Vice-président, etc."
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.inputLabel}>URL de la photo (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  value={formPhotoUrl}
                  onChangeText={setFormPhotoUrl}
                  placeholder="https://..."
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                {formPhotoUrl.trim().length > 0 && (
                  <Image source={{ uri: formPhotoUrl.trim() }} style={styles.imagePreview} />
                )}

                <Text style={styles.inputLabel}>Biographie (optionnel)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formBio}
                  onChangeText={setFormBio}
                  placeholder="Courte biographie..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <Text style={styles.inputLabel}>Ordre d'affichage (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  value={formOrderIndex}
                  onChangeText={setFormOrderIndex}
                  placeholder="1, 2, 3..."
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleCancel} disabled={submitting}>
                    <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.submitButton]} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.modalButtonText, styles.submitButtonText]}>
                        {editingMember ? 'Modifier' : 'Ajouter'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        )}
      </View>
    </>
  );
}
