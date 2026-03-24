
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
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import * as Haptics from 'expo-haptics';
import { BACKEND_URL } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  publishedAt: string;
}

const getAdminHeaders = async (): Promise<Record<string, string>> => {
  const password = await AsyncStorage.getItem('admin_password');
  return {
    'Content-Type': 'application/json',
    ...(password ? { 'x-admin-password': password } : {}),
  };
};

export default function AdminNewsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    console.log('[AdminNews] GET /api/news');
    try {
      const response = await fetch(`${BACKEND_URL}/api/news`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text.slice(0, 120)}`);
      }
      const data = await response.json();
      const list: NewsItem[] = Array.isArray(data) ? data : [];
      console.log('[AdminNews] Loaded news:', list.length);
      setNews(list);
    } catch (error: any) {
      console.error('[AdminNews] Load error:', error);
      showModal('Erreur', 'Impossible de charger les actualités: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const onRefresh = async () => {
    console.log('[AdminNews] Pull-to-refresh triggered');
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm' = 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleAdd = () => {
    console.log('[AdminNews] User tapped Nouvelle Actualité');
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormImageUrl('');
    setShowForm(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEdit = (item: NewsItem) => {
    console.log('[AdminNews] User tapped Modifier news:', item.id);
    setEditingId(item.id);
    setFormTitle(item.title || '');
    setFormContent(item.content || '');
    setFormImageUrl(item.imageUrl || '');
    setShowForm(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCancel = () => {
    console.log('[AdminNews] User tapped Annuler form');
    setShowForm(false);
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormImageUrl('');
  };

  const handleSubmit = async () => {
    console.log('[AdminNews] User tapped submit form, editing:', editingId ?? 'new');

    if (!formTitle.trim() || !formContent.trim()) {
      showModal('Erreur', 'Le titre et le contenu sont obligatoires.', 'error');
      return;
    }

    setSubmitting(true);

    const payload: Record<string, string> = {
      title: formTitle.trim(),
      content: formContent.trim(),
      publishedAt: new Date().toISOString(),
      ...(formImageUrl.trim() ? { imageUrl: formImageUrl.trim() } : {}),
    };

    console.log('[AdminNews] Submitting payload:', JSON.stringify(payload));

    try {
      const headers = await getAdminHeaders();
      if (editingId) {
        console.log('[AdminNews] PUT /api/admin/news/' + editingId);
        const res = await fetch(`${BACKEND_URL}/api/admin/news/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
        }
        console.log('[AdminNews] News updated successfully');
      } else {
        console.log('[AdminNews] POST /api/admin/news');
        const res = await fetch(`${BACKEND_URL}/api/admin/news`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
        }
        console.log('[AdminNews] News created successfully');
      }

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleCancel();
      await loadNews();
      showModal('Succès', editingId ? 'Actualité modifiée avec succès!' : 'Actualité créée avec succès!', 'success');
    } catch (error: any) {
      console.error('[AdminNews] Submit error:', error);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', error.message || "Échec de l'opération.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    console.log('[AdminNews] DELETE /api/admin/news/' + id);
    setDeleteConfirmId(null);

    try {
      const headers = await getAdminHeaders();
      const res = await fetch(`${BACKEND_URL}/api/admin/news/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
      }
      console.log('[AdminNews] Delete successful');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadNews();
      showModal('Succès', 'Actualité supprimée avec succès!', 'success');
    } catch (error: any) {
      console.error('[AdminNews] Delete error:', error);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', error.message || 'Échec de la suppression.', 'error');
    }
  };

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Gestion des Actualités', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: 'bold' } }} />
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
          title: 'Gestion des Actualités',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Actualités</Text>
            <Text style={styles.subtitle}>Créez et gérez les articles d'actualité</Text>
          </View>

          {!showForm && (
            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
              <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Nouvelle Actualité</Text>
            </TouchableOpacity>
          )}

          {showForm && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>
                {editingId ? "Modifier l'actualité" : 'Nouvelle actualité'}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Titre *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Titre de l'actualité"
                  placeholderTextColor={colors.textSecondary}
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contenu *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Contenu de l'actualité"
                  placeholderTextColor={colors.textSecondary}
                  value={formContent}
                  onChangeText={setFormContent}
                  multiline
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>URL de l'image (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://exemple.com/image.jpg"
                  placeholderTextColor={colors.textSecondary}
                  value={formImageUrl}
                  onChangeText={setFormImageUrl}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={submitting}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingId ? 'Modifier' : 'Créer'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {news.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol ios_icon_name="newspaper" android_material_icon_name="article" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>Aucune actualité</Text>
            </View>
          ) : (
            news.map((item) => {
              const dateText = formatDate(item.publishedAt);
              const contentPreview = item.content && item.content.length > 150
                ? item.content.substring(0, 150) + '...'
                : (item.content || '');

              return (
                <View key={item.id} style={styles.newsCard}>
                  <Text style={styles.newsTitle}>{item.title}</Text>
                  <Text style={styles.newsDate}>{dateText}</Text>
                  <Text style={styles.newsContent}>{contentPreview}</Text>
                  <View style={styles.newsActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEdit(item)}
                    >
                      <Text style={[styles.actionButtonText, styles.editButtonText]}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => {
                        console.log('[AdminNews] User tapped Supprimer news:', item.id);
                        setDeleteConfirmId(item.id);
                      }}
                    >
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={deleteConfirmId !== null}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette actualité?"
        type="confirm"
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        confirmText="Supprimer"
        cancelText="Annuler"
      />

      <Modal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  addButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  newsCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  newsTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 },
  newsContent: { fontSize: 14, color: colors.textSecondary, marginBottom: 12, lineHeight: 20 },
  newsDate: { fontSize: 12, color: colors.textSecondary, marginBottom: 12 },
  newsActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  editButton: { backgroundColor: colors.primary + '20' },
  deleteButton: { backgroundColor: '#DC354520' },
  actionButtonText: { fontSize: 14, fontWeight: '600' },
  editButtonText: { color: colors.primary },
  deleteButtonText: { color: '#DC3545' },
  formContainer: { backgroundColor: colors.card, borderRadius: 12, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 16, color: colors.text },
  textArea: { height: 120, textAlignVertical: 'top' },
  formButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, backgroundColor: colors.border, borderRadius: 8, padding: 14, alignItems: 'center' },
  cancelButtonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  submitButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 16, color: colors.textSecondary, marginTop: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
