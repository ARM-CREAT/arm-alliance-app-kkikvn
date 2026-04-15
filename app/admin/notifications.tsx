
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { BACKEND_URL } from '@/utils/api';
import AsyncStorage from '@/lib/async-storage';

const Haptics = {
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
};

interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  content?: string;
  type: string;
  category: string;
  published: boolean;
  is_published?: boolean;
  createdAt?: string;
  created_at?: string;
}

const CATEGORY_OPTIONS = [
  { key: 'actualite', label: 'Actualité' },
  { key: 'evenement', label: 'Événement' },
  { key: 'annonce', label: 'Annonce' },
  { key: 'urgent', label: 'Urgent' },
];

const TYPE_OPTIONS = [
  { key: 'public', label: 'Public' },
  { key: 'militants', label: 'Militants' },
  { key: 'tous', label: 'Tous' },
];

const CATEGORY_COLORS: Record<string, string> = {
  actualite: '#1565C0',
  evenement: '#2E7D32',
  annonce: '#E65100',
  urgent: '#C62828',
};

const CATEGORY_LABELS: Record<string, string> = {
  actualite: 'Actualité',
  evenement: 'Événement',
  annonce: 'Annonce',
  urgent: 'Urgent',
};

function getNotifBody(item: NotificationItem): string {
  return item.body || item.content || '';
}

function isPublished(item: NotificationItem): boolean {
  return item.published === true || item.is_published === true;
}

