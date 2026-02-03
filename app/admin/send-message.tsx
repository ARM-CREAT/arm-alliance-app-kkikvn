
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useCallback } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import { adminPost } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export default function SendMessageScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRole: '',
    targetRegion: '',
    targetCercle: '',
    targetCommune: '',
  });

  const checkAdminAuth = useCallback(async () => {
    console.log('[SendMessage] Checking admin authentication');
    try {
      const password = await AsyncStorage.getItem('admin_password');
      const secretCode = await AsyncStorage.getItem('admin_secret_code');
      
      const webPassword = Platform.OS === 'web' ? localStorage.getItem('admin_password') : null;
      const webSecretCode = Platform.OS === 'web' ? localStorage.getItem('admin_secret_code') : null;
      
      const hasCredentials = (password && secretCode) || (webPassword && webSecretCode);
      
      if (hasCredentials) {
        console.log('[SendMessage] Admin credentials found');
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('[SendMessage] No admin credentials, redirecting to login');
        router.replace('/admin/login');
        return false;
      }
    } catch (error) {
      console.error('[SendMessage] Error checking admin auth:', error);
      router.replace('/admin/login');
      return false;
    }
  }, [router]);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    console.log('[SendMessage] User tapped Send button');
    
    // Validation
    if (!formData.title.trim()) {
      showModal('Erreur', 'Veuillez entrer un titre', 'error');
      return;
    }
    if (!formData.content.trim()) {
      showModal('Erreur', 'Veuillez entrer le contenu du message', 'error');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      console.log('[SendMessage] Sending message:', formData);
      
      await adminPost('/api/admin/messages/send', {
        title: formData.title,
        content: formData.content,
        targetRole: formData.targetRole || undefined,
        targetRegion: formData.targetRegion || undefined,
        targetCercle: formData.targetCercle || undefined,
        targetCommune: formData.targetCommune || undefined,
      });
      
      console.log('[SendMessage] Message sent successfully');
      
      showModal(
        'Message Envoyé',
        'Votre message a été envoyé avec succès aux membres ciblés.',
        'success'
      );
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          title: '',
          content: '',
          targetRole: '',
          targetRegion: '',
          targetCercle: '',
          targetCommune: '',
        });
      }, 2000);
      
    } catch (error: any) {
      console.error('[SendMessage] Error sending message:', error);
      showModal(
        'Erreur',
        error?.message || 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Envoyer Message Interne',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="paperplane.fill"
              android_material_icon_name="send"
              size={48}
              color={colors.primary}
            />
            <Text style={styles.headerTitle}>Message Interne</Text>
            <Text style={styles.headerSubtitle}>
              Envoyer un message aux membres
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Titre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Titre du message"
                placeholderTextColor={colors.textSecondary}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contenu *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Contenu du message"
                placeholderTextColor={colors.textSecondary}
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ciblage (Optionnel)</Text>
              <Text style={styles.sectionSubtitle}>
                Laissez vide pour envoyer à tous les membres
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rôle Cible</Text>
              <TextInput
                style={styles.input}
                placeholder="militant, collecteur, superviseur, administrateur"
                placeholderTextColor={colors.textSecondary}
                value={formData.targetRole}
                onChangeText={(text) => setFormData({ ...formData, targetRole: text })}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Région Cible</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Bamako"
                placeholderTextColor={colors.textSecondary}
                value={formData.targetRegion}
                onChangeText={(text) => setFormData({ ...formData, targetRegion: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cercle Cible</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Commune I"
                placeholderTextColor={colors.textSecondary}
                value={formData.targetCercle}
                onChangeText={(text) => setFormData({ ...formData, targetCercle: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Commune Cible</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Badalabougou"
                placeholderTextColor={colors.textSecondary}
                value={formData.targetCommune}
                onChangeText={(text) => setFormData({ ...formData, targetCommune: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>
                Si aucun ciblage n&apos;est spécifié, le message sera envoyé à tous les membres
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Envoyer</Text>
                  <IconSymbol
                    ios_icon_name="paperplane"
                    android_material_icon_name="send"
                    size={20}
                    color={colors.background}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
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
    paddingTop: 14,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 10,
  },
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.background,
    marginRight: 8,
  },
});
