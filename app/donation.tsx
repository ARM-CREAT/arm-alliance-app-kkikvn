
import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { Modal } from "@/components/ui/Modal";
import { apiPost } from "@/utils/api";

type ContributionType = 'one-time' | 'monthly' | 'annual';

export default function DonationScreen() {
  const router = useRouter();
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [contributionType, setContributionType] = useState<ContributionType>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'visa' | 'mastercard' | 'bank_transfer'>('visa');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm' = 'info') => {
    console.log('[Donation] Showing modal:', title, message);
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleQuickAmount = (value: number) => {
    console.log('[Donation] User selected quick amount:', value);
    setSelectedAmount(value);
    setAmount(value.toString());
  };

  const handleSubmit = async () => {
    console.log('[Donation] User tapped Make Contribution button');
    
    if (!donorName.trim()) {
      showModal('Erreur', 'Veuillez entrer votre nom complet', 'error');
      return;
    }

    if (!donorEmail.trim()) {
      showModal('Erreur', 'Veuillez entrer votre adresse email', 'error');
      return;
    }

    if (!amount.trim()) {
      showModal('Erreur', 'Veuillez entrer un montant', 'error');
      return;
    }

    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      showModal('Erreur', 'Veuillez entrer un montant valide supérieur à 0', 'error');
      return;
    }

    setLoading(true);
    console.log('[Donation] Processing contribution:', { 
      donorName, 
      donorEmail, 
      amount: donationAmount, 
      contributionType, 
      paymentMethod 
    });

    try {
      const data = await apiPost('/api/donations', {
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        amount: donationAmount.toString(),
        contributionType,
        paymentMethod,
        currency: 'EUR',
      });

      console.log('[Donation] Contribution successful:', data);
      setLoading(false);

      const contributionTypeText = contributionType === 'monthly' 
        ? 'mensuelle' 
        : contributionType === 'annual' 
        ? 'annuelle' 
        : 'ponctuelle';
      
      showModal(
        'Merci pour votre contribution!',
        `Votre contribution ${contributionTypeText} de ${donationAmount}€ a été enregistrée avec succès. Vous recevrez un reçu par email à ${donorEmail}.`,
        'success'
      );
      
      // Clear form after success and navigate back after delay
      setTimeout(() => {
        setDonorName('');
        setDonorEmail('');
        setAmount('');
        setSelectedAmount(null);
        setModalVisible(false);
        router.back();
      }, 3000);
    } catch (error: any) {
      setLoading(false);
      console.error('[Donation] Error processing contribution:', error);
      const errorMessage = error?.message || 'Une erreur est survenue lors du traitement de votre contribution.';
      showModal('Erreur', errorMessage, 'error');
    }
  };

  const amountValue = parseFloat(amount) || 0;
  const monthlyAmountText = amountValue > 0 ? `${amountValue}€/mois` : '';
  const annualAmountText = amountValue > 0 ? `${amountValue}€/an` : '';
  const oneTimeAmountText = amountValue > 0 ? `${amountValue}€` : '';

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Contribution',
        headerBackTitle: 'Retour',
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <IconSymbol 
            ios_icon_name="heart.fill" 
            android_material_icon_name="favorite" 
            size={48} 
            color={colors.accent} 
          />
          <Text style={styles.title}>Soutenez l&apos;A.R.M</Text>
          <Text style={styles.subtitle}>
            Votre contribution aide à construire un Mali meilleur
          </Text>
        </View>

        <View style={styles.form}>
          {/* Type de contribution */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type de contribution</Text>
            <View style={styles.contributionTypes}>
              <TouchableOpacity 
                style={[styles.contributionTypeButton, contributionType === 'one-time' && styles.contributionTypeButtonSelected]}
                onPress={() => setContributionType('one-time')}
              >
                <IconSymbol 
                  ios_icon_name="gift.fill" 
                  android_material_icon_name="card-giftcard" 
                  size={24} 
                  color={contributionType === 'one-time' ? colors.background : colors.primary} 
                />
                <Text style={[styles.contributionTypeText, contributionType === 'one-time' && styles.contributionTypeTextSelected]}>
                  Ponctuelle
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.contributionTypeButton, contributionType === 'monthly' && styles.contributionTypeButtonSelected]}
                onPress={() => setContributionType('monthly')}
              >
                <IconSymbol 
                  ios_icon_name="calendar" 
                  android_material_icon_name="event" 
                  size={24} 
                  color={contributionType === 'monthly' ? colors.background : colors.primary} 
                />
                <Text style={[styles.contributionTypeText, contributionType === 'monthly' && styles.contributionTypeTextSelected]}>
                  Mensuelle
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.contributionTypeButton, contributionType === 'annual' && styles.contributionTypeButtonSelected]}
                onPress={() => setContributionType('annual')}
              >
                <IconSymbol 
                  ios_icon_name="calendar.badge.clock" 
                  android_material_icon_name="date-range" 
                  size={24} 
                  color={contributionType === 'annual' ? colors.background : colors.primary} 
                />
                <Text style={[styles.contributionTypeText, contributionType === 'annual' && styles.contributionTypeTextSelected]}>
                  Annuelle
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Montant de la contribution</Text>
            <View style={styles.quickAmounts}>
              <TouchableOpacity 
                style={[styles.quickAmountButton, selectedAmount === 10 && styles.quickAmountButtonSelected]}
                onPress={() => handleQuickAmount(10)}
              >
                <Text style={[styles.quickAmountText, selectedAmount === 10 && styles.quickAmountTextSelected]}>10€</Text>
                {contributionType === 'monthly' && (
                  <Text style={[styles.quickAmountSubtext, selectedAmount === 10 && styles.quickAmountTextSelected]}>/mois</Text>
                )}
                {contributionType === 'annual' && (
                  <Text style={[styles.quickAmountSubtext, selectedAmount === 10 && styles.quickAmountTextSelected]}>/an</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickAmountButton, selectedAmount === 20 && styles.quickAmountButtonSelected]}
                onPress={() => handleQuickAmount(20)}
              >
                <Text style={[styles.quickAmountText, selectedAmount === 20 && styles.quickAmountTextSelected]}>20€</Text>
                {contributionType === 'monthly' && (
                  <Text style={[styles.quickAmountSubtext, selectedAmount === 20 && styles.quickAmountTextSelected]}>/mois</Text>
                )}
                {contributionType === 'annual' && (
                  <Text style={[styles.quickAmountSubtext, selectedAmount === 20 && styles.quickAmountTextSelected]}>/an</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickAmountButton, selectedAmount === 50 && styles.quickAmountButtonSelected]}
                onPress={() => handleQuickAmount(50)}
              >
                <Text style={[styles.quickAmountText, selectedAmount === 50 && styles.quickAmountTextSelected]}>50€</Text>
                {contributionType === 'monthly' && (
                  <Text style={[styles.quickAmountSubtext, selectedAmount === 50 && styles.quickAmountTextSelected]}>/mois</Text>
                )}
                {contributionType === 'annual' && (
                  <Text style={[styles.quickAmountSubtext, selectedAmount === 50 && styles.quickAmountTextSelected]}>/an</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Montant personnalisé (€)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setSelectedAmount(null);
              }}
              placeholder="Entrez un montant"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            
            {amountValue > 0 && (
              <View style={styles.amountSummary}>
                <Text style={styles.amountSummaryText}>
                  {contributionType === 'monthly' 
                    ? `Contribution mensuelle: ${amountValue}€/mois`
                    : contributionType === 'annual'
                    ? `Contribution annuelle: ${amountValue}€/an`
                    : `Contribution ponctuelle: ${amountValue}€`
                  }
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vos informations</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom complet</Text>
              <TextInput
                style={styles.input}
                value={donorName}
                onChangeText={setDonorName}
                placeholder="Votre nom"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={donorEmail}
                onChangeText={setDonorEmail}
                placeholder="votre@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Méthode de paiement</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity 
                style={[styles.paymentButton, paymentMethod === 'visa' && styles.paymentButtonSelected]}
                onPress={() => setPaymentMethod('visa')}
              >
                <IconSymbol 
                  ios_icon_name="creditcard.fill" 
                  android_material_icon_name="credit-card" 
                  size={24} 
                  color={paymentMethod === 'visa' ? colors.background : colors.primary} 
                />
                <Text style={[styles.paymentText, paymentMethod === 'visa' && styles.paymentTextSelected]}>Visa</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.paymentButton, paymentMethod === 'mastercard' && styles.paymentButtonSelected]}
                onPress={() => setPaymentMethod('mastercard')}
              >
                <IconSymbol 
                  ios_icon_name="creditcard.fill" 
                  android_material_icon_name="credit-card" 
                  size={24} 
                  color={paymentMethod === 'mastercard' ? colors.background : colors.primary} 
                />
                <Text style={[styles.paymentText, paymentMethod === 'mastercard' && styles.paymentTextSelected]}>Mastercard</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.paymentButton, paymentMethod === 'bank_transfer' && styles.paymentButtonSelected]}
                onPress={() => setPaymentMethod('bank_transfer')}
              >
                <IconSymbol 
                  ios_icon_name="building.columns.fill" 
                  android_material_icon_name="account-balance" 
                  size={24} 
                  color={paymentMethod === 'bank_transfer' ? colors.background : colors.primary} 
                />
                <Text style={[styles.paymentText, paymentMethod === 'bank_transfer' && styles.paymentTextSelected]}>Virement</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.submitButtonText}>Confirmer la contribution</Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <IconSymbol 
              ios_icon_name="lock.fill" 
              android_material_icon_name="lock" 
              size={20} 
              color={colors.primary} 
            />
            <Text style={styles.infoText}>
              Paiement sécurisé. Vous recevrez un reçu par email et pourrez annuler à tout moment.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

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
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  contributionTypes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contributionTypeButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 20,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  contributionTypeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  contributionTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  contributionTypeTextSelected: {
    color: colors.background,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickAmountButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  quickAmountSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quickAmountTextSelected: {
    color: colors.background,
  },
  amountSummary: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  amountSummaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
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
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  paymentButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  paymentTextSelected: {
    color: colors.background,
  },
  submitButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
  },
  bottomSpacer: {
    height: 20,
  },
});
