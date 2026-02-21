
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet, BACKEND_URL, isBackendConfigured } from '@/utils/api';
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeSuccess: {
    backgroundColor: '#D4EDDA',
  },
  statusBadgeError: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextSuccess: {
    color: '#155724',
  },
  statusTextError: {
    color: '#721C24',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 16,
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

interface ConfigInfo {
  passwordConfigured: boolean;
  passwordLength: number;
  passwordHint: string;
  environment: string;
  isDefault?: boolean;
}

export default function AdminDiagnosticScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configInfo, setConfigInfo] = useState<ConfigInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backendConfigured = isBackendConfigured();

  const loadConfigInfo = async () => {
    console.log('Admin Diagnostic - Loading config info');
    
    if (!backendConfigured) {
      setError('Le backend n\'est pas configuré. Veuillez reconstruire l\'application.');
      setLoading(false);
      return;
    }

    try {
      const data = await apiGet<ConfigInfo>('/api/admin/config-info');
      console.log('Admin Diagnostic - Config info loaded:', data);
      setConfigInfo(data);
      setError(null);
    } catch (err: any) {
      console.error('Admin Diagnostic - Failed to load config info:', err);
      setError(err.message || 'Impossible de charger les informations de configuration');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConfigInfo();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadConfigInfo();
  };

  const handleGoToLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Diagnostic Admin',
            headerStyle: {
              backgroundColor: colors.primary,
            },
            headerTintColor: '#FFFFFF',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des informations...</Text>
        </View>
      </View>
    );
  }

  const passwordConfiguredText = configInfo?.passwordConfigured ? 'Oui' : 'Non';
  const passwordLengthText = configInfo?.passwordLength ? `${configInfo.passwordLength} caractères` : 'N/A';
  const passwordHintText = configInfo?.passwordHint || 'N/A';
  const environmentText = configInfo?.environment || 'Inconnu';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Diagnostic Admin',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#FFFFFF',
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Diagnostic Administrateur</Text>
          <Text style={styles.subtitle}>
            Informations de configuration du système
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>❌ Erreur</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!backendConfigured && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>⚠️ Backend non configuré</Text>
            <Text style={styles.errorText}>
              Le backend n'est pas configuré dans cette version de l'application. 
              Veuillez reconstruire l'application avec la configuration correcte.
            </Text>
          </View>
        )}

        {backendConfigured && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌐 Configuration Backend</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>URL du backend</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
                {BACKEND_URL}
              </Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Statut</Text>
              <View style={[styles.statusBadge, styles.statusBadgeSuccess]}>
                <Text style={[styles.statusText, styles.statusTextSuccess]}>
                  ✓ Configuré
                </Text>
              </View>
            </View>
          </View>
        )}

        {configInfo && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔐 Configuration Mot de Passe</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mot de passe configuré</Text>
                <View style={[
                  styles.statusBadge,
                  configInfo.passwordConfigured ? styles.statusBadgeSuccess : styles.statusBadgeError
                ]}>
                  <Text style={[
                    styles.statusText,
                    configInfo.passwordConfigured ? styles.statusTextSuccess : styles.statusTextError
                  ]}>
                    {passwordConfiguredText}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Longueur du mot de passe</Text>
                <Text style={styles.infoValue}>{passwordLengthText}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Indice (masqué)</Text>
                <Text style={styles.infoValue}>{passwordHintText}</Text>
              </View>
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>Mot de passe par défaut</Text>
                <View style={[
                  styles.statusBadge,
                  configInfo.isDefault ? styles.statusBadgeError : styles.statusBadgeSuccess
                ]}>
                  <Text style={[
                    styles.statusText,
                    configInfo.isDefault ? styles.statusTextError : styles.statusTextSuccess
                  ]}>
                    {configInfo.isDefault ? 'Oui (attention!)' : 'Non (personnalisé)'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚙️ Environnement</Text>
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>Type d'environnement</Text>
                <Text style={styles.infoValue}>{environmentText}</Text>
              </View>
            </View>

            {!configInfo.passwordConfigured && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>⚠️ Attention</Text>
                <Text style={styles.errorText}>
                  Le mot de passe administrateur n'est pas configuré sur le serveur. 
                  Contactez l'administrateur système pour configurer la variable d'environnement ADMIN_PASSWORD.
                </Text>
              </View>
            )}

            {configInfo.passwordConfigured && configInfo.isDefault && (
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>⚠️ Mot de passe par défaut détecté</Text>
                <Text style={styles.warningText}>
                  Le serveur utilise le mot de passe par défaut. Cela peut expliquer les problèmes 
                  de connexion en production si la variable ADMIN_PASSWORD n'est pas définie.
                  {'\n\n'}
                  Indice: {passwordHintText}
                  {'\n'}
                  Longueur: {configInfo.passwordLength} caractères
                </Text>
              </View>
            )}

            {configInfo.passwordConfigured && !configInfo.isDefault && (
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>ℹ️ Information</Text>
                <Text style={styles.warningText}>
                  Le mot de passe administrateur est configuré via la variable d'environnement. 
                  Si vous ne pouvez pas vous connecter, vérifiez que vous utilisez le bon mot de passe.
                  {'\n\n'}
                  Indice: {passwordHintText}
                  {'\n'}
                  Longueur totale: {configInfo.passwordLength} caractères
                </Text>
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleGoToLogin}
        >
          <Text style={styles.buttonText}>Aller à la connexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}
