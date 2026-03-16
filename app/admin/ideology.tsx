
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
import { BACKEND_URL } from '@/utils/api';

interface IdeologySection {
  key: string;
  title: string;
  content: string;
}

export default function AdminIdeologyScreen() {
  const router = useRouter();
  const [sections, setSections] = useState<IdeologySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<IdeologySection | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [saving, setSaving] = useState(false);

  const checkAuth = useCallback(async () => {
    const password = await AsyncStorage.getItem('admin_password');
    if (!password) {
      router.replace('/admin/login');
    }
  }, [router]);

  const getAdminHeaders = async () => {
    const password = await AsyncStorage.getItem('admin_password');
    return {
      'Content-Type': 'application/json',
      'x-admin-password': password || '',
    };
  };

  const fetchSections = useCallback(async () => {
    console.log('[Admin Ideology] GET /api/ideology');
    try {
      const response = await fetch(`${BACKEND_URL}/api/ideology`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text}`);
      }
      const data = await response.json();
      const list: IdeologySection[] = Array.isArray(data.sections) ? data.sections : [];
      setSections(list);
      setError('');
    } catch (e: any) {
      console.error('[Admin Ideology] Fetch error:', e.message);
      setError(e.message);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchSections();
    setLoading(false);
  }, [fetchSections]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSections();
    setRefreshing(false);
  }, [fetchSections]);

  useEffect(() => {
    checkAuth();
    loadData();
  }, [checkAuth, loadData]);

  const openEdit = (section: IdeologySection) => {
    console.log('[Admin Ideology] Open edit modal for key:', section.key);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingSection(section);
    setFormTitle(section.title);
    setFormContent(section.content);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingSection) return;
    console.log('[Admin Ideology] PUT /api/admin/ideology/' + editingSection.key);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const headers = await getAdminHeaders();
      const response = await fetch(`${BACKEND_URL}/api/admin/ideology/${editingSection.key}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ title: formTitle, content: formContent }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text}`);
      }
      setShowModal(false);
      await fetchSections();
      Alert.alert('Succès', 'Section mise à jour avec succès.');
    } catch (e: any) {
      console.error('[Admin Ideology] Save error:', e.message);
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Idéologie',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
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
            ) : sections.length === 0 ? (
              <Text style={styles.emptyText}>Aucune section trouvée.</Text>
            ) : (
              sections.map((section) => {
                const truncated = section.content.length > 120
                  ? section.content.substring(0, 120) + '...'
                  : section.content;
                return (
                  <View key={section.key} style={styles.card}>
                    <Text style={styles.cardKey}>{section.key}</Text>
                    <Text style={styles.cardTitle}>{section.title}</Text>
                    <Text style={styles.cardContent}>{truncated}</Text>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(section)}>
                      <Text style={styles.editBtnText}>Modifier</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      {/* Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Modifier la section</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Titre</Text>
              <TextInput
                style={styles.input}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="Titre de la section"
              />
              <Text style={styles.label}>Contenu</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formContent}
                onChangeText={setFormContent}
                placeholder="Contenu de la section"
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
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
  cardKey: { fontSize: 11, fontWeight: '600', color: colors.primary, textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  cardContent: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  editBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
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
  textArea: { height: 200, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
