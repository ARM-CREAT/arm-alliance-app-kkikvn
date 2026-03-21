
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import { authenticatedPost, authenticatedGet } from '@/utils/api';
import * as Haptics from 'expo-haptics';

type PaymentMethod = 'orange_money' | 'moov_money' | 'cash';
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
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function getStatusColor(status: string) {
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'payé' || s === 'completed') return '#34C759';
  if (s === 'pending' || s === 'en attente') return '#FF9500';
  return '#8E8E93';
}

function getStatusLabel(status: string) {
  const s = status.toLowerCase();
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

  const [selectedType, setSelectedType] = useState<CotisationType>('mensuelle');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('orange_money');
  const [amountInput, setAmountInput] = useState('5000');

  // After initiation
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
      console.log('[Cotisation] History loaded:', list.length, 'items');
      setHistory(list);
    } catch (error: any) {
      console.error('[Cotisation] Error loading history:', error);
      // Not authenticated or no history — show empty
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
    console.log('[Cotisation] Pull-to-refresh triggered');
    setRefreshing(true);
    loadHistory();
  }, [loadHistory]);

  const handleInitiate = async () => {
    console.log('[Cotisation] User tapped Initier le paiement');

    const amount = parseInt(amountInput, 10);
    if (!amountInput || isNaN(amount) || amount <= 0) {
      showModal('Erreur', 'Veuillez entrer un montant valide', 'error');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    const payload = { amount, type: selectedType, paymentMethod: selectedPaymentMethod };
    console.log('[Cotisation] POST /api/cotisations/initiate payload:', JSON.stringify(payload));

    try {
      const response = await authenticatedPost<{
        cotisationId: string;
        membershipNumber: string;
        paymentInstructions: string;
      }>('/api/cotisations/initiate', payload);

      console.log('[Cotisation] Initiation response:', JSON.stringify(response));

      setCotisationId(response.cotisationId);
      const instructions = typeof response.paymentInstructions === 'string'
        ? response.paymentInstructions
        : `ID de cotisation: ${response.cotisationId}\n\nVeuillez effectuer votre paiement et entrer l'ID de transaction ci-dessous.`;
      setPaymentInstructions(instructions);
    } catch (error: any) {
      console.error('[Cotisation] Initiation error:', error);
      showModal('Erreur', error?.message || 'Une erreur est survenue. Veuillez réessayer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    console.log('[Cotisation] User tapped Confirmer le paiement');

    if (!transactionId.trim()) {
      showModal('Erreur', 'Veuillez entrer l\'ID de transaction', 'error');
      return;
    }
    if (!cotisationId) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setConfirmLoading(true);
    const payload = { cotisationId, transactionId: transactionId.trim() };
    console.log('[Cotisation] POST /api/cotisations/confirm payload:', JSON.stringify(payload));

    try {
      const response = await authenticatedPost<{ success: boolean; message: string }>(
        '/api/cotisations/confirm',
        payload
      );
      console.log('[Cotisation] Confirm response:', JSON.stringify(response));

      showModal('Paiement Confirmé', response.message || 'Votre cotisation a été confirmée avec succès!', 'success');
      setCotisationId(null);
      setPaymentInstructions(null);
      setTransactionId('');
      setAmountInput('5000');
      loadHistory();
    } catch (error: any) {
      console.error('[Cotisation] Confirm error:', error);
      showModal('Erreur', error?.message || 'Impossible de confirmer le paiement.', 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const typeOptions: { value: CotisationType; label: string; amount: string }[] = [
    { value: 'mensuelle', label: 'Mensuelle', amount: '5 000 FCFA' },
    { value: 'trimestrielle', label: 'Trimestrielle', amount: '14 000 FCFA' },
    { value: 'annuelle', label: 'Annuelle', amount: '50 000 FCFA' },
  ];

  const paymentOptions: { value: PaymentMethod; label: string; color: string; abbr: string }[] = [
    { value: 'orange_money', label: 'Orange Money', color: '#FF6600', abbr: 'OM' },
    { value: 'moov_money', label: 'Moov Money', color: '#0066CC', abbr: 'MM' },
    { value: 'cash', label: 'Espèces', color: '#34C759', abbr: '💵' },
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
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="creditcard.fill"
            android_material_icon_name="payment"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.headerTitle}>Cotisation Militant</Text>
          <Text style={styles.headerSubtitle}>
            Contribuez au financement du parti
          </Text>
        </View>

        {/* Payment instructions + confirm step */}
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
                placeholderTextColor={colors.textSecondary}
                value={transactionId}
                onChangeText={setTransactionId}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, confirmLoading && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={confirmLoading}
              activeOpacity={0.8}
            >
              {confirmLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Confirmer le paiement</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                console.log('[Cotisation] User cancelled payment confirmation');
                setCotisationId(null);
                setPaymentInstructions(null);
                setTransactionId('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type de cotisation</Text>
              {typeOptions.map((opt) => {
                const isSelected = selectedType === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => {
                      console.log('[Cotisation] User selected type:', opt.value);
                      setSelectedType(opt.value);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionRow}>
                      <View style={styles.optionTextBlock}>
                        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.optionAmount}>{opt.amount}</Text>
                      </View>
                      {isSelected && (
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check-circle"
                          size={22}
                          color={colors.primary}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Amount */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Montant (FCFA)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 5000"
                placeholderTextColor={colors.textSecondary}
                value={amountInput}
                onChangeText={setAmountInput}
                keyboardType="numeric"
              />
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mode de paiement</Text>
              {paymentOptions.map((opt) => {
                const isSelected = selectedPaymentMethod === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.paymentCard, isSelected && styles.paymentCardSelected]}
                    onPress={() => {
                      console.log('[Cotisation] User selected payment method:', opt.value);
                      setSelectedPaymentMethod(opt.value);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.paymentIcon, { backgroundColor: opt.color }]}>
                      <Text style={styles.paymentIconText}>{opt.abbr}</Text>
                    </View>
                    <Text style={styles.paymentName}>{opt.label}</Text>
                    {isSelected && (
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonMargin, loading && styles.buttonDisabled]}
              onPress={handleInitiate}
              disabled={loading}
              activeOpacity={0.8}
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
            </TouchableOpacity>
          </>
        )}

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des cotisations</Text>
          {historyLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>Aucune cotisation enregistrée</Text>
            </View>
          ) : (
            history.map((item) => {
              const statusColor = getStatusColor(item.status);
              const statusLabel = getStatusLabel(item.status);
              const dateStr = formatDate(item.paidAt || item.createdAt);
              const amountStr = String(Number(item.amount).toLocaleString('fr-FR'));
              return (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <Text style={styles.historyAmount}>{amountStr} FCFA</Text>
                      <Text style={styles.historyType}>{item.type}</Text>
                      <Text style={styles.historyDate}>{dateStr}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
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
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
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
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FAF2',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  optionAmount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 12,
  },
  paymentCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FAF2',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderRadius: 12,
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
    fontWeight: 'bold',
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
    backgroundColor: '#EBF5FB',
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
  },
  emptyHistoryText: {
    fontSize: 15,
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
    color: colors.textSecondary,
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
