import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput as TextInputType,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '@/utils/api';
import { Colors } from '@/constants/Colors';

const C = Colors.light;

const GENDER_OPTIONS = [
  { label: 'Homme', value: 'male' },
  { label: 'Femme', value: 'female' },
];

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  const requiredMark = required ? ' *' : '';
  const labelText = text + requiredMark;
  return <Text style={styles.label}>{labelText}</Text>;
}

function FieldError({ message }: { message: string }) {
  if (!message) return null;
  return <Text style={styles.fieldError}>{message}</Text>;
}

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  // Required fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Optional fields
  const [email, setEmail] = useState('');
  const [commune, setCommune] = useState('');
  const [region, setRegion] = useState('');
  const [profession, setProfession] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [genderPickerVisible, setGenderPickerVisible] = useState(false);

  // Validation errors
  const [fullNameError, setFullNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Duplicate member modal
  const [duplicateModal, setDuplicateModal] = useState(false);
  const [duplicateMemberNumber, setDuplicateMemberNumber] = useState('');
  const [duplicateFullName, setDuplicateFullName] = useState('');

  // Refs for keyboard navigation
  const phoneRef = useRef<TextInputType>(null);
  const emailRef = useRef<TextInputType>(null);
  const communeRef = useRef<TextInputType>(null);
  const regionRef = useRef<TextInputType>(null);
  const professionRef = useRef<TextInputType>(null);
  const dateOfBirthRef = useRef<TextInputType>(null);

  const validate = (): boolean => {
    let valid = true;
    if (!fullName.trim()) {
      setFullNameError('Le nom complet est requis');
      valid = false;
    } else {
      setFullNameError('');
    }
    if (!phone.trim()) {
      setPhoneError('Le numéro de téléphone est requis');
      valid = false;
    } else if (phone.trim().length < 8) {
      setPhoneError('Le numéro doit contenir au moins 8 caractères');
      valid = false;
    } else {
      setPhoneError('');
    }
    return valid;
  };

  const handleSubmit = async () => {
    console.log('[Register] Bouton "Adhérer maintenant" appuyé');
    setErrorBanner('');
    if (!validate()) {
      console.log('[Register] Validation échouée');
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
    if (commune.trim()) payload.address = commune.trim();
    if (region.trim()) payload.region = region.trim();
    if (profession.trim()) payload.profession = profession.trim();
    if (dateOfBirth.trim()) payload.date_of_birth = dateOfBirth.trim();
    if (gender) payload.gender = gender;

    console.log('[Register] POST /api/members/register payload:', JSON.stringify(payload));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('[Register] Timeout de 30 secondes atteint');
    }, 30000);

    try {
      const response = await fetch(`${BACKEND_URL}/api/members/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        console.error('[Register] Erreur HTTP', response.status, text);

        if (response.status === 409) {
          let dupMemberNumber = '';
          let dupFullName = '';
          try {
            const json = JSON.parse(text);
            dupMemberNumber = json.membership_number ?? json.member_number ?? '';
            dupFullName = json.member_name ?? json.full_name ?? '';
            console.log('[Register] 409 PHONE_EXISTS — membre existant:', dupMemberNumber, dupFullName);
          } catch {
            console.error('[Register] 409 — impossible de parser la réponse JSON:', text);
          }
          setDuplicateMemberNumber(dupMemberNumber);
          setDuplicateFullName(dupFullName);
          setDuplicateModal(true);
          setLoading(false);
          return;
        }

        let message = `Erreur ${response.status}. Veuillez réessayer.`;
        try {
          const json = JSON.parse(text);
          message = json.message || json.error || message;
        } catch {
          if (text && text.length < 300) message = text;
        }
        console.error('[Register] Message d\'erreur affiché:', message);
        setErrorBanner(message);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('[Register] Inscription réussie:', JSON.stringify(data));

      const membershipNumber = data.membership_number ?? data.member_number ?? '';
      const memberFullName = data.member_name ?? data.full_name ?? fullName.trim();
      console.log('[Register] Navigation vers /member/success, numéro:', membershipNumber);

      router.replace({
        pathname: '/member/success',
        params: {
          membership_number: membershipNumber,
          full_name: memberFullName,
        },
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('[Register] Requête annulée (timeout 30s)');
        setErrorBanner('La requête a expiré. Vérifiez votre connexion et réessayez.');
      } else {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[Register] Erreur réseau:', message, err);
        setErrorBanner('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = () => {
    console.log('[Register] Lien "Déjà inscrit" appuyé');
    router.push('/member/recover');
  };

  const genderLabel = gender === 'male' ? 'Homme' : gender === 'female' ? 'Femme' : '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Adhésion ARM',
          headerShown: true,
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: C.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

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
              <Ionicons name="person-circle" size={48} color={C.primary} />
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
                    <Text style={styles.duplicateMemberNumber}>{duplicateMemberNumber}</Text>
                  </>
                ) : null}
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.duplicatePrimaryBtn}
              activeOpacity={0.85}
              onPress={() => {
                console.log('[Register] Modal 409 — "Voir ma carte" appuyé, member_number:', duplicateMemberNumber);
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
                console.log('[Register] Modal 409 — "Fermer" appuyé');
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
                    console.log('[Register] Sexe sélectionné:', opt.label);
                    setGender(opt.value);
                    setGenderPickerVisible(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={C.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.pickerCancel}
              onPress={() => {
                console.log('[Register] Picker sexe annulé');
                setGenderPickerVisible(false);
              }}
            >
              <Text style={styles.pickerCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="people" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>Adhésion ARM</Text>
          <Text style={styles.subtitle}>Rejoignez le mouvement</Text>
        </View>

        {/* Error Banner */}
        {errorBanner ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.errorBannerText}>{errorBanner}</Text>
          </View>
        ) : null}

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Informations requises</Text>

          {/* Nom complet */}
          <View style={styles.fieldGroup}>
            <FieldLabel text="Nom complet" required />
            <TextInput
              style={[styles.input, fullNameError ? styles.inputError : null]}
              value={fullName}
              onChangeText={(v) => { setFullName(v); if (v.trim()) setFullNameError(''); }}
              placeholder="Prénom et nom de famille"
              placeholderTextColor={C.textTertiary}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            <FieldError message={fullNameError} />
          </View>

          {/* Téléphone */}
          <View style={styles.fieldGroup}>
            <FieldLabel text="Téléphone" required />
            <TextInput
              ref={phoneRef}
              style={[styles.input, phoneError ? styles.inputError : null]}
              value={phone}
              onChangeText={(v) => { setPhone(v); if (v.trim()) setPhoneError(''); }}
              placeholder="+223 XX XX XX XX"
              placeholderTextColor={C.textTertiary}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            <FieldError message={phoneError} />
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Informations optionnelles</Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <FieldLabel text="Email" />
            <TextInput
              ref={emailRef}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              placeholderTextColor={C.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => communeRef.current?.focus()}
            />
          </View>

          {/* Commune */}
          <View style={styles.fieldGroup}>
            <FieldLabel text="Commune" />
            <TextInput
              ref={communeRef}
              style={styles.input}
              value={commune}
              onChangeText={setCommune}
              placeholder="Votre commune"
              placeholderTextColor={C.textTertiary}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => regionRef.current?.focus()}
            />
          </View>

          {/* Région */}
          <View style={styles.fieldGroup}>
            <FieldLabel text="Région" />
            <TextInput
              ref={regionRef}
              style={styles.input}
              value={region}
              onChangeText={setRegion}
              placeholder="Votre région"
              placeholderTextColor={C.textTertiary}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => professionRef.current?.focus()}
            />
          </View>

          {/* Profession */}
          <View style={styles.fieldGroup}>
            <FieldLabel text="Profession" />
            <TextInput
              ref={professionRef}
              style={styles.input}
              value={profession}
              onChangeText={setProfession}
              placeholder="Votre profession"
              placeholderTextColor={C.textTertiary}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => dateOfBirthRef.current?.focus()}
            />
          </View>

          {/* Date de naissance */}
          <View style={styles.fieldGroup}>
            <FieldLabel text="Date de naissance" />
            <TextInput
              ref={dateOfBirthRef}
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor={C.textTertiary}
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
            />
          </View>

          {/* Sexe */}
          <View style={styles.fieldGroup}>
            <FieldLabel text="Sexe" />
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() => {
                console.log('[Register] Ouverture picker sexe');
                setGenderPickerVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerTriggerText, !gender && styles.pickerTriggerPlaceholder]}>
                {genderLabel || 'Sélectionner'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={C.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Info numéro auto */}
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={16} color={C.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.infoText}>Votre numéro d'adhérent sera généré automatiquement</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Inscription en cours...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.btnIcon} />
                <Text style={styles.submitButtonText}>Adhérer maintenant</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Recover link */}
        <TouchableOpacity style={styles.recoverLink} onPress={handleRecover} activeOpacity={0.7}>
          <Text style={styles.recoverLinkText}>Déjà inscrit ? Retrouver ma carte</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  header: {
    backgroundColor: C.primary,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: C.accent,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    fontStyle: 'italic',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.danger,
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
  formCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: -24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: C.divider,
    marginVertical: 20,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: C.text,
    backgroundColor: C.surfaceSecondary,
  },
  inputError: {
    borderColor: C.danger,
    backgroundColor: '#FFF5F5',
  },
  fieldError: {
    fontSize: 12,
    color: C.danger,
    marginTop: 6,
    marginLeft: 4,
  },
  pickerTrigger: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surfaceSecondary,
  },
  pickerTriggerText: {
    fontSize: 16,
    color: C.text,
  },
  pickerTriggerPlaceholder: {
    color: C.textTertiary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  btnIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  recoverLink: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  recoverLinkText: {
    fontSize: 15,
    color: C.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Duplicate modal
  duplicateSheet: {
    backgroundColor: C.surface,
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
    color: C.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  duplicateBody: {
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  duplicateInfoBox: {
    backgroundColor: C.primaryMuted,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.primary + '30',
  },
  duplicateInfoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  duplicateInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  duplicateInfoDivider: {
    height: 1,
    backgroundColor: C.divider,
    marginVertical: 12,
  },
  duplicateMemberNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: C.primary,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  duplicatePrimaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: C.surfaceSecondary,
  },
  duplicateSecondaryBtnText: {
    fontSize: 15,
    color: C.textSecondary,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
  },
  pickerSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.textSecondary,
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
    backgroundColor: C.primaryMuted,
  },
  pickerOptionText: {
    fontSize: 17,
    color: C.text,
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: C.primary,
    fontWeight: '700',
  },
  pickerCancel: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: C.surfaceSecondary,
  },
  pickerCancelText: {
    fontSize: 16,
    color: C.textSecondary,
    fontWeight: '600',
  },
});
