
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, Linking, RefreshControl, ActivityIndicator
} from 'react-native';
import { Stack } from 'expo-router';
import { BACKEND_URL } from '@/utils/api-helpers';

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  address: string;
  type: 'general' | 'regional' | 'media';
}

const TYPE_LABELS: Record<string, string> = {
  general: 'Général',
  regional: 'Régional',
  media: 'Médias',
};

const TYPE_COLORS: Record<string, string> = {
  general: '#1B5E20',
  regional: '#1565C0',
  media: '#E65100',
};

export default function ContactScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadContacts = useCallback(async () => {
    console.log('[Contact] GET /api/contacts');
    setFetchError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/contacts`);
      if (res.ok) {
        const data = await res.json();
        console.log('[Contact] Contacts loaded:', Array.isArray(data) ? data.length : 0);
        setContacts(Array.isArray(data) ? data : []);
      } else {
        const errText = await res.text();
        console.log('[Contact] contacts fetch failed, status:', res.status, errText);
        setFetchError(`Impossible de charger les contacts (${res.status}).`);
      }
    } catch (e: any) {
      console.log('[Contact] contacts error', e);
      setFetchError('Impossible de charger les contacts. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const onRefresh = () => {
    console.log('[Contact] Pull-to-refresh triggered');
    setRefreshing(true);
    loadContacts();
  };

  const handleSubmit = async () => {
    console.log('[Contact] User tapped Send Message button');
    if (!senderName.trim() || !senderEmail.trim() || !subject.trim() || !message.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    setSending(true);
    const payload = { senderName, senderEmail, subject, message };
    console.log('[Contact] POST /api/messages', payload);
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        console.log('[Contact] Message sent successfully');
        Alert.alert('Succès', 'Votre message a été envoyé avec succès.');
        setSenderName(''); setSenderEmail(''); setSubject(''); setMessage('');
      } else {
        const err = await res.text();
        console.log('[Contact] Message send failed, status:', res.status, err);
        Alert.alert('Erreur', err || "Échec de l'envoi du message.");
      }
    } catch (e) {
      console.log('[Contact] Message send error', e);
      Alert.alert('Erreur', "Impossible d'envoyer le message. Vérifiez votre connexion.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Contact', headerShown: true }} />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Nos Contacts</Text>

        {loading ? (
          <ActivityIndicator color="#1B5E20" style={{ marginVertical: 20 }} />
        ) : fetchError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{fetchError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadContacts(); }}>
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : contacts.length === 0 ? (
          <Text style={styles.emptyText}>Aucun contact disponible.</Text>
        ) : (
          contacts.map(c => {
            const badgeColor = TYPE_COLORS[c.type] || '#1B5E20';
            const badgeLabel = TYPE_LABELS[c.type] || c.type;
            return (
              <View key={c.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{c.name}</Text>
                    <Text style={styles.cardRole}>{c.role}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                    <Text style={styles.badgeText}>{badgeLabel}</Text>
                  </View>
                </View>
                {c.address ? <Text style={styles.cardAddress}>📍 {c.address}</Text> : null}
                <View style={styles.cardActions}>
                  {c.phone ? (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        console.log('[Contact] User tapped call:', c.phone);
                        Linking.openURL('tel:' + c.phone);
                      }}
                    >
                      <Text style={styles.actionBtnText}>📞 {c.phone}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {c.email ? (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        console.log('[Contact] User tapped email:', c.email);
                        Linking.openURL('mailto:' + c.email);
                      }}
                    >
                      <Text style={styles.actionBtnText}>✉️ {c.email}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Envoyer un Message</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nom complet *</Text>
          <TextInput style={styles.input} value={senderName} onChangeText={setSenderName} placeholder="Votre nom" />

          <Text style={styles.label}>Email *</Text>
          <TextInput style={styles.input} value={senderEmail} onChangeText={setSenderEmail} placeholder="votre@email.com" keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Sujet *</Text>
          <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Sujet de votre message" />

          <Text style={styles.label}>Message *</Text>
          <TextInput style={[styles.input, styles.textarea]} value={message} onChangeText={setMessage} placeholder="Votre message..." multiline numberOfLines={5} textAlignVertical="top" />

          <TouchableOpacity style={[styles.submitBtn, sending && { opacity: 0.6 }]} onPress={handleSubmit} disabled={sending}>
            <Text style={styles.submitBtnText}>{sending ? 'Envoi en cours...' : 'Envoyer le Message'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1B5E20', marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  emptyText: { textAlign: 'center', color: '#888', marginVertical: 20, fontSize: 14 },
  errorContainer: { marginHorizontal: 16, marginVertical: 12, backgroundColor: '#FFF3F3', borderRadius: 10, padding: 16, alignItems: 'center', gap: 10 },
  errorText: { color: '#DC3545', fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#1B5E20', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  cardRole: { fontSize: 13, color: '#666', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardAddress: { fontSize: 13, color: '#555', marginBottom: 8 },
  cardActions: { gap: 6 },
  actionBtn: { paddingVertical: 6 },
  actionBtnText: { fontSize: 14, color: '#1B5E20', fontWeight: '500' },
  form: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: '#FAFAFA' },
  textarea: { height: 120, paddingTop: 10 },
  submitBtn: { backgroundColor: '#1B5E20', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
