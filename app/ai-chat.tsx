
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Clipboard,
  Alert,
  Image,
  ImageSourcePropType,
  ScrollView,
} from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/styles/commonStyles";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BACKEND_URL } from "@/utils/api-helpers";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_REPLIES = [
  "Notre programme",
  "Adhérer au parti",
  "Nos valeurs",
  "Événements à venir",
  "Contacter le parti",
  "L'AES et le Mali",
];

function resolveImageSource(
  source: string | number | ImageSourcePropType | undefined
): ImageSourcePropType {
  if (!source) return { uri: "" };
  if (typeof source === "string") return { uri: source };
  return source as ImageSourcePropType;
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
          Animated.timing(dot, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600),
        ])
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={typingStyles.container}>
      <View style={typingStyles.bubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[typingStyles.dot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
}

const typingStyles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    marginBottom: 12,
    marginLeft: 4,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
});

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    console.log("[AIChat] Screen opened");
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleSendMessage = async (overrideText?: string) => {
    const messageText = (overrideText ?? inputText).trim();
    if (!messageText || isStreaming) {
      console.log("[AIChat] Cannot send: empty or already streaming");
      return;
    }

    console.log("[AIChat] User sending message:", messageText);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setHasStarted(true);
    setIsStreaming(true);
    scrollToBottom();

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    try {
      console.log("[AIChat] POST /api/ai/chat with message:", messageText);

      const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[AIChat] API error:", response.status, errText);
        throw new Error(`Erreur ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      const isSSE = contentType.includes("text/event-stream") || contentType.includes("text/plain");

      setMessages((prev) => [...prev, assistantMessage]);

      if (isSSE && response.body) {
        // Streaming SSE path
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (trimmed.startsWith("data: ")) {
              try {
                const jsonStr = trimmed.slice(6);
                const data = JSON.parse(jsonStr);
                if (data.text) {
                  fullResponse += data.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, content: fullResponse }
                        : msg
                    )
                  );
                  scrollToBottom();
                }
              } catch {
                // ignore parse errors on partial chunks
              }
            }
          }
        }

        console.log("[AIChat] SSE stream complete, length:", fullResponse.length);

        // If we got nothing from SSE, try parsing as JSON fallback
        if (!fullResponse) {
          throw new Error("Empty SSE response");
        }
      } else {
        // JSON fallback path
        const data = await response.json();
        const text = data.text || data.message || data.response || JSON.stringify(data);
        console.log("[AIChat] JSON response received, length:", text.length);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: text } : msg
          )
        );
        scrollToBottom();
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error("[AIChat] Error:", error);
      // Remove the empty assistant message and add error message
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== assistantId);
        return [
          ...filtered,
          {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
            timestamp: new Date(),
          },
        ];
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsStreaming(false);
      scrollToBottom();
    }
  };

  const handleClearConversation = () => {
    console.log("[AIChat] User tapped Nouvelle conversation");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setMessages([]);
    setHasStarted(false);
  };

  const handleLongPress = (content: string) => {
    console.log("[AIChat] User long-pressed message, copying to clipboard");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Clipboard.setString(content);
    Alert.alert("Copié", "Le message a été copié dans le presse-papiers.");
  };

  const handleQuickReply = (text: string) => {
    console.log("[AIChat] User tapped quick reply:", text);
    handleSendMessage(text);
  };

  const charCount = inputText.length;
  const charCountColor =
    charCount > 450 ? colors.danger : charCount > 400 ? colors.warning : colors.textSecondary;

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const timeStr = item.timestamp.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Image
              source={resolveImageSource(
                require("@/assets/images/48b93c14-0824-4757-b7a4-95824e04a9a8.jpeg")
              )}
              style={styles.avatar}
            />
          </View>
        )}
        <View style={styles.bubbleWrapper}>
          <TouchableOpacity
            onLongPress={() => handleLongPress(item.content)}
            activeOpacity={0.85}
            delayLongPress={400}
          >
            <View
              style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  isUser ? styles.userMessageText : styles.assistantMessageText,
                ]}
              >
                {item.content}
              </Text>
            </View>
          </TouchableOpacity>
          <Text
            style={[
              styles.messageTime,
              isUser ? styles.userMessageTime : styles.assistantMessageTime,
            ]}
          >
            {timeStr}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const WelcomeState = () => (
    <View style={styles.emptyState}>
      <Image
        source={resolveImageSource(
          require("@/assets/images/48b93c14-0824-4757-b7a4-95824e04a9a8.jpeg")
        )}
        style={styles.emptyLogo}
      />
      <Text style={styles.emptyTitle}>Assistant A.R.M</Text>
      <Text style={styles.emptySubtitle}>
        Bienvenue ! Je suis l'assistant IA de l'Alliance pour le Rassemblement Malien. Posez-moi vos questions sur le parti, son programme, ses valeurs ou comment adhérer.
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Assistant IA",
          headerBackTitle: "Retour",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.background,
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.messagesListEmpty,
          ]}
          ListEmptyComponent={<WelcomeState />}
          ListFooterComponent={isStreaming ? <TypingIndicator /> : null}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />

        {/* Quick replies — always shown when no conversation started */}
        {!hasStarted && (
          <View style={styles.quickRepliesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickRepliesList}
            >
              {QUICK_REPLIES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.quickReplyChip}
                  onPress={() => handleQuickReply(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickReplyText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* "Nouvelle conversation" button — shown when conversation has started */}
        {hasStarted && (
          <View style={styles.newConvBar}>
            <TouchableOpacity
              style={styles.newConvButton}
              onPress={handleClearConversation}
              activeOpacity={0.7}
            >
              <Text style={styles.newConvButtonText}>+ Nouvelle conversation</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input area — always visible */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Posez votre question..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
              editable={!isStreaming}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => {
                if (Platform.OS !== "web") handleSendMessage();
              }}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isStreaming) && styles.sendButtonDisabled,
              ]}
              onPress={() => {
                console.log("[AIChat] User tapped send button");
                handleSendMessage();
              }}
              disabled={!inputText.trim() || isStreaming}
              activeOpacity={0.7}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
          {charCount > 0 && (
            <Text style={[styles.charCount, { color: charCountColor }]}>
              {charCount}
              {"/500"}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messagesListEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  emptyLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: "82%",
    flexDirection: "row",
    alignItems: "flex-end",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  assistantMessageContainer: {
    alignSelf: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 18,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleWrapper: {
    flex: 1,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: "#1B5E20",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#F0F0F0",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  assistantMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userMessageTime: {
    color: colors.textSecondary,
    textAlign: "right",
  },
  assistantMessageTime: {
    color: colors.textSecondary,
  },
  quickRepliesContainer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
  },
  quickRepliesList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickReplyChip: {
    backgroundColor: "#1B5E20" + "18",
    borderWidth: 1,
    borderColor: "#1B5E20" + "40",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickReplyText: {
    fontSize: 13,
    color: "#1B5E20",
    fontWeight: "600",
  },
  newConvBar: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  newConvButton: {
    backgroundColor: "#1B5E20" + "12",
    borderWidth: 1,
    borderColor: "#1B5E20" + "40",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 7,
  },
  newConvButtonText: {
    fontSize: 13,
    color: "#1B5E20",
    fontWeight: "600",
  },
  inputContainer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1B5E20",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
    shadowOpacity: 0,
  },
  sendIcon: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 2,
  },
});
