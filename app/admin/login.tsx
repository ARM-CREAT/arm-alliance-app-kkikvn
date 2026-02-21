
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
import { apiPost, BACKEND_URL, isBackendConfigured } from '@/utils/api';
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
});

export default function AdminLoginScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');

  const backendConfigured = isBackendConfigured();
  const backendUrlDisplay = BACKEND_URL || 'Non configuré';

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm' = 'info') => {
    console.log('Admin Login - Showing modal:', title, message);
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleLogin = async () => {
    console.log('Admin Login - Login button pressed');
    console.log('Admin Login - Backend URL:', BACKEND_URL);
    console.log('Admin Login - Backend configured:', backendConfigured);
    
    if (!backendConfigured) {
      console.error('Admin Login - Backend not configured');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal(
        'Erreur de configuration',
        'Le backend n\'est pas configuré. Veuillez reconstruire l\'application.',
        'error'
      );
      return;
    }

    if (!password.trim()) {
      console.log('Admin Login - Empty password');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', 'Veuillez entrer le mot de passe administrateur.', 'error');
      return;
    }

    setLoading(true);
    console.log('Admin Login - Attempting login...');
    console.log('Admin Login - Password length:', password.trim().length);

    try {
      const trimmedPassword = password.trim();
      console.log('Admin Login - Calling /api/admin/login endpoint');
      console.log('Admin Login - Password length being sent:', trimmedPassword.length);
      
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
      console.error('Admin Login - Login failed:', error);
      console.error('Admin Login - Error message:', error.message);
      console.error('Admin Login - Error stack:', error.stack);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorTitle = 'Erreur de connexion';
      const errorMessageText = error.message || 'Mot de passe administrateur incorrect.';
      let detailedMessage = errorMessageText;
      
      // Handle new specific error messages from the improved backend
      if (errorMessageText.includes('Le mot de passe est requis') || errorMessageText.includes('requis')) {
        errorTitle = 'Mot de passe requis';
        detailedMessage = 'Le mot de passe est requis. Veuillez entrer votre mot de passe administrateur.';
      } else if (
        errorMessageText.includes('Mot de passe administrateur incorrect') ||
        errorMessageText.includes('401') ||
        errorMessageText.includes('Invalid admin password') ||
        errorMessageText.includes('incorrect')
      ) {
        errorTitle = 'Mot de passe incorrect';
        // Extract hint about expected password length if provided in the error details
        const lengthMatch = errorMessageText.match(/(\d+)\s*caract/i);
        const lengthHint = lengthMatch ? `\n\nLongueur attendue: ${lengthMatch[1]} caractères.` : '';
        detailedMessage = `Le mot de passe administrateur est incorrect. Veuillez vérifier et réessayer.${lengthHint}\n\nSi le problème persiste après la publication sur Google Play Store, utilisez l'outil de diagnostic pour vérifier la configuration du serveur.`;
      } else if (errorMessageText.includes('connexion') || errorMessageText.includes('Network') || errorMessageText.includes('Failed to fetch') || errorMessageText.includes('Impossible de se connecter')) {
        errorTitle = 'Erreur de connexion';
        detailedMessage = `Impossible de se connecter au serveur.\n\nURL du backend: ${BACKEND_URL}\n\nVérifiez votre connexion internet et réessayez.`;
      } else if (errorMessageText.includes('timeout') || errorMessageText.includes('trop de temps')) {
        errorTitle = 'Délai d\'attente dépassé';
        detailedMessage = 'Le serveur met trop de temps à répondre. Vérifiez votre connexion internet et réessayez.';
      }
      
      showModal(errorTitle, detailedMessage, 'error');
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
              <Text style={styles.warningTitle}>🔒 Accès Réservé</Text>
              <Text style={styles.warningText}>
                Cet espace est réservé aux administrateurs du parti A.R.M. 
                Seul le mot de passe secret permet d'accéder au tableau de bord administrateur.
              </Text>
            </View>

            {__DEV__ && (
              <View style={styles.debugBox}>
                <Text style={styles.debugTitle}>ℹ️ Informations de diagnostic</Text>
                <Text style={styles.debugText}>
                  Backend: {backendConfigured ? '✓ Configuré' : '✗ Non configuré'}
                  {'\n'}URL: {backendUrlDisplay}
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
              style={[styles.button, (loading || !password.trim() || !backendConfigured) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading || !password.trim() || !backendConfigured}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleGoToDiagnostic}
            >
              <Text style={styles.secondaryButtonText}>🔍 Diagnostic de configuration</Text>
            </TouchableOpacity>

            <Text style={styles.helpText}>
              En cas de problème de connexion après publication sur Google Play Store, 
              utilisez l'outil de diagnostic pour vérifier la configuration du serveur.
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
