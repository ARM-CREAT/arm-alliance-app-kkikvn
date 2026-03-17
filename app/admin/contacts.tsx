
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles/commonStyles';
import { BACKEND_URL } from '@/utils/api-helpers';

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  address: string;
  type: string;
}

const TYPE_OPTIONS = ['general', 'regional', 'media'];

const TYPE_COLORS: Record<string, string> = {
  general: colors.primary,
  regional: colors.secondary,
  media: colors.accent,
};

const TYPE_LABELS: Record<string, string> = {
  general: 'Général',
  regional: 'Régional',
  media: 'Médias',
};

const emptyForm = {
  name: '',
  role: '',
  phone: '',
  email: '',
  address: '',
  type: 'general',
};

export default function AdminContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const checkAuth = useCallback(async () => {
    const password = await AsyncStorage.getItem('admin_password');
    if (!password) {
      router.replace('/admin/login');
    }
  }, [router]);

  const getAdminHeaders = async (): Promise<Record<string, string>> => {
    const password = await AsyncStorage.getItem('admin_password');
    return {
      'Content-Type': 'application/json',
      'x-admin-password': password || '',
    };
  };

  const fetchContacts = useCallback(async () => {
    console.log('[Admin Contacts] GET /api/contacts');
    try {
      const headers = await getAdminHeaders();
      const response = await fetch(`${BACKEND_URL}/api/contacts`, { headers });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text}`);
      }
      const data = await response.json();
      const list: Contact[] = Array.isArray(data) ? data : (data.contacts || []);
      setContacts(list);
      setError('');
    } catch (e: any) {
      console.error('[Admin Contacts] Fetch error:', e.message);
      setError(e.message);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchContacts();
    setLoading(false);
  }, [fetchContacts]);

  const onRefresh = useCallback(async () => {
    console.log('[Admin Contacts] Pull-to-refresh triggered');
    setRefreshing(true);
    await fetchContacts();
    setRefreshing(false);
  }, [fetchContacts]);

  useEffect(() => {
    checkAuth();
    loadData();
  }, [checkAuth, loadData]);

  const openCreate = () => {
    console.log('[Admin Contacts] Open create modal');
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingContact(null);
    setForm({ ...emptyForm });
    setShowFormModal(true);
  };

  const openEdit = (contact: Contact) => {
    console.log('[Admin Contacts] Open edit modal for id:', contact.id);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingContact(contact);
    setForm({
      name: contact.name || '',
      role: contact.role || '',
      phone: contact.phone || '',
      email: contact.email || '',
      address: contact.address || '',
      type: contact.type || 'general',
    });
    setShowFormModal(true);
  };

  const openDelete = (id: string) => {
    console.log('[Admin Contacts] Open delete confirm for id:', id);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingContact(null);
    setForm({ ...emptyForm });
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }
    console.log('[Admin Contacts] Saving contact, editing:', editingContact?.id || 'new');
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const headers = await getAdminHeaders();
      const body = {
        name: form.name.trim(),
        role: form.role.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        type: form.type,
      };
      if (editingContact) {
        console.log('[Admin Contacts] PUT /api/admin/contacts/' + editingContact.id);
        const response = await fetch(`${BACKEND_URL}/api/admin/contacts/${editingContact.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Erreur ${response.status}: ${text}`);
        }
        console.log('[Admin Contacts] Contact updated successfully');
      } else {
        console.log('[Admin Contacts] POST /api/admin/contacts');
        const response = await fetch(`${BACKEND_URL}/api/admin/contacts`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Erreur ${response.status}: ${text}`);
        }
        console.log('[Admin Contacts] Contact created successfully');
      }
      closeFormModal();
      await fetchContacts();
    } catch (e: any) {
      console.error('[Admin Contacts] Save error:', e.message);
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    console.log('[Admin Contacts] DELETE /api/admin/contacts/' + deletingId);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const headers = await getAdminHeaders();
      const response = await fetch(`${BACKEND_URL}/api/admin/contacts/${deletingId}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text}`);
      }
      console.log('[Admin Contacts] Contact deleted successfully');
      closeDeleteModal();
      await fetchContacts();
    } catch (e: any) {
      console.error('[Admin Contacts] Delete error:', e.message);
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Contacts',
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : contacts.length === 0 ? (
              <Text style={styles.emptyText}>Aucun contact. Créez-en un !</Text>
            ) : (
              contacts.map((contact) => {
                const typeColor = TYPE_COLORS[contact.type] || colors.primary;
                const typeLabel = TYPE_LABELS[contact.type] || contact.type;
                return (
                  <View key={contact.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{contact.name}</Text>
                      <View style={[styles.badge, { backgroundColor: typeColor }]}>
                        <Text style={styles.badgeText}>{typeLabel}</Text>
                      </View>
                    </View>
                    {contact.role ? <Text style={styles.cardRole}>{contact.role}</Text> : null}
                    {contact.phone ? <Text style={styles.cardMeta}>{contact.phone}</Text> : null}
                    {contact.email ? <Text style={styles.cardMeta}>{contact.email}</Text> : null}
                    {contact.address ? <Text style={styles.cardAddress}>{contact.address}</Text> : null}
                    <View style={styles.cardActions}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(contact)}>
                        <Text style={styles.editBtnText}>Modifier</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => openDelete(contact.id)}>
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
      <Modal visible={showFormModal} animationType="slide" transparent onRequestClose={closeFormModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingContact ? 'Modifier le contact' : 'Nouveau contact'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Nom complet"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.fieldLabel}>Rôle</Text>
              <TextInput
                style={styles.input}
                value={form.role}
                onChangeText={(v) => setForm((f) => ({ ...f, role: v }))}
                placeholder="Rôle / Fonction"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.fieldLabel}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="+223 XX XX XX XX"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                placeholder="email@exemple.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.fieldLabel}>Adresse</Text>
              <TextInput
                style={styles.input}
                value={form.address}
                onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                placeholder="Adresse"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.typeRow}>
                {TYPE_OPTIONS.map((t) => {
                  const isSelected = form.type === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, isSelected && { backgroundColor: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] }]}
                      onPress={() => {
                        console.log('[Admin Contacts] Type selected:', t);
                        setForm((f) => ({ ...f, type: t }));
                      }}
                    >
                      <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>
                        {TYPE_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={closeFormModal}
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
      <Modal visible={showDeleteModal} animationType="fade" transparent onRequestClose={closeDeleteModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmContainer}>
            <Text style={styles.modalTitle}>Supprimer ce contact ?</Text>
            <Text style={styles.confirmText}>Cette action est irréversible.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeDeleteModal}>
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
  list: { padding: 16, paddingBottom: 40 },
  errorText: { color: colors.error, textAlign: 'center', marginTop: 20, fontSize: 15 },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 1, marginRight: 8 },
  cardRole: { fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: 4 },
  cardMeta: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  cardAddress: { fontSize: 12, color: colors.textSecondary, marginBottom: 2, fontStyle: 'italic' },
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
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 4, marginTop: 12 },
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
  typeRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  typeChipText: { fontSize: 13, color: colors.textSecondary },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  deleteConfirmBtn: { flex: 1, backgroundColor: colors.error, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
});
