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
  TextInput as TextInputType,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '@/utils/api-helpers';
import { Colors } from '@/constants/Colors';

const C = Colors.light;

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [locationError, setLocationError] = useState('');

  const lastNameRef = useRef<TextInputType>(null);
  const phoneRef = useRef<TextInputType>(null);
  const locationRef = useRef<TextInputType>(null);

  const validate = (): boolean => {
    let valid = true;
    if (!firstName.trim()) {
      setFirstNameError('Le prénom est requis');
      valid = false;
    } else {
      setFirstNameError('');
    }
    if (!lastName.trim()) {
      setLastNameError('Le nom est requis');
      valid = false;
    } else {
      setLastNameError('');
    }
    if (!phone.trim()) {
      setPhoneError('Le numéro de téléphone est requis');
      valid = false;
    } else {
      setPhoneError('');
    }
    if (!location.trim()) {
      setLocationError('La localisation est requise');
      valid = false;
    } else {
      setLocationError('');
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
    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      location: location.trim(),
    };
    console.log('[Register] POST /api/memberships', JSON.stringify(payload));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('[Register] Timeout de 30 secondes atteint');
    }, 30000);

    try {
      const response = await fetch(`${BACKEND_URL}/api/memberships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        console.log('[Register] Erreur HTTP', response.status, text);
        let message = `Erreur ${response.status}`;
        try {
          const json = JSON.parse(text);
          message = json.message || json.error || message;
        } catch {
          message = text || message;
        }
        setErrorBanner(message);
        return;
      }

      const data = await response.json();
      console.log('[Register] Inscription réussie:', JSON.stringify(data));

      router.push({
        pathname: '/member/success',
        params: {
          member_number: data.member_number ?? data.membership_number ?? '',
          first_name: data.first_name ?? firstName.trim(),
          last_name: data.last_name ?? lastName.trim(),
        },
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[Register] Requête annulée (timeout 30s)');
        setErrorBanner('La requête a expiré. Vérifiez votre connexion et réessayez.');
      } else {
        const message = err instanceof Error ? err.message : String(err);
        console.log('[Register] Erreur réseau:', message);
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

  const handleRetry = () => {
    console.log('[Register] Bouton Réessayer appuyé');
    setErrorBanner('');
    handleSubmit();
  };

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
            <TouchableOpacity onPress={handleRetry} style={styles.retryBtn} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Prénom */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              style={[styles.input, firstNameError ? styles.inputError : null]}
              value={firstName}
              onChangeText={(v) => { setFirstName(v); if (v.trim()) setFirstNameError(''); }}
              placeholder="Votre prénom"
              placeholderTextColor={C.textTertiary}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
            />
            {firstNameError ? <Text style={styles.fieldError}>{firstNameError}</Text> : null}
          </View>

          {/* Nom */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              ref={lastNameRef}
              style={[styles.input, lastNameError ? styles.inputError : null]}
              value={lastName}
              onChangeText={(v) => { setLastName(v); if (v.trim()) setLastNameError(''); }}
              placeholder="Votre nom de famille"
              placeholderTextColor={C.textTertiary}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            {lastNameError ? <Text style={styles.fieldError}>{lastNameError}</Text> : null}
          </View>

          {/* Téléphone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              ref={phoneRef}
              style={[styles.input, phoneError ? styles.inputError : null]}
              value={phone}
              onChangeText={(v) => { setPhone(v); if (v.trim()) setPhoneError(''); }}
              placeholder="+223 XX XX XX XX"
              placeholderTextColor={C.textTertiary}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => locationRef.current?.focus()}
            />
            {phoneError ? <Text style={styles.fieldError}>{phoneError}</Text> : null}
          </View>

          {/* Localisation */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Localisation</Text>
            <TextInput
              ref={locationRef}
              style={[styles.input, locationError ? styles.inputError : null]}
              value={location}
              onChangeText={(v) => { setLocation(v); if (v.trim()) setLocationError(''); }}
              placeholder="Votre commune ou ville"
              placeholderTextColor={C.textTertiary}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            {locationError ? <Text style={styles.fieldError}>{locationError}</Text> : null}
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
    gap: 4,
  },
  errorBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
  fieldGroup: {
    marginBottom: 20,
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
});
