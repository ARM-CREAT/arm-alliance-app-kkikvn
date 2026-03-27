
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { MessageCircle, Plus, RefreshCw, X, Send } from 'lucide-react-native';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

interface Conversation {
  id: string;
  member_id: string;
  member_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffH < 24) return `${diffH}h`;
  return `${diffD}j`;
}

export default function MessagingScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newMemberNumber, setNewMemberNumber] = useState('');

  const fetchConversations = useCallback(async () => {
    console.log('[Messaging] Chargement des conversations');
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/conversations`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} — ${txt.slice(0, 100)}`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray(data.conversations) ? data.conversations : []);
      console.log('[Messaging] Conversations chargées:', list.length);
      setConversations(list);
    } catch (err: any) {
      console.error('[Messaging] Erreur:', err.message);
      setError('Impossible de charger les conversations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = useCallback(async () => {
    console.log('[Messaging] Actualisation');
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const handleConversationPress = (conv: Conversation) => {
    console.log('[Messaging] Conversation appuyée:', conv.member_id, conv.member_name);
    router.push({ pathname: '/chat/[member_id]', params: { member_id: conv.member_id, member_name: conv.member_name } });
  };

  const handleNewConversation = () => {
    const trimmed = newMemberNumber.trim();
    if (!trimmed) return;
    console.log('[Messaging] Nouvelle conversation avec:', trimmed);
    setShowNewModal(false);
    setNewMemberNumber('');
    router.push({ pathname: '/chat/[member_id]', params: { member_id: trimmed, member_name: trimmed } });
  };

  const handleOpenNewModal = () => {
    console.log('[Messaging] Ouverture du modal nouvelle conversation');
    setShowNewModal(true);
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const timeDisplay = item.last_message_at ? formatRelativeTime(item.last_message_at) : '';
    const hasUnread = item.unread_count > 0;
    const unreadDisplay = String(item.unread_count > 99 ? '99+' : item.unread_count);

    return (
      <TouchableOpacity
        style={styles.convCard}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.convAvatar}>
          <Text style={styles.convAvatarText}>{(item.member_name || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.convBody}>
          <View style={styles.convTopRow}>
            <Text style={[styles.convName, hasUnread && styles.convNameBold]} numberOfLines={1}>
              {item.member_name}
            </Text>
            <Text style={styles.convTime}>{timeDisplay}</Text>
          </View>
          <View style={styles.convBottomRow}>
            <Text style={[styles.convLastMsg, hasUnread && styles.convLastMsgBold]} numberOfLines={1}>
              {item.last_message || 'Aucun message'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadDisplay}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Messagerie',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchConversations}>
              <RefreshCw size={16} color="#FFFFFF" />
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MessageCircle size={52} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Aucune conversation</Text>
                <Text style={styles.emptySubtitle}>Appuyez sur + pour démarrer une conversation</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={handleOpenNewModal} activeOpacity={0.85}>
          <Plus size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* New Conversation Modal */}
        <Modal
          visible={showNewModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNewModal(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nouvelle conversation</Text>
                <TouchableOpacity onPress={() => setShowNewModal(false)}>
                  <X size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalLabel}>Numéro de membre</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="ex: ARM-2024-00001"
                placeholderTextColor={colors.textTertiary}
                value={newMemberNumber}
                onChangeText={setNewMemberNumber}
                autoCapitalize="characters"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.modalSendButton, !newMemberNumber.trim() && styles.modalSendButtonDisabled]}
                onPress={handleNewConversation}
                disabled={!newMemberNumber.trim()}
                activeOpacity={0.8}
              >
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.modalSendText}>Démarrer</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  convAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  convAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  convBody: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  convNameBold: {
    fontWeight: '800',
  },
  convTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  convBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  convLastMsg: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  convLastMsgBold: {
    fontWeight: '600',
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
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
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  modalSendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modalSendButtonDisabled: {
    opacity: 0.5,
  },
  modalSendText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
