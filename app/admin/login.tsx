
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { Modal } from '@/components/ui/Modal';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL, isBackendConfigured, setAdminCredentials, clearAdminCredentials, apiCall } from '@/utils/api';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    console.log('[AdminLogin] Checking backend connection...');
    console.log('[AdminLogin] Backend URL:', BACKEND_URL);
    console.log('[AdminLogin] Backend configured:', isBackendConfigured());
    
    if (!isBackendConfigured()) {
      setBackendStatus('offline');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
      if (response.ok) {
        console.log('[AdminLogin] Backend is online');
        setBackendStatus('online');
      } else {
        console.log('[AdminLogin] Backend returned error:', response.status);
        setBackendStatus('offline');
      }
    } catch (error) {
      console.error('[AdminLogin] Backend connection failed:', error);
      setBackendStatus('offline');
    }
  };

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const togglePasswordVisibility = () => {
    console.log('User toggled password visibility');
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    console.log('Admin login attempt with password:', password ? '***' : '(empty)');
    
    // Check backend status first
    if (backendStatus === 'offline') {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      showModal(
        'Serveur hors ligne', 
        'Le serveur est actuellement hors ligne ou en cours de redémarrage. Veuillez patienter quelques instants et réessayer.', 
        'error'
      );
      return;
    }

    if (backendStatus === 'checking') {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      showModal(
        'Vérification en cours', 
        'Veuillez patienter pendant que nous vérifions la connexion au serveur.', 
        'warning'
      );
      return;
    }
    
    const trimmedPassword = password.trim();
    
    if (!trimmedPassword) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      showModal('Erreur', 'Veuillez entrer le mot de passe administrateur', 'error');
      return;
    }

    setLoading(true);
    setConnectionStatus('Connexion au serveur...');
    console.log('Verifying admin credentials...');

    try {
      // Store the admin credentials first
      await setAdminCredentials(trimmedPassword, trimmedPassword);

      console.log('Admin credentials stored, verifying with backend...');
      setConnectionStatus('Vérification des identifiants...');
      
      // Verify credentials by calling the verify endpoint with admin headers
      try {
        const verifyResult = await apiCall('/api/admin/verify', {
          method: 'POST',
          headers: {
            'x-admin-password': trimmedPassword,
            'x-admin-secret': trimmedPassword,
          },
          body: JSON.stringify({}),
        });
        
        console.log('Admin credentials verified successfully:', verifyResult);
        setConnectionStatus('Connexion réussie !');
        
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        showModal(
          'Succès', 
          'Connexion réussie ! Bienvenue dans l\'espace administrateur.', 
          'success'
        );
        
        // Navigate after a short delay to show success message
        setTimeout(() => {
          router.replace('/admin/dashboard');
        }, 1000);
      } catch (error: any) {
        console.error('Admin verification failed:', error);
        console.error('Error details:', {
          message: error?.message,
          name: error?.name,
          stack: error?.stack
        });
        
        // Clear invalid credentials
        await clearAdminCredentials();
        
        // Provide specific error message
        const errorMsg = error?.message || 'Erreur de connexion';
        if (errorMsg.includes('403') || errorMsg.includes('Invalid') || errorMsg.includes('Missing') || errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
          throw new Error('Mot de passe incorrect. Le mot de passe par défaut est: admin123');
        } else if (errorMsg.includes('connexion') || errorMsg.includes('Network') || errorMsg.includes('fetch') || errorMsg.includes('Impossible') || errorMsg.includes('CORS')) {
          throw new Error('Impossible de se connecter au serveur. Le serveur est peut-être en cours de redémarrage. Veuillez patienter 30 secondes et réessayer.');
        } else {
          throw new Error(errorMsg);
        }
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      const errorMessage = error?.message || 'Erreur lors de la connexion. Veuillez réessayer.';
      showModal('Erreur', errorMessage, 'error');
    } finally {
      setLoading(false);
      setConnectionStatus('');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Connexion Administrateur',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#fff',
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/48b93c14-0824-4757-b7a4-95824e04a9a8.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Espace Administrateur</Text>
          <Text style={styles.subtitle}>A.R.M - Alliance pour le Rassemblement Malien</Text>

          <View style={styles.warningBox}>
            <IconSymbol
              ios_icon_name="exclamationmark.shield.fill"
              android_material_icon_name="admin-panel-settings"
              size={24}
              color={colors.warning}
            />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>Accès Réservé</Text>
              <Text style={styles.warningText}>
                Cette page est réservée UNIQUEMENT aux administrateurs.{'\n'}
                Les militants n&apos;ont PAS besoin de mot de passe.
              </Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.infoText}>
              Un seul mot de passe pour accéder à l&apos;espace administrateur.{'\n'}
              <Text style={styles.infoTextBold}>Mot de passe par défaut: admin123</Text>
            </Text>
          </View>

          {backendStatus === 'checking' ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.statusText}>Vérification de la connexion au serveur...</Text>
            </View>
          ) : null}

          {backendStatus === 'offline' ? (
            <View style={[styles.statusBox, styles.statusBoxOffline]}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={20}
                color={colors.error}
              />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTextOffline}>Serveur hors ligne</Text>
                <Text style={styles.statusSubtext}>
                  Le serveur est en cours de redémarrage. Veuillez patienter 30 secondes et réessayer.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={checkBackendConnection}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {backendStatus === 'online' ? (
            <View style={[styles.statusBox, styles.statusBoxOnline]}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.success}
              />
              <Text style={styles.statusTextOnline}>Serveur en ligne</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>Mot de passe administrateur</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Entrez le mot de passe"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={togglePasswordVisibility}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name={showPassword ? "eye.slash.fill" : "eye.fill"}
                  android_material_icon_name={showPassword ? "visibility-off" : "visibility"}
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, (loading || backendStatus !== 'online') && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading || backendStatus !== 'online'}
              activeOpacity={0.7}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" />
                  {connectionStatus ? (
                    <Text style={styles.loadingText}>{connectionStatus}</Text>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.publicAccessBox}>
            <IconSymbol
              ios_icon_name="person.2.fill"
              android_material_icon_name="group"
              size={20}
              color={colors.success}
            />
            <View style={styles.publicAccessTextContainer}>
              <Text style={styles.publicAccessTitle}>Pour les Militants</Text>
              <Text style={styles.publicAccessText}>
                Vous pouvez adhérer, accéder à votre carte de membre, et utiliser toutes les fonctionnalités SANS mot de passe depuis la page d&apos;accueil.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Fraternité • Liberté • Égalité
            </Text>
          </View>
        </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.warning,
    alignItems: 'flex-start',
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    marginLeft: 12,
    lineHeight: 18,
  },
  infoTextBold: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
  },
  statusBox: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 12,
  },
  statusBoxOnline: {
    backgroundColor: '#D4EDDA',
    borderColor: colors.success,
  },
  statusBoxOffline: {
    backgroundColor: '#F8D7DA',
    borderColor: colors.error,
    alignItems: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    color: colors.text,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTextOnline: {
    fontSize: 14,
    color: '#155724',
    fontWeight: '600',
  },
  statusTextOffline: {
    fontSize: 14,
    color: '#721C24',
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#721C24',
    lineHeight: 16,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  publicAccessBox: {
    flexDirection: 'row',
    backgroundColor: '#D4EDDA',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.success,
    alignItems: 'flex-start',
  },
  publicAccessTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  publicAccessTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 4,
  },
  publicAccessText: {
    fontSize: 13,
    color: '#155724',
    lineHeight: 18,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
