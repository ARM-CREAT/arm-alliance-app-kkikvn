
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { Send, RefreshCw } from 'lucide-react-native';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function ChatScreen() {
  const { member_id, member_name } = useLocalSearchParams<{ member_id: string; member_name?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [senderId, setSenderId] = useState('admin');
  const [senderName, setSenderName] = useState('Admin');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadSenderInfo = async () => {
      try {
        const storedNumber = await AsyncStorage.getItem('member_number');
        const storedName = await AsyncStorage.getItem('member_full_name');
        if (storedNumber) setSenderId(storedNumber);
        if (storedName) setSenderName(storedName);
        else setSenderName('Membre');
      } catch {
        // keep defaults
      }
    };
    loadSenderInfo();
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!member_id) return;
    console.log('[Chat] Chargement des messages pour:', member_id);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/${member_id}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} — ${txt.slice(0, 100)}`);
      }
      const data = await res.json();
      const list: Message[] = Array.isArray(data) ? data : (Array.isArray(data.messages) ? data.messages : []);
      console.log('[Chat] Messages chargés:', list.length);
      setMessages(list);

      // Mark as read
      fetch(`${BACKEND_URL}/api/messages/${member_id}/read`, { method: 'PATCH' }).catch(() => {});
    } catch (err: any) {
      console.error('[Chat] Erreur chargement:', err.message);
      setError('Impossible de charger les messages.');
    } finally {
      setLoading(false);
    }
  }, [member_id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || sending) return;
    console.log('[Chat] Envoi du message à:', member_id, 'contenu:', content.slice(0, 50));
    setSending(true);
    setInputText('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: senderId,
          sender_name: senderName,
          recipient_id: member_id,
          content,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} — ${txt.slice(0, 100)}`);
      }
      const newMsg: Message = await res.json();
      console.log('[Chat] Message envoyé:', newMsg.id);
      setMessages((prev) => [newMsg, ...prev]);
    } catch (err: any) {
      console.error('[Chat] Erreur envoi:', err.message);
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const displayName = member_name || member_id || 'Conversation';

  const renderMessage = ({ item }: { item: Message }) => {
    const isAdmin = item.sender_id === 'admin' || item.sender_id === senderId;
    const timeDisplay = formatTime(item.created_at);

    return (
      <View style={[styles.bubbleRow, isAdmin ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
        <View style={[styles.bubble, isAdmin ? styles.bubbleAdmin : styles.bubbleMember]}>
          {!isAdmin && (
            <Text style={styles.bubbleSenderName}>{item.sender_name}</Text>
          )}
          <Text style={[styles.bubbleText, isAdmin ? styles.bubbleTextAdmin : styles.bubbleTextMember]}>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, isAdmin ? styles.bubbleTimeAdmin : styles.bubbleTimeMember]}>
            {timeDisplay}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: displayName,
          headerShown: true,
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
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMessages}>
              <RefreshCw size={16} color="#FFFFFF" />
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Aucun message. Commencez la conversation !</Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Écrire un message..."
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  bubbleRow: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleAdmin: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleMember: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleSenderName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 3,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextAdmin: {
    color: '#FFFFFF',
  },
  bubbleTextMember: {
    color: colors.text,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeAdmin: {
    color: 'rgba(255,255,255,0.65)',
  },
  bubbleTimeMember: {
    color: colors.textTertiary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 120,
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
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  errorText: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
