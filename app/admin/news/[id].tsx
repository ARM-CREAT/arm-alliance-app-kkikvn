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
const Haptics = {
  notificationAsync: async (_type?: unknown) => {},
  NotificationFeedbackType: { Success: 'success', Error: 'error', Warning: 'warning' } as const,
};

const ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'x-admin-password': 'admin123',
};
const ADMIN_DELETE_HEADERS = {
  'x-admin-password': 'admin123',
};

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export default function NewsFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [published, setPublished] = useState(false);

  const loadArticle = useCallback(async () => {
    if (isNew) return;
    console.log('[NewsForm] GET /api/news/' + id);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/news/${id}`, { headers: ADMIN_HEADERS });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
      }
      const data: NewsItem = await res.json();
      console.log('[NewsForm] Article chargé:', data.id);
      setTitle(data.title || '');
      setContent(data.content || '');
      setImageUrl(data.image_url || '');
      setPublished(Boolean(data.published));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[NewsForm] Erreur chargement:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    let isMounted = true;
    loadArticle().finally(() => { if (!isMounted) return; });
    return () => { isMounted = false; };
  }, [loadArticle]);

  const handleSave = async () => {
    console.log('[NewsForm] Bouton Enregistrer appuyé, isNew:', isNew);
    if (!title.trim()) {
      Alert.alert('Champ requis', 'Le titre est obligatoire.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Champ requis', 'Le contenu est obligatoire.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      content: content.trim(),
      published,
      ...(imageUrl.trim() ? { image_url: imageUrl.trim() } : {}),
    };

    console.log('[NewsForm]', isNew ? 'POST /api/news' : `PUT /api/news/${id}`, JSON.stringify(payload));

    try {
      const res = await fetch(
        isNew ? `${BACKEND_URL}/api/news` : `${BACKEND_URL}/api/news/${id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: ADMIN_HEADERS,
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
      }
      console.log('[NewsForm] Article enregistré avec succès');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[NewsForm] Erreur enregistrement:', msg);
      setError(msg);
      Alert.alert('Erreur', msg);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    console.log('[NewsForm] Bouton Supprimer appuyé, id:', id);
    Alert.alert(
      'Supprimer cet article',
      'Cette action est irréversible. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('[NewsForm] DELETE /api/news/' + id);
            setDeleting(true);
            try {
              const res = await fetch(`${BACKEND_URL}/api/news/${id}`, {
                method: 'DELETE',
                headers: ADMIN_DELETE_HEADERS,
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
              }
              console.log('[NewsForm] Article supprimé');
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error('[NewsForm] Erreur suppression:', msg);
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

  const screenTitle = isNew ? 'Nouvel article' : 'Modifier article';

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
              placeholder="Titre de l'article"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contenu *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Contenu de l'article..."
              placeholderTextColor={colors.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>URL de l'image (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://exemple.com/image.jpg"
              placeholderTextColor={colors.textTertiary}
              value={imageUrl}
              onChangeText={setImageUrl}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Publié</Text>
              <Text style={styles.switchDesc}>Rendre cet article visible au public</Text>
            </View>
            <Switch
              value={published}
              onValueChange={(val) => {
                console.log('[NewsForm] Toggle publié:', val);
                setPublished(val);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
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
              style={[styles.deleteBtn, deleting && styles.saveBtnDisabled]}
              onPress={handleDelete}
              disabled={saving || deleting}
            >
              {deleting ? (
                <ActivityIndicator color={colors.danger} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  <Text style={styles.deleteBtnText}>Supprimer cet article</Text>
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
  textarea: {
    minHeight: 160,
    paddingTop: 14,
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
  saveBtnDisabled: { opacity: 0.6 },
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
