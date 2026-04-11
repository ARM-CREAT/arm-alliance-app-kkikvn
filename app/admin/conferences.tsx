
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@/lib/async-storage';
import { colors } from '@/styles/commonStyles';
import { BACKEND_URL } from '@/utils/api-helpers';

const Haptics = {
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
};

interface Conference {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  hostName: string;
  status: string;
  joinUrl: string;
}

const STATUS_OPTIONS = ['scheduled', 'active', 'ended'];

const STATUS_COLORS: Record<string, string> = {
  scheduled: colors.primary,
  active: colors.success,
  ended: colors.textSecondary,
};

const emptyForm = {
  title: '',
  description: '',
  scheduledAt: '',
  duration: '',
  hostName: '',
  status: 'scheduled',
  joinUrl: '',
};

export default function AdminConferencesScreen() {
  const router = useRouter();
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingConference, setEditingConference] = useState<Conference | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const checkAuth = useCallback(async () => {
    // Auth is handled by the admin layout guard — no redirect needed here
  }, []);

  const getAdminHeaders = async () => {
    const password = await AsyncStorage.getItem('admin_password');
    return {
      'Content-Type': 'application/json',
      'x-admin-password': password || '',
    };
  };

  const fetchConferences = useCallback(async () => {
    console.log('[Admin Conferences] Fetching conferences list');
    try {
      const headers = await getAdminHeaders();
      const response = await fetch(`${BACKEND_URL}/api/conferences`, { headers });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text}`);
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.conferences || []);
      setConferences(list);
      setError('');
    } catch (e: any) {
      console.error('[Admin Conferences] Fetch error:', e.message);
      setError(e.message);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchConferences();
    setLoading(false);
  }, [fetchConferences]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConferences();
    setRefreshing(false);
  }, [fetchConferences]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    console.log('[Admin Conferences] Open create modal');
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingConference(null);
    setForm(emptyForm);
    setShowFormModal(true);
  };

  const openEdit = (conf: Conference) => {
    console.log('[Admin Conferences] Open edit modal for id:', conf.id);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingConference(conf);
    setForm({
      title: conf.title || '',
      description: conf.description || '',
      scheduledAt: conf.scheduledAt || '',
      duration: String(conf.duration || ''),
      hostName: conf.hostName || '',
      status: conf.status || 'scheduled',
      joinUrl: conf.joinUrl || '',
    });
    setShowFormModal(true);
  };

  const openDelete = (id: string) => {
    console.log('[Admin Conferences] Open delete confirm for id:', id);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }
    console.log('[Admin Conferences] Saving conference, editing:', editingConference?.id || 'new');
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const headers = await getAdminHeaders();
      const body: any = {
        title: form.title,
        description: form.description,
        scheduledAt: form.scheduledAt,
        duration: Number(form.duration) || 0,
        hostName: form.hostName,
        joinUrl: form.joinUrl,
      };
      if (editingConference) {
        body.status = form.status;
        console.log('[Admin Conferences] PUT /api/conferences/' + editingConference.id);
        const response = await fetch(`${BACKEND_URL}/api/conferences/${editingConference.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Erreur ${response.status}: ${text}`);
        }
      } else {
        console.log('[Admin Conferences] POST /api/conferences');
        const response = await fetch(`${BACKEND_URL}/api/conferences`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Erreur ${response.status}: ${text}`);
        }
      }
      setShowFormModal(false);
      await fetchConferences();
    } catch (e: any) {
      console.error('[Admin Conferences] Save error:', e.message);
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    console.log('[Admin Conferences] DELETE /api/conferences/' + deletingId);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const headers = await getAdminHeaders();
      const response = await fetch(`${BACKEND_URL}/api/conferences/${deletingId}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text}`);
      }
      setShowDeleteModal(false);
      setDeletingId(null);
      await fetchConferences();
    } catch (e: any) {
      console.error('[Admin Conferences] Delete error:', e.message);
      Alert.alert('Erreur', e.message);
    }
  };

  const statusLabel = (s: string) => {
    if (s === 'scheduled') return 'Planifiée';
    if (s === 'active') return 'Active';
    if (s === 'ended') return 'Terminée';
    return s;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Conférences',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity onPress={openCreate} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>+ Créer</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          >
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : conferences.length === 0 ? (
              <Text style={styles.emptyText}>Aucune conférence. Créez-en une !</Text>
            ) : (
              conferences.map((conf) => {
                const statusColor = STATUS_COLORS[conf.status] || colors.textSecondary;
                const statusText = statusLabel(conf.status);
                return (
                  <View key={conf.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{conf.title}</Text>
                      <View style={[styles.badge, { backgroundColor: statusColor }]}>
                        <Text style={styles.badgeText}>{statusText}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardMeta}>{conf.hostName}</Text>
                    <Text style={styles.cardMeta}>{conf.scheduledAt}</Text>
                    <View style={styles.cardActions}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(conf)}>
                        <Text style={styles.editBtnText}>Modifier</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => openDelete(conf.id)}>
                        <Text style={styles.deleteBtnText}>Supprimer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      {/* Form Modal */}
      <Modal visible={showFormModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingConference ? 'Modifier la conférence' : 'Nouvelle conférence'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Titre *</Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="Titre de la conférence"
              />
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Description"
                multiline
                numberOfLines={3}
              />
              <Text style={styles.label}>Date/Heure (ISO)</Text>
              <TextInput
                style={styles.input}
                value={form.scheduledAt}
                onChangeText={(v) => setForm((f) => ({ ...f, scheduledAt: v }))}
                placeholder="2024-12-31T10:00:00Z"
              />
              <Text style={styles.label}>Durée (minutes)</Text>
              <TextInput
                style={styles.input}
                value={form.duration}
                onChangeText={(v) => setForm((f) => ({ ...f, duration: v }))}
                placeholder="60"
                keyboardType="numeric"
              />
              <Text style={styles.label}>Hôte</Text>
              <TextInput
                style={styles.input}
                value={form.hostName}
                onChangeText={(v) => setForm((f) => ({ ...f, hostName: v }))}
                placeholder="Nom de l'hôte"
              />
              <Text style={styles.label}>URL de connexion</Text>
              <TextInput
                style={styles.input}
                value={form.joinUrl}
                onChangeText={(v) => setForm((f) => ({ ...f, joinUrl: v }))}
                placeholder="https://..."
                autoCapitalize="none"
              />
              {editingConference && (
                <>
                  <Text style={styles.label}>Statut</Text>
                  <View style={styles.statusRow}>
                    {STATUS_OPTIONS.map((s) => {
                      const isSelected = form.status === s;
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[styles.statusChip, isSelected && styles.statusChipActive]}
                          onPress={() => setForm((f) => ({ ...f, status: s }))}
                        >
                          <Text style={[styles.statusChipText, isSelected && styles.statusChipTextActive]}>
                            {statusLabel(s)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowFormModal(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmContainer}>
            <Text style={styles.modalTitle}>Supprimer la conférence ?</Text>
            <Text style={styles.confirmText}>Cette action est irréversible.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={handleDelete}>
                <Text style={styles.saveBtnText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: 60 },
  list: { padding: 16 },
  errorText: { color: colors.error, textAlign: 'center', marginTop: 20 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 1, marginRight: 8 },
  cardMeta: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  editBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  deleteBtn: { flex: 1, backgroundColor: colors.error, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  deleteBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  headerBtn: { marginRight: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  headerBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  confirmContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    margin: 32,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  confirmText: { fontSize: 15, color: colors.textSecondary, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 4, marginTop: 12 },
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
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statusChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusChipText: { fontSize: 13, color: colors.textSecondary },
  statusChipTextActive: { color: '#fff', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  deleteConfirmBtn: { flex: 1, backgroundColor: colors.error, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
});
