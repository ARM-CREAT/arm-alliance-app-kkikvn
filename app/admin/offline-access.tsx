
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#D1ECF1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BEE5EB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C5460',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0C5460',
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    padding: 8,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    marginRight: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  codeBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeText: {
    fontSize: 14,
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
});

const OFFLINE_PASSWORD_KEY = 'admin_offline_password';
const OFFLINE_ACCESS_ENABLED_KEY = 'admin_offline_access_enabled';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

export default function OfflineAccessScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [offlineAccessEnabled, setOfflineAccessEnabled] = useState(false);
  const [savedPassword, setSavedPassword] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');

  useEffect(() => {
    loadOfflineStatus();
  }, []);

  const loadOfflineStatus = async () => {
    console.log('Offline Access - Loading offline status');
    try {
      const enabled = await AsyncStorage.getItem(OFFLINE_ACCESS_ENABLED_KEY);
      const saved = await AsyncStorage.getItem(OFFLINE_PASSWORD_KEY);
      
      const isEnabled = enabled === 'true';
      setOfflineAccessEnabled(isEnabled);
      setSavedPassword(saved);
      
      console.log('Offline Access - Status loaded:', { enabled: isEnabled, hasSavedPassword: !!saved });
    } catch (error) {
      console.error('Offline Access - Failed to load status:', error);
    }
  };

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm' = 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleEnableOfflineAccess = async () => {
    console.log('Offline Access - Enabling offline access');
    
    if (!password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', 'Veuillez entrer le mot de passe administrateur.', 'error');
      return;
    }

    setLoading(true);

    try {
      const trimmedPassword = password.trim();
      
      // Vérifier si c'est le mot de passe par défaut
      const isDefaultPassword = trimmedPassword === DEFAULT_ADMIN_PASSWORD;
      
      // Sauvegarder le mot de passe localement
      await AsyncStorage.setItem(OFFLINE_PASSWORD_KEY, trimmedPassword);
      await AsyncStorage.setItem(OFFLINE_ACCESS_ENABLED_KEY, 'true');
      
      console.log('Offline Access - Offline access enabled successfully');
      
      setOfflineAccessEnabled(true);
      setSavedPassword(trimmedPassword);
      setPassword('');
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const passwordTypeText = isDefaultPassword ? 'par défaut (admin123)' : 'personnalisé';
      showModal(
        'Accès hors ligne activé',
        `L'accès administrateur hors ligne est maintenant activé avec le mot de passe ${passwordTypeText}.\n\nVous pourrez accéder au tableau de bord même si le backend est indisponible.`,
        'success'
      );
    } catch (error: any) {
      console.error('Offline Access - Failed to enable offline access:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', 'Impossible d\'activer l\'accès hors ligne.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableOfflineAccess = async () => {
    console.log('Offline Access - Disabling offline access');
    
    try {
      await AsyncStorage.removeItem(OFFLINE_PASSWORD_KEY);
      await AsyncStorage.removeItem(OFFLINE_ACCESS_ENABLED_KEY);
      
      setOfflineAccessEnabled(false);
      setSavedPassword(null);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showModal('Accès hors ligne désactivé', 'L\'accès administrateur hors ligne a été désactivé.', 'info');
    } catch (error) {
      console.error('Offline Access - Failed to disable offline access:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', 'Impossible de désactiver l\'accès hors ligne.', 'error');
    }
  };

  const handleAccessDashboard = () => {
    console.log('Offline Access - Accessing dashboard in offline mode');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/admin/dashboard');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const passwordLengthText = savedPassword ? `${savedPassword.length} caractères` : 'N/A';
  const isDefaultPasswordText = savedPassword === DEFAULT_ADMIN_PASSWORD ? 'Oui (admin123)' : 'Non (personnalisé)';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Accès Hors Ligne',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#FFFFFF',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Mode Hors Ligne</Text>
          <Text style={styles.subtitle}>
            Accédez au tableau de bord administrateur même si le backend est indisponible
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 À propos du mode hors ligne</Text>
          <Text style={styles.infoText}>
            Le mode hors ligne vous permet d'accéder au tableau de bord administrateur même si:
            {'\n'}• Le backend est temporairement arrêté
            {'\n'}• L'abonnement est momentanément suspendu
            {'\n'}• La connexion internet est instable
            {'\n\n'}
            Activez ce mode en entrant votre mot de passe administrateur. Il sera sauvegardé localement de manière sécurisée.
          </Text>
        </View>

        {offlineAccessEnabled ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ Accès hors ligne activé</Text>
              
              <View style={styles.statusRow}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={24}
                  color="#28A745"
                  style={styles.statusIcon}
                />
                <Text style={styles.statusText}>
                  Mot de passe sauvegardé localement
                </Text>
              </View>

              <View style={styles.statusRow}>
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={24}
                  color={colors.primary}
                  style={styles.statusIcon}
                />
                <Text style={styles.statusText}>
                  Longueur: {passwordLengthText}
                </Text>
              </View>

              <View style={styles.statusRow}>
                <IconSymbol
                  ios_icon_name="key.fill"
                  android_material_icon_name="vpn-key"
                  size={24}
                  color={colors.primary}
                  style={styles.statusIcon}
                />
                <Text style={styles.statusText}>
                  Mot de passe par défaut: {isDefaultPasswordText}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleAccessDashboard}
            >
              <Text style={styles.buttonText}>Accéder au tableau de bord</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleDisableOfflineAccess}
            >
              <Text style={styles.secondaryButtonText}>Désactiver l'accès hors ligne</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>⚠️ Configuration requise</Text>
              <Text style={styles.warningText}>
                Pour activer l'accès hors ligne, entrez votre mot de passe administrateur ci-dessous.
                {'\n\n'}
                Si vous utilisez le mot de passe par défaut, entrez: admin123
                {'\n\n'}
                Si vous avez configuré un mot de passe personnalisé via la variable d'environnement ADMIN_PASSWORD, utilisez ce mot de passe.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔐 Activer l'accès hors ligne</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mot de passe administrateur</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Entrez le mot de passe"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleEnableOfflineAccess}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={togglePasswordVisibility}
                  >
                    <IconSymbol
                      ios_icon_name={showPassword ? 'eye.slash' : 'eye'}
                      android_material_icon_name={showPassword ? 'visibility-off' : 'visibility'}
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, (loading || !password.trim()) && styles.buttonDisabled]}
                onPress={handleEnableOfflineAccess}
                disabled={loading || !password.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Activer l'accès hors ligne</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Mot de passe par défaut</Text>
              <Text style={styles.sectionText}>
                Si vous n'avez pas configuré de mot de passe personnalisé, utilisez le mot de passe par défaut:
              </Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>admin123</Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🔒 Sécurité</Text>
          <Text style={styles.infoText}>
            Le mot de passe est stocké localement sur votre appareil de manière sécurisée via AsyncStorage.
            {'\n\n'}
            Seul vous avez accès à ce mot de passe. Il n'est jamais transmis à des serveurs tiers.
          </Text>
        </View>
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
