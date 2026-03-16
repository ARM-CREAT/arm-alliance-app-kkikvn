
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
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { apiGet, apiPost } from '@/utils/api';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ActiveCall {
  id: string;
  callType: 'audio' | 'video';
  status: 'initiating' | 'active' | 'ended';
  joinUrl?: string;
  initiatorId?: string;
  targetMemberId?: string;
  createdAt: string;
}

interface InitiateCallResponse {
  callId: string;
  joinUrl: string;
  status: string;
}

function formatTime(dateString: string) {
  try {
    return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateString;
  }
}

function getCallStatusLabel(status: string) {
  const map: Record<string, string> = {
    initiating: 'En cours de connexion',
    active: 'Actif',
    ended: 'Terminé',
  };
  return map[status] || status;
}

function getCallStatusColor(status: string) {
  const map: Record<string, string> = {
    initiating: colors.warning,
    active: colors.success,
    ended: colors.textSecondary,
  };
  return map[status] || colors.textSecondary;
}

export default function CallScreen() {
  const insets = useSafeAreaInsets();
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [targetMemberId, setTargetMemberId] = useState('');
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [initiating, setInitiating] = useState(false);

  useEffect(() => {
    console.log('[Call] Screen opened');
    loadActiveCalls();
  }, []);

  const loadActiveCalls = async () => {
    console.log('[Call] GET /api/calls/active');
    setError(null);
    try {
      const data = await apiGet<ActiveCall[]>('/api/calls/active');
      console.log('[Call] Active calls loaded:', data?.length ?? 0);
      setActiveCalls(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[Call] Error loading active calls:', err);
      setError('Impossible de charger les appels actifs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadActiveCalls();
  }, []);

  const handleInitiateCall = async () => {
    if (!targetMemberId.trim()) return;
    console.log('[Call] POST /api/calls/initiate with targetMemberId:', targetMemberId, 'callType:', callType);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setInitiating(true);
    try {
      const result = await apiPost<InitiateCallResponse>('/api/calls/initiate', {
        targetMemberId: targetMemberId.trim(),
        callType,
      });
      console.log('[Call] Call initiated, joinUrl:', result.joinUrl);
      setShowInitiateModal(false);
      setTargetMemberId('');
      if (result.joinUrl) {
        const canOpen = await Linking.canOpenURL(result.joinUrl);
        if (canOpen) {
          await Linking.openURL(result.joinUrl);
        }
      }
      await loadActiveCalls();
    } catch (err: any) {
      console.error('[Call] Error initiating call:', err);
      setError(err.message || "Impossible d'initier l'appel.");
    } finally {
      setInitiating(false);
    }
  };

  const handleJoinCall = async (call: ActiveCall) => {
    console.log('[Call] User tapped join call:', call.id, call.joinUrl);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (!call.joinUrl) return;
    try {
      const canOpen = await Linking.canOpenURL(call.joinUrl);
      if (canOpen) {
        await Linking.openURL(call.joinUrl);
      }
    } catch (err) {
      console.error('[Call] Error opening call URL:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: true, title: 'Appels', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF' }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des appels...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Appels',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />

      {/* Initiate Call Hero */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Appeler un Membre</Text>
          <Text style={styles.heroSubtitle}>Lancez un appel audio ou vidéo sécurisé</Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={[styles.heroBtn, styles.heroBtnVideo]}
              onPress={() => {
                console.log('[Call] User tapped initiate video call');
                setCallType('video');
                setShowInitiateModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.heroBtnIcon}>📹</Text>
              <Text style={styles.heroBtnText}>Vidéo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.heroBtn, styles.heroBtnAudio]}
              onPress={() => {
                console.log('[Call] User tapped initiate audio call');
                setCallType('audio');
                setShowInitiateModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.heroBtnIcon}>📞</Text>
              <Text style={styles.heroBtnText}>Audio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadActiveCalls}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Appels Actifs</Text>

        {activeCalls.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📵</Text>
            <Text style={styles.emptyTitle}>Aucun appel actif</Text>
            <Text style={styles.emptySubtitle}>
              Lancez un appel en utilisant les boutons ci-dessus.
            </Text>
          </View>
        ) : (
          activeCalls.map((call) => {
            const statusColor = getCallStatusColor(call.status);
            const statusLabel = getCallStatusLabel(call.status);
            const timeStr = formatTime(call.createdAt);
            const isActive = call.status === 'active' || call.status === 'initiating';

            return (
              <View key={call.id} style={styles.callCard}>
                <View style={styles.callAvatarCircle}>
                  <Text style={styles.callAvatarIcon}>
                    {call.callType === 'video' ? '📹' : '📞'}
                  </Text>
                </View>
                <View style={styles.callInfo}>
                  <Text style={styles.callType}>
                    {call.callType === 'video' ? 'Appel Vidéo' : 'Appel Audio'}
                  </Text>
                  <View style={styles.callStatusRow}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.callStatus, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                  <Text style={styles.callTime}>{timeStr}</Text>
                </View>
                {isActive && call.joinUrl ? (
                  <TouchableOpacity
                    style={styles.joinCallBtn}
                    onPress={() => handleJoinCall(call)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.joinCallBtnText}>Rejoindre</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Initiate Call Modal */}
      <RNModal visible={showInitiateModal} transparent animationType="slide" onRequestClose={() => setShowInitiateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {callType === 'video' ? '📹 Appel Vidéo' : '📞 Appel Audio'}
              </Text>
              <TouchableOpacity onPress={() => setShowInitiateModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>ID du membre à appeler</Text>
            <TextInput
              style={styles.input}
              value={targetMemberId}
              onChangeText={setTargetMemberId}
              placeholder="Numéro ou ID du membre"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Type d'appel</Text>
            <View style={styles.callTypeRow}>
              <TouchableOpacity
                style={[styles.callTypeChip, callType === 'video' && styles.callTypeChipActive]}
                onPress={() => setCallType('video')}
              >
                <Text style={styles.callTypeIcon}>📹</Text>
                <Text style={[styles.callTypeText, callType === 'video' && styles.callTypeTextActive]}>Vidéo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.callTypeChip, callType === 'audio' && styles.callTypeChipActive]}
                onPress={() => setCallType('audio')}
              >
                <Text style={styles.callTypeIcon}>📞</Text>
                <Text style={[styles.callTypeText, callType === 'audio' && styles.callTypeTextActive]}>Audio</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowInitiateModal(false)} disabled={initiating}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.callBtn, !targetMemberId.trim() && styles.callBtnDisabled]}
                onPress={handleInitiateCall}
                disabled={initiating || !targetMemberId.trim()}
              >
                {initiating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.callBtnText}>Appeler</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  heroSection: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 24 },
  heroContent: {},
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: '#FFFFFF', opacity: 0.85, marginBottom: 20 },
  heroButtons: { flexDirection: 'row', gap: 12 },
  heroBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 8 },
  heroBtnVideo: { backgroundColor: '#FFFFFF' },
  heroBtnAudio: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  heroBtnIcon: { fontSize: 18 },
  heroBtnText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  listContent: { padding: 16, paddingBottom: 32 },
  errorBanner: { backgroundColor: colors.danger + '15', borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorText: { fontSize: 14, color: colors.danger, flex: 1 },
  retryText: { fontSize: 14, color: colors.primary, fontWeight: '600', marginLeft: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  callCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  callAvatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '18', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  callAvatarIcon: { fontSize: 22 },
  callInfo: { flex: 1 },
  callType: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  callStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  callStatus: { fontSize: 13, fontWeight: '500' },
  callTime: { fontSize: 12, color: colors.textSecondary },
  joinCallBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  joinCallBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  modalClose: { fontSize: 20, color: colors.textSecondary, padding: 4 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.card, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  callTypeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  callTypeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, gap: 8 },
  callTypeChipActive: { backgroundColor: colors.primary + '15', borderColor: colors.primary },
  callTypeIcon: { fontSize: 18 },
  callTypeText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  callTypeTextActive: { color: colors.primary },
  modalActions: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.backgroundAlt },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.text },
  callBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary },
  callBtnDisabled: { opacity: 0.5 },
  callBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
