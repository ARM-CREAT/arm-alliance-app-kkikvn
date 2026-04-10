
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '@/utils/api';

const GENDER_OPTIONS = [
  { label: 'Homme', value: 'male' },
  { label: 'Femme', value: 'female' },
  { label: 'Autre', value: 'other' },
];

interface FormErrors {
  fullName?: string;
  phone?: string;
}

export default function MembershipScreen() {
  const router = useRouter();

  // Required fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Optional fields
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [commune, setCommune] = useState('');
  const [gender, setGender] = useState('');
  const [genderPickerVisible, setGenderPickerVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [errorBanner, setErrorBanner] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Duplicate (409) modal
  const [duplicateModal, setDuplicateModal] = useState(false);
  const [duplicateMemberNumber, setDuplicateMemberNumber] = useState('');
  const [duplicateFullName, setDuplicateFullName] = useState('');

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Le nom complet est requis';
    if (!phone.trim()) newErrors.phone = 'Le numéro de téléphone est requis';
    else if (phone.trim().length < 8) newErrors.phone = 'Le numéro doit contenir au moins 8 caractères';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const genderLabel = gender === 'male' ? 'Homme' : gender === 'female' ? 'Femme' : gender === 'other' ? 'Autre' : '';

  const handleSubmit = async () => {
    console.log("[Profile] Bouton 'Adhérer maintenant' appuyé");
    setErrorBanner('');

    if (!validate()) {
      console.log('[Profile] Validation échouée', errors);
      return;
    }

    setLoading(true);

    // Split full_name into first_name / last_name for the API
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const payload: Record<string, string> = {
      first_name: firstName,
      last_name: lastName,
      phone: phone.trim(),
    };
    if (email.trim()) payload.email = email.trim();
    if (region.trim()) payload.region = region.trim();
    if (commune.trim()) payload.address = commune.trim();
    if (gender) payload.gender = gender;

    console.log('[Profile] POST /api/members/register', JSON.stringify(payload));

    try {
      const response = await fetch(`${BACKEND_URL}/api/members/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.log('[Profile] Erreur HTTP', response.status, text);

        if (response.status === 409) {
          let dupNumber = '';
          let dupName = '';
          try {
            const json = JSON.parse(text);
            dupNumber = json.membership_number ?? json.member_number ?? '';
            dupName = json.member_name ?? json.full_name ?? '';
            console.log('[Profile] 409 doublon — membre existant:', dupNumber, dupName);
          } catch {
            console.log('[Profile] 409 — impossible de parser la réponse');
          }
          setDuplicateMemberNumber(dupNumber);
          setDuplicateFullName(dupName);
          setDuplicateModal(true);
          return;
        }

        let message = `Erreur ${response.status}. Veuillez réessayer.`;
        try {
          const json = JSON.parse(text);
          message = json.error || json.message || message;
        } catch {
          message = text || message;
        }
        setErrorBanner(message);
        return;
      }

      const data = await response.json();
      const membershipNumber = data.membership_number ?? data.membershipNumber ?? '';
      const returnedName = data.member_name ?? data.full_name ?? fullName.trim();
      console.log('[Profile] Inscription réussie:', membershipNumber);

      router.push({
        pathname: '/member/success',
        params: {
          membership_number: membershipNumber,
          full_name: returnedName,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Profile] Erreur réseau:', message);
      setErrorBanner('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string, hasError?: boolean) => [
    styles.input,
    focusedField === field && styles.inputFocused,
    hasError && styles.inputError,
  ];

  const monoFont = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

  return (
    <>
      {/* Duplicate member modal (409) */}
      <Modal
        visible={duplicateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setDuplicateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.duplicateSheet}>
            <View style={styles.duplicateIconRow}>
              <Ionicons name="person-circle" size={48} color={colors.primary} />
            </View>
            <Text style={styles.duplicateTitle}>Numéro déjà inscrit</Text>
            <Text style={styles.duplicateBody}>Ce numéro de téléphone est déjà inscrit.</Text>
            {duplicateFullName ? (
              <View style={styles.duplicateInfoBox}>
                <Text style={styles.duplicateInfoLabel}>NOM</Text>
                <Text style={styles.duplicateInfoValue}>{duplicateFullName}</Text>
                {duplicateMemberNumber ? (
                  <>
                    <View style={styles.duplicateInfoDivider} />
                    <Text style={styles.duplicateInfoLabel}>NUMÉRO DE MEMBRE</Text>
                    <Text style={[styles.duplicateMemberNumber, { fontFamily: monoFont }]}>{duplicateMemberNumber}</Text>
                  </>
                ) : null}
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.duplicatePrimaryBtn}
              activeOpacity={0.85}
              onPress={() => {
                console.log("[Profile] Modal 409 — 'Voir ma carte' appuyé, member_number:", duplicateMemberNumber);
                setDuplicateModal(false);
                router.push({
                  pathname: '/member/card',
                  params: {
                    member_number: duplicateMemberNumber,
                    full_name: duplicateFullName,
                  },
                });
              }}
            >
              <Ionicons name="card" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.duplicatePrimaryBtnText}>Voir ma carte</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.duplicateSecondaryBtn}
              activeOpacity={0.7}
              onPress={() => {
                console.log("[Profile] Modal 409 — 'Fermer' appuyé");
                setDuplicateModal(false);
              }}
            >
              <Text style={styles.duplicateSecondaryBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Gender picker modal */}
      <Modal
        visible={genderPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGenderPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setGenderPickerVisible(false)}
        >
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Sélectionner le sexe</Text>
            {GENDER_OPTIONS.map((opt) => {
              const isSelected = gender === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
                  onPress={() => {
                    console.log('[Profile] Sexe sélectionné:', opt.label);
                    setGender(opt.value);
                    setGenderPickerVisible(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.pickerCancel}
              onPress={() => {
                console.log('[Profile] Picker sexe annulé');
                setGenderPickerVisible(false);
              }}
            >
              <Text style={styles.pickerCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>ARM</Text>
          </View>
          <Text style={styles.title}>Adhésion ARM</Text>
          <Text style={styles.subtitle}>
            Rejoignez l'Alliance pour le Rassemblement Malien
          </Text>
        </View>

        {/* Error Banner */}
        {errorBanner ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.errorBannerText}>{errorBanner}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Text style={styles.sectionLabel}>Informations requises</Text>

          {/* Nom complet */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nom complet <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={inputStyle('fullName', !!errors.fullName)}
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                if (errors.fullName) setErrors((e) => ({ ...e, fullName: undefined }));
              }}
              placeholder="Prénom et nom de famille"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              editable={!loading}
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField(null)}
            />
            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
          </View>

          {/* Téléphone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Téléphone <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={inputStyle('phone', !!errors.phone)}
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
              }}
              placeholder="+223 XX XX XX XX"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              editable={!loading}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
            />
            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Informations optionnelles</Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={inputStyle('email')}
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Région */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Région</Text>
            <TextInput
              style={inputStyle('region')}
              value={region}
              onChangeText={setRegion}
              placeholder="Votre région"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              editable={!loading}
              onFocus={() => setFocusedField('region')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Commune */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Commune</Text>
            <TextInput
              style={inputStyle('commune')}
              value={commune}
              onChangeText={setCommune}
              placeholder="Votre commune"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              editable={!loading}
              onFocus={() => setFocusedField('commune')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Sexe */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sexe</Text>
            <TouchableOpacity
              style={[styles.input, styles.pickerTrigger, focusedField === 'gender' && styles.inputFocused]}
              onPress={() => {
                console.log('[Profile] Ouverture picker sexe');
                setGenderPickerVisible(true);
              }}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={[styles.pickerTriggerText, !gender && styles.pickerTriggerPlaceholder]}>
                {genderLabel || 'Sélectionner'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10, marginTop: 1 }} />
            <Text style={styles.infoText}>
              Votre numéro d'adhérent sera généré automatiquement après soumission.
            </Text>
          </View>

          <AnimatedPressable
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Inscription en cours...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Adhérer maintenant</Text>
              </>
            )}
          </AnimatedPressable>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
  },
  headerBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerBadgeText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.danger,
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
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 20,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerTriggerText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerTriggerPlaceholder: {
    color: colors.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
  },
  duplicateSheet: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginHorizontal: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  duplicateIconRow: {
    marginBottom: 12,
  },
  duplicateTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  duplicateBody: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  duplicateInfoBox: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  duplicateInfoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  duplicateInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  duplicateInfoDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },
  duplicateMemberNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 2,
  },
  duplicatePrimaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },
  duplicatePrimaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  duplicateSecondaryBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
  },
  duplicateSecondaryBtnText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primaryMuted,
  },
  pickerOptionText: {
    fontSize: 17,
    color: colors.text,
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  pickerCancel: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
  },
  pickerCancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
