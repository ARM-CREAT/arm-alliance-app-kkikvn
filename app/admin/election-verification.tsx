
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import { adminGet, adminPut } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface ElectionResult {
  id: string;
  memberId: string;
  electionType: string;
  region: string;
  cercle: string;
  commune: string;
  bureauVote: string;
  resultsData: any;
  pvPhotoUrl?: string;
  submittedAt: string;
  status: 'pending' | 'verified' | 'rejected';
}

export default function ElectionVerificationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [results, setResults] = useState<ElectionResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ElectionResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error' | 'confirm',
    onConfirm: () => {},
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAdminAuth = async () => {
    console.log('[ElectionVerification] Checking admin authentication');
    try {
      const password = await AsyncStorage.getItem('admin_password');
      const secretCode = await AsyncStorage.getItem('admin_secret_code');
      
      const webPassword = Platform.OS === 'web' ? localStorage.getItem('admin_password') : null;
      const webSecretCode = Platform.OS === 'web' ? localStorage.getItem('admin_secret_code') : null;
      
      const hasCredentials = (password && secretCode) || (webPassword && webSecretCode);
      
      if (hasCredentials) {
        console.log('[ElectionVerification] Admin credentials found');
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[ElectionVerification] Error checking admin auth:', error);
      return false;
    }
  };

  useEffect(() => {
    const initScreen = async () => {
      const authenticated = await checkAdminAuth();
      if (authenticated) {
        loadPendingResults();
      } else {
        setLoading(false);
      }
    };
    
    initScreen();
  }, []);

  const loadPendingResults = async () => {
    console.log('[ElectionVerification] Loading pending results');
    setLoading(true);

    try {
      const response = await adminGet('/api/admin/elections/pending');
      console.log('[ElectionVerification] Results loaded:', response);
      setResults(response || []);
    } catch (error: any) {
      console.error('[ElectionVerification] Error loading results:', error);
      showModal('Erreur', error?.message || 'Impossible de charger les résultats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingResults();
    setRefreshing(false);
  };

  const showModal = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm',
    onConfirm?: () => void
  ) => {
    setModalConfig({
      title,
      message,
      type,
      onConfirm: onConfirm || (() => {}),
    });
    setModalVisible(true);
  };

  const handleVerify = async (resultId: string, status: 'verified' | 'rejected') => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    showModal(
      'Confirmer',
      `Voulez-vous vraiment ${status === 'verified' ? 'vérifier' : 'rejeter'} ce résultat ?`,
      'confirm',
      async () => {
        setModalVisible(false);
        try {
          await adminPut(`/api/admin/elections/${resultId}/verify`, { status });
          showModal('Succès', `Résultat ${status === 'verified' ? 'vérifié' : 'rejeté'} avec succès`, 'success');
          await loadPendingResults();
        } catch (error: any) {
          console.error('[ElectionVerification] Error verifying result:', error);
          showModal('Erreur', error?.message || 'Impossible de mettre à jour le résultat', 'error');
        }
      }
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Vérifier Résultats',
            headerShown: true,
            headerBackTitle: 'Retour',
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Vérifier Résultats',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="checkmark.seal"
              android_material_icon_name="verified"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>Aucun résultat en attente</Text>
            <Text style={styles.emptySubtext}>
              Tous les résultats ont été vérifiés
            </Text>
          </View>
        ) : (
          <View style={styles.resultsList}>
            {results.map((result) => (
              <View key={result.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultIcon}>
                    <IconSymbol
                      ios_icon_name="doc.text.fill"
                      android_material_icon_name="description"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle}>{result.electionType}</Text>
                    <Text style={styles.resultLocation}>
                      {result.region} • {result.cercle} • {result.commune}
                    </Text>
                    <Text style={styles.resultBureau}>Bureau: {result.bureauVote}</Text>
                    <Text style={styles.resultDate}>{formatDate(result.submittedAt)}</Text>
                  </View>
                </View>

                <View style={styles.resultsData}>
                  <Text style={styles.resultsDataTitle}>Résultats:</Text>
                  {Object.entries(result.resultsData).map(([key, value]) => (
                    <View key={key} style={styles.resultRow}>
                      <Text style={styles.resultKey}>{key}:</Text>
                      <Text style={styles.resultValue}>{String(value)}</Text>
                    </View>
                  ))}
                </View>

                {result.pvPhotoUrl && (
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={() => {
                      // Open photo in modal or browser
                      showModal('Photo PV', `URL: ${result.pvPhotoUrl}`, 'info');
                    }}
                  >
                    <IconSymbol
                      ios_icon_name="photo"
                      android_material_icon_name="photo"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.photoButtonText}>Voir photo PV</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.verifyButton]}
                    onPress={() => handleVerify(result.id, 'verified')}
                  >
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionButtonText}>Vérifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleVerify(result.id, 'rejected')}
                  >
                    <IconSymbol
                      ios_icon_name="xmark.circle.fill"
                      android_material_icon_name="cancel"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionButtonText}>Rejeter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalVisible(false)}
        onConfirm={modalConfig.onConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 40,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
  },
  emptySubtext: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  resultsList: {
    padding: 16,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  resultLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  resultBureau: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  resultDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resultsData: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  resultsDataTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  resultKey: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 12,
    gap: 6,
  },
  photoButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  verifyButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
