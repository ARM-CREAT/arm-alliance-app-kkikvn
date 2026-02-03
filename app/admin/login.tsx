
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

export default function AdminLoginScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretCode, setShowSecretCode] = useState(false);
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

  const toggleSecretCodeVisibility = () => {
    console.log('User toggled secret code visibility');
    setShowSecretCode(!showSecretCode);
  };

  const handleLogin = async () => {
    console.log('Admin login attempt');
    
    const trimmedPassword = password.trim();
    const trimmedSecretCode = secretCode.trim();
    
    if (!trimmedPassword) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      showModal('Erreur', 'Veuillez entrer le mot de passe administrateur', 'error');
      return;
    }

    if (!trimmedSecretCode) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      showModal('Erreur', 'Veuillez entrer le code secret', 'error');
      return;
    }

    setLoading(true);
    console.log('Verifying admin credentials...');

    try {
      // Store the admin credentials for authenticated requests
      await AsyncStorage.setItem('admin_password', trimmedPassword);
      await AsyncStorage.setItem('admin_secret_code', trimmedSecretCode);
      
      if (Platform.OS === 'web') {
        localStorage.setItem('admin_password', trimmedPassword);
        localStorage.setItem('admin_secret_code', trimmedSecretCode);
      }

      console.log('Admin credentials stored, navigating to dashboard');
      
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
    } catch (error) {
      console.error('Admin login error:', error);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      showModal('Erreur', 'Erreur lors de la connexion. Veuillez réessayer.', 'error');
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

          <View style={styles.infoBox}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.infoText}>
              Identifiants par défaut:{'\n'}
              Mot de passe: admin123{'\n'}
              Code secret: arm2024secure
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
                returnKeyType="next"
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

            <Text style={styles.label}>Code secret</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Entrez le code secret"
                placeholderTextColor={colors.textSecondary}
                value={secretCode}
                onChangeText={setSecretCode}
                secureTextEntry={!showSecretCode}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={toggleSecretCodeVisibility}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name={showSecretCode ? "eye.slash.fill" : "eye.fill"}
                  android_material_icon_name={showSecretCode ? "visibility-off" : "visibility"}
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
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
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
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
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
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
