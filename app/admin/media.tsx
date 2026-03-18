
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { BACKEND_URL } from '@/utils/api';

interface MediaFile {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  key: string;
}

export default function AdminMediaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm' = 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const loadMedia = useCallback(async () => {
    console.log('[AdminMedia] GET /api/media');
    try {
      const adminPassword = await AsyncStorage.getItem('admin_password') || '';
      const response = await fetch(`${BACKEND_URL}/api/media`, {
        headers: { 'x-admin-password': adminPassword },
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errText}`);
      }
      const data = await response.json();
      console.log('[AdminMedia] Loaded media files:', Array.isArray(data) ? data.length : 0);
      setMediaFiles(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('[AdminMedia] Load error:', error);
      showModal('Erreur', 'Impossible de charger les médias.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuthAndLoad = useCallback(async () => {
    console.log('[AdminMedia] Checking authentication');
    try {
      const adminPassword = await AsyncStorage.getItem('admin_password');
      if (!adminPassword) {
        console.log('[AdminMedia] No admin password found, redirecting to login');
        router.replace('/admin/login');
        return;
      }
      await loadMedia();
    } catch (error) {
      console.error('[AdminMedia] Auth check error:', error);
      router.replace('/admin/login');
    }
  }, [router, loadMedia]);

  useEffect(() => {
    checkAuthAndLoad();
  }, [checkAuthAndLoad]);

  const onRefresh = async () => {
    console.log('[AdminMedia] Pull-to-refresh triggered');
    setRefreshing(true);
    await loadMedia();
    setRefreshing(false);
  };

  const uploadFile = async (uri: string, fileName: string, mimeType: string) => {
    console.log('[AdminMedia] Uploading file:', fileName, 'type:', mimeType);
    setUploading(true);

    try {
      const adminPassword = await AsyncStorage.getItem('admin_password');
      if (!adminPassword) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: mimeType,
      } as any);

      console.log('[AdminMedia] POST /api/admin/media/upload');
      const response = await fetch(`${BACKEND_URL}/api/admin/media/upload`, {
        method: 'POST',
        headers: {
          'x-admin-password': adminPassword,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed');
      }

      const result = await response.json();
      console.log('[AdminMedia] Upload successful:', result);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showModal('Succès', 'Fichier téléchargé avec succès!', 'success');
      await loadMedia();
    } catch (error: any) {
      console.error('[AdminMedia] Upload error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', error.message || 'Échec du téléchargement.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handlePickImage = async () => {
    console.log('[AdminMedia] User tapped Photo/Vidéo upload button');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showModal('Permission requise', "Permission d'accès à la galerie requise.", 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileName = asset.uri.split('/').pop() || 'image.jpg';
      const mimeType = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';
      await uploadFile(asset.uri, fileName, mimeType);
    }
  };

  const handlePickDocument = async () => {
    console.log('[AdminMedia] User tapped Document upload button');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadFile(asset.uri, asset.name, asset.mimeType || 'application/octet-stream');
      }
    } catch (error: any) {
      console.error('[AdminMedia] Document picker error:', error);
      showModal('Erreur', 'Erreur lors de la sélection du document.', 'error');
    }
  };

  const handleCopyUrl = async (mediaId: string) => {
    console.log('[AdminMedia] User tapped Copier URL for media:', mediaId);
    const url = `${BACKEND_URL}/api/media/${mediaId}/download`;
    try {
      await Clipboard.setStringAsync(url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showModal('Copié', 'URL copiée dans le presse-papiers!', 'success');
    } catch (err) {
      console.error('[AdminMedia] Clipboard error:', err);
      showModal('Erreur', "Impossible de copier l'URL.", 'error');
    }
  };

  const handleDelete = (mediaId: string, fileName: string) => {
    console.log('[AdminMedia] User tapped Supprimer for media:', mediaId, fileName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Supprimer le fichier',
      `Êtes-vous sûr de vouloir supprimer "${fileName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('[AdminMedia] DELETE /api/admin/media/' + mediaId);
            try {
              const adminPassword = await AsyncStorage.getItem('admin_password') || '';
              const response = await fetch(`${BACKEND_URL}/api/admin/media/${mediaId}`, {
                method: 'DELETE',
                headers: { 'x-admin-password': adminPassword },
              });
              if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Erreur ${response.status}: ${errText}`);
              }
              console.log('[AdminMedia] Media deleted successfully:', mediaId);
              setMediaFiles(prev => prev.filter(m => m.id !== mediaId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              console.error('[AdminMedia] Delete error:', error);
              showModal('Erreur', error.message || 'Impossible de supprimer le fichier.', 'error');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
      const sizeKB = (bytes / 1024).toFixed(1);
      return `${sizeKB} KB`;
    }
    const sizeMB = (bytes / (1024 * 1024)).toFixed(1);
    return `${sizeMB} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Gestion des Médias', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: 'bold' } }} />
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
          title: 'Gestion des Médias',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Médias</Text>
          <Text style={styles.subtitle}>Téléchargez et gérez vos photos, vidéos et documents</Text>
        </View>

        <View style={styles.uploadSection}>
          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <IconSymbol ios_icon_name="photo" android_material_icon_name="photo" size={20} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Photo/Vidéo</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <IconSymbol ios_icon_name="document" android_material_icon_name="description" size={20} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Document</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {mediaFiles.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol ios_icon_name="photo" android_material_icon_name="photo" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>Aucun média téléchargé</Text>
          </View>
        ) : (
          <View style={styles.mediaGrid}>
            {mediaFiles.map((media) => {
              const isImage = media.mimeType.startsWith('image/');
              const fileSize = formatFileSize(media.size);
              const uploadDate = formatDate(media.uploadedAt);
              const detailsText = `${media.mimeType} • ${fileSize} • ${uploadDate}`;
              const downloadUrl = `${BACKEND_URL}/api/media/${media.id}/download`;

              return (
                <View key={media.id} style={styles.mediaCard}>
                  {isImage && (
                    <Image
                      source={{ uri: downloadUrl }}
                      style={styles.mediaPreview}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.mediaInfo}>
                    <Text style={styles.mediaName}>{media.fileName}</Text>
                    <Text style={styles.mediaDetails}>{detailsText}</Text>
                  </View>
                  <View style={styles.mediaActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.copyButton]}
                      onPress={() => handleCopyUrl(media.id)}
                    >
                      <Text style={[styles.actionButtonText, styles.copyButtonText]}>Copier URL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(media.id, media.fileName)}
                    >
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  uploadSection: { marginBottom: 24 },
  uploadButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  uploadButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  uploadButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  mediaGrid: { gap: 16 },
  mediaCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  mediaPreview: { width: '100%', height: 200, borderRadius: 8, backgroundColor: colors.border, marginBottom: 12 },
  mediaInfo: { marginBottom: 12 },
  mediaName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  mediaDetails: { fontSize: 12, color: colors.textSecondary },
  mediaActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  copyButton: { backgroundColor: colors.primary + '20' },
  deleteButton: { backgroundColor: '#DC354520' },
  actionButtonText: { fontSize: 14, fontWeight: '600' },
  copyButtonText: { color: colors.primary },
  deleteButtonText: { color: '#DC3545' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 16, color: colors.textSecondary, marginTop: 16 },
});
