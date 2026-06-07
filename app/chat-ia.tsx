import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/styles/commonStyles";
import { BACKEND_URL } from "@/utils/api";
import { IconSymbol } from "@/components/IconSymbol";
import asyncStorage from "@/lib/async-storage";

const STORAGE_KEY = "chat_ia_history";
const MAX_STORED_MESSAGES = 10;
const WELCOME_MESSAGE = "Bonjour ! Je suis l'assistant IA de l'Alliance ARM. Comment puis-je vous aider aujourd'hui ?";

const QUICK_SUGGESTIONS = [
  "Quel est le programme de l'ARM ?",
  "Qui est le président du parti ?",
  "Comment devenir membre ?",
  "Quelles sont les valeurs de l'ARM ?",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();

    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value) => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
    marginHorizontal: 2,
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={typingStyles.container}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

const typingStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10 },
});

export default function ChatIAScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load persisted messages on mount
  useEffect(() => {
    const loadHistory = async () => {
      console.log("[ChatIA] Loading message history from storage");
      try {
        const stored = await asyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: Message[] = JSON.parse(stored);
          console.log("[ChatIA] Loaded", parsed.length, "messages from storage");
          if (parsed.length > 0) {
            setMessages(parsed);
            setShowSuggestions(false);
            return;
          }
        }
      } catch (e) {
        console.error("[ChatIA] Failed to load history:", e);
      }
      // No history — show welcome message
      const welcome: Message = {
        id: generateId(),
        role: "assistant",
        content: WELCOME_MESSAGE,
        timestamp: Date.now(),
      };
      setMessages([welcome]);
    };
    loadHistory();
  }, []);

  // Persist messages whenever they change
  useEffect(() => {
    if (messages.length === 0) return;
    const toStore = messages.slice(-MAX_STORED_MESSAGES);
    asyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStore)).catch((e) => {
      console.error("[ChatIA] Failed to persist messages:", e);
    });
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isGenerating]);

  const handleReset = useCallback(async () => {
    console.log("[ChatIA] Reset conversation pressed");
    await asyncStorage.removeItem(STORAGE_KEY);
    const welcome: Message = {
      id: generateId(),
      role: "assistant",
      content: WELCOME_MESSAGE,
      timestamp: Date.now(),
    };
    setMessages([welcome]);
    setInputText("");
    setShowSuggestions(true);
    setIsGenerating(false);
  }, []);

  const handleBack = useCallback(() => {
    console.log("[ChatIA] Back button pressed");
    router.back();
  }, [router]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;

    console.log("[ChatIA] Sending message:", trimmed);
    setShowSuggestions(false);
    setInputText("");

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const payload = {
        messages: [...history, { role: "user", content: trimmed }],
      };

      console.log("[ChatIA] POST /api/chat-ia with", payload.messages.length, "messages");

      const response = await fetch(`${BACKEND_URL}/api/chat-ia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[ChatIA] API error:", response.status, errText);
        throw new Error(`Erreur ${response.status} : ${errText || "Réponse invalide du serveur"}`);
      }

      // Try streaming first
      let replyContent = "";
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream") || contentType.includes("text/plain")) {
        console.log("[ChatIA] Streaming response detected");
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        const streamingId = generateId();
        setMessages((prev) => [
          ...prev,
          { id: streamingId, role: "assistant", content: "", timestamp: Date.now() },
        ]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // Handle SSE format
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content || parsed.content || parsed.text || "";
                  replyContent += delta;
                } catch {
                  replyContent += data;
                }
              } else if (line.trim() && !line.startsWith(":")) {
                replyContent += line;
              }
            }
            const captured = replyContent;
            setMessages((prev) =>
              prev.map((m) => (m.id === streamingId ? { ...m, content: captured } : m))
            );
          }
        }
      } else {
        // JSON response
        const data = await response.json();
        console.log("[ChatIA] JSON response received");
        replyContent =
          data.reply ||
          data.message ||
          data.content ||
          data.choices?.[0]?.message?.content ||
          data.text ||
          "Je n'ai pas pu générer une réponse. Veuillez réessayer.";

        const assistantMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: replyContent,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }

      console.log("[ChatIA] Response received, length:", replyContent.length);
    } catch (e: any) {
      console.error("[ChatIA] Send error:", e.message);
      const errorMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: `Désolé, une erreur s'est produite : ${e.message || "Impossible de contacter le serveur."}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  }, [messages, isGenerating]);

  const handleSend = useCallback(() => {
    console.log("[ChatIA] Send button pressed");
    sendMessage(inputText);
  }, [inputText, sendMessage]);

  const handleSuggestion = useCallback((suggestion: string) => {
    console.log("[ChatIA] Quick suggestion pressed:", suggestion);
    sendMessage(suggestion);
  }, [sendMessage]);

  const canSend = inputText.trim().length > 0 && !isGenerating;

  const renderMessage = (msg: Message) => {
    const isUser = msg.role === "user";
    return (
      <View
        key={msg.id}
        style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <IconSymbol android_material_icon_name="smart-toy" size={18} color={colors.aiAccent} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
          ]}
        >
          <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAssistant]}>
            {msg.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <IconSymbol android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Assistant IA</Text>
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>En ligne</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <IconSymbol android_material_icon_name="refresh" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(renderMessage)}

          {isGenerating && (
            <View style={[styles.messageRow, styles.messageRowAssistant]}>
              <View style={styles.avatarContainer}>
                <IconSymbol android_material_icon_name="smart-toy" size={18} color={colors.aiAccent} />
              </View>
              <View style={[styles.messageBubble, styles.bubbleAssistant]}>
                <TypingIndicator />
              </View>
            </View>
          )}

          {/* Quick suggestions */}
          {showSuggestions && messages.length <= 1 && !isGenerating && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggestions rapides</Text>
              {QUICK_SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestion(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                  <IconSymbol android_material_icon_name="arrow-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Input zone */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={(t) => {
                setInputText(t);
              }}
              placeholder="Posez votre question..."
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={1000}
              editable={!isGenerating}
              returnKeyType="default"
              onSubmitEditing={() => {
                if (Platform.OS !== "web") return;
                handleSend();
              }}
            />
            <TouchableOpacity
              style={[styles.sendButton, canSend ? styles.sendButtonActive : styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!canSend}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <IconSymbol android_material_icon_name="send" size={20} color={canSend ? "#fff" : colors.textTertiary} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>Propulsé par l'IA de l'Alliance ARM</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
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
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  onlineIndicator: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e" },
  onlineText: { fontSize: 11, color: "#22c55e", fontWeight: "500" },
  resetBtn: { padding: 4 },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  messageRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  messageRowUser: { justifyContent: "flex-end" },
  messageRowAssistant: { justifyContent: "flex-start" },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    flexShrink: 0,
  },
  messageBubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  messageTextUser: { color: "#fff" },
  messageTextAssistant: { color: colors.text },
  suggestionsContainer: { marginTop: 16, marginBottom: 8 },
  suggestionsTitle: { fontSize: 13, color: colors.textSecondary, fontWeight: "600", marginBottom: 10 },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  suggestionText: { fontSize: 14, color: colors.text, flex: 1, marginRight: 8 },
  bottomPadding: { height: 8 },
  inputContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 8 : 12,
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendButtonActive: { backgroundColor: colors.primary },
  sendButtonDisabled: { backgroundColor: colors.border },
  inputHint: { fontSize: 11, color: colors.textTertiary, textAlign: "center", marginTop: 6 },
});