export default function AdminNotificationsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<NotificationItem | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formType, setFormType] = useState('public');
  const [formCategory, setFormCategory] = useState('actualite');
  const [formPublished, setFormPublished] = useState(false);

  const loadNotifications = useCallback(async () => {
    console.log('[AdminNotifications] GET /api/notifications (public)');
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text}`);
      }
      const data = await res.json();
      const list: NotificationItem[] = Array.isArray(data) ? data : [];
      console.log('[AdminNotifications] Chargées:', list.length, 'éléments');
      setNotifications(list);
    } catch (err: any) {
      console.error('[AdminNotifications] Erreur de chargement:', err);
      Alert.alert('Erreur', 'Impossible de charger les notifications. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadNotifications().finally(() => { if (!isMounted) return; });
    return () => { isMounted = false; };
  }, [loadNotifications]);

  const onRefresh = useCallback(async () => {
    console.log('[AdminNotifications] Actualisation par glissement');
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const resetForm = () => {
    setFormTitle('');
    setFormBody('');
    setFormType('public');
    setFormCategory('actualite');
    setFormPublished(false);
    setEditingNotification(null);
  };

  const handleAdd = () => {
    console.log('[AdminNotifications] Bouton Nouvelle notification appuyé');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (item: NotificationItem) => {
    console.log('[AdminNotifications] Bouton Modifier appuyé pour:', item.id);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingNotification(item);
    setFormTitle(item.title || '');
    setFormBody(getNotifBody(item));
    setFormType(item.type || 'public');
    setFormCategory(item.category || 'actualite');
    setFormPublished(isPublished(item));
    setShowForm(true);
  };

  const handleCancel = () => {
    console.log('[AdminNotifications] Bouton Annuler appuyé');
    setShowForm(false);
    resetForm();
  };

  const getAdminHeaders = async (): Promise<Record<string, string>> => {
    const password = await AsyncStorage.getItem('admin_password');
    return {
      'Content-Type': 'application/json',
      ...(password ? { 'x-admin-password': password } : {}),
    };
  };

  const handleSubmit = async () => {
    console.log('[AdminNotifications] Bouton Enregistrer appuyé, editing:', editingNotification?.id ?? 'nouveau');

    if (!formTitle.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire.');
      return;
    }
    if (!formBody.trim()) {
      Alert.alert('Erreur', 'Le contenu est obligatoire.');
      return;
    }

    setSubmitting(true);

    const payload = {
      title: formTitle.trim(),
      body: formBody.trim(),
      type: formType,
      category: formCategory,
      published: formPublished,
    };

    console.log('[AdminNotifications] Payload:', JSON.stringify(payload));

    try {
      const headers = await getAdminHeaders();
      if (editingNotification) {
        console.log('[AdminNotifications] PUT /api/notifications/' + editingNotification.id);
        const res = await fetch(`${BACKEND_URL}/api/notifications/${editingNotification.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
        }
        console.log('[AdminNotifications] Notification modifiée avec succès');
      } else {
        console.log('[AdminNotifications] POST /api/notifications');
        const res = await fetch(`${BACKEND_URL}/api/notifications`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
        }
        console.log('[AdminNotifications] Notification créée avec succès');
      }

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowForm(false);
      resetForm();
      await loadNotifications();
      Alert.alert('Succès', editingNotification ? 'Notification modifiée.' : 'Notification créée.');
    } catch (err: any) {
      console.error('[AdminNotifications] Erreur de soumission:', err);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', err.message || "Échec de l'opération.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: NotificationItem) => {
    console.log('[AdminNotifications] Bouton Supprimer appuyé pour:', item.id);
    Alert.alert(
      'Confirmer la suppression',
      `Supprimer "${item.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('[AdminNotifications] DELETE /api/notifications/' + item.id);
            try {
              const headers = await getAdminHeaders();
              const res = await fetch(`${BACKEND_URL}/api/notifications/${item.id}`, {
                method: 'DELETE',
                headers,
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
              }
              console.log('[AdminNotifications] Suppression réussie');
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await loadNotifications();
            } catch (err: any) {
              console.error('[AdminNotifications] Erreur de suppression:', err);
              Alert.alert('Erreur', err.message || 'Échec de la suppression.');
            }
          },
        },
      ]
    );
  };

  const handleTogglePublished = async (item: NotificationItem) => {
    const newPublished = !isPublished(item);
    console.log('[AdminNotifications] Toggle publié pour:', item.id, '->', newPublished);
    try {
      const headers = await getAdminHeaders();
      console.log('[AdminNotifications] PUT /api/notifications/' + item.id, { published: newPublished });
      const res = await fetch(`${BACKEND_URL}/api/notifications/${item.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ published: newPublished }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
      }
      console.log('[AdminNotifications] Toggle publié réussi');
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, published: newPublished, is_published: newPublished } : n)
      );
    } catch (err: any) {
      console.error('[AdminNotifications] Erreur toggle publié:', err);
      Alert.alert('Erreur', err.message);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Notifications',
            headerShown: true,
            headerBackTitle: 'Retour',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
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
          title: 'Notifications',
          headerShown: true,
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Notifications</Text>
            <Text style={styles.pageSubtitle}>Gérez les actualités et annonces</Text>
          </View>

          {showForm && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>
                {editingNotification ? 'Modifier la notification' : 'Nouvelle notification'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Titre *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Titre de la notification"
                  placeholderTextColor={colors.textSecondary}
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contenu *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Contenu de la notification"
                  placeholderTextColor={colors.textSecondary}
                  value={formBody}
                  onChangeText={setFormBody}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.optionRow}>
                  {TYPE_OPTIONS.map((opt) => {
                    const isSelected = formType === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[styles.optionBtn, isSelected && styles.optionBtnActive]}
                        onPress={() => {
                          console.log('[AdminNotifications] Type sélectionné:', opt.key);
                          setFormType(opt.key);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.optionBtnText, isSelected && styles.optionBtnTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Catégorie</Text>
                <View style={styles.optionRow}>
                  {CATEGORY_OPTIONS.map((opt) => {
                    const isSelected = formCategory === opt.key;
                    const catColor = CATEGORY_COLORS[opt.key];
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[
                          styles.optionBtn,
                          isSelected && { backgroundColor: catColor, borderColor: catColor },
                        ]}
                        onPress={() => {
                          console.log('[AdminNotifications] Catégorie sélectionnée:', opt.key);
                          setFormCategory(opt.key);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.optionBtnText, isSelected && styles.optionBtnTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.publishedRow}>
                <Text style={styles.label}>Publier immédiatement</Text>
                <Switch
                  value={formPublished}
                  onValueChange={(val) => {
                    console.log('[AdminNotifications] Toggle publié (form):', val);
                    setFormPublished(val);
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingNotification ? 'Modifier' : 'Créer'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {notifications.length === 0 && !showForm ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="bell.slash"
                android_material_icon_name="notifications_off"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>Aucune notification</Text>
              <Text style={styles.emptyStateSubtext}>Appuyez sur + pour créer une notification</Text>
            </View>
          ) : (
            notifications.map((item) => {
              const catColor = CATEGORY_COLORS[item.category] || '#607D8B';
              const catLabel = CATEGORY_LABELS[item.category] || item.category;
              const typeLabel = TYPE_OPTIONS.find(t => t.key === item.type)?.label || item.type;
              const itemPublished = isPublished(item);
              const itemBody = getNotifBody(item);
              return (
                <View key={item.id} style={styles.notifCard}>
                  <View style={styles.notifCardTop}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.categoryBadge, { backgroundColor: catColor }]}>
                        <Text style={styles.categoryBadgeText}>{catLabel}</Text>
                      </View>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{typeLabel}</Text>
                      </View>
                    </View>
                    <View style={styles.publishedToggleRow}>
                      <Text style={styles.publishedLabel}>
                        {itemPublished ? 'Publié' : 'Masqué'}
                      </Text>
                      <Switch
                        value={itemPublished}
                        onValueChange={() => handleTogglePublished(item)}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </View>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifContent} numberOfLines={2}>{itemBody}</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editBtn]}
                      onPress={() => handleEdit(item)}
                    >
                      <Text style={styles.editBtnText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleDelete(item)}
                    >
                      <Text style={styles.deleteBtnText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {!showForm && (
          <TouchableOpacity style={styles.fab} onPress={handleAdd} activeOpacity={0.85}>
            <IconSymbol
              ios_icon_name="plus"
              android_material_icon_name="add"
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: colors.textSecondary },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 15,
    color: colors.text,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  optionBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  optionBtnTextActive: { color: '#FFFFFF' },
  publishedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 16, color: colors.textSecondary, marginTop: 16, fontWeight: '600' },
  emptyStateSubtext: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },
  notifCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  publishedToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  publishedLabel: { fontSize: 12, color: colors.textSecondary },
  notifTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  notifContent: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 12 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  editBtn: { backgroundColor: colors.primary + '20' },
  deleteBtn: { backgroundColor: '#DC354520' },
  editBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  deleteBtnText: { fontSize: 13, fontWeight: '600', color: '#DC3545' },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
