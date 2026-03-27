
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { colors } from '@/styles/commonStyles';
import { Play, RefreshCw, Image as ImageIcon, Video } from 'lucide-react-native';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';
const { width } = Dimensions.get('window');
const PHOTO_CARD_SIZE = (width - 48) / 2;

interface MediaItem {
  id: string;
  title: string;
  description: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail_url: string;
  created_at: string;
}

export default function MediaScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'photo' | 'video'>('photo');
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    console.log('[Media] Chargement des médias');
    setError(null);
    try {
      const [photoRes, videoRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/media?type=photo`),
        fetch(`${BACKEND_URL}/api/media?type=video`),
      ]);

      if (!photoRes.ok) {
        const txt = await photoRes.text();
        throw new Error(`Photos: ${photoRes.status} — ${txt.slice(0, 100)}`);
      }
      if (!videoRes.ok) {
        const txt = await videoRes.text();
        throw new Error(`Vidéos: ${videoRes.status} — ${txt.slice(0, 100)}`);
      }

      const photoData = await photoRes.json();
      const videoData = await videoRes.json();

      console.log('[Media] Photos chargées:', photoData.media?.length ?? 0);
      console.log('[Media] Vidéos chargées:', videoData.media?.length ?? 0);

      setPhotos(Array.isArray(photoData.media) ? photoData.media : []);
      setVideos(Array.isArray(videoData.media) ? videoData.media : []);
    } catch (err: any) {
      console.error('[Media] Erreur:', err.message);
      setError('Impossible de charger les médias. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const onRefresh = useCallback(async () => {
    console.log('[Media] Actualisation');
    setRefreshing(true);
    await fetchMedia();
    setRefreshing(false);
  }, [fetchMedia]);

  const handlePhotoPress = (item: MediaItem) => {
    console.log('[Media] Photo appuyée:', item.id, item.title);
    router.push({ pathname: '/media-viewer', params: { url: item.url, title: item.title } });
  };

  const handleVideoPress = (item: MediaItem) => {
    console.log('[Media] Vidéo appuyée:', item.id, item.title);
    router.push({ pathname: '/video-player', params: { url: item.url, title: item.title } });
  };

  const handleTabChange = (tab: 'photo' | 'video') => {
    console.log('[Media] Onglet changé:', tab);
    setActiveTab(tab);
  };

  const renderPhotoItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity
      style={styles.photoCard}
      onPress={() => handlePhotoPress(item)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.thumbnail_url || item.url }}
        style={styles.photoImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.photoTitleWrap}>
        <Text style={styles.photoTitle} numberOfLines={2}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderVideoItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => handleVideoPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.videoThumbnailWrap}>
        <Image
          source={{ uri: item.thumbnail_url || item.url }}
          style={styles.videoThumbnail}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Play size={22} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.videoDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = (type: 'photo' | 'video') => (
    <View style={styles.emptyState}>
      {type === 'photo' ? (
        <ImageIcon size={48} color={colors.textTertiary} />
      ) : (
        <Video size={48} color={colors.textTertiary} />
      )}
      <Text style={styles.emptyText}>
        {type === 'photo' ? 'Aucune photo disponible' : 'Aucune vidéo disponible'}
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Médiathèque',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <View style={styles.container}>
        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentButton, activeTab === 'photo' && styles.segmentButtonActive]}
            onPress={() => handleTabChange('photo')}
            activeOpacity={0.8}
          >
            <ImageIcon size={16} color={activeTab === 'photo' ? '#FFFFFF' : colors.primary} />
            <Text style={[styles.segmentText, activeTab === 'photo' && styles.segmentTextActive]}>
              Photos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, activeTab === 'video' && styles.segmentButtonActive]}
            onPress={() => handleTabChange('video')}
            activeOpacity={0.8}
          >
            <Play size={16} color={activeTab === 'video' ? '#FFFFFF' : colors.primary} />
            <Text style={[styles.segmentText, activeTab === 'video' && styles.segmentTextActive]}>
              Vidéos
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement des médias...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMedia}>
              <RefreshCw size={16} color="#FFFFFF" />
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'photo' ? (
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id}
            renderItem={renderPhotoItem}
            numColumns={2}
            columnWrapperStyle={styles.photoRow}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => renderEmpty('photo')}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id}
            renderItem={renderVideoItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => renderEmpty('video')}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
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
    backgroundColor: colors.background,
  },
  segmentedControl: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  photoRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  photoCard: {
    width: PHOTO_CARD_SIZE,
    backgroundColor: colors.card,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  photoImage: {
    width: '100%',
    height: PHOTO_CARD_SIZE,
  },
  photoTitleWrap: {
    padding: 10,
  },
  photoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 18,
  },
  videoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  videoThumbnailWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(27,122,62,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    padding: 14,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  videoDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
