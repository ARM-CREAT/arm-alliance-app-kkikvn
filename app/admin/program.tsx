
import { Stack } from 'expo-router';
import { Modal } from '@/components/ui/Modal';
import * as Haptics from 'expo-haptics';
import React, { useState, useEffect, useCallback } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { BACKEND_URL } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  title: string;
  description: string;
  icon?: string;
  color?: string;
  content?: string;
}

const ICON_OPTIONS = ['🏛️', '💰', '🛡️', '📚', '🏥', '🏗️', '🌾', '🌍', '⚖️', '🤝', '🌱', '🔬'];
const COLOR_OPTIONS = ['#1B5E20', '#1565C0', '#E65100', '#6A1B9A', '#00695C', '#C62828', '#F57F17', '#37474F'];

const getAdminHeaders = async (): Promise<Record<string, string>> => {
  const password = await AsyncStorage.getItem('admin_password');
  return {
    'Content-Type': 'application/json',
    ...(password ? { 'x-admin-password': password } : {}),
  };
};

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
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPrograms = useCallback(async () => {
    console.log('[AdminProgram] GET /api/programs');
    try {
      const response = await fetch(`${BACKEND_URL}/api/programs`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text.slice(0, 120)}`);
      }
      const data = await response.json();
      console.log('[AdminProgram] Programs loaded:', Array.isArray(data) ? data.length : 0);
      setPrograms(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('[AdminProgram] Error loading programs:', error);
      showModalFunc('Erreur', 'Impossible de charger le programme: ' + error.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const onRefresh = useCallback(() => {
    console.log('[AdminProgram] Pull-to-refresh triggered');
    setRefreshing(true);
    loadPrograms();
  }, [loadPrograms]);

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
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingProgram(null);
    setFormTitle('');
    setFormDescription('');
    setFormIcon('');
    setFormColor('');
    setFormContent('');
    setShowEditModal(true);
  };

  const handleEdit = (item: ProgramItem) => {
    console.log('[AdminProgram] User tapped Modifier program:', item.id);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingProgram(item);
    setFormTitle(item.title || '');
    setFormDescription(item.description || '');
    setFormIcon(item.icon || '');
    setFormColor(item.color || '');
    setFormContent(item.content || '');
    setShowEditModal(true);
  };

  const handleCancel = () => {
    console.log('[AdminProgram] User tapped Annuler form');
    setShowEditModal(false);
    setEditingProgram(null);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formDescription.trim()) {
      showModalFunc('Erreur', 'Le titre et la description sont obligatoires.', 'warning');
      return;
    }

    console.log('[AdminProgram] User tapped save program, editing:', editingProgram?.id ?? 'new');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    const programData: Record<string, string> = {
      title: formTitle.trim(),
      description: formDescription.trim(),
    };
    if (formIcon.trim()) programData.icon = formIcon.trim();
    if (formColor.trim()) programData.color = formColor.trim();
    if (formContent.trim()) programData.content = formContent.trim();

    console.log('[AdminProgram] Submitting payload:', JSON.stringify(programData));

    try {
      const headers = await getAdminHeaders();
      if (editingProgram) {
        console.log('[AdminProgram] PUT /api/programs/' + editingProgram.id);
        const res = await fetch(`${BACKEND_URL}/api/programs/${editingProgram.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(programData),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
        }
        console.log('[AdminProgram] Program updated successfully');
      } else {
        console.log('[AdminProgram] POST /api/programs');
        const res = await fetch(`${BACKEND_URL}/api/programs`, {
          method: 'POST',
          headers,
          body: JSON.stringify(programData),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
        }
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
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showModalFunc(
      'Confirmer la suppression',
      "Êtes-vous sûr de vouloir supprimer cet élément du programme?",
      'confirm',
      async () => {
        console.log('[AdminProgram] DELETE /api/programs/' + id);
        try {
          const headers = await getAdminHeaders();
          const res = await fetch(`${BACKEND_URL}/api/programs/${id}`, {
            method: 'DELETE',
            headers,
          });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
          }
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        >
          {programs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="doc.text" android_material_icon_name="description" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Aucun élément du programme pour le moment</Text>
            </View>
          ) : (
            programs.map((program) => {
              const iconDisplay = program.icon || '📄';
              const cardColor = program.color || colors.primary;
              return (
                <View key={program.id} style={styles.programCard}>
                  <View style={styles.programCardHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: cardColor + '20' }]}>
                      <Text style={styles.iconText}>{iconDisplay}</Text>
                    </View>
                    <Text style={styles.programTitle}>{program.title}</Text>
                  </View>
                  <Text style={styles.programDescription}>{program.description}</Text>
                  {program.content ? (
                    <Text style={styles.programContent} numberOfLines={2}>{program.content}</Text>
                  ) : null}
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
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>
                  {editingProgram ? 'Modifier le programme' : 'Nouveau programme'}
                </Text>

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
                  placeholder="Description courte du programme"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />

                <Text style={styles.inputLabel}>Contenu détaillé</Text>
                <TextInput
                  style={[styles.input, styles.textAreaLarge]}
                  value={formContent}
                  onChangeText={setFormContent}
                  placeholder="Contenu détaillé du programme politique..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={6}
                />

                <Text style={styles.inputLabel}>Icône</Text>
                <View style={styles.iconGrid}>
                  {ICON_OPTIONS.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[styles.iconOption, formIcon === icon && styles.iconOptionSelected]}
                      onPress={() => {
                        console.log('[AdminProgram] Icon selected:', icon);
                        setFormIcon(icon);
                      }}
                    >
                      <Text style={styles.iconOptionText}>{icon}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  value={formIcon}
                  onChangeText={setFormIcon}
                  placeholder="Ou saisissez un emoji personnalisé"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.inputLabel}>Couleur</Text>
                <View style={styles.colorGrid}>
                  {COLOR_OPTIONS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorOption, { backgroundColor: color }, formColor === color && styles.colorOptionSelected]}
                      onPress={() => {
                        console.log('[AdminProgram] Color selected:', color);
                        setFormColor(color);
                      }}
                    />
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  value={formColor}
                  onChangeText={setFormColor}
                  placeholder="#1B5E20"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
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
  programCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 22 },
  programTitle: { fontSize: 17, fontWeight: 'bold', color: colors.text, flex: 1 },
  programDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 6 },
  programContent: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, fontStyle: 'italic', marginBottom: 6 },
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
  modalScroll: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' as any, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.card, borderRadius: 8, padding: 12, fontSize: 15, color: colors.text, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  textAreaLarge: { minHeight: 120, textAlignVertical: 'top' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  iconOption: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  iconOptionSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primary + '15' },
  iconOptionText: { fontSize: 22 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  colorOption: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorOptionSelected: { borderColor: colors.text, borderWidth: 3 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8, marginBottom: 32 },
  modalButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  cancelButton: { backgroundColor: colors.card },
  submitButton: { backgroundColor: colors.primary },
  modalButtonText: { fontSize: 15, fontWeight: '600' },
  cancelButtonText: { color: colors.text },
  submitButtonText: { color: '#FFFFFF' },
});
