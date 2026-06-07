import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/styles/commonStyles";
import { BACKEND_URL } from "@/utils/api";
import { IconSymbol } from "@/components/IconSymbol";

// Lazy imports for native-only modules
let Audio: any = null;
let Speech: any = null;

if (Platform.OS !== "web") {
  try {
    Audio = require("expo-av").Audio;
  } catch (e) {
    console.warn("[VoiceAssistant] expo-av not available");
  }
  try {
    Speech = require("expo-speech");
  } catch (e) {
    console.warn("[VoiceAssistant] expo-speech not available");
  }
}

type VoiceState = "idle" | "recording" | "transcribing" | "generating" | "speaking";

interface ConversationEntry {
  id: string;
  userText: string;
  aiText: string;
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function PulseRing({ active, color }: { active: boolean; color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (active) {
      const anim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.4, duration: 700, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
          ]),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      scale.setValue(1);
      opacity.setValue(0.6);
    }
  }, [active, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { borderColor: color, transform: [{ scale }], opacity },
      ]}
    />
  );
}

export default function VoiceAssistantScreen() {
  const router = useRouter();
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const recordingRef = useRef<any>(null);

  // Request microphone permission on mount
  useEffect(() => {
    const requestPermission = async () => {
      console.log("[VoiceAssistant] Requesting microphone permission");
      if (Platform.OS === "web") {
        setHasPermission(false);
        return;
      }
      if (!Audio) {
        setHasPermission(false);
        return;
      }
      try {
        const { status } = await Audio.requestPermissionsAsync();
        const granted = status === "granted";
        console.log("[VoiceAssistant] Microphone permission:", status);
        setHasPermission(granted);
        if (granted) {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
        }
      } catch (e: any) {
        console.error("[VoiceAssistant] Permission error:", e.message);
        setHasPermission(false);
      }
    };
    requestPermission();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      if (Speech) {
        Speech.stop();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    console.log("[VoiceAssistant] Start recording pressed");
    setErrorMessage("");
    setTranscript("");
    setAiResponse("");

    if (!Audio) {
      setErrorMessage("L'enregistrement audio n'est pas disponible sur cette plateforme.");
      return;
    }

    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setVoiceState("recording");
      console.log("[VoiceAssistant] Recording started");
    } catch (e: any) {
      console.error("[VoiceAssistant] Start recording error:", e.message);
      setErrorMessage("Impossible de démarrer l'enregistrement : " + e.message);
      setVoiceState("idle");
    }
  }, []);

  const stopRecordingAndProcess = useCallback(async () => {
    console.log("[VoiceAssistant] Stop recording pressed");
    if (!recordingRef.current) return;

    setVoiceState("transcribing");

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      console.log("[VoiceAssistant] Recording stopped, URI:", uri);

      if (!uri) {
        throw new Error("Aucun fichier audio enregistré.");
      }

      // Build FormData for transcription
      const formData = new FormData();
      const filename = uri.split("/").pop() || "audio.m4a";
      const fileType = filename.endsWith(".m4a") ? "audio/m4a" : "audio/wav";
      formData.append("audio", { uri, name: filename, type: fileType } as any);

      console.log("[VoiceAssistant] POST /api/voice-transcribe");
      const transcribeResponse = await fetch(`${BACKEND_URL}/api/voice-transcribe`, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (!transcribeResponse.ok) {
        const errText = await transcribeResponse.text();
        console.error("[VoiceAssistant] Transcription error:", transcribeResponse.status, errText);
        throw new Error(`Erreur de transcription (${transcribeResponse.status})`);
      }

      const transcribeData = await transcribeResponse.json();
      const userText = transcribeData.transcript || transcribeData.text || "";
      console.log("[VoiceAssistant] Transcript:", userText);

      if (!userText.trim()) {
        throw new Error("Aucune parole détectée. Veuillez réessayer.");
      }

      setTranscript(userText);
      setVoiceState("generating");

      // Send to chat IA
      console.log("[VoiceAssistant] POST /api/chat-ia");
      const chatResponse = await fetch(`${BACKEND_URL}/api/chat-ia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userText }],
        }),
      });

      if (!chatResponse.ok) {
        const errText = await chatResponse.text();
        console.error("[VoiceAssistant] Chat IA error:", chatResponse.status, errText);
        throw new Error(`Erreur IA (${chatResponse.status})`);
      }

      const chatData = await chatResponse.json();
      const reply =
        chatData.reply ||
        chatData.message ||
        chatData.content ||
        chatData.choices?.[0]?.message?.content ||
        chatData.text ||
        "Je n'ai pas pu générer une réponse.";

      console.log("[VoiceAssistant] AI reply received, length:", reply.length);
      setAiResponse(reply);

      // Add to conversation history
      setConversation((prev) => [
        ...prev,
        { id: generateId(), userText, aiText: reply },
      ]);

      // Speak the reply
      if (Speech) {
        setVoiceState("speaking");
        console.log("[VoiceAssistant] Speaking reply via expo-speech");
        Speech.speak(reply, {
          language: "fr-FR",
          rate: 0.95,
          onDone: () => {
            console.log("[VoiceAssistant] Speech done");
            setVoiceState("idle");
          },
          onError: (e: any) => {
            console.error("[VoiceAssistant] Speech error:", e);
            setVoiceState("idle");
          },
        });
      } else {
        setVoiceState("idle");
      }
    } catch (e: any) {
      console.error("[VoiceAssistant] Process error:", e.message);
      setErrorMessage(e.message || "Une erreur s'est produite.");
      setVoiceState("idle");
    }
  }, []);

  const handleMicPress = useCallback(() => {
    console.log("[VoiceAssistant] Mic button pressed, current state:", voiceState);
    if (voiceState === "idle") {
      startRecording();
    } else if (voiceState === "recording") {
      stopRecordingAndProcess();
    }
  }, [voiceState, startRecording, stopRecordingAndProcess]);

  const handleStopSpeech = useCallback(() => {
    console.log("[VoiceAssistant] Stop speech pressed");
    if (Speech) {
      Speech.stop();
    }
    setVoiceState("idle");
  }, []);

  const handleBack = useCallback(() => {
    console.log("[VoiceAssistant] Back button pressed");
    if (Speech) Speech.stop();
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
    }
    router.back();
  }, [router]);

  const isRecording = voiceState === "recording";
  const isProcessing = voiceState === "transcribing" || voiceState === "generating";
  const isSpeaking = voiceState === "speaking";
  const isIdle = voiceState === "idle";

  const micBgColor = isRecording ? colors.error : colors.aiAccent;
  const micIconName = isRecording ? "stop" : "mic";

  const stateLabel = {
    idle: "Appuyez pour parler",
    recording: "Parlez maintenant...",
    transcribing: "Transcription en cours...",
    generating: "L'IA réfléchit...",
    speaking: "L'IA parle...",
  }[voiceState];

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <IconSymbol android_material_icon_name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voix IA</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.permissionContainer}>
          <IconSymbol android_material_icon_name="mic-off" size={64} color={colors.textTertiary} />
          <Text style={styles.permissionTitle}>Microphone requis</Text>
          <Text style={styles.permissionText}>
            Activez l'accès au microphone dans les paramètres de votre appareil pour utiliser l'assistant vocal.
          </Text>
          {Platform.OS === "web" && (
            <Text style={styles.permissionSubtext}>
              L'assistant vocal n'est pas disponible sur le navigateur web. Utilisez l'application mobile.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <IconSymbol android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voix IA</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Conversation history */}
        {conversation.length > 0 && (
          <View style={styles.historyContainer}>
            {conversation.map((entry) => (
              <View key={entry.id} style={styles.historyEntry}>
                <View style={styles.historyUserRow}>
                  <IconSymbol android_material_icon_name="person" size={14} color={colors.textTertiary} />
                  <Text style={styles.historyUserText}>{entry.userText}</Text>
                </View>
                <View style={styles.historyAiRow}>
                  <IconSymbol android_material_icon_name="smart-toy" size={14} color={colors.aiAccent} />
                  <Text style={styles.historyAiText}>{entry.aiText}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Current transcript */}
        {!!transcript && (
          <View style={styles.transcriptCard}>
            <View style={styles.transcriptHeader}>
              <IconSymbol android_material_icon_name="person" size={16} color={colors.textSecondary} />
              <Text style={styles.transcriptLabel}>Vous avez dit</Text>
            </View>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        )}

        {/* AI response */}
        {!!aiResponse && (
          <View style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <IconSymbol android_material_icon_name="smart-toy" size={16} color={colors.aiAccent} />
              <Text style={styles.responseLabel}>Réponse de l'IA</Text>
            </View>
            <Text style={styles.responseText}>{aiResponse}</Text>
          </View>
        )}

        {/* Error message */}
        {!!errorMessage && (
          <View style={styles.errorCard}>
            <IconSymbol android_material_icon_name="error-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color={colors.aiAccent} />
            <Text style={styles.processingText}>{stateLabel}</Text>
          </View>
        )}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Mic button area */}
        <View style={styles.micArea}>
          <Text style={styles.stateLabel}>{stateLabel}</Text>

          <View style={styles.micButtonWrapper}>
            <PulseRing active={isRecording || isSpeaking} color={isRecording ? colors.error : colors.aiAccent} />
            <TouchableOpacity
              style={[styles.micButton, { backgroundColor: micBgColor }]}
              onPress={handleMicPress}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <IconSymbol android_material_icon_name={micIconName} size={56} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {isSpeaking && (
            <TouchableOpacity style={styles.stopButton} onPress={handleStopSpeech}>
              <IconSymbol android_material_icon_name="stop-circle" size={20} color="#fff" />
              <Text style={styles.stopButtonText}>Arrêter</Text>
            </TouchableOpacity>
          )}

          {isIdle && !isProcessing && (
            <Text style={styles.hintText}>
              {isRecording ? "Relâchez pour envoyer" : "Maintenez pour enregistrer, relâchez pour envoyer"}
            </Text>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "center" },
  headerRight: { width: 32 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, flexGrow: 1 },
  historyContainer: { marginBottom: 16 },
  historyEntry: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyUserRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 6 },
  historyUserText: { fontSize: 13, color: colors.textSecondary, flex: 1, fontStyle: "italic" },
  historyAiRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  historyAiText: { fontSize: 13, color: colors.text, flex: 1 },
  transcriptCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transcriptHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  transcriptLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  transcriptText: { fontSize: 16, color: colors.textSecondary, fontStyle: "italic", lineHeight: 22 },
  responseCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  responseHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  responseLabel: { fontSize: 12, color: colors.aiAccent, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  responseText: { fontSize: 17, color: colors.text, lineHeight: 26, fontWeight: "500" },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: { fontSize: 14, color: colors.error, flex: 1, lineHeight: 20 },
  processingContainer: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 16 },
  processingText: { fontSize: 14, color: colors.textSecondary },
  spacer: { flex: 1, minHeight: 24 },
  micArea: { alignItems: "center", paddingVertical: 24 },
  stateLabel: { fontSize: 16, color: colors.textSecondary, fontWeight: "500", marginBottom: 24, textAlign: "center" },
  micButtonWrapper: { position: "relative", alignItems: "center", justifyContent: "center", width: 200, height: 200 },
  pulseRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
  },
  micButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  stopButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  hintText: { fontSize: 13, color: colors.textTertiary, textAlign: "center", marginTop: 16, paddingHorizontal: 32 },
  permissionContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 16 },
  permissionTitle: { fontSize: 20, fontWeight: "700", color: colors.text, textAlign: "center" },
  permissionText: { fontSize: 15, color: colors.textSecondary, textAlign: "center", lineHeight: 22 },
  permissionSubtext: { fontSize: 13, color: colors.textTertiary, textAlign: "center", lineHeight: 20 },
  bottomPadding: { height: 32 },
});
