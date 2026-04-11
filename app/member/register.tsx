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
import { BACKEND_URL } from '@/utils/api';

const PRIMARY = '#4CAF50';

const MEMBERSHIP_TYPES = [
  { label: 'Standard', value: 'standard' },
  { label: 'Actif', value: 'actif' },
  { label: 'Sympathisant', value: 'sympathisant' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [success, setSuccess] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [commune, setCommune] = useState('');
  const [region, setRegion] = useState('');
  const [profession, setProfession] = useState('');
  const [membershipType, setMembershipType] = useState('standard');
  const [message, setMessage] = useState('');
  const [typePickerVisible, setTypePickerVisible] = useState(false);

  // Validation errors
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Refs for keyboard navigation
  const emailRef = useRef<TextInputType>(null);
  const phoneRef = useRef<TextInputType>(null);
  const communeRef = useRef<TextInputType>(null);
  const regionRef = useRef<TextInputType>(null);
  const professionRef = useRef<TextInputType>(null);
  const messageRef = useRef<TextInputType>(null);

  const validate = (): boolean => {
    let valid = true;
    if (!fullName.trim()) {
      setFullNameError('Le nom complet est requis');
      valid = false;
    } else {
      setFullNameError('');
    }
    if (!email.trim()) {
      setEmailError('L\'email est requis');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Email invalide');
      valid = false;
    } else {
      setEmailError('');
    }
    return valid;
  };

  const handleSubmit = async () => {
    console.log('[Register] Bouton Soumettre appuyé');
    setErrorBanner('');
    if (!validate()) {
      console.log('[Register] Validation échouée');
      return;
    }

    const payload: Record<string, string> = {
      full_name: fullName.trim(),
      email: email.trim(),
    };
    if (phone.trim()) payload.phone = phone.trim();
    if (commune.trim()) payload.commune = commune.trim();
    if (region.trim()) payload.region = region.trim();
    if (profession.trim()) payload.profession = profession.trim();
    if (membershipType) payload.membership_type = membershipType;
    if (message.trim()) payload.message = message.trim();

    console.log('[Register] POST /api/members/register', JSON.stringify(payload));
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/members/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('[Register] Erreur HTTP', res.status, text.slice(0, 200));

        if (res.status === 409) {
          console.log('[Register] 409 — email déjà enregistré');
          setErrorBanner('Cet email est déjà enregistré.');
          setLoading(false);
          return;
        }

        let msg = `Erreur ${res.status}. Veuillez réessayer.`;
        try {
          const json = JSON.parse(text);
          msg = json.message || json.error || msg;
        } catch {
          if (text && text.length < 300) msg = text;
        }
        setErrorBanner(msg);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log('[Register] Inscription réussie:', JSON.stringify(data));
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Register] Erreur réseau:', msg);
      setErrorBanner('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeLabel = MEMBERSHIP_TYPES.find((t) => t.value === membershipType)?.label ?? 'Standard';

  if (success) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Adhésion ARM',
            headerStyle: { backgroundColor: PRIMARY },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Text style={styles.successIcon}>✅</Text>
          </View>
          <Text style={styles.successTitle}>Demande soumise !</Text>
          <Text style={styles.successBody}>
            Votre demande d'adhésion a été soumise avec succès !
          </Text>
          <Text style={styles.successSubBody}>
            Vous recevrez une confirmation par email une fois votre demande traitée.
          </Text>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => {
              console.log('[Register] Bouton Retour à l\'accueil appuyé');
              router.back();
            }}
          >
            <Text style={styles.successBtnText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Adhésion ARM',
          headerStyle: { backgroundColor: PRIMARY },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      {/* Membership type picker modal */}
      <Modal
        visible={typePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTypePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTypePickerVisible(false)}
        >
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Type d'adhésion</Text>
            {MEMBERSHIP_TYPES.map((opt) => {
              const isSelected = membershipType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
                  onPress={() => {
                    console.log('[Register] Type adhésion sélectionné:', opt.label);
                    setMembershipType(opt.value);
                    setTypePickerVisible(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.pickerCancel}
              onPress={() => {
                console.log('[Register] Picker type annulé');
                setTypePickerVisible(false);
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
            <Text style={styles.headerIcon}>👥</Text>
          </View>
          <Text style={styles.title}>Adhésion ARM</Text>
          <Text style={styles.subtitle}>Rejoignez le mouvement</Text>
        </View>

        {/* Error Banner */}
        {!!errorBanner && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorBanner}</Text>
          </View>
        )}

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>INFORMATIONS REQUISES</Text>

          {/* Prénom et Nom */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Prénom et Nom *</Text>
            <TextInput
              style={[styles.input, !!fullNameError && styles.inputError]}
              value={fullName}
              onChangeText={(v) => { setFullName(v); if (v.trim()) setFullNameError(''); }}
              placeholder="Votre prénom et nom"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            {!!fullNameError && <Text style={styles.fieldError}>{fullNameError}</Text>}
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              ref={emailRef}
              style={[styles.input, !!emailError && styles.inputError]}
              value={email}
              onChangeText={(v) => { setEmail(v); if (v.trim()) setEmailError(''); }}
              placeholder="votre@email.com"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>INFORMATIONS OPTIONNELLES</Text>

          {/* Téléphone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              ref={phoneRef}
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+223 XX XX XX XX"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => communeRef.current?.focus()}
            />
          </View>

          {/* Commune */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Commune</Text>
            <TextInput
              ref={communeRef}
              style={styles.input}
              value={commune}
              onChangeText={setCommune}
              placeholder="Votre commune"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => regionRef.current?.focus()}
            />
          </View>

          {/* Région */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Région</Text>
            <TextInput
              ref={regionRef}
              style={styles.input}
              value={region}
              onChangeText={setRegion}
              placeholder="Votre région"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => professionRef.current?.focus()}
            />
          </View>

          {/* Profession */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Profession</Text>
            <TextInput
              ref={professionRef}
              style={styles.input}
              value={profession}
              onChangeText={setProfession}
              placeholder="Votre profession"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Type d'adhésion */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Type d'adhésion</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() => {
                console.log('[Register] Ouverture picker type adhésion');
                setTypePickerVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerTriggerText}>{selectedTypeLabel}</Text>
              <Text style={styles.pickerChevron}>▾</Text>
            </TouchableOpacity>
          </View>

          {/* Message */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Message (optionnel)</Text>
            <TextInput
              ref={messageRef}
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Un message pour l'organisation..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Soumettre ma demande</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  header: {
    backgroundColor: PRIMARY,
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    fontStyle: 'italic',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: -24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FFF5F5',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  fieldError: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 5,
    marginLeft: 2,
  },
  pickerTrigger: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
  },
  pickerTriggerText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  pickerChevron: {
    fontSize: 16,
    color: '#999',
  },
  submitBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  // Success screen
  successContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  successIcon: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  successBody: {
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 8,
  },
  successSubBody: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  successBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  pickerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  pickerOptionSelected: {
    backgroundColor: PRIMARY + '15',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: PRIMARY,
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 16,
    color: PRIMARY,
    fontWeight: '700',
  },
  pickerCancel: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  pickerCancelText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
});
