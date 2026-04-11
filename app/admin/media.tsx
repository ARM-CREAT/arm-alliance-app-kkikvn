
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
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { BACKEND_URL, getBearerToken, apiGet, apiDelete } from '@/utils/api';

const Haptics = {
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
};

interface MediaFile {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  url?: string;
  key?: string;
}

export default function AdminMediaScreen() {
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
      const data = await apiGet('/api/media');
      console.log('[AdminMedia] Loaded media files:', Array.isArray(data) ? data.length : 0);
      setMediaFiles(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('[AdminMedia] Load error:', error);
      showModal('Erreur', 'Impossible de charger les médias: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

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
      const token = await getBearerToken();
      if (!token) {
        throw new Error('Non authentifié. Veuillez vous connecter.');
      }

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: mimeType,
      } as any);

      console.log('[AdminMedia] POST /api/media (multipart/form-data)');
      const response = await fetch(`${BACKEND_URL}/api/media`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type — let fetch set it with the boundary for multipart
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AdminMedia] Upload failed:', response.status, errorText);
        throw new Error(errorText || `Erreur ${response.status}`);
      }

      const result = await response.json();
      console.log('[AdminMedia] Upload successful:', result);

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showModal('Succès', 'Fichier téléchargé avec succès!', 'success');

      await loadMedia();
    } catch (error: any) {
      console.error('[AdminMedia] Upload error:', error);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', error.message || 'Échec du téléchargement.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handlePickImage = async () => {
    console.log('[AdminMedia] User tapped Photo/Vidéo upload button');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showModal('Permission requise', "L'accès à la galerie est nécessaire pour télécharger des photos et vidéos.", 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const uriParts = asset.uri.split('/');
      const rawName = uriParts[uriParts.length - 1] || 'upload.jpg';
      const fileName = rawName;
      const mimeType = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';
      console.log('[AdminMedia] Image/video selected:', fileName, mimeType);
      await uploadFile(asset.uri, fileName, mimeType);
    } else {
      console.log('[AdminMedia] Image/video picker cancelled');
    }
  };

  const handlePickDocument = async () => {
    console.log('[AdminMedia] User tapped Document upload button');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('[AdminMedia] Document selected:', asset.name, asset.mimeType);
        await uploadFile(asset.uri, asset.name, asset.mimeType || 'application/octet-stream');
      } else {
        console.log('[AdminMedia] Document picker cancelled');
      }
    } catch (error: any) {
      console.error('[AdminMedia] Document picker error:', error);
      showModal('Erreur', 'Erreur lors de la sélection du document.', 'error');
    }
  };

  const getMediaUrl = (media: MediaFile): string => {
    if (media.url) return media.url;
    return `${BACKEND_URL}/api/media/${media.id}`;
  };

  const handleCopyUrl = async (media: MediaFile) => {
    console.log('[AdminMedia] User tapped Copier URL for media:', media.id);
    const url = getMediaUrl(media);
    try {
      await Clipboard.setStringAsync(url);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showModal('Copié', 'URL copiée dans le presse-papiers!', 'success');
    } catch (err) {
      console.error('[AdminMedia] Clipboard error:', err);
      showModal('Erreur', "Impossible de copier l'URL.", 'error');
    }
  };

  const handleDelete = (media: MediaFile) => {
    console.log('[AdminMedia] User tapped Supprimer for media:', media.id, media.fileName);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Supprimer le fichier',
      `Êtes-vous sûr de vouloir supprimer "${media.fileName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('[AdminMedia] DELETE /api/media/' + media.id);
            try {
              await apiDelete(`/api/media/${media.id}`);
              console.log('[AdminMedia] Media deleted successfully:', media.id);
              setMediaFiles(prev => prev.filter(m => m.id !== media.id));
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    const numBytes = Number(bytes) || 0;
    if (numBytes < 1024) return `${numBytes} B`;
    if (numBytes < 1024 * 1024) {
      const sizeKB = (numBytes / 1024).toFixed(1);
      return `${sizeKB} KB`;
    }
    const sizeMB = (numBytes / (1024 * 1024)).toFixed(1);
    return `${sizeMB} MB`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString || '';
    }
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
            <TouchableOpacity style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]} onPress={handlePickImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <IconSymbol ios_icon_name="photo" android_material_icon_name="photo" size={20} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Photo/Vidéo</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]} onPress={handlePickDocument} disabled={uploading}>
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
          {uploading && (
            <Text style={styles.uploadingText}>Téléchargement en cours...</Text>
          )}
        </View>

        {mediaFiles.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol ios_icon_name="photo" android_material_icon_name="photo" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>Aucun média téléchargé</Text>
            <Text style={styles.emptyStateSubtext}>Appuyez sur Photo/Vidéo ou Document pour commencer</Text>
          </View>
        ) : (
          <View style={styles.mediaGrid}>
            {mediaFiles.map((media) => {
              const isImage = String(media.mimeType || '').startsWith('image/');
              const isVideo = String(media.mimeType || '').startsWith('video/');
              const fileSize = formatFileSize(media.size);
              const uploadDate = formatDate(media.uploadedAt);
              const mediaUrl = getMediaUrl(media);

              return (
                <View key={media.id} style={styles.mediaCard}>
                  {isImage ? (
                    <Image
                      source={{ uri: mediaUrl }}
                      style={styles.mediaPreview}
                      resizeMode="cover"
                    />
                  ) : isVideo ? (
                    <View style={styles.videoPreview}>
                      <IconSymbol ios_icon_name="play.circle.fill" android_material_icon_name="play-circle-filled" size={48} color="#FFFFFF" />
                      <Text style={styles.videoLabel}>Vidéo</Text>
                    </View>
                  ) : (
                    <View style={styles.docPreview}>
                      <IconSymbol ios_icon_name="document.fill" android_material_icon_name="description" size={40} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.mediaInfo}>
                    <Text style={styles.mediaName} numberOfLines={1}>{media.fileName}</Text>
                    <Text style={styles.mediaDetails}>
                      {String(media.mimeType || 'inconnu')}
                    </Text>
                    <Text style={styles.mediaDetails}>
                      {fileSize}
                    </Text>
                    <Text style={styles.mediaDetails}>
                      {uploadDate}
                    </Text>
                  </View>
                  <View style={styles.mediaActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.copyButton]}
                      onPress={() => handleCopyUrl(media)}
                    >
                      <Text style={[styles.actionButtonText, styles.copyButtonText]}>Copier URL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(media)}
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
  uploadButtons: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  uploadButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  uploadButtonDisabled: { opacity: 0.6 },
  uploadButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  uploadingText: { textAlign: 'center', color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  mediaGrid: { gap: 16 },
  mediaCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  mediaPreview: { width: '100%', height: 200, borderRadius: 8, backgroundColor: colors.border, marginBottom: 12 },
  videoPreview: { width: '100%', height: 120, borderRadius: 8, backgroundColor: '#1a1a2e', marginBottom: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
  videoLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  docPreview: { width: '100%', height: 80, borderRadius: 8, backgroundColor: colors.backgroundAlt, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  mediaInfo: { marginBottom: 12, gap: 2 },
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
  emptyStateText: { fontSize: 16, color: colors.textSecondary, marginTop: 16, fontWeight: '600' },
  emptyStateSubtext: { fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
});
