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
  Platform,
  Image,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles/commonStyles';
import { BACKEND_URL } from '@/utils/api-helpers';
import * as Haptics from 'expo-haptics';

const ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'x-admin-password': 'admin123',
};

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateString);
  }
}

export default function AdminNewsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadNews = useCallback(async (isRefresh = false) => {
    console.log('[AdminNews] GET /api/news');
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/news`, { headers: ADMIN_HEADERS });
      if (!res.ok) {
        const text = await res.text();
        console.error('[AdminNews] Erreur HTTP', res.status, text.slice(0, 120));
        throw new Error(`Erreur ${res.status}`);
      }
      const data = await res.json();
      const list: NewsItem[] = Array.isArray(data) ? data : (data.news ?? []);
      console.log('[AdminNews] Articles chargés:', list.length);
      setNews(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AdminNews] Erreur chargement:', msg);
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNews(false);
    }, [loadNews])
  );

  const onRefresh = useCallback(() => {
    console.log('[AdminNews] Pull-to-refresh');
    setRefreshing(true);
    loadNews(true);
  }, [loadNews]);

  const handleAdd = () => {
    console.log('[AdminNews] Bouton Ajouter appuyé');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/admin/news/new' as any);
  };

  const handleEdit = (item: NewsItem) => {
    console.log('[AdminNews] Modifier article:', item.id);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/admin/news/${item.id}` as any);
  };

  const handleDelete = (item: NewsItem) => {
    console.log('[AdminNews] Demande suppression article:', item.id);
    Alert.alert(
      'Supprimer cet article',
      `Voulez-vous vraiment supprimer "${item.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('[AdminNews] DELETE /api/news/' + item.id);
            try {
              const res = await fetch(`${BACKEND_URL}/api/news/${item.id}`, {
                method: 'DELETE',
                headers: ADMIN_HEADERS,
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Erreur ${res.status}: ${text.slice(0, 120)}`);
              }
              console.log('[AdminNews] Article supprimé:', item.id);
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadNews(true);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error('[AdminNews] Erreur suppression:', msg);
              Alert.alert('Erreur', msg);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: NewsItem }) => {
    const dateStr = formatDate(item.created_at);
    const publishedLabel = item.published ? 'Publié' : 'Brouillon';
    const publishedColor = item.published ? colors.success : colors.textTertiary;

    return (
      <TouchableOpacity
        style={[styles.card, !item.published && styles.cardUnpublished]}
        onPress={() => handleEdit(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: publishedColor + '22' }]}>
            <Text style={[styles.badgeText, { color: publishedColor }]}>{publishedLabel}</Text>
          </View>
          <Text style={styles.cardDate}>{dateStr}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
        ) : null}
        <Text style={styles.cardContent} numberOfLines={2}>{item.content}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
            <Ionicons name="pencil-outline" size={14} color={colors.primary} />
            <Text style={styles.editBtnText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={14} color={colors.danger} />
            <Text style={styles.deleteBtnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Actualités',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadNews(false)}>
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={news}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="newspaper-outline" size={56} color={colors.textTertiary} />
                <Text style={styles.emptyText}>Aucune actualité</Text>
                <Text style={styles.emptySubtext}>Appuyez sur + pour créer le premier article</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={handleAdd}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardUnpublished: {
    opacity: 0.65,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardDate: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    lineHeight: 22,
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 10,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.danger + '15',
    borderRadius: 8,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
