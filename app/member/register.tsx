import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '@/utils/api-helpers';

const PRIMARY = '#2E7D32';
const ACCENT = '#FFC107';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [commune, setCommune] = useState('');

  const [fullNameError, setFullNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [communeError, setCommuneError] = useState('');

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
    } else {
      setPhoneError('');
    }
    if (!commune.trim()) {
      setCommuneError('La commune ou ville est requise');
      valid = false;
    } else {
      setCommuneError('');
    }
    return valid;
  };

  const handleSubmit = async () => {
    console.log('[Register] Bouton S\'inscrire appuyé');
    if (!validate()) {
      console.log('[Register] Validation échouée');
      return;
    }

    setLoading(true);
    const payload = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      commune: commune.trim(),
    };
    console.log('[Register] POST /api/members', JSON.stringify(payload));

    try {
      const response = await fetch(`${BACKEND_URL}/api/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok && response.status !== 409) {
        const text = await response.text();
        console.log('[Register] Erreur HTTP', response.status, text);
        throw new Error(`Erreur ${response.status}: ${text}`);
      }

      const data = await response.json();
      console.log('[Register] Réponse reçue:', JSON.stringify(data));

      if (response.status === 409) {
        console.log('[Register] Doublon détecté, numéro existant:', data.member_number);
        Alert.alert(
          'Vous êtes déjà inscrit !',
          `Votre numéro de membre est : ${data.member_number}`,
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Voir ma carte',
              onPress: () => {
                console.log('[Register] Navigation vers carte (doublon):', data.member_number);
                router.push({
                  pathname: '/member/card',
                  params: { member: JSON.stringify(data) },
                });
              },
            },
          ]
        );
        return;
      }

      console.log('[Register] Inscription réussie, numéro:', data.member_number);
      router.push({
        pathname: '/member/card',
        params: { member: JSON.stringify(data) },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log('[Register] Erreur:', message);
      Alert.alert('Erreur', message || 'Erreur de connexion. Vérifiez votre connexion internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = () => {
    console.log('[Register] Lien "Déjà inscrit" appuyé');
    router.push('/member/recover');
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
          headerStyle: { backgroundColor: PRIMARY },
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

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={[styles.input, fullNameError ? styles.inputError : null]}
              value={fullName}
              onChangeText={(v) => { setFullName(v); if (v.trim()) setFullNameError(''); }}
              placeholder="Votre nom et prénom"
              placeholderTextColor="#9E9E9E"
              autoCapitalize="words"
              returnKeyType="next"
            />
            {fullNameError ? <Text style={styles.fieldError}>{fullNameError}</Text> : null}
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={[styles.input, phoneError ? styles.inputError : null]}
              value={phone}
              onChangeText={(v) => { setPhone(v); if (v.trim()) setPhoneError(''); }}
              placeholder="+223 XX XX XX XX"
              placeholderTextColor="#9E9E9E"
              keyboardType="phone-pad"
              returnKeyType="next"
            />
            {phoneError ? <Text style={styles.fieldError}>{phoneError}</Text> : null}
          </View>

          {/* Commune */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Commune / Ville</Text>
            <TextInput
              style={[styles.input, communeError ? styles.inputError : null]}
              value={commune}
              onChangeText={(v) => { setCommune(v); if (v.trim()) setCommuneError(''); }}
              placeholder="Votre commune ou ville"
              placeholderTextColor="#9E9E9E"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            {communeError ? <Text style={styles.fieldError}>{communeError}</Text> : null}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.btnIcon} />
                <Text style={styles.submitButtonText}>S'inscrire</Text>
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
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  header: {
    backgroundColor: PRIMARY,
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
    borderColor: ACCENT,
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
  formCard: {
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#C62828',
    backgroundColor: '#FFF5F5',
  },
  fieldError: {
    fontSize: 12,
    color: '#C62828',
    marginTop: 6,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
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
    color: PRIMARY,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
