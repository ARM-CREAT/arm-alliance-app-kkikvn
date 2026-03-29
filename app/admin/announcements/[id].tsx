import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles/commonStyles';
import { BACKEND_URL } from '@/utils/api';
import * as Haptics from 'expo-haptics';

const ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'x-admin-password': 'admin123',
};
const ADMIN_DELETE_HEADERS = {
  'x-admin-password': 'admin123',
};

type Priority = 'normal' | 'urgent';

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: Priority;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export default function AnnouncementFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [published, setPublished] = useState(false);

  const loadAnnouncement = useCallback(async () => {
    if (isNew) return;
    console.log('[AnnouncementForm] GET /api/announcements/' + id);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/announcements/${id}`, { headers: ADMIN_HEADERS });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
      }
      const data: Announcement = await res.json();
      console.log('[AnnouncementForm] Annonce chargée:', data.id);
      setTitle(data.title || '');
      setBody(data.body || '');
      setPriority(data.priority === 'urgent' ? 'urgent' : 'normal');
      setPublished(Boolean(data.published));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AnnouncementForm] Erreur chargement:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    loadAnnouncement();
  }, [loadAnnouncement]);

  const handleSave = async () => {
    console.log('[AnnouncementForm] Bouton Enregistrer appuyé, isNew:', isNew);
    if (!title.trim()) {
      Alert.alert('Champ requis', 'Le titre est obligatoire.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Champ requis', 'Le corps est obligatoire.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = { title: title.trim(), body: body.trim(), priority, published };
    console.log('[AnnouncementForm]', isNew ? 'POST /api/announcements' : `PUT /api/announcements/${id}`, JSON.stringify(payload));

    try {
      const res = await fetch(
        isNew ? `${BACKEND_URL}/api/announcements` : `${BACKEND_URL}/api/announcements/${id}`,
        { method: isNew ? 'POST' : 'PUT', headers: ADMIN_HEADERS, body: JSON.stringify(payload) }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
      }
      console.log('[AnnouncementForm] Annonce enregistrée avec succès');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AnnouncementForm] Erreur enregistrement:', msg);
      setError(msg);
      Alert.alert('Erreur', msg);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    console.log('[AnnouncementForm] Bouton Supprimer appuyé, id:', id);
    Alert.alert(
      'Supprimer cette annonce',
      'Cette action est irréversible. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('[AnnouncementForm] DELETE /api/announcements/' + id);
            setDeleting(true);
            try {
              const res = await fetch(`${BACKEND_URL}/api/announcements/${id}`, {
                method: 'DELETE',
                headers: ADMIN_DELETE_HEADERS,
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
              }
              console.log('[AnnouncementForm] Annonce supprimée');
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error('[AnnouncementForm] Erreur suppression:', msg);
              setError(msg);
              Alert.alert('Erreur', msg);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const screenTitle = isNew ? 'Nouvelle annonce' : 'Modifier annonce';
  const normalBg = priority === 'normal' ? colors.primary : 'transparent';
  const urgentBg = priority === 'urgent' ? colors.danger : 'transparent';
  const normalTextColor = priority === 'normal' ? '#FFFFFF' : colors.textSecondary;
  const urgentTextColor = priority === 'urgent' ? '#FFFFFF' : colors.textSecondary;

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: screenTitle, headerShown: true, headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: 'bold' } }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Titre de l'annonce"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Corps *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Contenu de l'annonce..."
              placeholderTextColor={colors.textTertiary}
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Priorité</Text>
            <View style={styles.segmented}>
              <TouchableOpacity
                style={[styles.segmentBtn, { backgroundColor: normalBg }, priority === 'normal' && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[AnnouncementForm] Priorité sélectionnée: normal');
                  setPriority('normal');
                }}
              >
                <Text style={[styles.segmentBtnText, { color: normalTextColor }]}>Normal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, { backgroundColor: urgentBg }, priority === 'urgent' && styles.segmentBtnUrgent]}
                onPress={() => {
                  console.log('[AnnouncementForm] Priorité sélectionnée: urgent');
                  setPriority('urgent');
                }}
              >
                <Text style={[styles.segmentBtnText, { color: urgentTextColor }]}>Urgent</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Publiée</Text>
              <Text style={styles.switchDesc}>Rendre cette annonce visible au public</Text>
            </View>
            <Switch
              value={published}
              onValueChange={(val) => {
                console.log('[AnnouncementForm] Toggle publié:', val);
                setPublished(val);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving || deleting}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Enregistrer</Text>
              </>
            )}
          </TouchableOpacity>

          {!isNew && (
            <TouchableOpacity
              style={[styles.deleteBtn, deleting && styles.btnDisabled]}
              onPress={handleDelete}
              disabled={saving || deleting}
            >
              {deleting ? (
                <ActivityIndicator color={colors.danger} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  <Text style={styles.deleteBtnText}>Supprimer cette annonce</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.danger + '18',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  errorBannerText: { flex: 1, fontSize: 13, color: colors.danger, lineHeight: 18 },
  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    minHeight: 52,
  },
  textarea: { minHeight: 160, paddingTop: 14 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    borderRadius: 10,
  },
  segmentBtnUrgent: {
    borderRadius: 10,
  },
  segmentBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  switchInfo: { flex: 1 },
  switchLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  switchDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  deleteBtn: {
    backgroundColor: colors.danger + '12',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  deleteBtnText: { color: colors.danger, fontSize: 16, fontWeight: '700' },
});
