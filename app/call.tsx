
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { BACKEND_URL } from '@/utils/api';
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
  const [initiatingAudio, setInitiatingAudio] = useState(false);
  const [initiatingVideo, setInitiatingVideo] = useState(false);

  useEffect(() => {
    console.log('[Call] Screen opened');
    loadActiveCalls();
  }, []);

  const loadActiveCalls = async () => {
    console.log('[Call] GET /api/calls/active');
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/calls/active`);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Erreur ${res.status}: ${errText}`);
      }
      const data = await res.json();
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
    console.log('[Call] Pull-to-refresh triggered');
    setRefreshing(true);
    loadActiveCalls();
  }, []);

  const initiateCall = async (callType: 'audio' | 'video') => {
    console.log('[Call] User tapped initiate call, type:', callType);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (callType === 'audio') setInitiatingAudio(true);
    else setInitiatingVideo(true);

    try {
      console.log('[Call] POST /api/calls/initiate with targetMemberId: general, callType:', callType);
      const res = await fetch(`${BACKEND_URL}/api/calls/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMemberId: 'general', callType }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Erreur ${res.status}: ${errText}`);
      }

      const result: InitiateCallResponse = await res.json();
      console.log('[Call] Call initiated, callId:', result.callId, 'joinUrl:', result.joinUrl);

      if (!result.joinUrl) {
        Alert.alert('Appel', "L'appel a été initié mais aucun lien de connexion n'est disponible.");
        await loadActiveCalls();
        return;
      }

      const canOpen = await Linking.canOpenURL(result.joinUrl);
      if (canOpen) {
        await Linking.openURL(result.joinUrl);
      } else {
        console.warn('[Call] Cannot open URL:', result.joinUrl);
        Alert.alert('Erreur', "Impossible d'ouvrir le lien d'appel: " + result.joinUrl);
      }

      await loadActiveCalls();
    } catch (err: any) {
      console.error('[Call] Error initiating call:', err);
      const msg = err.message || "Impossible d'initier l'appel.";
      setError(msg);
      Alert.alert('Erreur', msg);
    } finally {
      setInitiatingAudio(false);
      setInitiatingVideo(false);
    }
  };

  const handleJoinCall = async (call: ActiveCall) => {
    console.log('[Call] User tapped join call:', call.id, call.joinUrl);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (!call.joinUrl) {
      Alert.alert('Erreur', "Aucun lien de connexion disponible pour cet appel.");
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(call.joinUrl);
      if (canOpen) {
        await Linking.openURL(call.joinUrl);
      } else {
        Alert.alert('Erreur', "Impossible d'ouvrir le lien d'appel.");
      }
    } catch (err) {
      console.error('[Call] Error opening call URL:', err);
      Alert.alert('Erreur', "Impossible d'ouvrir le lien d'appel.");
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

      {/* Hero section with two big call buttons */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Appeler un Membre</Text>
        <Text style={styles.heroSubtitle}>Lancez un appel audio ou vidéo sécurisé</Text>
        <View style={styles.heroButtons}>
          <TouchableOpacity
            style={[styles.heroBtn, styles.heroBtnVideo]}
            onPress={() => initiateCall('video')}
            disabled={initiatingVideo || initiatingAudio}
            activeOpacity={0.8}
          >
            {initiatingVideo ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Text style={styles.heroBtnIcon}>📹</Text>
                <Text style={[styles.heroBtnText, { color: colors.primary }]}>Appel Vidéo</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.heroBtn, styles.heroBtnAudio]}
            onPress={() => initiateCall('audio')}
            disabled={initiatingAudio || initiatingVideo}
            activeOpacity={0.8}
          >
            {initiatingAudio ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.heroBtnIcon}>📞</Text>
                <Text style={[styles.heroBtnText, { color: '#FFFFFF' }]}>Appel Audio</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => { setError(null); loadActiveCalls(); }}>
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
            const callTypeLabel = call.callType === 'video' ? 'Appel Vidéo' : 'Appel Audio';
            const callTypeIcon = call.callType === 'video' ? '📹' : '📞';

            return (
              <View key={call.id} style={styles.callCard}>
                <View style={styles.callAvatarCircle}>
                  <Text style={styles.callAvatarIcon}>{callTypeIcon}</Text>
                </View>
                <View style={styles.callInfo}>
                  <Text style={styles.callTypeText}>{callTypeLabel}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  heroSection: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 24 },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 20 },
  heroButtons: { flexDirection: 'row', gap: 12 },
  heroBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 8, minHeight: 56 },
  heroBtnVideo: { backgroundColor: '#FFFFFF' },
  heroBtnAudio: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  heroBtnIcon: { fontSize: 20 },
  heroBtnText: { fontSize: 15, fontWeight: '700' },
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
  callTypeText: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  callStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  callStatus: { fontSize: 13, fontWeight: '500' },
  callTime: { fontSize: 12, color: colors.textSecondary },
  joinCallBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  joinCallBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
