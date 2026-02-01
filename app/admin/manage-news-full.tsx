
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
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedApiCall } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';
import * as Haptics from 'expo-haptics';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  publishedAt: string;
}

export default function ManageNewsFullScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    videoUrl: '',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error' | 'confirm',
    onConfirm: () => {},
  });

  const showModal = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm' = 'info',
    onConfirm?: () => void
  ) => {
    setModalConfig({ title, message, type, onConfirm: onConfirm || (() => {}) });
    setModalVisible(true);
  };

  const loadNews = useCallback(async () => {
    console.log('[ManageNews] Loading news articles');
    setIsLoading(true);

    try {
      const { data, error } = await authenticatedApiCall<NewsArticle[]>('/api/news', {
        method: 'GET',
      });

      if (data) {
        setNews(data);
      } else {
        console.error('[ManageNews] Error loading news:', error);
        showModal('Erreur', error || 'Impossible de charger les actualités', 'error');
      }
    } catch (error) {
      console.error('[ManageNews] Error:', error);
      showModal('Erreur', 'Une erreur est survenue', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
      return;
    }
    if (user) {
      loadNews();
    }
  }, [user, authLoading, router, loadNews]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingNews(null);
    setFormData({ title: '', content: '', imageUrl: '', videoUrl: '' });
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingNews(article);
    setIsCreating(false);
    setFormData({
      title: article.title,
      content: article.content,
      imageUrl: article.imageUrl || '',
      videoUrl: article.videoUrl || '',
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showModal('Erreur', 'Le titre et le contenu sont requis', 'error');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      if (isCreating) {
        // Create new article
        const { data, error } = await authenticatedApiCall<NewsArticle>('/api/news', {
          method: 'POST',
          body: JSON.stringify(formData),
        });

        if (data) {
          showModal('Succès', 'Article créé avec succès', 'success');
          setIsCreating(false);
          setFormData({ title: '', content: '', imageUrl: '', videoUrl: '' });
          await loadNews();
        } else {
          showModal('Erreur', error || 'Impossible de créer l\'article', 'error');
        }
      } else if (editingNews) {
        // Update existing article
        const { data, error } = await authenticatedApiCall<NewsArticle>(
          `/api/news/${editingNews.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(formData),
          }
        );

        if (data) {
          showModal('Succès', 'Article mis à jour avec succès', 'success');
          setEditingNews(null);
          setFormData({ title: '', content: '', imageUrl: '', videoUrl: '' });
          await loadNews();
        } else {
          showModal('Erreur', error || 'Impossible de mettre à jour l\'article', 'error');
        }
      }
    } catch (error) {
      console.error('[ManageNews] Save error:', error);
      showModal('Erreur', 'Une erreur est survenue', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (article: NewsArticle) => {
    showModal(
      'Confirmer la suppression',
      `Voulez-vous vraiment supprimer "${article.title}" ?`,
      'confirm',
      async () => {
        setModalVisible(false);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setIsLoading(true);

        try {
          const { error } = await authenticatedApiCall(`/api/news/${article.id}`, {
            method: 'DELETE',
          });

          if (!error) {
            showModal('Succès', 'Article supprimé avec succès', 'success');
            await loadNews();
          } else {
            showModal('Erreur', error || 'Impossible de supprimer l\'article', 'error');
          }
        } catch (error) {
          console.error('[ManageNews] Delete error:', error);
          showModal('Erreur', 'Une erreur est survenue', 'error');
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingNews(null);
    setFormData({ title: '', content: '', imageUrl: '', videoUrl: '' });
  };

  if (authLoading) {
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
          title: 'Gérer les actualités',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Modal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalVisible(false)}
        onConfirm={modalConfig.onConfirm}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {(isCreating || editingNews) ? (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {isCreating ? 'Créer un article' : 'Modifier l\'article'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Titre *"
              placeholderTextColor={colors.textSecondary}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Contenu *"
              placeholderTextColor={colors.textSecondary}
              value={formData.content}
              onChangeText={(text) => setFormData({ ...formData, content: text })}
              multiline
              numberOfLines={6}
            />

            <TextInput
              style={styles.input}
              placeholder="URL de l'image (optionnel)"
              placeholderTextColor={colors.textSecondary}
              value={formData.imageUrl}
              onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="URL de la vidéo (optionnel)"
              placeholderTextColor={colors.textSecondary}
              value={formData.videoUrl}
              onChangeText={(text) => setFormData({ ...formData, videoUrl: text })}
            />

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add-circle"
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.createButtonText}>Créer un article</Text>
            </TouchableOpacity>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : news.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol
                  ios_icon_name="newspaper"
                  android_material_icon_name="article"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>Aucun article</Text>
              </View>
            ) : (
              <View style={styles.newsList}>
                {news.map((article) => (
                  <View key={article.id} style={styles.newsCard}>
                    <Text style={styles.newsTitle}>{article.title}</Text>
                    <Text style={styles.newsContent} numberOfLines={3}>
                      {article.content}
                    </Text>
                    <View style={styles.newsActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit(article)}
                      >
                        <IconSymbol
                          ios_icon_name="pencil"
                          android_material_icon_name="edit"
                          size={20}
                          color={colors.primary}
                        />
                        <Text style={styles.editButtonText}>Modifier</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(article)}
                      >
                        <IconSymbol
                          ios_icon_name="trash"
                          android_material_icon_name="delete"
                          size={20}
                          color={colors.danger}
                        />
                        <Text style={styles.deleteButtonText}>Supprimer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  newsList: {
    gap: 16,
  },
  newsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  newsContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  newsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
});
