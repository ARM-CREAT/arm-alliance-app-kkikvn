
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
  Platform,
  Linking,
  Modal as RNModal,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { BACKEND_URL } from '@/utils/api-helpers';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Conference {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  hostName: string;
  status: 'scheduled' | 'active' | 'ended';
  joinUrl?: string;
  roomCode?: string;
}

const DURATION_OPTIONS = [30, 60, 90, 120];

function formatDateTime(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    scheduled: colors.warning,
    active: colors.success,
    ended: colors.textSecondary,
  };
  return map[status] || colors.textSecondary;
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    scheduled: 'Planifiée',
    active: 'En cours',
    ended: 'Terminée',
  };
  return map[status] || status;
}

export default function ConferenceScreen() {
  const insets = useSafeAreaInsets();
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formScheduledDate, setFormScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formDuration, setFormDuration] = useState(60);
  const [formHostName, setFormHostName] = useState('');

  useEffect(() => {
    console.log('[Conference] Screen opened');
    checkAdminStatus();
    loadConferences();
  }, []);

  const checkAdminStatus = async () => {
    const pw = await AsyncStorage.getItem('admin_password');
    setIsAdmin(!!pw);
  };

  const loadConferences = async () => {
    console.log('[Conference] GET /api/conferences');
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/conferences`);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Erreur ${res.status}: ${errText}`);
      }
      const data = await res.json();
      console.log('[Conference] Conferences loaded:', data?.length ?? 0);
      setConferences(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[Conference] Error loading conferences:', err);
      setError('Impossible de charger les conférences.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    console.log('[Conference] Pull-to-refresh triggered');
    setRefreshing(true);
    loadConferences();
  }, []);

  const handleJoin = async (conference: Conference) => {
    console.log('[Conference] User tapped Rejoindre for:', conference.id, conference.joinUrl);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const url = conference.joinUrl;
    if (!url) {
      console.warn('[Conference] No joinUrl available');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.warn('[Conference] Cannot open URL:', url);
      }
    } catch (err) {
      console.error('[Conference] Error opening URL:', err);
    }
  };

  const handleOpenCreateModal = () => {
    console.log('[Conference] Admin opening create conference modal');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFormTitle('');
    setFormDescription('');
    setFormScheduledDate(new Date());
    setFormDuration(60);
    setFormHostName('');
    setShowCreateModal(true);
  };

  const handleCreateConference = async () => {
    if (!formTitle.trim() || !formHostName.trim()) {
      return;
    }
    console.log('[Conference] POST /api/conferences');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSubmitting(true);
    try {
      const password = await AsyncStorage.getItem('admin_password');
      const scheduledAt = formScheduledDate.toISOString();
      const response = await fetch(`${BACKEND_URL}/api/conferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password || '',
        },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          scheduledAt,
          duration: formDuration,
          hostName: formHostName.trim(),
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errText}`);
      }
      console.log('[Conference] Conference created successfully');
      setShowCreateModal(false);
      await loadConferences();
    } catch (err: any) {
      console.error('[Conference] Error creating conference:', err);
      setError(err.message || 'Impossible de créer la conférence.');
    } finally {
      setSubmitting(false);
    }
  };

  // Find the first active conference's roomCode for the "Rejoindre en direct" button
  const activeConference = conferences.find(c => c.status === 'active');
  const liveRoomCode = activeConference?.roomCode ?? 'ARM-0001';

  const scheduledAtDisplay = formScheduledDate.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: true, title: 'Conférences', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF' }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des conférences...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Conférences',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerRight: isAdmin
            ? () => (
                <View style={styles.headerBtnRow}>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('[Conference] Admin tapped Lancer la caméra (host mode)');
                      router.push({
                        pathname: '/live-conference',
                        params: {
                          title: 'Conférence ARM en Direct',
                          hostName: 'ARM',
                          roomCode: liveRoomCode,
                          isHost: 'true',
                          participantName: 'ARM',
                        },
                      });
                    }}
                    style={[styles.headerBtn, styles.headerBtnCamera]}
                  >
                    <Text style={styles.headerBtnText}>📹</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleOpenCreateModal} style={styles.headerBtn}>
                    <Text style={styles.headerBtnText}>+ Créer</Text>
                  </TouchableOpacity>
                </View>
              )
            : undefined,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Join live button — always visible at top */}
        <TouchableOpacity
          style={styles.joinLiveBtn}
          onPress={() => {
            console.log('[Conference] User tapped Rejoindre en direct, roomCode:', liveRoomCode);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            router.push({
              pathname: '/live-conference',
              params: {
                title: 'Conférence ARM en Direct',
                hostName: 'ARM',
                roomCode: liveRoomCode,
                isHost: 'false',
                participantName: 'Militant ARM',
              },
            });
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.joinLiveBtnIcon}>🔴</Text>
          <View style={styles.joinLiveBtnTextCol}>
            <Text style={styles.joinLiveBtnTitle}>Rejoindre en direct</Text>
            <Text style={styles.joinLiveBtnSub}>Conférence ARM • {liveRoomCode}</Text>
          </View>
          <Text style={styles.joinLiveBtnArrow}>›</Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadConferences}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {conferences.length === 0 && !error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Aucune conférence</Text>
            <Text style={styles.emptySubtitle}>
              Les prochaines conférences vidéo apparaîtront ici.
            </Text>
          </View>
        ) : (
          conferences.map((conf) => {
            const statusColor = getStatusColor(conf.status);
            const statusLabel = getStatusLabel(conf.status);
            const dateStr = formatDateTime(conf.scheduledAt);
            const canJoin = conf.status === 'active' || conf.status === 'scheduled';
            const rc = conf.roomCode ?? 'ARM-0001';
            const hostIsAdmin = isAdmin;

            return (
              <View key={conf.id} style={styles.card}>
                <View style={styles.cardAccent} />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{conf.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '25', borderColor: statusColor }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>

                  {conf.description ? (
                    <Text style={styles.cardDescription} numberOfLines={2}>{conf.description}</Text>
                  ) : null}

                  <View style={styles.cardMeta}>
                    <Text style={styles.metaIcon}>👤</Text>
                    <Text style={styles.metaText}>{conf.hostName}</Text>
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={styles.metaIcon}>🕐</Text>
                    <Text style={styles.metaText}>{dateStr}</Text>
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={styles.metaIcon}>⏱</Text>
                    <Text style={styles.metaText}>{conf.duration} minutes</Text>
                  </View>

                  {canJoin && conf.joinUrl ? (
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={() => handleJoin(conf)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.joinButtonIcon}>📹</Text>
                      <Text style={styles.joinButtonText}>Rejoindre</Text>
                    </TouchableOpacity>
                  ) : null}

                  {conf.status === 'active' ? (
                    <TouchableOpacity
                      style={styles.liveButton}
                      onPress={() => {
                        console.log('[Conference] User tapped Démarrer en direct for:', conf.id, 'roomCode:', rc, 'isHost:', hostIsAdmin);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }
                        router.push({
                          pathname: '/live-conference',
                          params: {
                            title: conf.title,
                            hostName: conf.hostName,
                            roomCode: rc,
                            isHost: hostIsAdmin ? 'true' : 'false',
                            participantName: hostIsAdmin ? conf.hostName : 'Militant ARM',
                          },
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.liveButtonIcon}>🔴</Text>
                      <Text style={styles.liveButtonText}>Démarrer en direct</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Conference Modal */}
      <RNModal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrapper}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nouvelle Conférence</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Titre *</Text>
                <TextInput style={styles.input} value={formTitle} onChangeText={setFormTitle} placeholder="Titre de la conférence" placeholderTextColor={colors.textSecondary} />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput style={[styles.input, styles.textArea]} value={formDescription} onChangeText={setFormDescription} placeholder="Description (optionnel)" placeholderTextColor={colors.textSecondary} multiline numberOfLines={3} />

                <Text style={styles.inputLabel}>Date et heure *</Text>
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => {
                    console.log('[Conference] User tapped date picker');
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.datePickerBtnText}>{scheduledAtDisplay}</Text>
                  <Text style={styles.datePickerIcon}>📅</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={formScheduledDate}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS !== 'ios') setShowDatePicker(false);
                      if (selectedDate) {
                        console.log('[Conference] Date selected:', selectedDate.toISOString());
                        setFormScheduledDate(selectedDate);
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}
                {Platform.OS === 'ios' && showDatePicker && (
                  <TouchableOpacity style={styles.datePickerDoneBtn} onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerDoneText}>Confirmer</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.inputLabel}>Durée</Text>
                <View style={styles.durationRow}>
                  {DURATION_OPTIONS.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.durationChip, formDuration === d && styles.durationChipActive]}
                      onPress={() => {
                        console.log('[Conference] Duration selected:', d);
                        setFormDuration(d);
                      }}
                    >
                      <Text style={[styles.durationChipText, formDuration === d && styles.durationChipTextActive]}>
                        {d} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Nom de l'hôte *</Text>
                <TextInput style={styles.input} value={formHostName} onChangeText={setFormHostName} placeholder="Nom de l'animateur" placeholderTextColor={colors.textSecondary} />

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateModal(false)} disabled={submitting}>
                    <Text style={styles.cancelBtnText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.createBtn, (!formTitle.trim() || !formHostName.trim()) && styles.createBtnDisabled]}
                    onPress={handleCreateConference}
                    disabled={submitting || !formTitle.trim() || !formHostName.trim()}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.createBtnText}>Créer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </RNModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  headerBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  headerBtnCamera: { paddingHorizontal: 8 },
  headerBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  listContent: { padding: 16, paddingBottom: 32 },
  errorBanner: { backgroundColor: colors.danger + '15', borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorText: { fontSize: 14, color: colors.danger, flex: 1 },
  retryText: { fontSize: 14, color: colors.primary, fontWeight: '600', marginLeft: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  card: { backgroundColor: colors.card, borderRadius: 16, marginBottom: 16, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  cardAccent: { width: 5, backgroundColor: colors.primary },
  cardContent: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  metaIcon: { fontSize: 14 },
  metaText: { fontSize: 13, color: colors.textSecondary },
  joinButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, marginTop: 12, gap: 8 },
  joinButtonIcon: { fontSize: 16 },
  joinButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  liveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success, borderRadius: 10, paddingVertical: 12, marginTop: 8, gap: 8 },
  liveButtonIcon: { fontSize: 14 },
  liveButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalWrapper: { justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  modalClose: { fontSize: 20, color: colors.textSecondary, padding: 4 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.card, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  datePickerBtnText: { fontSize: 15, color: colors.text },
  datePickerIcon: { fontSize: 16 },
  datePickerDoneBtn: { alignSelf: 'flex-end', paddingHorizontal: 20, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: 8, marginBottom: 16 },
  datePickerDoneText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  durationChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  durationChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  durationChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  durationChipTextActive: { color: '#FFFFFF' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.backgroundAlt },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.text },
  createBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  joinLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3A1F',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(45,139,60,0.4)',
    gap: 12,
  },
  joinLiveBtnIcon: { fontSize: 20 },
  joinLiveBtnTextCol: { flex: 1 },
  joinLiveBtnTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  joinLiveBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  joinLiveBtnArrow: { fontSize: 22, color: colors.success, fontWeight: '300' },
});
