
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

type PaymentMethod = 'sama_money' | 'orange_money' | 'moov_money';
type CotisationType = 'monthly' | 'annual' | 'one-time';

export default function CotisationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const [selectedType, setSelectedType] = useState<CotisationType>('monthly');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('orange_money');
  const [customAmount, setCustomAmount] = useState('');

  const cotisationAmounts = {
    monthly: 5000,
    annual: 50000,
  };

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handlePayment = async () => {
    console.log('User tapped Pay button');
    
    const amountValue = selectedType === 'one-time' 
      ? parseInt(customAmount) 
      : cotisationAmounts[selectedType];

    if (selectedType === 'one-time' && (!customAmount || amountValue < 1000)) {
      showModal('Erreur', 'Le montant minimum est de 1000 FCFA');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      const { authenticatedPost } = await import('@/utils/api');
      
      console.log('[Cotisation] Initiating payment:', {
        amount: amountValue,
        type: selectedType,
        paymentMethod: selectedPaymentMethod,
      });

      const response = await authenticatedPost('/api/cotisations/initiate', {
        amount: amountValue,
        type: selectedType,
        paymentMethod: selectedPaymentMethod,
      });

      console.log('[Cotisation] Payment initiated:', response);

      // Format payment instructions from backend
      let instructions = '';
      if (response.paymentInstructions) {
        if (typeof response.paymentInstructions === 'string') {
          instructions = response.paymentInstructions;
        } else {
          instructions = `ID de cotisation: ${response.cotisationId}\n\n${getPaymentInstructions(selectedPaymentMethod, amountValue)}`;
        }
      } else {
        instructions = getPaymentInstructions(selectedPaymentMethod, amountValue);
      }
      
      showModal('Instructions de Paiement', instructions);
      
    } catch (error: any) {
      console.error('[Cotisation] Payment initiation error:', error);
      showModal('Erreur', error?.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentInstructions = (method: PaymentMethod, amount: number): string => {
    const instructions = {
      sama_money: `Pour payer ${amount} FCFA via Sama Money:\n\n1. Composez *123#\n2. Sélectionnez "Transfert d'argent"\n3. Entrez le numéro: 70 00 00 00\n4. Montant: ${amount} FCFA\n5. Confirmez avec votre code PIN`,
      orange_money: `Pour payer ${amount} FCFA via Orange Money:\n\n1. Composez #144#\n2. Sélectionnez "Transfert d'argent"\n3. Entrez le numéro: 70 00 00 00\n4. Montant: ${amount} FCFA\n5. Confirmez avec votre code PIN`,
      moov_money: `Pour payer ${amount} FCFA via Moov Money:\n\n1. Composez *555#\n2. Sélectionnez "Transfert d'argent"\n3. Entrez le numéro: 70 00 00 00\n4. Montant: ${amount} FCFA\n5. Confirmez avec votre code PIN`,
    };
    return instructions[method];
  };

  const monthlyAmount = cotisationAmounts.monthly.toLocaleString('fr-FR');
  const annualAmount = cotisationAmounts.annual.toLocaleString('fr-FR');

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Payer ma Cotisation',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="creditcard.fill"
            android_material_icon_name="payment"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.headerTitle}>Cotisation Militante</Text>
          <Text style={styles.headerSubtitle}>
            Soutenez l&apos;action de l&apos;A.R.M
          </Text>
        </View>

        {/* Cotisation Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de Cotisation</Text>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedType === 'monthly' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedType('monthly')}
            activeOpacity={0.8}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionIcon}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="event"
                  size={24}
                  color={selectedType === 'monthly' ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Mensuelle</Text>
                <Text style={styles.optionAmount}>{monthlyAmount} FCFA / mois</Text>
              </View>
              {selectedType === 'monthly' && (
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={24}
                  color={colors.primary}
                />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedType === 'annual' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedType('annual')}
            activeOpacity={0.8}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionIcon}>
                <IconSymbol
                  ios_icon_name="calendar.badge.clock"
                  android_material_icon_name="date-range"
                  size={24}
                  color={selectedType === 'annual' ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Annuelle</Text>
                <Text style={styles.optionAmount}>{annualAmount} FCFA / an</Text>
                <Text style={styles.optionSavings}>Économisez 10 000 FCFA</Text>
              </View>
              {selectedType === 'annual' && (
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={24}
                  color={colors.primary}
                />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedType === 'one-time' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedType('one-time')}
            activeOpacity={0.8}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionIcon}>
                <IconSymbol
                  ios_icon_name="gift.fill"
                  android_material_icon_name="card-giftcard"
                  size={24}
                  color={selectedType === 'one-time' ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Montant Libre</Text>
                <Text style={styles.optionDescription}>Contribution ponctuelle</Text>
              </View>
              {selectedType === 'one-time' && (
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={24}
                  color={colors.primary}
                />
              )}
            </View>
            {selectedType === 'one-time' && (
              <View style={styles.customAmountContainer}>
                <TextInput
                  style={styles.customAmountInput}
                  placeholder="Entrez le montant (min. 1000 FCFA)"
                  placeholderTextColor={colors.textSecondary}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="numeric"
                />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moyen de Paiement</Text>

          <TouchableOpacity
            style={[
              styles.paymentCard,
              selectedPaymentMethod === 'orange_money' && styles.paymentCardSelected,
            ]}
            onPress={() => setSelectedPaymentMethod('orange_money')}
            activeOpacity={0.8}
          >
            <View style={[styles.paymentIcon, { backgroundColor: '#FF6600' }]}>
              <Text style={styles.paymentIconText}>OM</Text>
            </View>
            <Text style={styles.paymentName}>Orange Money</Text>
            {selectedPaymentMethod === 'orange_money' && (
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentCard,
              selectedPaymentMethod === 'moov_money' && styles.paymentCardSelected,
            ]}
            onPress={() => setSelectedPaymentMethod('moov_money')}
            activeOpacity={0.8}
          >
            <View style={[styles.paymentIcon, { backgroundColor: '#0066CC' }]}>
              <Text style={styles.paymentIconText}>MM</Text>
            </View>
            <Text style={styles.paymentName}>Moov Money</Text>
            {selectedPaymentMethod === 'moov_money' && (
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentCard,
              selectedPaymentMethod === 'sama_money' && styles.paymentCardSelected,
            ]}
            onPress={() => setSelectedPaymentMethod('sama_money')}
            activeOpacity={0.8}
          >
            <View style={[styles.paymentIcon, { backgroundColor: '#00AA55' }]}>
              <Text style={styles.paymentIconText}>SM</Text>
            </View>
            <Text style={styles.paymentName}>Sama Money</Text>
            {selectedPaymentMethod === 'sama_money' && (
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Text style={styles.payButtonText}>Procéder au Paiement</Text>
              <IconSymbol
                ios_icon_name="arrow.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={colors.background}
              />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
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
    paddingTop: Platform.OS === 'android' ? 16 : 0,
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundAlt,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  optionAmount: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  optionSavings: {
    fontSize: 13,
    color: '#10B981',
    marginTop: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customAmountContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  customAmountInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  paymentCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundAlt,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paymentIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  paymentName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.background,
    marginRight: 8,
  },
});
