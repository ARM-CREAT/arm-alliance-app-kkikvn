
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

interface SuccessData {
  membershipNumber: string;
  id: string;
  message?: string;
}

export default function MemberRegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    region: '',
    cercle: '',
    commune: '',
    profession: '',
    nina: '',
    motivation: '',
  });

  const updateField = (field: keyof typeof formData) => (text: string) => {
    setFormData(prev => ({ ...prev, [field]: text }));
    if (errorMessage) setErrorMessage(null);
  };

  const validate = (): string | null => {
    if (!formData.firstName.trim() || formData.firstName.trim().length < 2) {
      return 'Le prénom doit contenir au moins 2 caractères.';
    }
    if (!formData.lastName.trim() || formData.lastName.trim().length < 2) {
      return 'Le nom doit contenir au moins 2 caractères.';
    }
    const phoneRegex = /^[0-9+\s\-]{8,15}$/;
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone.trim())) {
      return 'Veuillez entrer un numéro de téléphone valide (8-15 chiffres).';
    }
    return null;
  };

  const handleSubmit = async () => {
    console.log('[MemberRegister] Bouton S\'inscrire appuyé');

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    setErrorMessage(null);

    const payload: Record<string, string> = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
    };
    if (formData.email.trim()) payload.email = formData.email.trim();
    if (formData.region.trim()) payload.region = formData.region.trim();
    if (formData.cercle.trim()) payload.cercle = formData.cercle.trim();
    if (formData.commune.trim()) payload.commune = formData.commune.trim();
    if (formData.profession.trim()) payload.profession = formData.profession.trim();
    if (formData.nina.trim()) payload.nina = formData.nina.trim();
    if (formData.motivation.trim()) payload.motivation = formData.motivation.trim();

    console.log('[MemberRegister] POST /api/members/register payload:', JSON.stringify(payload));

    try {
      const res = await fetch(`${BACKEND_URL}/api/members/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        const existingNumber = data?.membershipNumber || data?.member?.membershipNumber || '';
        console.log('[MemberRegister] 409 - Déjà inscrit, numéro:', existingNumber);
        Alert.alert(
          'Déjà inscrit',
          `Vous êtes déjà inscrit. Votre numéro: ${existingNumber}`,
          [
            {
              text: 'Voir ma carte',
              onPress: () => router.push({ pathname: '/member/card', params: { membershipNumber: existingNumber } } as any),
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        let msg = `Erreur ${res.status}`;
        try {
          const json = JSON.parse(text);
          msg = json.error || json.message || msg;
        } catch {
          if (text) msg = text;
        }
        throw new Error(msg);
      }

      const data = await res.json();
      console.log('[MemberRegister] Inscription réussie:', JSON.stringify(data));

      const membershipNumber =
        data?.membershipNumber ||
        data?.member?.membershipNumber ||
        data?.member?.membership_number ||
        'N/A';

      setSuccessData({ membershipNumber, id: data?.id || data?.member?.id || '', message: data?.message });

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.error('[MemberRegister] Erreur:', err);
      setErrorMessage(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (successData) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Adhésion au Parti',
            headerShown: true,
            headerBackTitle: 'Retour',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <ScrollView contentContainerStyle={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={72}
              color="#2E7D32"
            />
          </View>
          <Text style={styles.successTitle}>Inscription réussie !</Text>
          <Text style={styles.successLabel}>Votre numéro de membre :</Text>
          <View style={styles.memberNumberBox}>
            <Text style={styles.memberNumber}>{successData.membershipNumber}</Text>
          </View>
          <Text style={styles.successSubtitle}>Conservez ce numéro précieusement</Text>

          <TouchableOpacity
            style={styles.successPrimaryBtn}
            onPress={() => {
              console.log('[MemberRegister] Bouton Voir ma carte appuyé');
              router.push({ pathname: '/member/card', params: { membershipNumber: successData.membershipNumber } } as any);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.successPrimaryBtnText}>Voir ma carte</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.successSecondaryBtn}
            onPress={() => {
              console.log('[MemberRegister] Bouton Retour à l\'accueil appuyé');
              router.replace('/(tabs)/(home)');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.successSecondaryBtnText}>Retour à l&apos;accueil</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Adhésion au Parti',
          headerShown: true,
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formHeader}>
            <IconSymbol
              ios_icon_name="person.badge.plus"
              android_material_icon_name="person-add"
              size={48}
              color={colors.primary}
            />
            <Text style={styles.headerTitle}>Devenir Militant A.R.M</Text>
            <Text style={styles.headerSubtitle}>
              Rejoignez l&apos;Alliance pour le Rassemblement Malien
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Prénom *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Prénom"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.firstName}
                  onChangeText={updateField('firstName')}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Nom *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nom de famille"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.lastName}
                  onChangeText={updateField('lastName')}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone *</Text>
              <TextInput
                style={styles.input}
                placeholder="+223 XX XX XX XX"
                placeholderTextColor={colors.textSecondary}
                value={formData.phone}
                onChangeText={updateField('phone')}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (Optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="votre.email@exemple.com"
                placeholderTextColor={colors.textSecondary}
                value={formData.email}
                onChangeText={updateField('email')}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Région (Optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: District de Bamako"
                placeholderTextColor={colors.textSecondary}
                value={formData.region}
                onChangeText={updateField('region')}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Cercle (Optionnel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Kati"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.cercle}
                  onChangeText={updateField('cercle')}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Commune (Optionnel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Commune I"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.commune}
                  onChangeText={updateField('commune')}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profession (Optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Enseignant, Commerçant..."
                placeholderTextColor={colors.textSecondary}
                value={formData.profession}
                onChangeText={updateField('profession')}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numéro NINA (Optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Numéro d'identification nationale"
                placeholderTextColor={colors.textSecondary}
                value={formData.nina}
                onChangeText={updateField('nina')}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Motivation (Optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Pourquoi souhaitez-vous rejoindre l'A.R.M?"
                placeholderTextColor={colors.textSecondary}
                value={formData.motivation}
                onChangeText={updateField('motivation')}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {errorMessage && (
              <View style={styles.errorBox}>
                <IconSymbol
                  ios_icon_name="exclamationmark.circle.fill"
                  android_material_icon_name="error"
                  size={18}
                  color={colors.error}
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>
                Les champs marqués d&apos;un * sont obligatoires. Votre inscription sera examinée par un administrateur.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>S&apos;inscrire</Text>
                  <IconSymbol
                    ios_icon_name="arrow.right"
                    android_material_icon_name="arrow-forward"
                    size={20}
                    color={colors.background}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  formHeader: {
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
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
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
  },
  textArea: {
    minHeight: 90,
    paddingTop: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
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
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.background,
  },
  // Success screen
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIconCircle: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  successLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  memberNumberBox: {
    backgroundColor: colors.primary + '15',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 16,
    marginBottom: 12,
  },
  memberNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 36,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  successPrimaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successPrimaryBtnText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  successSecondaryBtn: {
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  successSecondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});
