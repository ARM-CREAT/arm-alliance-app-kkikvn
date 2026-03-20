
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { apiPost } from '@/utils/api';
import * as Haptics from 'expo-haptics';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIResponse {
  message?: string;
  response?: string;
  content?: string;
  reply?: string;
}

const SUGGESTED_QUESTIONS = [
  "Quelle est l'idéologie de l'A.R.M ?",
  "Comment adhérer au parti ?",
  "Quels sont les programmes de l'A.R.M ?",
  "Qui dirige l'Alliance A.R.M ?",
];

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Bonjour ! Je suis l'assistant IA de l'Alliance pour le Rassemblement Malien (A.R.M). Je peux répondre à vos questions sur le parti, son idéologie, ses programmes et ses activités. Comment puis-je vous aider ?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    console.log('[AIAssistant] User sending message:', trimmed);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    scrollToBottom();

    try {
      console.log('[AIAssistant] POST /api/ai/chat');
      const response = await apiPost<AIResponse>('/api/ai/chat', {
        message: trimmed,
        conversationId,
      });

      console.log('[AIAssistant] AI response received');

      const replyText =
        response?.message ||
        response?.response ||
        response?.content ||
        response?.reply ||
        "Je n'ai pas pu générer une réponse. Veuillez réessayer.";

      if ((response as any)?.conversationId) {
        setConversationId((response as any).conversationId);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: String(replyText),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      scrollToBottom();

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error('[AIAssistant] Error calling AI:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Désolé, je ne peux pas répondre pour le moment. Vérifiez votre connexion et réessayez.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  }, [loading, conversationId, scrollToBottom]);

  const handleSend = useCallback(() => {
    sendMessage(inputText);
  }, [inputText, sendMessage]);

  const handleSuggestedQuestion = useCallback((question: string) => {
    console.log('[AIAssistant] User tapped suggested question:', question);
    sendMessage(question);
  }, [sendMessage]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const timeStr = formatTime(item.timestamp);
    const isWelcome = item.id === 'welcome';

    return (
      <Animated.View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowAssistant,
          { opacity: fadeAnim },
        ]}
      >
        {!isUser && (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>IA</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          {isWelcome && (
            <View style={styles.welcomeBadge}>
              <Text style={styles.welcomeBadgeText}>Assistant A.R.M</Text>
            </View>
          )}
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isUser ? styles.timeTextUser : styles.timeTextAssistant]}>
            {timeStr}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const showSuggestions = messages.length === 1;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Assistant IA A.R.M',
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={
            loading ? (
              <View style={styles.typingIndicator}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>IA</Text>
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.typingText}>En train de répondre...</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={null}
        />

        {showSuggestions && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Questions suggérées</Text>
            <View style={styles.suggestionsRow}>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestedQuestion(q)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionChipText} numberOfLines={2}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Posez votre question..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.sendButtonIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F0',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeBadge: {
    backgroundColor: colors.primary + '18',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  welcomeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  bubbleTextAssistant: {
    color: '#1A1A1A',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
  },
  timeTextUser: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'right',
  },
  timeTextAssistant: {
    color: colors.textSecondary,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  typingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: colors.primary + '12',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    maxWidth: '48%',
  },
  suggestionChipText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F4F0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
