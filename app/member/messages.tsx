
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet, authenticatedPost } from '@/utils/api';
import * as Haptics from 'expo-haptics';

interface Message {
  id: string;
  title: string;
  content: string;
  senderId: string;
  targetRole?: string;
  targetRegion?: string;
  targetCercle?: string;
  targetCommune?: string;
  sentAt: string;
  createdAt: string;
  isRead?: boolean;
}

export default function MemberMessagesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    console.log('[MemberMessages] Loading messages');
    setLoading(true);

    try {
      const response = await authenticatedGet('/api/messages/my-messages');
      console.log('[MemberMessages] Messages loaded:', response);
      setMessages(response);
    } catch (error: any) {
      console.error('[MemberMessages] Error loading messages:', error);
      setErrorMessage(error?.message || 'Impossible de charger les messages');
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleMessagePress = async (message: Message) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedMessage(message);
    setModalVisible(true);

    // Mark as read if not already read
    if (!message.isRead) {
      try {
        await authenticatedPost(`/api/messages/mark-read/${message.id}`, {});
        // Update local state
        setMessages(prev =>
          prev.map(m => (m.id === message.id ? { ...m, isRead: true } : m))
        );
      } catch (error) {
        console.error('[MemberMessages] Error marking message as read:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Messages Internes',
            headerShown: true,
            headerBackTitle: 'Retour',
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Messages Internes',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="envelope.open"
              android_material_icon_name="mail-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>Aucun message</Text>
            <Text style={styles.emptySubtext}>
              Vous recevrez ici les notifications du parti
            </Text>
          </View>
        ) : (
          <View style={styles.messagesList}>
            {messages.map((message) => (
              <TouchableOpacity
                key={message.id}
                style={[
                  styles.messageCard,
                  !message.isRead && styles.messageCardUnread,
                ]}
                onPress={() => handleMessagePress(message)}
                activeOpacity={0.8}
              >
                <View style={styles.messageHeader}>
                  <View style={styles.messageIconContainer}>
                    <IconSymbol
                      ios_icon_name={message.isRead ? 'envelope.open.fill' : 'envelope.fill'}
                      android_material_icon_name={message.isRead ? 'mail-outline' : 'mail'}
                      size={24}
                      color={message.isRead ? colors.textSecondary : colors.primary}
                    />
                  </View>
                  <View style={styles.messageContent}>
                    <Text style={styles.messageTitle} numberOfLines={1}>
                      {message.title}
                    </Text>
                    <Text style={styles.messagePreview} numberOfLines={2}>
                      {message.content}
                    </Text>
                    <Text style={styles.messageDate}>
                      {formatDate(message.sentAt)}
                    </Text>
                  </View>
                  {!message.isRead && <View style={styles.unreadBadge} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Modal
          visible={modalVisible}
          title={selectedMessage.title}
          message={`${selectedMessage.content}\n\n${formatDate(selectedMessage.sentAt)}`}
          onClose={() => {
            setModalVisible(false);
            setSelectedMessage(null);
          }}
        />
      )}

      {/* Error Modal */}
      <Modal
        visible={errorModalVisible}
        title="Erreur"
        message={errorMessage}
        type="error"
        onClose={() => setErrorModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
  },
  emptySubtext: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.backgroundAlt,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  messageDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  unreadBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
});
