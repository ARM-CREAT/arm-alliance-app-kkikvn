import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles/commonStyles';
import { BACKEND_URL } from '@/utils/api';

const Haptics = {
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
};

const ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'x-admin-password': 'admin123',
};

interface ArmMessage {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

type FormMode = 'create' | 'edit';

function formatDateFr(dateString?: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateString);
  }
}

export default function AdminArmMessagesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<ArmMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  const loadMessages = useCallback(async (isRefresh = false) => {
    console.log('[AdminArmMessages] GET /api/arm-messages');
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/arm-messages`);
      if (!res.ok) {
        const text = await res.text();
        console.error('[AdminArmMessages] Erreur HTTP', res.status, text.slice(0, 120));
        throw new Error(`Erreur ${res.status}`);
      }
      const data = await res.json();
      const list: ArmMessage[] = Array.isArray(data) ? data : (data.messages ?? []);
      console.log('[AdminArmMessages] Messages chargés:', list.length);
      setMessages(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AdminArmMessages] Erreur chargement:', msg);
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMessages(false);
    }, [loadMessages])
  );

  const onRefresh = useCallback(() => {
    console.log('[AdminArmMessages] Pull-to-refresh');
    setRefreshing(true);
    loadMessages(true);
  }, [loadMessages]);

  const openCreateForm = () => {
    console.log('[AdminArmMessages] Bouton Nouveau message appuyé');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormMode('create');
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormImageUrl('');
    setFormError(null);
    setFormVisible(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const openEditForm = (item: ArmMessage) => {
    console.log('[AdminArmMessages] Modifier message:', item.id);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormMode('edit');
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormImageUrl(item.image_url ?? '');
    setFormError(null);
    setFormVisible(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const cancelForm = () => {
    console.log('[AdminArmMessages] Formulaire annulé');
    setFormVisible(false);
    setFormError(null);
  };

  const handleSubmit = async () => {
    const trimmedTitle = formTitle.trim();
    const trimmedContent = formContent.trim();

    if (!trimmedTitle || !trimmedContent) {
      setFormError('Le titre et le contenu sont obligatoires.');
      return;
    }

    const body: Record<string, string> = {
      title: trimmedTitle,
      content: trimmedContent,
    };
    if (formImageUrl.trim()) {
      body.image_url = formImageUrl.trim();
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (formMode === 'create') {
        console.log('[AdminArmMessages] POST /api/arm-messages', JSON.stringify(body));
        const res = await fetch(`${BACKEND_URL}/api/arm-messages`, {
          method: 'POST',
          headers: ADMIN_HEADERS,
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error('[AdminArmMessages] Erreur création', res.status, text.slice(0, 120));
          throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
        }
        const created = await res.json();
        console.log('[AdminArmMessages] Message créé:', created?.id ?? '?');
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        console.log('[AdminArmMessages] PUT /api/arm-messages/' + editingId, JSON.stringify(body));
        const res = await fetch(`${BACKEND_URL}/api/arm-messages/${editingId}`, {
          method: 'PUT',
          headers: ADMIN_HEADERS,
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error('[AdminArmMessages] Erreur modification', res.status, text.slice(0, 120));
          throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
        }
        const updated = await res.json();
        console.log('[AdminArmMessages] Message modifié:', updated?.id ?? editingId);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setFormVisible(false);
      loadMessages(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AdminArmMessages] Erreur soumission:', msg);
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: ArmMessage) => {
    console.log('[AdminArmMessages] Demande suppression message:', item.id);
    Alert.alert(
      'Supprimer ce message',
      `Voulez-vous vraiment supprimer "${item.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('[AdminArmMessages] DELETE /api/arm-messages/' + item.id);
            try {
              const res = await fetch(`${BACKEND_URL}/api/arm-messages/${item.id}`, {
                method: 'DELETE',
                headers: { 'x-admin-password': 'admin123' },
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
              }
              console.log('[AdminArmMessages] Message supprimé:', item.id);
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadMessages(true);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error('[AdminArmMessages] Erreur suppression:', msg);
              Alert.alert('Erreur', msg);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ArmMessage }) => {
    const dateStr = formatDateFr(item.created_at);
    const hasImage = !!item.image_url;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {hasImage && (
            <View style={styles.imageBadge}>
              <Ionicons name="image-outline" size={12} color={colors.primary} />
              <Text style={styles.imageBadgeText}>Image</Text>
            </View>
          )}
          <Text style={styles.cardDate}>{dateStr}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardContent} numberOfLines={3}>{item.content}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => openEditForm(item)}
          >
            <Ionicons name="pencil-outline" size={14} color={colors.primary} />
            <Text style={styles.editBtnText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={14} color={colors.danger} />
            <Text style={styles.deleteBtnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const formTitle_label = formMode === 'create' ? 'Nouveau message ARM' : 'Modifier le message';
  const submitLabel = formMode === 'create' ? 'Publier' : 'Enregistrer';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Messages ARM',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Messages list */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => loadMessages(false)}>
                <Text style={styles.retryBtnText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : messages.length === 0 && !formVisible ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={56} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Aucun message ARM</Text>
              <Text style={styles.emptySubtext}>Appuyez sur + pour publier un message</Text>
            </View>
          ) : (
            messages.map((item) => (
              <View key={item.id}>
                {renderItem({ item })}
              </View>
            ))
          )}

          {/* Inline form */}
          {formVisible && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{formTitle_label}</Text>

              <Text style={styles.fieldLabel}>Titre *</Text>
              <TextInput
                style={styles.input}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="Titre du message"
                placeholderTextColor={colors.textTertiary}
                maxLength={200}
              />

              <Text style={styles.fieldLabel}>Contenu *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formContent}
                onChangeText={setFormContent}
                placeholder="Contenu du message..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>URL de l'image (optionnel)</Text>
              <TextInput
                style={styles.input}
                value={formImageUrl}
                onChangeText={setFormImageUrl}
                placeholder="https://..."
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                keyboardType="url"
              />

              {!!formError && (
                <View style={styles.formErrorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              )}

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={cancelForm}
                  disabled={submitting}
                >
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name={formMode === 'create' ? 'send-outline' : 'checkmark-outline'}
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.submitBtnText}>{submitLabel}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* FAB — only show when form is hidden */}
        {!formVisible && (
          <TouchableOpacity style={styles.fab} onPress={openCreateForm}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingVertical: 60 },
  loadingText: { fontSize: 15, color: colors.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  errorText: { fontSize: 15, color: colors.danger, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  emptyContainer: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.textSecondary },
  emptySubtext: { fontSize: 13, color: colors.textTertiary, textAlign: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  imageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  imageBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  cardDate: { fontSize: 11, color: colors.textTertiary, fontWeight: '500', marginLeft: 'auto' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6, lineHeight: 22 },
  cardContent: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 12 },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 10,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.danger + '15',
    borderRadius: 8,
  },
  deleteBtnText: { fontSize: 13, fontWeight: '600', color: colors.danger },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 14,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  formErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.danger + '15',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  formErrorText: { fontSize: 13, color: colors.danger, flex: 1 },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
