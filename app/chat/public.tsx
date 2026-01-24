
import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

interface ChatMessage {
  id: string;
  userName: string;
  message: string;
  createdAt: string;
}

export default function PublicChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userName, setUserName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    console.log('PublicChatScreen: Loading chat messages');
    loadMessages();
    
    // Refresh messages every 5 seconds
    const interval = setInterval(() => {
      loadMessages();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    console.log('Loading public chat messages');
    try {
      const { apiCall } = await import('@/utils/api');
      const { data, error } = await apiCall<ChatMessage[]>('/api/chat/public');
      
      if (error) {
        console.error('Failed to load chat messages:', error);
        return;
      }
      
      if (data) {
        setMessages(data);
        console.log('Loaded', data.length, 'chat messages');
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const handleSetName = () => {
    if (userName.trim()) {
      console.log('User set name:', userName);
      setShowNameInput(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    console.log('User sending message:', messageText);

    try {
      const { apiCall } = await import('@/utils/api');
      const { data, error } = await apiCall<ChatMessage>('/api/chat/public', {
        method: 'POST',
        body: JSON.stringify({
          userName,
          message: messageText.trim(),
        }),
      });

      if (error) {
        console.error('Failed to send message:', error);
        return;
      }

      if (data) {
        // Add the new message to the list
        setMessages(prev => [...prev, data]);
        console.log('Message sent successfully');
      }

      setMessageText('');
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.userName === userName;
    const messageTime = new Date(item.createdAt).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        <View style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}>
          {!isOwnMessage && <Text style={styles.senderName}>{item.userName}</Text>}
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {item.message}
          </Text>
          <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  if (showNameInput) {
    return (
      <>
        <Stack.Screen options={{ 
          headerShown: true,
          title: 'Chat Public',
          headerBackTitle: 'Retour',
        }} />
        <View style={styles.nameInputContainer}>
          <IconSymbol 
            ios_icon_name="person.circle.fill" 
            android_material_icon_name="account-circle" 
            size={64} 
            color={colors.primary} 
          />
          <Text style={styles.nameInputTitle}>Entrez votre nom</Text>
          <Text style={styles.nameInputSubtitle}>
            Pour participer au chat public
          </Text>
          <TextInput
            style={styles.nameInput}
            value={userName}
            onChangeText={setUserName}
            placeholder="Votre nom"
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />
          <TouchableOpacity 
            style={styles.nameSubmitButton}
            onPress={handleSetName}
          >
            <Text style={styles.nameSubmitButtonText}>Continuer</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Chat Public',
        headerBackTitle: 'Retour',
      }} />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol 
                ios_icon_name="bubble.left.and.bubble.right" 
                android_material_icon_name="chat" 
                size={48} 
                color={colors.textSecondary} 
              />
              <Text style={styles.emptyText}>Aucun message pour le moment</Text>
              <Text style={styles.emptySubtext}>Soyez le premier à écrire!</Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Écrivez un message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <IconSymbol 
              ios_icon_name="paperplane.fill" 
              android_material_icon_name="send" 
              size={24} 
              color={colors.background} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  nameInputContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  nameInputTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  nameInputSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  nameInput: {
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  nameSubmitButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nameSubmitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '75%',
  },
  ownMessageBubble: {
    backgroundColor: colors.primary,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  ownMessageText: {
    color: colors.background,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  ownMessageTime: {
    color: colors.backgroundAlt,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  messageInput: {
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
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
