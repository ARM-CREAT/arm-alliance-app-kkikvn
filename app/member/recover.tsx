import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '@/utils/api-helpers';

const PRIMARY = '#2E7D32';
const ACCENT = '#FFC107';

export default function RecoverScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    console.log('[Recover] Bouton Rechercher appuyé, téléphone:', phone);
    if (!phone.trim()) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }
    setError('');
    setLoading(true);

    const encodedPhone = encodeURIComponent(phone.trim());
    console.log('[Recover] GET /api/members/lookup?phone=' + encodedPhone);

    try {
      const response = await fetch(`${BACKEND_URL}/api/members/lookup?phone=${encodedPhone}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.status === 404) {
        console.log('[Recover] Aucun adhérent trouvé pour:', phone);
        setError('Aucun adhérent trouvé avec ce numéro');
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error('[Recover] Erreur HTTP', response.status, text);
        let errMsg = `Erreur ${response.status}`;
        try {
          const json = JSON.parse(text);
          errMsg = json.message || json.error || errMsg;
        } catch {
          if (text && text.length < 300) errMsg = text;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      console.log('[Recover] Membre trouvé:', data.member_number, JSON.stringify(data));

      router.push({
        pathname: '/member/card',
        params: { member: JSON.stringify(data) },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Recover] Erreur:', message, err);
      setError(message || 'Erreur de connexion. Vérifiez votre connexion internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    console.log('[Recover] Lien S\'inscrire appuyé');
    router.push('/member/register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Retrouver ma carte',
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
            <Ionicons name="search" size={36} color="#fff" />
          </View>
          <Text style={styles.title}>Retrouver ma carte</Text>
          <Text style={styles.subtitle}>Entrez votre numéro de téléphone pour accéder à votre carte de membre</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={phone}
              onChangeText={(v) => { setPhone(v); if (v.trim()) setError(''); }}
              placeholder="+223 XX XX XX XX"
              placeholderTextColor="#9E9E9E"
              keyboardType="phone-pad"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoFocus
            />
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#C62828" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={18} color="#fff" style={styles.btnIcon} />
                <Text style={styles.searchButtonText}>Rechercher</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={styles.registerSection}>
          <Text style={styles.registerHint}>Pas encore inscrit ?</Text>
          <TouchableOpacity onPress={handleRegister} activeOpacity={0.7}>
            <Text style={styles.registerLink}>S'inscrire maintenant</Text>
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: ACCENT,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    flex: 1,
  },
  searchButton: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  btnIcon: {
    marginRight: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  registerSection: {
    alignItems: 'center',
    marginTop: 28,
    gap: 6,
  },
  registerHint: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 15,
    color: PRIMARY,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
