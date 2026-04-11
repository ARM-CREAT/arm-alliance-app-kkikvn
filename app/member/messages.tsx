
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal as RNModal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet, authenticatedPost } from '@/utils/api';

const Haptics = {
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
};

interface Message {
  id: string;
  title: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export default function MemberMessagesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    console.log('[MemberMessages] GET /api/messages/my-messages');
    setError(null);
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Délai dépassé. Vérifiez votre connexion internet.')), 20000)
      );
      const fetchPromise = authenticatedGet<{ messages: Message[] } | Message[]>('/api/messages/my-messages');
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      const list: Message[] = Array.isArray(response)
        ? response
        : (response as { messages: Message[] })?.messages ?? [];
      console.log('[MemberMessages] Messages chargés:', list.length, 'éléments');
      setMessages(list);
    } catch (err: any) {
      console.error('[MemberMessages] Erreur chargement messages:', err.message);
      const msg: string = err?.message ?? '';
      if (
        msg.includes('token') ||
        msg.includes('Authentication') ||
        msg.includes('sign in') ||
        msg.includes('401') ||
        msg.includes('Unauthorized')
      ) {
        setMessages([]);
        setError('Veuillez vous connecter pour accéder à vos messages.');
      } else {
        setError(msg || 'Impossible de charger les messages.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const onRefresh = useCallback(() => {
    console.log('[MemberMessages] Pull-to-refresh triggered');
    setRefreshing(true);
    loadMessages();
  }, [loadMessages]);

  const handleMessagePress = async (message: Message) => {
    console.log('[MemberMessages] User tapped message:', message.id, message.title);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedMessage(message);
    setDetailVisible(true);

    if (!message.isRead) {
      console.log('[MemberMessages] POST /api/messages/mark-read/' + message.id);
      try {
        await authenticatedPost(`/api/messages/mark-read/${message.id}`, {});
        setMessages(prev =>
          prev.map(m => (m.id === message.id ? { ...m, isRead: true } : m))
        );
        console.log('[MemberMessages] Message marked as read:', message.id);
      } catch (err) {
        console.error('[MemberMessages] Error marking message as read:', err);
      }
    }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;
  const unreadCountStr = String(unreadCount);

  const isAuthError = (error ?? '').includes('connecter');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Messages',
            headerShown: true,
            headerBackTitle: 'Retour',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Messages',
          headerShown: true,
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      {error ? (
        <View style={styles.errorContainer}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle"
            android_material_icon_name="warning"
            size={48}
            color={colors.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
          {isAuthError ? (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => { console.log('[MemberMessages] Bouton Se connecter appuyé'); router.push('/auth'); }}
            >
              <Text style={styles.retryBtnText}>Se connecter</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => { setLoading(true); loadMessages(); }}
            >
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {unreadCount > 0 && (
            <View style={styles.unreadBanner}>
              <Text style={styles.unreadBannerText}>{unreadCountStr} message(s) non lu(s)</Text>
            </View>
          )}

          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <IconSymbol
                  ios_icon_name="envelope.open"
                  android_material_icon_name="mail-outline"
                  size={48}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={styles.emptyTitle}>Aucun message</Text>
              <Text style={styles.emptySubtext}>
                Vous recevrez ici les notifications et communications du parti
              </Text>
            </View>
          ) : (
            <View style={styles.messagesList}>
              {messages.map((message) => {
                const dateStr = formatDate(message.sentAt);
                const isUnread = !message.isRead;
                return (
                  <TouchableOpacity
                    key={message.id}
                    style={[styles.messageCard, isUnread && styles.messageCardUnread]}
                    onPress={() => handleMessagePress(message)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.messageRow}>
                      <View style={[styles.messageIconWrap, isUnread && styles.messageIconWrapUnread]}>
                        <IconSymbol
                          ios_icon_name={isUnread ? 'envelope.fill' : 'envelope.open.fill'}
                          android_material_icon_name={isUnread ? 'mail' : 'mail-outline'}
                          size={22}
                          color={isUnread ? colors.primary : colors.textSecondary}
                        />
                      </View>
                      <View style={styles.messageContent}>
                        <Text style={[styles.messageTitle, isUnread && styles.messageTitleUnread]} numberOfLines={1}>
                          {message.title}
                        </Text>
                        <Text style={styles.messagePreview} numberOfLines={2}>
                          {message.content}
                        </Text>
                        <Text style={styles.messageDate}>{dateStr}</Text>
                      </View>
                      {isUnread && <View style={styles.unreadDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Message Detail Modal */}
      <RNModal
        visible={detailVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle} numberOfLines={2}>
              {selectedMessage?.title}
            </Text>
            <TouchableOpacity
              style={styles.detailCloseBtn}
              onPress={() => {
                console.log('[MemberMessages] User closed message detail');
                setDetailVisible(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.detailCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailScrollContent}>
            {selectedMessage && (
              <>
                <Text style={styles.detailDate}>{formatDate(selectedMessage.sentAt)}</Text>
                <Text style={styles.detailContent}>{selectedMessage.content}</Text>
              </>
            )}
          </ScrollView>
        </View>
      </RNModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    color: colors.danger,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  unreadBanner: {
    backgroundColor: colors.primary + '18',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary + '30',
  },
  unreadBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  messagesList: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  messageCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: '#F0FAF2',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  messageIconWrapUnread: {
    backgroundColor: colors.primary + '18',
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  messageTitleUnread: {
    fontWeight: '700',
    color: colors.text,
  },
  messagePreview: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 6,
  },
  messageDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: 8,
    marginTop: 4,
    flexShrink: 0,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    gap: 12,
  },
  detailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 26,
  },
  detailCloseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    flexShrink: 0,
  },
  detailCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  detailDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  detailContent: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
  },
});
