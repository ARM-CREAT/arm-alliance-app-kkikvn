
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { authenticatedPost, authenticatedGet } from '@/utils/api';
import * as Haptics from 'expo-haptics';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

type PaymentMethod = 'orange_money' | 'moov_money' | 'virement';
type CotisationType = 'mensuelle' | 'trimestrielle' | 'annuelle';

interface Cotisation {
  id: string;
  amount: number;
  type: string;
  paymentMethod: string;
  transactionId?: string;
  status: string;
  paidAt?: string;
  createdAt: string;
}

function formatDate(dateString?: string) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return dateString; }
}

function getStatusColor(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'payé' || s === 'completed') return colors.success;
  if (s === 'pending' || s === 'en attente') return colors.warning;
  return colors.textSecondary;
}

function getStatusLabel(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'completed') return 'Payé';
  if (s === 'pending') return 'En attente';
  return status;
}

export default function CotisationScreen() {
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'error'>('info');
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const [selectedType, setSelectedType] = useState<CotisationType>('mensuelle');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('orange_money');
  const [amountInput, setAmountInput] = useState('5000');

  const [cotisationId, setCotisationId] = useState<string | null>(null);
  const [paymentInstructions, setPaymentInstructions] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [history, setHistory] = useState<Cotisation[]>([]);

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const loadHistory = useCallback(async () => {
    console.log('[Cotisation] GET /api/cotisations/my-history');
    try {
      const response = await authenticatedGet<{ cotisations: Cotisation[] }>('/api/cotisations/my-history');
      const list = response?.cotisations ?? [];
      console.log('[Cotisation] Historique chargé:', list.length, 'éléments');
      setHistory(list);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('[Cotisation] Erreur historique:', error.message);
      if (error.message?.includes('token') || error.message?.includes('Authentication') || error.message?.includes('401')) {
        setIsAuthenticated(false);
      }
      setHistory([]);
    } finally {
      setHistoryLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(() => {
    console.log('[Cotisation] Pull-to-refresh');
    setRefreshing(true);
    loadHistory();
  }, [loadHistory]);

  const handleInitiate = async () => {
    console.log('[Cotisation] Bouton Initier le paiement appuyé');

    const amount = parseInt(amountInput, 10);
    if (!amountInput || isNaN(amount) || amount <= 0) {
      showModal('Erreur', 'Veuillez entrer un montant valide', 'error');
      return;
    }

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setLoading(true);
    const payload = { amount, type: selectedType, paymentMethod: selectedPaymentMethod };
    console.log('[Cotisation] POST /api/cotisations/initiate', JSON.stringify(payload));

    try {
      const response = await authenticatedPost<{
        cotisationId: string;
        membershipNumber: string;
        paymentInstructions: string;
      }>('/api/cotisations/initiate', payload);

      console.log('[Cotisation] Initiation réussie:', JSON.stringify(response));
      setCotisationId(response.cotisationId);
      const instructions = typeof response.paymentInstructions === 'string'
        ? response.paymentInstructions
        : `ID de cotisation: ${response.cotisationId}\n\nEffectuez votre paiement et entrez l'ID de transaction ci-dessous.`;
      setPaymentInstructions(instructions);
    } catch (error: any) {
      console.error('[Cotisation] Erreur initiation:', error.message);
      showModal('Erreur', error?.message || 'Une erreur est survenue. Veuillez réessayer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    console.log('[Cotisation] Bouton Confirmer le paiement appuyé');

    if (!transactionId.trim()) {
      showModal('Erreur', "Veuillez entrer l'ID de transaction", 'error');
      return;
    }
    if (!cotisationId) return;

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setConfirmLoading(true);
    const payload = { cotisationId, transactionId: transactionId.trim() };
    console.log('[Cotisation] POST /api/cotisations/confirm', JSON.stringify(payload));

    try {
      const response = await authenticatedPost<{ success: boolean; message: string }>(
        '/api/cotisations/confirm', payload
      );
      console.log('[Cotisation] Confirmation réussie:', JSON.stringify(response));
      showModal('Paiement confirmé', response.message || 'Votre cotisation a été confirmée !', 'success');
      setCotisationId(null);
      setPaymentInstructions(null);
      setTransactionId('');
      setAmountInput('5000');
      loadHistory();
    } catch (error: any) {
      console.error('[Cotisation] Erreur confirmation:', error.message);
      showModal('Erreur', error?.message || 'Impossible de confirmer le paiement.', 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const typeOptions: { value: CotisationType; label: string; amount: string; desc: string }[] = [
    { value: 'mensuelle', label: 'Mensuelle', amount: '5 000 FCFA', desc: 'Par mois' },
    { value: 'trimestrielle', label: 'Trimestrielle', amount: '14 000 FCFA', desc: 'Par trimestre' },
    { value: 'annuelle', label: 'Annuelle', amount: '50 000 FCFA', desc: 'Par an' },
  ];

  const paymentOptions: { value: PaymentMethod; label: string; color: string; abbr: string }[] = [
    { value: 'orange_money', label: 'Orange Money', color: '#FF6600', abbr: 'OM' },
    { value: 'moov_money', label: 'Moov Money', color: '#0066CC', abbr: 'MM' },
    { value: 'virement', label: 'Virement', color: colors.primary, abbr: '🏦' },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Cotisation',
          headerShown: true,
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>💳</Text>
          </View>
          <Text style={styles.headerTitle}>Cotisation Militant</Text>
          <Text style={styles.headerSubtitle}>Contribuez au financement du parti</Text>
        </View>

        {/* Non authentifié */}
        {!isAuthenticated && (
          <View style={styles.authWarning}>
            <Text style={styles.authWarningIcon}>🔒</Text>
            <Text style={styles.authWarningText}>
              Connectez-vous pour accéder aux cotisations et consulter votre historique.
            </Text>
          </View>
        )}

        {/* Étape confirmation */}
        {paymentInstructions ? (
          <View style={styles.section}>
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>Instructions de paiement</Text>
              <Text style={styles.instructionsText}>{paymentInstructions}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ID de Transaction *</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez l'ID de transaction reçu"
                placeholderTextColor={colors.textTertiary}
                value={transactionId}
                onChangeText={setTransactionId}
                autoCapitalize="none"
              />
            </View>

            <AnimatedPressable
              style={[styles.primaryButton, confirmLoading && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={confirmLoading}
            >
              {confirmLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Confirmer le paiement</Text>
              )}
            </AnimatedPressable>

            <AnimatedPressable
              style={styles.cancelButton}
              onPress={() => {
                console.log('[Cotisation] Annulation confirmation paiement');
                setCotisationId(null);
                setPaymentInstructions(null);
                setTransactionId('');
              }}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </AnimatedPressable>
          </View>
        ) : (
          <>
            {/* Type de cotisation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type de cotisation</Text>
              {typeOptions.map((opt) => {
                const isSelected = selectedType === opt.value;
                return (
                  <AnimatedPressable
                    key={opt.value}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => {
                      console.log('[Cotisation] Type sélectionné:', opt.value);
                      setSelectedType(opt.value);
                    }}
                  >
                    <View style={styles.optionRow}>
                      <View style={styles.optionTextBlock}>
                        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.optionDesc}>{opt.desc}</Text>
                      </View>
                      <Text style={[styles.optionAmount, isSelected && { color: colors.primary }]}>
                        {opt.amount}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkCircle}>
                          <Text style={styles.checkMark}>✓</Text>
                        </View>
                      )}
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>

            {/* Montant */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Montant (FCFA)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 5000"
                placeholderTextColor={colors.textTertiary}
                value={amountInput}
                onChangeText={setAmountInput}
                keyboardType="numeric"
              />
            </View>

            {/* Mode de paiement */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mode de paiement</Text>
              {paymentOptions.map((opt) => {
                const isSelected = selectedPaymentMethod === opt.value;
                return (
                  <AnimatedPressable
                    key={opt.value}
                    style={[styles.paymentCard, isSelected && styles.paymentCardSelected]}
                    onPress={() => {
                      console.log('[Cotisation] Mode de paiement sélectionné:', opt.value);
                      setSelectedPaymentMethod(opt.value);
                    }}
                  >
                    <View style={[styles.paymentIcon, { backgroundColor: opt.color }]}>
                      <Text style={styles.paymentIconText}>{opt.abbr}</Text>
                    </View>
                    <Text style={[styles.paymentName, isSelected && { color: colors.primary }]}>
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </AnimatedPressable>
                );
              })}
            </View>

            <AnimatedPressable
              style={[styles.primaryButton, styles.primaryButtonMargin, loading && styles.buttonDisabled]}
              onPress={handleInitiate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Initier le paiement</Text>
                  <IconSymbol
                    ios_icon_name="arrow.right"
                    android_material_icon_name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                  />
                </>
              )}
            </AnimatedPressable>
          </>
        )}

        {/* Historique */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des cotisations</Text>
          {historyLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : !isAuthenticated ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>Connectez-vous pour voir votre historique</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>Aucune cotisation enregistrée</Text>
            </View>
          ) : (
            history.map((item) => {
              const statusColor = getStatusColor(item.status);
              const statusLabel = getStatusLabel(item.status);
              const dateStr = formatDate(item.paidAt || item.createdAt);
              const amountStr = Number(item.amount).toLocaleString('fr-FR');
              return (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <Text style={styles.historyAmount}>{amountStr} FCFA</Text>
                      <Text style={styles.historyType}>{item.type}</Text>
                      <Text style={styles.historyDate}>{dateStr}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIconText: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  authWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  authWarningIcon: {
    fontSize: 20,
  },
  authWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTextBlock: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 12,
  },
  paymentCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentIconText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  paymentName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
    marginTop: 20,
  },
  primaryButtonMargin: {
    marginHorizontal: 20,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  instructionsBox: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLeft: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  historyType: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  historyDate: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
