import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

interface SuccessData {
  membershipNumber: string;
  id: string;
  message?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [cercle, setCercle] = useState('');
  const [commune, setCommune] = useState('');
  const [profession, setProfession] = useState('');
  const [nina, setNina] = useState('');
  const [motivation, setMotivation] = useState('');

  const validate = (): string | null => {
    if (!firstName.trim() || firstName.trim().length < 2) return 'Le prénom est requis (minimum 2 caractères)';
    if (!lastName.trim() || lastName.trim().length < 2) return 'Le nom est requis (minimum 2 caractères)';
    if (!phone.trim()) return 'Le numéro de téléphone est requis';
    if (!/^[0-9+\s\-]{8,15}$/.test(phone.trim())) return 'Numéro de téléphone invalide (8 à 15 chiffres)';
    return null;
  };

  const handleSubmit = async () => {
    console.log('[Register] Submit button pressed');
    setErrorMessage('');
    const validationError = validate();
    if (validationError) {
      console.log('[Register] Validation error:', validationError);
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      };
      if (email.trim()) payload.email = email.trim();
      if (region.trim()) payload.region = region.trim();
      if (cercle.trim()) payload.cercle = cercle.trim();
      if (commune.trim()) payload.commune = commune.trim();
      if (profession.trim()) payload.profession = profession.trim();
      if (nina.trim()) payload.nina = nina.trim();
      if (motivation.trim()) payload.motivation = motivation.trim();

      console.log('[Register] Sending payload:', JSON.stringify(payload));
      console.log('[Register] URL:', `${BACKEND_URL}/api/members/register`);

      const response = await fetch(`${BACKEND_URL}/api/members/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[Register] Response status:', response.status);

      let data: Record<string, unknown> = {};
      try {
        const text = await response.text();
        console.log('[Register] Response text:', text);
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.log('[Register] Failed to parse response:', parseErr);
      }

      if (response.status === 409) {
        const existingNumber =
          (data.membershipNumber as string) ||
          ((data.member as Record<string, string>)?.membershipNumber) ||
          ((data.member as Record<string, string>)?.membership_number) ||
          '';
        Alert.alert(
          'Déjà inscrit',
          `Vous êtes déjà membre du parti.\nVotre numéro: ${existingNumber}`,
          [
            { text: 'Voir ma carte', onPress: () => router.push({ pathname: '/member/card', params: { membershipNumber: existingNumber } }) },
            { text: 'OK', style: 'cancel' },
          ]
        );
        return;
      }

      if (!response.ok) {
        const errMsg =
          (data.details as string) ||
          (data.error as string) ||
          (data.message as string) ||
          `Erreur serveur (${response.status})`;
        console.log('[Register] Error response:', errMsg);
        setErrorMessage(errMsg);
        return;
      }

      // Success
      const membershipNumber =
        (data.membershipNumber as string) ||
        ((data.member as Record<string, string>)?.membershipNumber) ||
        ((data.member as Record<string, string>)?.membership_number) ||
        '';
      const id = (data.id as string) || ((data.member as Record<string, string>)?.id) || '';
      console.log('[Register] Success! membershipNumber:', membershipNumber);

      setSuccessData({ membershipNumber, id, message: data.message as string | undefined });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log('[Register] Network error:', message);
      setErrorMessage('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS SCREEN
  if (successData) {
    const memberFont = Platform.OS === 'ios' ? 'Courier' : 'monospace';
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Adhésion au Parti', headerShown: true, headerBackTitle: 'Retour' }} />
        <ScrollView contentContainerStyle={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#1B5E20" />
          </View>
          <Text style={styles.successTitle}>Inscription réussie !</Text>
          <Text style={styles.successSubtitle}>Bienvenue dans Alliance ARM</Text>

          <View style={styles.memberNumberBox}>
            <Text style={styles.memberNumberLabel}>Votre numéro de membre</Text>
            <Text style={[styles.memberNumber, { fontFamily: memberFont }]}>{successData.membershipNumber}</Text>
            <Text style={styles.memberNumberHint}>Conservez ce numéro précieusement</Text>
          </View>

          <Text style={styles.pendingNote}>
            Votre demande est en cours de traitement. Vous recevrez une confirmation de votre adhésion.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              console.log('[Register] Navigate to member card:', successData.membershipNumber);
              router.push({ pathname: '/member/card', params: { membershipNumber: successData.membershipNumber } });
            }}>
            <Ionicons name="card-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Voir ma carte de membre</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              console.log('[Register] Navigate to home');
              router.replace('/(tabs)/(home)');
            }}>
            <Text style={styles.secondaryButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // FORM SCREEN
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Adhésion au Parti', headerShown: true, headerBackTitle: 'Retour' }} />
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">

        <View style={styles.formHeader}>
          <Ionicons name="people" size={40} color="#1B5E20" />
          <Text style={styles.formTitle}>Rejoindre Alliance ARM</Text>
          <Text style={styles.formSubtitle}>Remplissez le formulaire pour adhérer au parti</Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#C62828" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles *</Text>

          <Text style={styles.label}>Prénom *</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Votre prénom"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Votre nom de famille"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Téléphone *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Ex: 76 12 34 56"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com (optionnel)"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localisation</Text>

          <Text style={styles.label}>Région</Text>
          <TextInput
            style={styles.input}
            value={region}
            onChangeText={setRegion}
            placeholder="Ex: Bamako, Sikasso..."
            autoCapitalize="words"
          />

          <Text style={styles.label}>Cercle</Text>
          <TextInput
            style={styles.input}
            value={cercle}
            onChangeText={setCercle}
            placeholder="Votre cercle"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Commune</Text>
          <TextInput
            style={styles.input}
            value={commune}
            onChangeText={setCommune}
            placeholder="Votre commune"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations complémentaires</Text>

          <Text style={styles.label}>Profession</Text>
          <TextInput
            style={styles.input}
            value={profession}
            onChangeText={setProfession}
            placeholder="Votre profession"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Numéro NINA</Text>
          <TextInput
            style={styles.input}
            value={nina}
            onChangeText={setNina}
            placeholder="Numéro NINA (optionnel)"
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Motivation</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={motivation}
            onChangeText={setMotivation}
            placeholder="Pourquoi souhaitez-vous adhérer à Alliance ARM ?"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Soumettre ma demande d'adhésion</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  formContainer: { padding: 16 },
  formHeader: { alignItems: 'center', paddingVertical: 24, marginBottom: 8 },
  formTitle: { fontSize: 22, fontWeight: '800', color: '#1B5E20', marginTop: 12, textAlign: 'center' },
  formSubtitle: { fontSize: 14, color: '#666', marginTop: 4, textAlign: 'center' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', borderRadius: 8, padding: 12, marginBottom: 16, gap: 8 },
  errorText: { flex: 1, color: '#C62828', fontSize: 14 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1B5E20', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#fafafa', color: '#1a1a1a' },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#1B5E20', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successContainer: { flexGrow: 1, alignItems: 'center', padding: 24, paddingTop: 48 },
  successIcon: { marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#1B5E20', textAlign: 'center' },
  successSubtitle: { fontSize: 16, color: '#555', marginTop: 4, textAlign: 'center' },
  memberNumberBox: { backgroundColor: '#1B5E20', borderRadius: 16, padding: 24, alignItems: 'center', marginVertical: 24, width: '100%' },
  memberNumberLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 8 },
  memberNumber: { color: '#FFD700', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  memberNumberHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 },
  pendingNote: { backgroundColor: '#FFF8E1', borderRadius: 8, padding: 12, color: '#E65100', fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  primaryButton: { backgroundColor: '#1B5E20', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 12 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { padding: 16, alignItems: 'center', width: '100%' },
  secondaryButtonText: { color: '#1B5E20', fontSize: 15, fontWeight: '600' },
});
