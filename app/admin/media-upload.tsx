
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Modal } from '@/components/ui/Modal';
import { adminApiCall } from '@/utils/api';

export default function MediaUploadScreen() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handlePickImage = async () => {
    console.log('[MediaUpload] User tapped Pick Image');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showModal(
          'Permission Requise',
          'Veuillez autoriser l\'accès à la galerie pour sélectionner des photos.',
          'warning'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedMedia(result.assets[0]);
        console.log('[MediaUpload] Image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('[MediaUpload] Error picking image:', error);
      showModal('Erreur', 'Impossible de sélectionner l\'image', 'error');
    }
  };

  const handlePickVideo = async () => {
    console.log('[MediaUpload] User tapped Pick Video');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showModal(
          'Permission Requise',
          'Veuillez autoriser l\'accès à la galerie pour sélectionner des vidéos.',
          'warning'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedMedia(result.assets[0]);
        console.log('[MediaUpload] Video selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('[MediaUpload] Error picking video:', error);
      showModal('Erreur', 'Impossible de sélectionner la vidéo', 'error');
    }
  };

  const handlePickDocument = async () => {
    console.log('[MediaUpload] User tapped Pick Document');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedMedia(result.assets[0]);
        console.log('[MediaUpload] Document selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('[MediaUpload] Error picking document:', error);
      showModal('Erreur', 'Impossible de sélectionner le document', 'error');
    }
  };

  const handleUpload = async () => {
    if (!selectedMedia) {
      showModal('Erreur', 'Veuillez sélectionner un fichier à télécharger', 'warning');
      return;
    }

    console.log('[MediaUpload] User tapped Upload');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      
      const file: any = {
        uri: selectedMedia.uri,
        type: selectedMedia.mimeType || 'application/octet-stream',
        name: selectedMedia.fileName || selectedMedia.uri.split('/').pop() || 'file',
      };
      
      formData.append('file', file);

      // Upload to backend
      const response = await adminApiCall('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[MediaUpload] Upload successful:', response);
      
      showModal(
        'Succès',
        'Le fichier a été téléchargé avec succès !',
        'success'
      );
      
      setSelectedMedia(null);
    } catch (error: any) {
      console.error('[MediaUpload] Upload error:', error);
      showModal(
        'Erreur',
        error?.message || 'Impossible de télécharger le fichier. Veuillez réessayer.',
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    console.log('[MediaUpload] User cleared selection');
    setSelectedMedia(null);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Télécharger des Médias',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="photo.fill"
            android_material_icon_name="photo-library"
            size={64}
            color={colors.primary}
          />
          <Text style={styles.title}>Gestion des Médias</Text>
          <Text style={styles.subtitle}>
            Photos, Vidéos et Documents
          </Text>
        </View>

        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Téléchargez des médias pour les utiliser dans les actualités, événements et autres contenus du parti.
          </Text>
        </View>

        {/* Selection Buttons */}
        <View style={styles.selectionSection}>
          <Text style={styles.sectionTitle}>Sélectionner un fichier</Text>
          
          <TouchableOpacity
            style={styles.selectionButton}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="photo.circle.fill"
              android_material_icon_name="image"
              size={32}
              color={colors.success}
            />
            <View style={styles.selectionContent}>
              <Text style={styles.selectionTitle}>Photos</Text>
              <Text style={styles.selectionDescription}>
                JPG, PNG, GIF
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectionButton}
            onPress={handlePickVideo}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="video.circle.fill"
              android_material_icon_name="videocam"
              size={32}
              color={colors.warning}
            />
            <View style={styles.selectionContent}>
              <Text style={styles.selectionTitle}>Vidéos</Text>
              <Text style={styles.selectionDescription}>
                MP4, MOV, AVI
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectionButton}
            onPress={handlePickDocument}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="doc.circle.fill"
              android_material_icon_name="description"
              size={32}
              color={colors.primary}
            />
            <View style={styles.selectionContent}>
              <Text style={styles.selectionTitle}>Documents</Text>
              <Text style={styles.selectionDescription}>
                PDF, DOC, DOCX
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Selected Media Preview */}
        {selectedMedia && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Fichier sélectionné</Text>
            
            <View style={styles.previewCard}>
              {selectedMedia.type?.startsWith('image') && (
                <Image
                  source={{ uri: selectedMedia.uri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              )}
              
              <View style={styles.previewInfo}>
                <Text style={styles.previewName} numberOfLines={2}>
                  {selectedMedia.fileName || selectedMedia.uri.split('/').pop()}
                </Text>
                <Text style={styles.previewSize}>
                  {selectedMedia.fileSize ? `${(selectedMedia.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Taille inconnue'}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={28}
                  color={colors.error}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUpload}
              disabled={uploading}
              activeOpacity={0.8}
            >
              {uploading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="arrow.up.circle.fill"
                    android_material_icon_name="cloud-upload"
                    size={24}
                    color={colors.background}
                  />
                  <Text style={styles.uploadButtonText}>Télécharger</Text>
                </>
              )}
            </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginLeft: 12,
  },
  selectionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  selectionContent: {
    flex: 1,
    marginLeft: 16,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  selectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  previewSection: {
    marginTop: 24,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  previewInfo: {
    flex: 1,
    marginLeft: 16,
  },
  previewName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  previewSize: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  clearButton: {
    padding: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.background,
    marginLeft: 12,
  },
});
