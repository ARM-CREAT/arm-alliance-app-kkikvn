
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal } from '@/components/ui/Modal';

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
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<NewsArticle | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    videoUrl: '',
  });

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const checkAdminAuth = useCallback(async () => {
    console.log('[ManageNews] Checking admin authentication');
    try {
      const password = await AsyncStorage.getItem('admin_password');
      const secretCode = await AsyncStorage.getItem('admin_secret_code');
      
      const webPassword = Platform.OS === 'web' ? localStorage.getItem('admin_password') : null;
      const webSecretCode = Platform.OS === 'web' ? localStorage.getItem('admin_secret_code') : null;
      
      const hasCredentials = (password && secretCode) || (webPassword && webSecretCode);
      
      if (hasCredentials) {
        console.log('[ManageNews] Admin credentials found');
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('[ManageNews] No admin credentials, redirecting to login');
        router.replace('/admin/login');
        return false;
      }
    } catch (error) {
      console.error('[ManageNews] Error checking admin auth:', error);
      router.replace('/admin/login');
      return false;
    }
  }, [router]);

  const loadNews = useCallback(async () => {
    console.log('[ManageNews] Loading news articles');
    try {
      const response = await adminGet<NewsArticle[]>('/api/news');
      setNews(response || []);
      console.log('[ManageNews] Loaded', response?.length || 0, 'articles');
    } catch (error) {
      console.error('[ManageNews] Error loading news:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initScreen = async () => {
      const authenticated = await checkAdminAuth();
      if (authenticated) {
        loadNews();
      }
    };
    
    initScreen();
  }, [checkAdminAuth, loadNews]);

  const onRefresh = useCallback(() => {
    console.log('[ManageNews] Refreshing news');
    setRefreshing(true);
    loadNews();
  }, [loadNews]);

  const handleCreate = () => {
    console.log('[ManageNews] Creating new article');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEditing(true);
    setCurrentArticle(null);
    setFormData({ title: '', content: '', imageUrl: '', videoUrl: '' });
  };

  const handleEdit = (article: NewsArticle) => {
    console.log('[ManageNews] Editing article:', article.id);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditing(true);
    setCurrentArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      imageUrl: article.imageUrl || '',
      videoUrl: article.videoUrl || '',
    });
  };

  const handleSave = async () => {
    console.log('[ManageNews] Saving article');
    
    if (!formData.title.trim() || !formData.content.trim()) {
      showModal('Erreur', 'Le titre et le contenu sont obligatoires', 'error');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      if (currentArticle) {
        await adminPut(`/api/admin/news/${currentArticle.id}`, {
          title: formData.title,
          content: formData.content,
          imageUrl: formData.imageUrl || undefined,
          videoUrl: formData.videoUrl || undefined,
        });
      } else {
        await adminPost('/api/admin/news', {
          title: formData.title,
          content: formData.content,
          imageUrl: formData.imageUrl || undefined,
          videoUrl: formData.videoUrl || undefined,
        });
      }

      showModal('Succès', 'Article enregistré avec succès', 'success');
      setEditing(false);
      loadNews();
    } catch (error: any) {
      console.error('[ManageNews] Error saving article:', error);
      showModal('Erreur', error?.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (article: NewsArticle) => {
    console.log('[ManageNews] Deleting article:', article.id);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    setLoading(true);

    try {
      await adminDelete(`/api/admin/news/${article.id}`);
      showModal('Succès', 'Article supprimé avec succès', 'success');
      loadNews();
    } catch (error: any) {
      console.error('[ManageNews] Error deleting article:', error);
      showModal('Erreur', error?.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('[ManageNews] Canceling edit');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditing(false);
    setCurrentArticle(null);
    setFormData({ title: '', content: '', imageUrl: '', videoUrl: '' });
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
            title: currentArticle ? 'Modifier l\'Article' : 'Nouvel Article',
            headerShown: true,
            headerBackTitle: 'Retour',
          }}
        />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Titre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Titre de l'article"
                placeholderTextColor={colors.textSecondary}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contenu *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Contenu de l'article"
                placeholderTextColor={colors.textSecondary}
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>URL de l&apos;image (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                value={formData.imageUrl}
                onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>URL de la vidéo (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                value={formData.videoUrl}
                onChangeText={(text) => setFormData({ ...formData, videoUrl: text })}
                autoCapitalize="none"
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
          title: 'Gérer les Actualités',
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
            <Text style={styles.createButtonText}>Nouvel Article</Text>
          </TouchableOpacity>
        </View>

        {news.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="newspaper"
              android_material_icon_name="article"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>Aucun article</Text>
            <Text style={styles.emptyStateSubtext}>Créez votre premier article</Text>
          </View>
        ) : (
          <View style={styles.newsList}>
            {news.map((article) => (
              <View key={article.id} style={styles.newsItem}>
                <View style={styles.newsItemHeader}>
                  <Text style={styles.newsItemTitle}>{article.title}</Text>
                  <Text style={styles.newsItemDate}>
                    {new Date(article.publishedAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <Text style={styles.newsItemContent} numberOfLines={3}>
                  {article.content}
                </Text>
                <View style={styles.newsItemActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(article)}
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
                    onPress={() => handleDelete(article)}
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
  newsList: {
    paddingHorizontal: 20,
  },
  newsItem: {
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
  newsItemHeader: {
    marginBottom: 8,
  },
  newsItemTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  newsItemDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  newsItemContent: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  newsItemActions: {
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
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
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
