import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { BACKEND_URL } from '@/utils/api';

const PRIMARY = '#4CAF50';

interface ArmMessage {
  id: string;
  author_name: string;
  author_email?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

function formatDateFr(dateString?: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateString);
  }
}

export default function AdminMessagesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<ArmMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<ArmMessage | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMessages = useCallback(async (isRefresh = false) => {
    console.log('[AdminMessages] GET /api/arm-messages');
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/arm-messages`);
      if (!res.ok) {
        const text = await res.text();
        console.error('[AdminMessages] Erreur HTTP', res.status, text.slice(0, 120));
        throw new Error(`Erreur ${res.status}`);
      }
      const data = await res.json();
      const list: ArmMessage[] = Array.isArray(data) ? data : (data.messages ?? []);
      console.log('[AdminMessages] Messages chargés:', list.length);
      setMessages(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AdminMessages] Erreur chargement:', msg);
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMessages(false);
    }, [loadMessages])
  );

  const onRefresh = useCallback(() => {
    console.log('[AdminMessages] Pull-to-refresh');
    setRefreshing(true);
    loadMessages(true);
  }, [loadMessages]);

  const handleMarkRead = async (msg: ArmMessage) => {
    if (msg.is_read) return;
    console.log('[AdminMessages] PATCH /api/arm-messages/' + msg.id + '/read');
    try {
      const res = await fetch(`${BACKEND_URL}/api/arm-messages/${msg.id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('[AdminMessages] Erreur mark-read', res.status, text.slice(0, 120));
        return;
      }
      console.log('[AdminMessages] Message marqué comme lu:', msg.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m))
      );
      if (selectedMsg?.id === msg.id) {
        setSelectedMsg((prev) => (prev ? { ...prev, is_read: true } : prev));
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[AdminMessages] Erreur réseau mark-read:', errMsg);
    }
  };

  const handleOpenDetail = (msg: ArmMessage) => {
    console.log('[AdminMessages] Ouverture message:', msg.id, msg.author_name);
    setSelectedMsg(msg);
    setDetailVisible(true);
    handleMarkRead(msg);
  };

  const handleDelete = (msg: ArmMessage) => {
    console.log('[AdminMessages] Demande suppression message:', msg.id);
    Alert.alert(
      'Supprimer ce message',
      `Voulez-vous vraiment supprimer le message de "${msg.author_name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('[AdminMessages] DELETE /api/arm-messages/' + msg.id);
            setDeletingId(msg.id);
            try {
              const res = await fetch(`${BACKEND_URL}/api/arm-messages/${msg.id}`, {
                method: 'DELETE',
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
              }
              console.log('[AdminMessages] Message supprimé:', msg.id);
              setMessages((prev) => prev.filter((m) => m.id !== msg.id));
              if (selectedMsg?.id === msg.id) {
                setDetailVisible(false);
                setSelectedMsg(null);
              }
            } catch (err: unknown) {
              const errMsg = err instanceof Error ? err.message : String(err);
              console.error('[AdminMessages] Erreur suppression:', errMsg);
              Alert.alert('Erreur', errMsg);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;
  const unreadLabel = unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Tous lus';

  const renderItem = ({ item }: { item: ArmMessage }) => {
    const dateStr = formatDateFr(item.created_at);
    const isDeleting = deletingId === item.id;
    const isUnread = !item.is_read;

    return (
      <TouchableOpacity
        style={[styles.card, isUnread && styles.cardUnread]}
        onPress={() => handleOpenDetail(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            {isUnread && <View style={styles.unreadDot} />}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(item.author_name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.authorName, isUnread && styles.authorNameBold]} numberOfLines={1}>
                {item.author_name}
              </Text>
              <Text style={styles.cardDate}>{dateStr}</Text>
            </View>
            {item.author_email ? (
              <Text style={styles.authorEmail} numberOfLines={1}>{item.author_email}</Text>
            ) : null}
            <Text style={styles.contentPreview} numberOfLines={2}>{item.content}</Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          {isUnread && (
            <TouchableOpacity
              style={styles.readBtn}
              onPress={() => {
                console.log('[AdminMessages] Bouton Marquer lu appuyé:', item.id);
                handleMarkRead(item);
              }}
            >
              <Text style={styles.readBtnText}>Marquer lu</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Text style={styles.deleteBtnText}>Supprimer</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Messages reçus',
          headerShown: true,
          headerStyle: { backgroundColor: PRIMARY },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      {/* Detail modal */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          console.log('[AdminMessages] Fermeture modal détail');
          setDetailVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedMsg && (
                <>
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalAuthor}>{selectedMsg.author_name}</Text>
                      {selectedMsg.author_email ? (
                        <Text style={styles.modalEmail}>{selectedMsg.author_email}</Text>
                      ) : null}
                      <Text style={styles.modalDate}>{formatDateFr(selectedMsg.created_at)}</Text>
                    </View>
                    <View style={[styles.readBadge, selectedMsg.is_read ? styles.readBadgeRead : styles.readBadgeUnread]}>
                      <Text style={[styles.readBadgeText, selectedMsg.is_read ? styles.readBadgeTextRead : styles.readBadgeTextUnread]}>
                        {selectedMsg.is_read ? 'Lu' : 'Non lu'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalDivider} />
                  <Text style={styles.modalContent}>{selectedMsg.content}</Text>
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalDeleteBtn}
                      onPress={() => handleDelete(selectedMsg)}
                    >
                      <Text style={styles.modalDeleteBtnText}>Supprimer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalCloseBtn}
                      onPress={() => {
                        console.log('[AdminMessages] Bouton Fermer modal appuyé');
                        setDetailVisible(false);
                      }}
                    >
                      <Text style={styles.modalCloseBtnText}>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        {/* Stats bar */}
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </Text>
          <View style={[styles.unreadBadge, unreadCount > 0 ? styles.unreadBadgeActive : styles.unreadBadgeInactive]}>
            <Text style={[styles.unreadBadgeText, unreadCount > 0 ? styles.unreadBadgeTextActive : styles.unreadBadgeTextInactive]}>
              {unreadLabel}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Chargement des messages...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                console.log('[AdminMessages] Bouton Réessayer appuyé');
                loadMessages(false);
              }}
            >
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              messages.length === 0 && styles.listContentEmpty,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={PRIMARY}
                colors={[PRIMARY]}
              />
            }
            ListEmptyComponent={
              <View style={styles.centerBox}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>Aucun message</Text>
                <Text style={styles.emptySubtitle}>Les messages reçus apparaîtront ici.</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  unreadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  unreadBadgeActive: {
    backgroundColor: '#FEF2F2',
  },
  unreadBadgeInactive: {
    backgroundColor: '#F0FDF4',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  unreadBadgeTextActive: {
    color: '#DC2626',
  },
  unreadBadgeTextInactive: {
    color: '#16a34a',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
    marginRight: 6,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: PRIMARY,
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  authorNameBold: {
    fontWeight: '800',
  },
  cardDate: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
    flexShrink: 0,
  },
  authorEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  contentPreview: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  readBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: PRIMARY + '15',
    borderRadius: 8,
  },
  readBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY,
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalAuthor: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  modalEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 12,
    color: '#999',
  },
  readBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  readBadgeRead: {
    backgroundColor: '#F0FDF4',
  },
  readBadgeUnread: {
    backgroundColor: '#FEF2F2',
  },
  readBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  readBadgeTextRead: {
    color: '#16a34a',
  },
  readBadgeTextUnread: {
    color: '#DC2626',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
  },
  modalContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  modalDeleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modalDeleteBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalCloseBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
