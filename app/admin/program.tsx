
import { Stack, useRouter } from 'expo-router';
import { Modal } from '@/components/ui/Modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useState, useEffect, useCallback } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { BACKEND_URL } from '@/utils/api';
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

interface ProgramItem {
  id: string;
  category: string;
  title: string;
  description: string;
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
  programCard: {
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
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  programTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  programActions: {
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
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
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

export default function AdminProgramScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramItem | null>(null);
  const [formCategory, setFormCategory] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOrder, setFormOrder] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const checkAuthAndLoad = useCallback(async () => {
    console.log('[AdminProgram] Checking authentication and loading programs');
    try {
      const credentials = await AsyncStorage.getItem('admin_credentials');
      if (!credentials) {
        console.log('[AdminProgram] No credentials found, redirecting to login');
        router.replace('/admin/login');
        return;
      }

      await loadPrograms();
    } catch (error) {
      console.error('[AdminProgram] Error checking auth:', error);
      showModalFunc('Erreur', 'Erreur lors de la vérification de l\'authentification.', 'error');
    }
  }, [router]);

  useEffect(() => {
    checkAuthAndLoad();
  }, [checkAuthAndLoad]);

  const loadPrograms = async () => {
    console.log('[AdminProgram] Loading programs');
    try {
      const credentials = await AsyncStorage.getItem('admin_credentials');
      if (!credentials) {
        router.replace('/admin/login');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/admin/program`, {
        method: 'GET',
        headers: {
          'x-admin-password': credentials,
          'x-admin-secret': credentials,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      console.log('[AdminProgram] Programs loaded:', data);
      setPrograms(data);
    } catch (error: any) {
      console.error('[AdminProgram] Error loading programs:', error);
      showModalFunc('Erreur', 'Impossible de charger le programme politique.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPrograms();
  }, []);

  const showModalFunc = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm', callback?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalCallback(() => callback);
    setShowModal(true);
  };

  const handleAdd = () => {
    console.log('[AdminProgram] Opening add program form');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingProgram(null);
    setFormCategory('');
    setFormTitle('');
    setFormDescription('');
    setFormOrder('');
    setShowEditModal(true);
  };

  const handleEdit = (item: ProgramItem) => {
    console.log('[AdminProgram] Opening edit form for program:', item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingProgram(item);
    setFormCategory(item.category);
    setFormTitle(item.title);
    setFormDescription(item.description);
    setFormOrder(item.order?.toString() || '');
    setShowEditModal(true);
  };

  const handleCancel = () => {
    console.log('[AdminProgram] Cancelling form');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowEditModal(false);
    setEditingProgram(null);
  };

  const handleSubmit = async () => {
    console.log('[AdminProgram] Submitting form');
    
    if (!formCategory.trim() || !formTitle.trim() || !formDescription.trim()) {
      showModalFunc('Erreur', 'Veuillez remplir tous les champs obligatoires.', 'warning');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    try {
      const credentials = await AsyncStorage.getItem('admin_credentials');
      if (!credentials) {
        router.replace('/admin/login');
        return;
      }

      const programData = {
        category: formCategory.trim(),
        title: formTitle.trim(),
        description: formDescription.trim(),
        order: formOrder.trim() ? parseInt(formOrder.trim()) : undefined,
      };

      const url = editingProgram
        ? `${BACKEND_URL}/api/admin/program/${editingProgram.id}`
        : `${BACKEND_URL}/api/admin/program`;

      const response = await fetch(url, {
        method: editingProgram ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': credentials,
          'x-admin-secret': credentials,
        },
        body: JSON.stringify(programData),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const successMessage = editingProgram ? 'Programme modifié avec succès!' : 'Programme ajouté avec succès!';
      console.log('[AdminProgram]', successMessage);
      
      setShowEditModal(false);
      setEditingProgram(null);
      showModalFunc('Succès', successMessage, 'success');
      await loadPrograms();
    } catch (error: any) {
      console.error('[AdminProgram] Error submitting program:', error);
      showModalFunc('Erreur', 'Impossible de sauvegarder le programme.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    console.log('[AdminProgram] Requesting delete confirmation for program:', id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    showModalFunc(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cet élément du programme?',
      'confirm',
      async () => {
        console.log('[AdminProgram] Deleting program:', id);
        try {
          const credentials = await AsyncStorage.getItem('admin_credentials');
          if (!credentials) {
            router.replace('/admin/login');
            return;
          }

          const response = await fetch(`${BACKEND_URL}/api/admin/program/${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-password': credentials,
              'x-admin-secret': credentials,
            },
            body: JSON.stringify({}),
          });

          if (!response.ok) {
            throw new Error(`Erreur ${response.status}`);
          }

          console.log('[AdminProgram] Program deleted successfully');
          showModalFunc('Succès', 'Programme supprimé avec succès!', 'success');
          await loadPrograms();
        } catch (error: any) {
          console.error('[AdminProgram] Error deleting program:', error);
          showModalFunc('Erreur', 'Impossible de supprimer le programme.', 'error');
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
            title: 'Gestion du Programme',
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
          title: 'Gestion du Programme',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Programme Politique</Text>
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
          {programs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="doc.text" android_material_icon_name="description" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Aucun élément du programme pour le moment</Text>
            </View>
          ) : (
            programs.map((program) => (
              <View key={program.id} style={styles.programCard}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{program.category}</Text>
                </View>
                
                <Text style={styles.programTitle}>{program.title}</Text>
                <Text style={styles.programDescription}>{program.description}</Text>

                <View style={styles.programActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEdit(program)}
                  >
                    <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={16} color={colors.primary} />
                    <Text style={[styles.actionButtonText, styles.editButtonText]}>Modifier</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(program.id)}
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
                {editingProgram ? 'Modifier le programme' : 'Nouveau programme'}
              </Text>

              <Text style={styles.inputLabel}>Catégorie *</Text>
              <TextInput
                style={styles.input}
                value={formCategory}
                onChangeText={setFormCategory}
                placeholder="Éducation, Santé, Économie, etc."
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Titre *</Text>
              <TextInput
                style={styles.input}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="Titre du programme"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Description détaillée du programme"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
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
                      {editingProgram ? 'Modifier' : 'Ajouter'}
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
