
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
import { useLocalization } from "@/contexts/LocalizationContext";
import { convertCurrency, formatCurrency, Currency } from "@/utils/currency";

type ContributionType = 'one-time' | 'monthly' | 'annual';

export default function DonationScreen() {
  const router = useRouter();
  const { t, currency } = useLocalization();
  
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

  // Quick amounts in EUR (base currency)
  const quickAmountsEUR = [10, 20, 50];
  
  // Convert quick amounts to selected currency
  const quickAmounts = quickAmountsEUR.map(amt => 
    Math.round(convertCurrency(amt, 'EUR', currency))
  );

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
      showModal(t('error'), t('errorName'), 'error');
      return;
    }

    if (!donorEmail.trim()) {
      showModal(t('error'), t('errorEmail'), 'error');
      return;
    }

    if (!amount.trim()) {
      showModal(t('error'), t('errorAmount'), 'error');
      return;
    }

    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      showModal(t('error'), t('errorAmountValid'), 'error');
      return;
    }

    setLoading(true);
    console.log('[Donation] Processing contribution:', { 
      donorName, 
      donorEmail, 
      amount: donationAmount,
      currency,
      contributionType, 
      paymentMethod 
    });

    try {
      // Convert amount to EUR for backend storage
      const amountInEUR = convertCurrency(donationAmount, currency, 'EUR');
      
      const data = await apiPost('/api/donations', {
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        amount: amountInEUR.toString(),
        contributionType,
        paymentMethod,
        currency: 'EUR', // Backend stores in EUR
        displayCurrency: currency, // User's selected currency for display
        displayAmount: donationAmount.toString(),
      });

      console.log('[Donation] Contribution successful:', data);
      setLoading(false);

      const formattedAmount = formatCurrency(donationAmount, currency);
      const contributionTypeText = contributionType === 'monthly' 
        ? t('monthly').toLowerCase()
        : contributionType === 'annual' 
        ? t('annual').toLowerCase()
        : t('oneTime').toLowerCase();
      
      showModal(
        t('thankYou'),
        t('contributionSuccess', { amount: formattedAmount }),
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
      showModal(t('error'), errorMessage, 'error');
    }
  };

  const amountValue = parseFloat(amount) || 0;
  const formattedAmount = amountValue > 0 ? formatCurrency(amountValue, currency) : '';

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: t('donation'),
        headerBackTitle: t('back'),
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <IconSymbol 
            ios_icon_name="heart.fill" 
            android_material_icon_name="favorite" 
            size={48} 
            color={colors.accent} 
          />
          <Text style={styles.title}>{t('supportARM')}</Text>
          <Text style={styles.subtitle}>
            {t('supportDescription')}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Type de contribution */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('contributionType')}</Text>
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
                  {t('oneTime')}
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
                  {t('monthly')}
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
                  {t('annual')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('amount')}</Text>
            <View style={styles.quickAmounts}>
              {quickAmounts.map((value, index) => {
                const isSelected = selectedAmount === value;
                const displayValue = formatCurrency(value, currency);
                return (
                  <TouchableOpacity 
                    key={index}
                    style={[styles.quickAmountButton, isSelected && styles.quickAmountButtonSelected]}
                    onPress={() => handleQuickAmount(value)}
                  >
                    <Text style={[styles.quickAmountText, isSelected && styles.quickAmountTextSelected]}>
                      {displayValue}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <Text style={styles.label}>{t('customAmount')}</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setSelectedAmount(null);
              }}
              placeholder={t('enterAmount')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            
            {amountValue > 0 && (
              <View style={styles.amountSummary}>
                <Text style={styles.amountSummaryText}>
                  {contributionType === 'monthly' 
                    ? `${t('monthly')}: ${formattedAmount}/${t('monthly').toLowerCase()}`
                    : contributionType === 'annual'
                    ? `${t('annual')}: ${formattedAmount}/${t('annual').toLowerCase()}`
                    : `${t('oneTime')}: ${formattedAmount}`
                  }
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('yourInfo')}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('fullName')}</Text>
              <TextInput
                style={styles.input}
                value={donorName}
                onChangeText={setDonorName}
                placeholder={t('fullName')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('email')}</Text>
              <TextInput
                style={styles.input}
                value={donorEmail}
                onChangeText={setDonorEmail}
                placeholder={t('email')}
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('paymentMethod')}</Text>
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
                <Text style={[styles.paymentText, paymentMethod === 'bank_transfer' && styles.paymentTextSelected]}>
                  {currency === 'XOF' ? 'Mobile Money' : 'Virement'}
                </Text>
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
              <Text style={styles.submitButtonText}>{t('confirmContribution')}</Text>
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
              {t('securePayment')}
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
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
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
