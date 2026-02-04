
import React, { useState } from 'react';
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
import { adminGet } from '@/utils/api';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const togglePasswordVisibility = () => {
    console.log('User toggled password visibility');
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    console.log('Admin login attempt');
    
    const trimmedPassword = password.trim();
    
    if (!trimmedPassword) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      showModal('Erreur', 'Veuillez entrer le mot de passe administrateur', 'error');
      return;
    }

    setLoading(true);
    console.log('Verifying admin credentials...');

    try {
      // Store the admin credentials for authenticated requests
      // Using the same password for both fields to simplify
      await AsyncStorage.setItem('admin_password', trimmedPassword);
      await AsyncStorage.setItem('admin_secret_code', trimmedPassword);
      
      if (Platform.OS === 'web') {
        localStorage.setItem('admin_password', trimmedPassword);
        localStorage.setItem('admin_secret_code', trimmedPassword);
      }

      console.log('Admin credentials stored, verifying with backend...');
      
      // Verify credentials by making a test API call
      try {
        await adminGet('/api/admin/analytics');
        console.log('Admin credentials verified successfully');
      } catch (error) {
        console.error('Admin verification failed:', error);
        // Clear invalid credentials
        await AsyncStorage.removeItem('admin_password');
        await AsyncStorage.removeItem('admin_secret_code');
        if (Platform.OS === 'web') {
          localStorage.removeItem('admin_password');
          localStorage.removeItem('admin_secret_code');
        }
        throw new Error('Mot de passe incorrect');
      }
      
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
      console.error('Admin login error:', error);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      const errorMessage = error?.message || 'Erreur lors de la connexion. Veuillez réessayer.';
      showModal('Erreur', errorMessage, 'error');
    } finally {
      setLoading(false);
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
              Mot de passe par défaut: admin123
            </Text>
          </View>

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
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
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
