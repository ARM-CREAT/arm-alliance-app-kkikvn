
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@/lib/async-storage';
import { colors } from '@/styles/commonStyles';
import { BACKEND_URL } from '@/utils/api';

const Haptics = {
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
};

interface AppSettings {
  appName: string;
  welcomeMessage: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  donationEnabled: boolean;
}

const defaultSettings: AppSettings = {
  appName: '',
  welcomeMessage: '',
  contactPhone: '',
  contactEmail: '',
  contactAddress: '',
  donationEnabled: true,
};

export default function AdminAppSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');



  const getAdminHeaders = async () => {
    const password = await AsyncStorage.getItem('admin_password');
    return {
      'Content-Type': 'application/json',
      'x-admin-password': password || '',
    };
  };

  const fetchSettings = useCallback(async () => {
    console.log('[Admin AppSettings] GET /api/admin/settings');
    try {
      const headers = await getAdminHeaders();
      const response = await fetch(`${BACKEND_URL}/api/admin/settings`, { headers });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text}`);
      }
      const data = await response.json();
      setSettings({
        appName: data.appName || '',
        welcomeMessage: data.welcomeMessage || '',
        contactPhone: data.contactPhone || '',
        contactEmail: data.contactEmail || '',
        contactAddress: data.contactAddress || '',
        donationEnabled: data.donationEnabled !== false,
      });
      setError('');
    } catch (e: any) {
      console.error('[Admin AppSettings] Fetch error:', e.message);
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      await fetchSettings();
      if (isMounted) setLoading(false);
    };
    load();
    return () => { isMounted = false; };
  }, [fetchSettings]);

  const handleSave = async () => {
    console.log('[Admin AppSettings] PUT /api/admin/settings');
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const headers = await getAdminHeaders();
      const response = await fetch(`${BACKEND_URL}/api/admin/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text}`);
      }
      Alert.alert('Succès', 'Paramètres enregistrés avec succès.');
    } catch (e: any) {
      console.error('[Admin AppSettings] Save error:', e.message);
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof AppSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Paramètres App',
            headerShown: true,
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
          }}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Paramètres App',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Général</Text>

          <Text style={styles.label}>Nom de l'application</Text>
          <TextInput
            style={styles.input}
            value={settings.appName}
            onChangeText={(v) => updateField('appName', v)}
            placeholder="Alliance ARM"
          />

          <Text style={styles.label}>Message de bienvenue</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={settings.welcomeMessage}
            onChangeText={(v) => updateField('welcomeMessage', v)}
            placeholder="Message affiché sur la page d'accueil"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>

          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={settings.contactPhone}
            onChangeText={(v) => updateField('contactPhone', v)}
            placeholder="+223 XX XX XX XX"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={settings.contactEmail}
            onChangeText={(v) => updateField('contactEmail', v)}
            placeholder="contact@alliance-arm.ml"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Adresse</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={settings.contactAddress}
            onChangeText={(v) => updateField('contactAddress', v)}
            placeholder="Adresse du siège"
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fonctionnalités</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Dons activés</Text>
              <Text style={styles.toggleDesc}>Afficher le module de dons dans l'app</Text>
            </View>
            <Switch
              value={settings.donationEnabled}
              onValueChange={(v) => {
                console.log('[Admin AppSettings] Toggle donationEnabled:', v);
                updateField('donationEnabled', v);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.donationEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>


        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBanner: {
    backgroundColor: colors.danger + '20',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: { color: colors.danger, fontSize: 14 },
  section: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 4, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.backgroundAlt,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  toggleDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});
