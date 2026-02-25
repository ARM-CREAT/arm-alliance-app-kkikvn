
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import { apiPost, BACKEND_URL, isBackendConfigured, checkBackendHealth } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 20,
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
    backgroundColor: colors.card,
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
  errorBox: {
    backgroundColor: '#F8D7DA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F5C6CB',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#721C24',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#721C24',
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: '#D4EDDA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C3E6CB',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#155724',
    lineHeight: 20,
  },
  debugBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  diagnosticLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  diagnosticLinkText: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  offlineButton: {
    backgroundColor: '#17A2B8',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  offlineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

const OFFLINE_PASSWORD_KEY = 'admin_offline_password';
const OFFLINE_ACCESS_ENABLED_KEY = 'admin_offline_access_enabled';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const backendConfigured = isBackendConfigured();
  const backendUrlDisplay = BACKEND_URL || 'Non configuré';

  // Activer automatiquement l'accès hors ligne avec le mot de passe par défaut si ce n'est pas déjà fait
  React.useEffect(() => {
    const initializeOfflineAccess = async () => {
      try {
        const offlineEnabled = await AsyncStorage.getItem(OFFLINE_ACCESS_ENABLED_KEY);
        
        if (offlineEnabled !== 'true') {
          console.log('Admin Login - Initializing offline access with default password');
          await AsyncStorage.setItem(OFFLINE_PASSWORD_KEY, 'admin123');
          await AsyncStorage.setItem(OFFLINE_ACCESS_ENABLED_KEY, 'true');
          console.log('Admin Login - Offline access initialized successfully');
        }
      } catch (error) {
        console.error('Admin Login - Failed to initialize offline access:', error);
      }
    };

    initializeOfflineAccess();
  }, []);

  // Vérifier l'état du backend au chargement
  React.useEffect(() => {
    const checkBackend = async () => {
      if (!backendConfigured) {
        setBackendStatus('offline');
        return;
      }

      console.log('Admin Login - Checking backend health...');
      const isHealthy = await checkBackendHealth();
      setBackendStatus(isHealthy ? 'online' : 'offline');
      console.log('Admin Login - Backend status:', isHealthy ? 'online' : 'offline');
    };

    checkBackend();
  }, [backendConfigured]);

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm' = 'info') => {
    console.log('Admin Login - Showing modal:', title, message);
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleOfflineLogin = async () => {
    console.log('Admin Login - Attempting offline login');
    
    if (!password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', 'Veuillez entrer le mot de passe administrateur.', 'error');
      return;
    }

    setLoading(true);

    try {
      const trimmedPassword = password.trim();
      
      const offlineEnabled = await AsyncStorage.getItem(OFFLINE_ACCESS_ENABLED_KEY);
      const savedPassword = await AsyncStorage.getItem(OFFLINE_PASSWORD_KEY);
      
      console.log('Admin Login - Offline access status:', { enabled: offlineEnabled === 'true', hasSavedPassword: !!savedPassword });
      
      if (offlineEnabled === 'true' && savedPassword) {
        if (trimmedPassword === savedPassword) {
          console.log('Admin Login - Offline login successful');
          
          await AsyncStorage.setItem('admin_password', trimmedPassword);
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showModal('Succès', 'Connexion administrateur réussie (mode hors ligne)!', 'success');
          
          setTimeout(() => {
            console.log('Admin Login - Navigating to dashboard');
            router.replace('/admin/dashboard');
          }, 1000);
        } else {
          console.log('Admin Login - Offline login failed: incorrect password');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showModal(
            'Mot de passe incorrect',
            'Le mot de passe ne correspond pas au mot de passe sauvegardé pour l\'accès hors ligne.',
            'error'
          );
        }
      } else {
        console.log('Admin Login - Offline access not enabled');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showModal(
          'Accès hors ligne non activé',
          'L\'accès hors ligne n\'est pas activé. Veuillez d\'abord activer l\'accès hors ligne ou vous connecter en ligne.',
          'warning'
        );
      }
    } catch (error: any) {
      console.error('Admin Login - Offline login error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', 'Une erreur est survenue lors de la connexion hors ligne.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    console.log('Admin Login - Login button pressed');
    console.log('Admin Login - Backend URL:', BACKEND_URL);
    console.log('Admin Login - Backend configured:', backendConfigured);
    console.log('Admin Login - Backend status:', backendStatus);
    
    if (!password.trim()) {
      console.log('Admin Login - Empty password');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', 'Veuillez entrer le mot de passe administrateur.', 'error');
      return;
    }

    const trimmedPassword = password.trim();

    // Si le backend n'est pas disponible, essayer directement le mode hors ligne
    if (!backendConfigured || backendStatus === 'offline') {
      console.log('Admin Login - Backend not available, trying offline login');
      await handleOfflineLogin();
      return;
    }

    setLoading(true);
    console.log('Admin Login - Attempting online login...');

    try {
      console.log('Admin Login - Calling /api/admin/login endpoint');
      
      const response = await apiPost('/api/admin/login', {
        password: trimmedPassword,
      });

      console.log('Admin Login - Login successful:', response);

      await AsyncStorage.setItem('admin_password', trimmedPassword);
      console.log('Admin Login - Password stored in AsyncStorage');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showModal('Succès', 'Connexion administrateur réussie!', 'success');

      setTimeout(() => {
        console.log('Admin Login - Navigating to dashboard');
        router.replace('/admin/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Admin Login - Online login failed:', error);
      console.error('Admin Login - Error message:', error.message);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      const errorMessageText = error.message || '';
      
      // Si c'est une erreur de connexion, essayer automatiquement le mode hors ligne
      if (
        errorMessageText.includes('ne répond pas') ||
        errorMessageText.includes('n\'est pas disponible') ||
        errorMessageText.includes('Failed to fetch') ||
        errorMessageText.includes('Network') ||
        errorMessageText.includes('timeout')
      ) {
        console.log('Admin Login - Backend unavailable, attempting automatic offline login');
        
        try {
          const offlineEnabled = await AsyncStorage.getItem(OFFLINE_ACCESS_ENABLED_KEY);
          const savedPassword = await AsyncStorage.getItem(OFFLINE_PASSWORD_KEY);
          
          if (offlineEnabled === 'true' && savedPassword && trimmedPassword === savedPassword) {
            console.log('Admin Login - Automatic offline login successful');
            await AsyncStorage.setItem('admin_password', trimmedPassword);
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showModal(
              'Connexion réussie (Mode hors ligne)',
              'Le serveur n\'est pas disponible, mais vous êtes connecté en mode hors ligne.',
              'success'
            );
            
            setTimeout(() => {
              console.log('Admin Login - Navigating to dashboard (offline mode)');
              router.replace('/admin/dashboard');
            }, 1500);
            return;
          }
        } catch (offlineError) {
          console.error('Admin Login - Automatic offline login failed:', offlineError);
        }
        
        showModal(
          'Serveur non disponible',
          'Le serveur backend n\'est pas accessible actuellement.\n\n' +
          'Utilisez le bouton "Connexion hors ligne" ci-dessous pour accéder au tableau de bord sans connexion au serveur.\n\n' +
          'Mot de passe par défaut: admin123',
          'warning'
        );
      } else if (
        errorMessageText.includes('401') ||
        errorMessageText.includes('incorrect') ||
        errorMessageText.includes('Password')
      ) {
        showModal(
          'Mot de passe incorrect',
          'Le mot de passe administrateur est incorrect. Veuillez vérifier et réessayer.\n\n' +
          'Si vous avez oublié le mot de passe, utilisez le mode hors ligne avec le mot de passe par défaut: admin123',
          'error'
        );
      } else {
        showModal(
          'Erreur de connexion',
          `Une erreur est survenue: ${errorMessageText}\n\n` +
          'Essayez le mode hors ligne ou contactez l\'administrateur système.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoToDiagnostic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/admin/diagnostic');
  };

  const handleGoToOfflineAccess = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/admin/offline-access');
  };

  const statusText = backendStatus === 'checking' ? 'Vérification...' : backendStatus === 'online' ? '✓ En ligne' : '✗ Hors ligne';
  const statusTextColor = backendStatus === 'checking' ? colors.textSecondary : backendStatus === 'online' ? '#28A745' : '#DC3545';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Connexion Administrateur',
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Espace Administrateur</Text>
            <Text style={styles.subtitle}>
              Gérez le contenu et les fonctionnalités de l'application
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>🔒 Accès Administrateur</Text>
              <Text style={styles.warningText}>
                Espace réservé aux administrateurs du parti A.R.M.{'\n\n'}
                Deux modes de connexion disponibles:{'\n'}
                • En ligne: Connexion au serveur (nécessite internet){'\n'}
                • Hors ligne: Accès local sans serveur
              </Text>
            </View>

            {backendConfigured && backendStatus === 'online' && (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>✓ Serveur disponible</Text>
                <Text style={styles.successText}>
                  Le serveur backend est accessible. Vous pouvez vous connecter en ligne.
                </Text>
              </View>
            )}

            {(!backendConfigured || backendStatus === 'offline') && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>⚠️ Serveur non disponible</Text>
                <Text style={styles.errorText}>
                  Le serveur backend n'est pas accessible. Utilisez le mode hors ligne pour accéder au tableau de bord.{'\n\n'}
                  Mot de passe par défaut: admin123
                </Text>
              </View>
            )}

            {__DEV__ && (
              <View style={styles.debugBox}>
                <Text style={styles.debugTitle}>ℹ️ Informations de diagnostic</Text>
                <Text style={styles.debugText}>
                  Backend: {backendConfigured ? '✓ Configuré' : '✗ Non configuré'}
                  {'\n'}URL: {backendUrlDisplay}
                  {'\n'}Statut: <Text style={{ color: statusTextColor }}>{statusText}</Text>
                  {'\n'}Plateforme: {Platform.OS}
                  {'\n'}Version: {Platform.Version}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe administrateur</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Entrez le mot de passe secret"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
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
              onPress={handleLogin}
              disabled={loading || !password.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {backendStatus === 'online' ? 'Se connecter' : 'Connexion hors ligne'}
                </Text>
              )}
            </TouchableOpacity>

            {backendStatus === 'online' && (
              <TouchableOpacity
                style={styles.offlineButton}
                onPress={handleOfflineLogin}
                disabled={loading || !password.trim()}
              >
                <Text style={styles.offlineButtonText}>🔌 Connexion hors ligne</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleGoToOfflineAccess}
            >
              <Text style={styles.secondaryButtonText}>⚙️ Configurer l'accès hors ligne</Text>
            </TouchableOpacity>

            {backendConfigured && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleGoToDiagnostic}
              >
                <Text style={styles.secondaryButtonText}>🔍 Diagnostic de configuration</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.helpText}>
              💡 Conseils de connexion:{'\n\n'}
              • Si le serveur n'est pas disponible, utilisez le mode hors ligne{'\n'}
              • Mot de passe par défaut: admin123{'\n'}
              • Configurez l'accès hors ligne pour une connexion plus rapide{'\n\n'}
              En cas de problème persistant, utilisez l'outil de diagnostic pour vérifier la configuration.
            </Text>
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
    </>
  );
}
