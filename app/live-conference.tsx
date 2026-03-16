
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  FlipHorizontal,
  PhoneOff,
  ChevronLeft,
  Camera,
} from 'lucide-react-native';

export default function LiveConferenceScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ title?: string; hostName?: string }>();

  const conferenceTitle = params.title ?? 'Conférence en direct';
  const hostName = params.hostName ?? 'Hôte';

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    console.log('[LiveConference] Screen mounted, title:', conferenceTitle, 'host:', hostName);
    requestCameraPermission();
    requestMicPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const granted =
      cameraPermission?.granted && micPermission?.granted;
    if (granted) {
      console.log('[LiveConference] Permissions granted, starting timer');
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraPermission?.granted, micPermission?.granted]);

  const handleEndCall = useCallback(() => {
    console.log('[LiveConference] End call pressed, elapsed:', elapsed, 's');
    if (intervalRef.current) clearInterval(intervalRef.current);
    router.back();
  }, [elapsed]);

  const handleFlipCamera = useCallback(() => {
    const next = facing === 'front' ? 'back' : 'front';
    console.log('[LiveConference] Flip camera pressed, new facing:', next);
    setFacing(next);
  }, [facing]);

  const handleToggleMic = useCallback(() => {
    const next = !micMuted;
    console.log('[LiveConference] Mic toggle pressed, muted:', next);
    setMicMuted(next);
  }, [micMuted]);

  const handleToggleCamera = useCallback(() => {
    const next = !cameraOff;
    console.log('[LiveConference] Camera toggle pressed, off:', next);
    setCameraOff(next);
  }, [cameraOff]);

  const handleOpenSettings = useCallback(() => {
    console.log('[LiveConference] Open settings pressed for permissions');
    Linking.openSettings();
  }, []);

  const handleBack = useCallback(() => {
    console.log('[LiveConference] Back pressed');
    router.back();
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');
  const timerDisplay = `${minutesStr}:${secondsStr}`;

  const permissionsLoaded = cameraPermission !== null && micPermission !== null;
  const permissionsGranted = cameraPermission?.granted && micPermission?.granted;

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
        <TouchableOpacity style={styles.permissionBackBtn} onPress={handleBack}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.permissionContent}>
          <View style={styles.permissionIconCircle}>
            <Camera size={36} color="#FFFFFF" strokeWidth={1.5} />
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

  return (
    <View style={styles.container}>
      {/* Camera preview */}
      {!cameraOff ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
          mute={micMuted}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.cameraOffBg]}>
          <View style={styles.cameraOffIconCircle}>
            <VideoOff size={40} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
          </View>
          <Text style={styles.cameraOffText}>Caméra désactivée</Text>
        </View>
      )}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.topBarBtn} onPress={handleBack} activeOpacity={0.8}>
          <ChevronLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle} numberOfLines={1}>{conferenceTitle}</Text>
          <Text style={styles.topBarHost} numberOfLines={1}>{hostName}</Text>
        </View>

        <View style={styles.timerBadge}>
          <View style={styles.timerDot} />
          <Text style={styles.timerText}>{timerDisplay}</Text>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {/* Mic toggle */}
        <TouchableOpacity
          style={[styles.controlBtn, micMuted && styles.controlBtnActive]}
          onPress={handleToggleMic}
          activeOpacity={0.8}
          accessibilityLabel={micMuted ? 'Activer le microphone' : 'Désactiver le microphone'}
        >
          {micMuted
            ? <MicOff size={22} color="#FFFFFF" />
            : <Mic size={22} color="#FFFFFF" />
          }
        </TouchableOpacity>

        {/* Camera toggle */}
        <TouchableOpacity
          style={[styles.controlBtn, cameraOff && styles.controlBtnActive]}
          onPress={handleToggleCamera}
          activeOpacity={0.8}
          accessibilityLabel={cameraOff ? 'Activer la caméra' : 'Désactiver la caméra'}
        >
          {cameraOff
            ? <VideoOff size={22} color="#FFFFFF" />
            : <Video size={22} color="#FFFFFF" />
          }
        </TouchableOpacity>

        {/* Flip camera */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={handleFlipCamera}
          activeOpacity={0.8}
          accessibilityLabel="Retourner la caméra"
        >
          <FlipHorizontal size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* End call */}
        <TouchableOpacity
          style={styles.endCallBtn}
          onPress={handleEndCall}
          activeOpacity={0.85}
          accessibilityLabel="Terminer l'appel"
        >
          <PhoneOff size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraOffBg: {
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOffIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cameraOffText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    gap: 12,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  topBarHost: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  timerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  // Bottom controls
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    gap: 16,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  // Permissions screen
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionLoadingText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },
  permissionBackBtn: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  permissionIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(45,139,60,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(45,139,60,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  permissionMessage: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#2D8B3C',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2D8B3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  permissionCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  permissionCancelText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
});
