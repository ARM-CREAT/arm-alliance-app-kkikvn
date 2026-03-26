
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const ADMIN_PASSWORD = 'admin123';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    console.log('[AdminLogin] Bouton Se connecter appuyé');

    if (!password.trim()) {
      console.log('[AdminLogin] Mot de passe vide');
      setError('Veuillez entrer le mot de passe.');
      return;
    }

    setLoading(true);
    setError('');

    const trimmedPassword = password.trim();
    console.log('[AdminLogin] Vérification du mot de passe admin');

    if (trimmedPassword === ADMIN_PASSWORD) {
      console.log('[AdminLogin] Mot de passe correct, accès accordé');
      await AsyncStorage.setItem('admin_password', trimmedPassword);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLoading(false);
      router.replace('/admin/dashboard');
    } else {
      console.log('[AdminLogin] Mot de passe incorrect');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Mot de passe incorrect.');
      setLoading(false);
    }
  };

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
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.lockBadge}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
          <Text style={styles.title}>Espace Admin</Text>
          <Text style={styles.subtitle}>Alliance pour le Rassemblement Malien</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
              <TextInput
                style={styles.input}
                placeholder="Entrez le mot de passe"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); }}
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
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <AnimatedPressable
            style={[styles.loginButton, (loading || !password.trim()) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading || !password.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Se connecter</Text>
            )}
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSection: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 48,
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
  },
  form: {
    padding: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 24,
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
  inputWrapperError: {
    borderColor: colors.danger,
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
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.danger,
    fontWeight: '500',
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
});
