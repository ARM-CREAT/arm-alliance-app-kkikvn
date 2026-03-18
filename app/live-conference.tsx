
// NOTE: This is a signaling-only implementation using WebSocket for chat and participant tracking.
// Real WebRTC peer video streams are not implemented — only the local camera feed is shown.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '@/utils/api';

// Derive WS base from BACKEND_URL (replace http(s) with ws(s))
const WS_BASE = BACKEND_URL.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isSystem: boolean;
}

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: string;
}

function nowTime() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function LiveConferenceScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    title?: string;
    hostName?: string;
    roomCode?: string;
    isHost?: string;
    participantName?: string;
  }>();

  const conferenceTitle = params.title ?? 'Conférence ARM en Direct';
  const hostName = params.hostName ?? 'ARM';
  const roomCode = params.roomCode ?? 'ARM-0001';
  const isHost = params.isHost === 'true';
  const participantName = params.participantName ?? 'Participant';

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantCount, setParticipantCount] = useState(1);
  const [wsConnected, setWsConnected] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const chatScrollRef = useRef<ScrollView>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;

  // Panel slide animation
  const showPanel = showChat || showParticipants;
  useEffect(() => {
    Animated.timing(panelAnim, {
      toValue: showPanel ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [showPanel]);

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.5, 0],
  });

  // Timer
  useEffect(() => {
    const granted = cameraPermission?.granted && micPermission?.granted;
    if (granted) {
      intervalRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [cameraPermission?.granted, micPermission?.granted]);

  // WebSocket
  useEffect(() => {
    const granted = cameraPermission?.granted && micPermission?.granted;
    if (!granted) return;

    const url = `${WS_BASE}/ws/conference/${roomCode}?name=${encodeURIComponent(participantName)}&isHost=${isHost}`;
    console.log('[LiveConference] Connecting WebSocket:', url);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[LiveConference] WebSocket connected, room:', roomCode);
      setWsConnected(true);
      addSystemMessage('Vous avez rejoint la conférence');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('[LiveConference] WS message received:', msg.type, msg);
        handleWsMessage(msg);
      } catch (e) {
        console.warn('[LiveConference] WS parse error:', e);
      }
    };

    ws.onclose = () => {
      console.log('[LiveConference] WebSocket closed');
      setWsConnected(false);
      addSystemMessage('Connexion perdue');
    };

    ws.onerror = (e) => {
      console.error('[LiveConference] WebSocket error:', e);
      setWsConnected(false);
      addSystemMessage('Connexion perdue');
    };

    return () => {
      console.log('[LiveConference] Closing WebSocket on unmount');
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraPermission?.granted, micPermission?.granted]);

  const addSystemMessage = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: `sys-${Date.now()}-${Math.random()}`,
      sender: '',
      text,
      time: nowTime(),
      isSystem: true,
    };
    setChatMessages((prev) => [...prev, msg]);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleWsMessage = useCallback((msg: any) => {
    if (msg.type === 'participant-joined') {
      const name = msg.name ?? 'Inconnu';
      const newP: Participant = {
        id: msg.id ?? String(Date.now()),
        name,
        isHost: msg.isHost === true,
        joinedAt: nowTime(),
      };
      setParticipants((prev) => {
        if (prev.find((p) => p.id === newP.id)) return prev;
        return [...prev, newP];
      });
      addSystemMessage(`${name} a rejoint`);
      if (msg.participantCount != null) setParticipantCount(Number(msg.participantCount));
      else setParticipantCount((p) => p + 1);
    } else if (msg.type === 'participant-left') {
      const name = msg.name ?? 'Inconnu';
      setParticipants((prev) => prev.filter((p) => p.id !== msg.id));
      addSystemMessage(`${name} a quitté`);
      if (msg.participantCount != null) setParticipantCount(Number(msg.participantCount));
      else setParticipantCount((p) => Math.max(1, p - 1));
    } else if (msg.type === 'chat') {
      const chatMsg: ChatMessage = {
        id: `chat-${Date.now()}-${Math.random()}`,
        sender: msg.sender ?? 'Inconnu',
        text: msg.text ?? '',
        time: nowTime(),
        isSystem: false,
      };
      setChatMessages((prev) => [...prev, chatMsg]);
      setUnreadCount((p) => p + 1);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    } else if (msg.type === 'participant-update') {
      if (msg.participantCount != null) setParticipantCount(Number(msg.participantCount));
    }
  }, [addSystemMessage]);

  const handleSendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    console.log('[LiveConference] Sending chat message:', text);
    const payload = { type: 'chat', sender: participantName, text };
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
    const localMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      sender: participantName,
      text,
      time: nowTime(),
      isSystem: false,
    };
    setChatMessages((prev) => [...prev, localMsg]);
    setChatInput('');
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [chatInput, participantName]);

  const handleToggleChat = useCallback(() => {
    const next = !showChat;
    console.log('[LiveConference] Chat panel toggled:', next);
    setShowChat(next);
    if (next) {
      setShowParticipants(false);
      setUnreadCount(0);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: false }), 200);
    }
  }, [showChat]);

  const handleToggleParticipants = useCallback(() => {
    const next = !showParticipants;
    console.log('[LiveConference] Participants panel toggled:', next);
    setShowParticipants(next);
    if (next) setShowChat(false);
  }, [showParticipants]);

  const handleEndCall = useCallback(() => {
    console.log('[LiveConference] End call pressed, elapsed:', elapsed, 's');
    if (intervalRef.current) clearInterval(intervalRef.current);
    wsRef.current?.close();
    router.back();
  }, [elapsed]);

  const handleFlipCamera = useCallback(() => {
    const next = facing === 'front' ? 'back' : 'front';
    console.log('[LiveConference] Flip camera:', next);
    setFacing(next);
  }, [facing]);

  const handleToggleMic = useCallback(() => {
    const next = !micMuted;
    console.log('[LiveConference] Mic toggled, muted:', next);
    setMicMuted(next);
  }, [micMuted]);

  const handleToggleCamera = useCallback(() => {
    const next = !cameraOff;
    console.log('[LiveConference] Camera toggled, off:', next);
    setCameraOff(next);
  }, [cameraOff]);

  const handleBack = useCallback(() => {
    console.log('[LiveConference] Back pressed');
    router.back();
  }, []);

  const handleOpenSettings = useCallback(() => {
    console.log('[LiveConference] Opening settings for permissions');
    Linking.openSettings();
  }, []);

  // Permissions
  useEffect(() => {
    console.log('[LiveConference] Mounted, requesting permissions. room:', roomCode, 'isHost:', isHost);
    requestCameraPermission();
    requestMicPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const permissionsLoaded = cameraPermission !== null && micPermission !== null;
  const permissionsGranted = cameraPermission?.granted && micPermission?.granted;

  const liveSubtitle = 'ARM • En direct';
  const participantCountLabel = `👥 ${participantCount}`;
  const hostBadgeLabel = '🎙 ARM';
  const wsIndicatorColor = wsConnected ? '#22C55E' : '#EF4444';

  // Sort participants: ARM/host first
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    return 0;
  });

  if (!permissionsLoaded) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionLoadingText}>Vérification des permissions...</Text>
      </View>
    );
  }

  if (!permissionsGranted) {
    return (
      <View style={[styles.permissionContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={[styles.permissionBackBtn, { top: insets.top + 12 }]} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.permissionContent}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="camera-outline" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.permissionTitle}>Accès requis</Text>
          <Text style={styles.permissionMessage}>
            Pour rejoindre la conférence, l'application a besoin d'accéder à votre caméra et à votre microphone.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={handleOpenSettings} activeOpacity={0.85}>
            <Text style={styles.permissionButtonText}>Ouvrir les paramètres</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.permissionCancelBtn} onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.permissionCancelText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const bottomBarPaddingBottom = insets.bottom + 16;

  return (
    <View style={styles.container}>
      {/* Camera layer — mute prop removed (not a valid CameraView prop) */}
      {!cameraOff ? (
        <CameraView style={StyleSheet.absoluteFill} facing={facing} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.cameraOffBg]}>
          <View style={styles.cameraOffIconCircle}>
            <Ionicons name="videocam-off-outline" size={40} color="rgba(255,255,255,0.45)" />
          </View>
          <Text style={styles.cameraOffText}>Caméra désactivée</Text>
        </View>
      )}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.topBarBtn} onPress={handleBack} activeOpacity={0.8} accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle} numberOfLines={1}>{conferenceTitle}</Text>
          <View style={styles.topBarSubtitleRow}>
            <View style={styles.liveDot} />
            <Text style={styles.topBarSubtitle}>{liveSubtitle}</Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <View style={styles.timerBadge}>
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>{timerDisplay}</Text>
          </View>
          <View style={[styles.wsIndicator, { backgroundColor: wsIndicatorColor }]} />
        </View>
      </View>

      {/* Host badge */}
      {isHost && (
        <View style={[styles.hostBadge, { top: insets.top + 72 }]}>
          <Text style={styles.hostBadgeText}>{hostBadgeLabel}</Text>
        </View>
      )}

      {/* Participant count badge */}
      <View style={[styles.participantBadge, { top: insets.top + 72 }]}>
        <Text style={styles.participantBadgeText}>{participantCountLabel}</Text>
      </View>

      {/* Panel (chat or participants) */}
      {showPanel && (
        <Animated.View
          style={[
            styles.panel,
            { transform: [{ translateY: panelTranslateY }] },
          ]}
        >
          {showChat && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.panelInner}
            >
              {/* Chat header */}
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Chat</Text>
                <View style={styles.panelHeaderRight}>
                  <View style={styles.panelCountBadge}>
                    <Text style={styles.panelCountText}>{participantCount}</Text>
                  </View>
                  <TouchableOpacity onPress={handleToggleChat} style={styles.panelCloseBtn} accessibilityLabel="Fermer le chat">
                    <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Messages */}
              <ScrollView
                ref={chatScrollRef}
                style={styles.chatScroll}
                contentContainerStyle={styles.chatScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {chatMessages.length === 0 && (
                  <Text style={styles.chatEmpty}>Aucun message pour l'instant</Text>
                )}
                {chatMessages.map((msg) => {
                  if (msg.isSystem) {
                    return (
                      <View key={msg.id} style={styles.systemMsgRow}>
                        <Text style={styles.systemMsgText}>{msg.text}</Text>
                      </View>
                    );
                  }
                  const isArm = msg.sender === 'ARM' || msg.sender === hostName;
                  const senderColor = isArm ? '#4ADE80' : '#FFFFFF';
                  return (
                    <View key={msg.id} style={styles.chatMsgRow}>
                      <View style={styles.chatMsgBubble}>
                        <View style={styles.chatMsgHeader}>
                          <Text style={[styles.chatMsgSender, { color: senderColor }]}>{msg.sender}</Text>
                          <Text style={styles.chatMsgTime}>{msg.time}</Text>
                        </View>
                        <Text style={styles.chatMsgText}>{msg.text}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Input */}
              <View style={[styles.chatInputRow, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                <TextInput
                  style={styles.chatInput}
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Écrire un message..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  returnKeyType="send"
                  onSubmitEditing={handleSendChat}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={[styles.chatSendBtn, !chatInput.trim() && styles.chatSendBtnDisabled]}
                  onPress={handleSendChat}
                  disabled={!chatInput.trim()}
                  accessibilityLabel="Envoyer le message"
                >
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}

          {showParticipants && (
            <View style={styles.panelInner}>
              {/* Participants header */}
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Participants</Text>
                <View style={styles.panelHeaderRight}>
                  <View style={styles.panelCountBadge}>
                    <Text style={styles.panelCountText}>{participantCount}</Text>
                  </View>
                  <TouchableOpacity onPress={handleToggleParticipants} style={styles.panelCloseBtn} accessibilityLabel="Fermer les participants">
                    <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={styles.chatScroll} contentContainerStyle={styles.chatScrollContent} showsVerticalScrollIndicator={false}>
                {/* ARM host always first */}
                <View style={styles.participantRow}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.participantAvatarText}>A</Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>ARM</Text>
                    <Text style={styles.participantJoined}>Hôte principal</Text>
                  </View>
                  <View style={styles.hostTag}>
                    <Text style={styles.hostTagText}>Hôte</Text>
                  </View>
                </View>

                {sortedParticipants.map((p) => {
                  const initial = p.name.charAt(0).toUpperCase();
                  const joinedLabel = `Rejoint à ${p.joinedAt}`;
                  return (
                    <View key={p.id} style={styles.participantRow}>
                      <View style={styles.participantAvatar}>
                        <Text style={styles.participantAvatarText}>{initial}</Text>
                      </View>
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>{p.name}</Text>
                        <Text style={styles.participantJoined}>{joinedLabel}</Text>
                      </View>
                      {p.isHost && (
                        <View style={styles.hostTag}>
                          <Text style={styles.hostTagText}>Hôte</Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                {sortedParticipants.length === 0 && (
                  <Text style={styles.chatEmpty}>Aucun autre participant</Text>
                )}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      )}

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: bottomBarPaddingBottom }]}>
        {/* Mic */}
        <TouchableOpacity
          style={[styles.controlBtn, micMuted && styles.controlBtnMuted]}
          onPress={handleToggleMic}
          activeOpacity={0.8}
          accessibilityLabel={micMuted ? 'Activer le microphone' : 'Désactiver le microphone'}
        >
          <Ionicons name={micMuted ? 'mic-off' : 'mic'} size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Camera */}
        <TouchableOpacity
          style={[styles.controlBtn, cameraOff && styles.controlBtnMuted]}
          onPress={handleToggleCamera}
          activeOpacity={0.8}
          accessibilityLabel={cameraOff ? 'Activer la caméra' : 'Désactiver la caméra'}
        >
          <Ionicons name={cameraOff ? 'videocam-off' : 'videocam'} size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Flip */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={handleFlipCamera}
          activeOpacity={0.8}
          accessibilityLabel="Retourner la caméra"
        >
          <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Chat */}
        <TouchableOpacity
          style={[styles.controlBtn, showChat && styles.controlBtnBlue]}
          onPress={handleToggleChat}
          activeOpacity={0.8}
          accessibilityLabel="Ouvrir le chat"
        >
          <Ionicons name="chatbubble-outline" size={22} color="#FFFFFF" />
          {unreadCount > 0 && !showChat && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Participants */}
        <TouchableOpacity
          style={[styles.controlBtn, showParticipants && styles.controlBtnBlue]}
          onPress={handleToggleParticipants}
          activeOpacity={0.8}
          accessibilityLabel="Voir les participants"
        >
          <Ionicons name="people-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* End call */}
        <TouchableOpacity
          style={styles.endCallBtn}
          onPress={handleEndCall}
          activeOpacity={0.85}
          accessibilityLabel="Terminer l'appel"
        >
          <Ionicons name="call" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  cameraOffBg: { backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  cameraOffIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cameraOffText: { fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: 'rgba(0,0,0,0.65)', gap: 12 },
  topBarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2 },
  topBarSubtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  topBarSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, gap: 5 },
  timerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  timerText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  wsIndicator: { width: 8, height: 8, borderRadius: 4 },
  hostBadge: { position: 'absolute', left: 16, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  hostBadgeText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  participantBadge: { position: 'absolute', right: 16, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  participantBadgeText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.65)', gap: 12 },
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  controlBtnMuted: { backgroundColor: 'rgba(220,38,38,0.85)' },
  controlBtnBlue: { backgroundColor: 'rgba(37,99,235,0.85)' },
  endCallBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center', shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
  unreadBadge: { position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  unreadBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
  panel: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT * 0.48, backgroundColor: 'rgba(15,15,15,0.92)', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  panelInner: { flex: 1 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  panelTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  panelHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelCountBadge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  panelCountText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  panelCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  chatScroll: { flex: 1 },
  chatScrollContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chatEmpty: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, marginTop: 20, fontStyle: 'italic' },
  systemMsgRow: { alignItems: 'center', marginVertical: 4 },
  systemMsgText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', textAlign: 'center' },
  chatMsgRow: { marginBottom: 4 },
  chatMsgBubble: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 10 },
  chatMsgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatMsgSender: { fontSize: 13, fontWeight: '700' },
  chatMsgTime: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  chatMsgText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#FFFFFF', minHeight: 44 },
  chatSendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2D8B3C', justifyContent: 'center', alignItems: 'center' },
  chatSendBtnDisabled: { opacity: 0.4 },
  participantRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 12 },
  participantAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(45,139,60,0.35)', justifyContent: 'center', alignItems: 'center' },
  participantAvatarText: { fontSize: 16, fontWeight: '700', color: '#4ADE80' },
  participantInfo: { flex: 1 },
  participantName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  participantJoined: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  hostTag: { backgroundColor: 'rgba(45,139,60,0.3)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(45,139,60,0.5)' },
  hostTagText: { fontSize: 11, fontWeight: '700', color: '#4ADE80' },
  permissionContainer: { flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  permissionLoadingText: { fontSize: 15, color: 'rgba(255,255,255,0.5)' },
  permissionBackBtn: { position: 'absolute', left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  permissionContent: { alignItems: 'center', maxWidth: 320 },
  permissionIconCircle: { width: 88, height: 88, borderRadius: 28, backgroundColor: 'rgba(45,139,60,0.25)', borderWidth: 1, borderColor: 'rgba(45,139,60,0.4)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  permissionTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 12, letterSpacing: -0.3 },
  permissionMessage: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permissionButton: { backgroundColor: '#2D8B3C', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 12 },
  permissionButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  permissionCancelBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  permissionCancelText: { fontSize: 15, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
});
