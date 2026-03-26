
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { BACKEND_URL, checkBackendHealth } from '@/utils/api';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const OFFLINE_PASSWORD_KEY = 'admin_offline_password';
const OFFLINE_ACCESS_ENABLED_KEY = 'admin_offline_access_enabled';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@alliance-arm.fr');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Backend is always configured — no need to check
  const backendConfigured = true;

  const runHealthCheck = React.useCallback(async () => {
    setBackendStatus('checking');
    console.log('[AdminLogin] Vérification santé backend...');
    const isHealthy = await checkBackendHealth();
    setBackendStatus(isHealthy ? 'online' : 'offline');
    console.log('[AdminLogin] Statut backend:', isHealthy ? 'online' : 'offline');
  }, []);

  React.useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm' = 'info') => {
    console.log('[AdminLogin] Modal:', title, message);
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleLogin = async () => {
    console.log('[AdminLogin] Bouton Se connecter appuyé');

    if (!email.trim() || !password.trim()) {
      console.log('[AdminLogin] Email ou mot de passe vide');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showModal('Erreur', 'Veuillez entrer votre email et mot de passe.', 'error');
      return;
    }

    const trimmedPassword = password.trim();

    if (backendStatus === 'offline') {
      console.log('[AdminLogin] Backend hors ligne, tentative connexion hors ligne');
      await handleOfflineLogin(trimmedPassword);
      return;
    }

    setLoading(true);
    console.log('[AdminLogin] POST /api/admin/login');

    try {
      const trimmedEmail = email.trim();
      console.log('[AdminLogin] POST /api/admin/login ->', BACKEND_URL, '| email:', trimmedEmail);
      const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[AdminLogin] Erreur login:', response.status, errText);
        let msg = `Erreur ${response.status}`;
        try { msg = JSON.parse(errText).error || JSON.parse(errText).message || msg; } catch {}
        if (response.status === 401) {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showModal('Identifiants invalides', 'Email ou mot de passe incorrect.', 'error');
        } else if (response.status === 403) {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showModal('Accès refusé', 'Vous n\'avez pas les droits administrateur.', 'error');
        } else {
          showModal('Erreur de connexion', msg, 'error');
        }
        return;
      }

      const data = await response.json();
      console.log('[AdminLogin] Connexion réussie, token reçu:', !!data.token);
      if (data.token) {
        await AsyncStorage.setItem('admin_token', data.token);
      }
      await AsyncStorage.setItem('admin_password', trimmedPassword);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showModal('Succès', 'Connexion administrateur réussie !', 'success');
      setTimeout(() => router.replace('/admin/dashboard'), 1000);
    } catch (error: any) {
      console.error('[AdminLogin] Erreur réseau:', error.message);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      // Tentative hors ligne automatique
      const offlineEnabled = await AsyncStorage.getItem(OFFLINE_ACCESS_ENABLED_KEY);
      const savedPassword = await AsyncStorage.getItem(OFFLINE_PASSWORD_KEY);
      if (offlineEnabled === 'true' && savedPassword && trimmedPassword === savedPassword) {
        await AsyncStorage.setItem('admin_password', trimmedPassword);
        showModal('Connexion hors ligne', 'Connecté en mode hors ligne.', 'success');
        setTimeout(() => router.replace('/admin/dashboard'), 1000);
        return;
      }
      showModal('Erreur de connexion', 'Impossible de joindre le serveur. Vérifiez votre connexion internet.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineLogin = async (pwd: string) => {
    console.log('[AdminLogin] Tentative connexion hors ligne');
    setLoading(true);
    try {
      const offlineEnabled = await AsyncStorage.getItem(OFFLINE_ACCESS_ENABLED_KEY);
      const savedPassword = await AsyncStorage.getItem(OFFLINE_PASSWORD_KEY);
      if (offlineEnabled === 'true' && savedPassword && pwd === savedPassword) {
        await AsyncStorage.setItem('admin_password', pwd);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showModal('Succès', 'Connexion hors ligne réussie !', 'success');
        setTimeout(() => router.replace('/admin/dashboard'), 1000);
      } else {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showModal('Accès refusé', 'Mot de passe incorrect ou accès hors ligne non activé.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const statusColor = backendStatus === 'online' ? colors.success : backendStatus === 'offline' ? colors.danger : colors.textSecondary;
  const statusLabel = backendStatus === 'online' ? 'En ligne' : backendStatus === 'offline' ? 'Hors ligne' : 'Vérification...';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Connexion Administrateur',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.lockBadge}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
            <Text style={styles.title}>Espace Admin</Text>
            <Text style={styles.subtitle}>Alliance pour le Rassemblement Malien</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              {backendStatus === 'offline' && (
                <AnimatedPressable onPress={() => { console.log('[AdminLogin] Bouton Réessayer appuyé'); runHealthCheck(); }} style={styles.retryInline}>
                  <Text style={styles.retryInlineText}>Réessayer</Text>
                </AnimatedPressable>
              )}
            </View>
          </View>

          <View style={styles.form}>
            {backendStatus === 'offline' && (
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>Serveur non disponible</Text>
                <Text style={styles.warningText}>
                  Le serveur n'est pas accessible. Utilisez le mode hors ligne si activé.
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email administrateur</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="admin@alliance-arm.fr"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Entrez le mot de passe"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <AnimatedPressable
                  style={styles.eyeButton}
                  onPress={() => {
                    console.log('[AdminLogin] Toggle visibilité mot de passe');
                    setShowPassword(!showPassword);
                  }}
                >
                  <IconSymbol
                    ios_icon_name={showPassword ? 'eye.slash' : 'eye'}
                    android_material_icon_name={showPassword ? 'visibility-off' : 'visibility'}
                    size={22}
                    color={colors.textSecondary}
                  />
                </AnimatedPressable>
              </View>
            </View>

            <AnimatedPressable
              style={[styles.loginButton, (loading || !password.trim()) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading || !password.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {backendStatus === 'online' ? 'Se connecter' : 'Connexion hors ligne'}
                </Text>
              )}
            </AnimatedPressable>

            <AnimatedPressable
              style={styles.secondaryButton}
              onPress={() => {
                console.log('[AdminLogin] Navigation vers configuration accès hors ligne');
                router.push('/admin/offline-access');
              }}
            >
              <Text style={styles.secondaryButtonText}>Configurer l'accès hors ligne</Text>
            </AnimatedPressable>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  lockBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  retryInline: {
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  retryInlineText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  form: {
    padding: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F5C518',
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },
  inputGroup: {
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
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
