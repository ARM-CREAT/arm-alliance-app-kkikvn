
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
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { BACKEND_URL } from '@/utils/api';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  newsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  newsContent: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  newsDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  newsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.primary + '20',
  },
  deleteButton: {
    backgroundColor: '#DC354520',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButtonText: {
    color: colors.primary,
  },
  deleteButtonText: {
    color: '#DC3545',
  },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  publishedAt: string;
}

export default function AdminNewsScreen() {
  const router = useRouter();
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
    console.log('Admin News - Loading news');
    try {
      const response = await fetch(`${BACKEND_URL}/api/news`);
      if (!response.ok) {
        throw new Error('Failed to load news');
      }
      const data = await response.json();
      console.log('Admin News - Loaded news:', data.length);
      setNews(data);
    } catch (error: any) {
      console.error('Admin News - Load error:', error);
      showModal('Erreur', 'Impossible de charger les actualités.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuthAndLoad = useCallback(async () => {
    console.log('Admin News - Checking authentication');
    try {
      const adminPassword = await AsyncStorage.getItem('admin_password');
      if (!adminPassword) {
        console.log('Admin News - No admin password found, redirecting to login');
        router.replace('/admin/login');
        return;
      }
      await loadNews();
    } catch (error) {
      console.error('Admin News - Auth check error:', error);
      router.replace('/admin/login');
    }
  }, [router, loadNews]);

  useEffect(() => {
    checkAuthAndLoad();
  }, [checkAuthAndLoad]);

  const onRefresh = async () => {
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
    console.log('Admin News - Opening add form');
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormImageUrl('');
    setShowForm(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEdit = (item: NewsItem) => {
    console.log('Admin News - Editing news:', item.id);
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormImageUrl(item.imageUrl || '');
    setShowForm(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCancel = () => {
    console.log('Admin News - Canceling form');
    setShowForm(false);
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormImageUrl('');
  };

  const handleSubmit = async () => {
    console.log('Admin News - Submitting form');
    
    if (!formTitle.trim() || !formContent.trim()) {
      showModal('Erreur', 'Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const adminPassword = await AsyncStorage.getItem('admin_password');
      if (!adminPassword) {
        throw new Error('Not authenticated');
      }

      const url = editingId
        ? `${BACKEND_URL}/api/admin/news/${editingId}`
        : `${BACKEND_URL}/api/admin/news`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({
          title: formTitle.trim(),
          content: formContent.trim(),
          imageUrl: formImageUrl.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Operation failed');
      }

      console.log('Admin News - Operation successful');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showModal('Succès', editingId ? 'Actualité modifiée avec succès!' : 'Actualité créée avec succès!', 'success');
      
      handleCancel();
      await loadNews();
    } catch (error: any) {
      console.error('Admin News - Submit error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', error.message || 'Échec de l\'opération.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    console.log('Admin News - Deleting news:', id);
    setDeleteConfirmId(null);

    try {
      const adminPassword = await AsyncStorage.getItem('admin_password');
      if (!adminPassword) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${BACKEND_URL}/api/admin/news/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': adminPassword,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Delete failed');
      }

      console.log('Admin News - Delete successful');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showModal('Succès', 'Actualité supprimée avec succès!', 'success');
      await loadNews();
    } catch (error: any) {
      console.error('Admin News - Delete error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', error.message || 'Échec de la suppression.', 'error');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    return formatted;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Gestion des Actualités',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Actualités</Text>
            <Text style={styles.subtitle}>
              Créez et gérez les articles d'actualité
            </Text>
          </View>

          {!showForm && (
            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.addButtonText}>Nouvelle Actualité</Text>
            </TouchableOpacity>
          )}

          {showForm && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>
                {editingId ? 'Modifier l\'actualité' : 'Nouvelle actualité'}
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
                  placeholder="https://..."
                  placeholderTextColor={colors.textSecondary}
                  value={formImageUrl}
                  onChangeText={setFormImageUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
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
              <IconSymbol
                ios_icon_name="article"
                android_material_icon_name="article"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>
                Aucune actualité
              </Text>
            </View>
          ) : (
            news.map((item) => {
              const dateText = formatDate(item.publishedAt);
              const contentPreview = item.content.length > 150
                ? item.content.substring(0, 150) + '...'
                : item.content;

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
                      <Text style={[styles.actionButtonText, styles.editButtonText]}>
                        Modifier
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => setDeleteConfirmId(item.id)}
                    >
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                        Supprimer
                      </Text>
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
