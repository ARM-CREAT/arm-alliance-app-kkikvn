
import { Stack } from 'expo-router';
import { Modal } from '@/components/ui/Modal';
import * as Haptics from 'expo-haptics';
import React, { useState, useEffect, useCallback } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { BACKEND_URL } from '@/utils/api-helpers';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProgramItem {
  id: string;
  category: string;
  title: string;
  description: string;
  order?: number;
}

const CATEGORIES = [
  'Gouvernance',
  'Économie',
  'Sécurité',
  'Éducation',
  'Santé',
  'Infrastructure',
  'Agriculture',
  'Diplomatie',
];

async function getAdminPassword(): Promise<string> {
  const pw = await AsyncStorage.getItem('admin_password');
  return pw || '';
}

async function adminFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const password = await getAdminPassword();
  const url = `${BACKEND_URL}${endpoint}`;
  console.log('[AdminProgram] Fetch:', options.method || 'GET', url);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password,
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error('[AdminProgram] API error:', response.status, errText);
    throw new Error(`Erreur ${response.status}: ${errText}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export default function AdminProgramScreen() {
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
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    console.log('[AdminProgram] Loading programs from GET /api/program');
    try {
      const res = await fetch(`${BACKEND_URL}/api/program`);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Erreur ${res.status}: ${errText}`);
      }
      const data = await res.json();
      console.log('[AdminProgram] Programs loaded:', data?.length ?? 0);
      setPrograms(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('[AdminProgram] Error loading programs:', error);
      showModalFunc('Erreur', 'Impossible de charger le programme politique.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    console.log('[AdminProgram] Pull-to-refresh triggered');
    setRefreshing(true);
    loadPrograms();
  }, []);

  const showModalFunc = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm',
    callback?: () => void
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalCallback(callback ? () => callback : null);
    setShowModal(true);
  };

  const handleAdd = () => {
    console.log('[AdminProgram] User tapped Ajouter program');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingProgram(null);
    setFormCategory('');
    setFormTitle('');
    setFormDescription('');
    setFormOrder('');
    setShowCategoryPicker(false);
    setShowEditModal(true);
  };

  const handleEdit = (item: ProgramItem) => {
    console.log('[AdminProgram] User tapped Modifier program:', item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingProgram(item);
    setFormCategory(item.category);
    setFormTitle(item.title);
    setFormDescription(item.description);
    setFormOrder(item.order?.toString() || '');
    setShowCategoryPicker(false);
    setShowEditModal(true);
  };

  const handleCancel = () => {
    console.log('[AdminProgram] User tapped Annuler form');
    setShowEditModal(false);
    setEditingProgram(null);
    setShowCategoryPicker(false);
  };

  const handleSubmit = async () => {
    if (!formCategory.trim() || !formTitle.trim() || !formDescription.trim()) {
      showModalFunc('Erreur', 'Veuillez remplir tous les champs obligatoires.', 'warning');
      return;
    }

    console.log('[AdminProgram] User tapped save program, editing:', editingProgram?.id ?? 'new');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    const programData: any = {
      category: formCategory.trim(),
      title: formTitle.trim(),
      description: formDescription.trim(),
    };
    if (formOrder.trim()) {
      programData.order = parseInt(formOrder.trim(), 10);
    }

    try {
      if (editingProgram) {
        console.log('[AdminProgram] PUT /api/program/' + editingProgram.id);
        await adminFetch(`/api/program/${editingProgram.id}`, {
          method: 'PUT',
          body: JSON.stringify(programData),
        });
        console.log('[AdminProgram] Program updated successfully');
      } else {
        console.log('[AdminProgram] POST /api/program');
        await adminFetch('/api/program', {
          method: 'POST',
          body: JSON.stringify(programData),
        });
        console.log('[AdminProgram] Program created successfully');
      }

      const successMessage = editingProgram ? 'Programme modifié avec succès!' : 'Programme ajouté avec succès!';
      setShowEditModal(false);
      setEditingProgram(null);
      await loadPrograms();
      showModalFunc('Succès', successMessage, 'success');
    } catch (error: any) {
      console.error('[AdminProgram] Error submitting program:', error);
      showModalFunc('Erreur', error.message || 'Impossible de sauvegarder le programme.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    console.log('[AdminProgram] User tapped Supprimer program:', id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showModalFunc(
      'Confirmer la suppression',
      "Êtes-vous sûr de vouloir supprimer cet élément du programme?",
      'confirm',
      async () => {
        console.log('[AdminProgram] DELETE /api/program/' + id);
        try {
          await adminFetch(`/api/program/${id}`, { method: 'DELETE', body: JSON.stringify({}) });
          console.log('[AdminProgram] Program deleted successfully');
          await loadPrograms();
          showModalFunc('Succès', 'Programme supprimé avec succès!', 'success');
        } catch (error: any) {
          console.error('[AdminProgram] Error deleting program:', error);
          showModalFunc('Erreur', error.message || 'Impossible de supprimer le programme.', 'error');
        }
      }
    );
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Gestion du Programme', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Gestion du Programme', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF' }} />
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
                  <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleEdit(program)}>
                    <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={16} color={colors.primary} />
                    <Text style={[styles.actionButtonText, styles.editButtonText]}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(program.id)}>
                    <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={16} color="#FF3B30" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
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

        {/* Edit / Add inline modal */}
        {showEditModal && (
          <View style={styles.editModalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.editModalWrapper}>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>
                  {editingProgram ? 'Modifier le programme' : 'Nouveau programme'}
                </Text>

                <Text style={styles.inputLabel}>Catégorie *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.categorySelector]}
                  onPress={() => {
                    console.log('[AdminProgram] User tapped category picker');
                    setShowCategoryPicker(!showCategoryPicker);
                  }}
                >
                  <Text style={formCategory ? styles.categorySelectorText : styles.categorySelectorPlaceholder}>
                    {formCategory || 'Sélectionner une catégorie'}
                  </Text>
                  <Text style={styles.categorySelectorArrow}>{showCategoryPicker ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {showCategoryPicker && (
                  <View style={styles.categoryList}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.categoryOption, formCategory === cat && styles.categoryOptionSelected]}
                        onPress={() => {
                          console.log('[AdminProgram] Category selected:', cat);
                          setFormCategory(cat);
                          setShowCategoryPicker(false);
                        }}
                      >
                        <Text style={[styles.categoryOptionText, formCategory === cat && styles.categoryOptionTextSelected]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

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
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleCancel} disabled={submitting}>
                    <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.submitButton]} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.modalButtonText, styles.submitButtonText]}>
                        {editingProgram ? 'Modifier' : 'Ajouter'}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.primary },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  addButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  addButtonText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  listContainer: { padding: 16 },
  programCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: colors.primary + '20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  categoryText: { fontSize: 11, fontWeight: '600', color: colors.primary, textTransform: 'uppercase' },
  programTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  programDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  programActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
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
  modalScroll: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' as any, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.card, borderRadius: 8, padding: 12, fontSize: 15, color: colors.text, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  categorySelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categorySelectorText: { fontSize: 15, color: colors.text },
  categorySelectorPlaceholder: { fontSize: 15, color: colors.textSecondary },
  categorySelectorArrow: { fontSize: 12, color: colors.textSecondary },
  categoryList: { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 16, overflow: 'hidden' },
  categoryOption: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  categoryOptionSelected: { backgroundColor: colors.primary + '15' },
  categoryOptionText: { fontSize: 15, color: colors.text },
  categoryOptionTextSelected: { color: colors.primary, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  cancelButton: { backgroundColor: colors.card },
  submitButton: { backgroundColor: colors.primary },
  modalButtonText: { fontSize: 15, fontWeight: '600' },
  cancelButtonText: { color: colors.text },
  submitButtonText: { color: '#FFFFFF' },
});
