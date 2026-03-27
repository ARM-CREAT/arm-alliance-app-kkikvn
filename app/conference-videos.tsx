
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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { colors } from '@/styles/commonStyles';
import { Play, Mic, Clock, RefreshCw, Video } from 'lucide-react-native';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';
const { width } = Dimensions.get('window');

interface ConferenceVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  speaker: string;
  duration: string;
  event_date: string;
  created_at: string;
}

const FRENCH_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function formatFrenchDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate();
  const month = FRENCH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonThumb} />
      <View style={styles.skeletonInfo}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '60%' }]} />
        <View style={[styles.skeletonLine, { width: '40%' }]} />
      </View>
    </View>
  );
}

export default function ConferenceVideosScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState<ConferenceVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    console.log('[ConferenceVideos] Chargement des vidéos de conférence');
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/conference-videos`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} — ${txt.slice(0, 100)}`);
      }
      const data = await res.json();
      const list: ConferenceVideo[] = Array.isArray(data.videos) ? data.videos : (Array.isArray(data) ? data : []);
      console.log('[ConferenceVideos] Vidéos chargées:', list.length);
      setVideos(list);
    } catch (err: any) {
      console.error('[ConferenceVideos] Erreur:', err.message);
      setError('Impossible de charger les conférences. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const onRefresh = useCallback(async () => {
    console.log('[ConferenceVideos] Actualisation');
    setRefreshing(true);
    await fetchVideos();
    setRefreshing(false);
  }, [fetchVideos]);

  const handleVideoPress = (video: ConferenceVideo) => {
    console.log('[ConferenceVideos] Vidéo appuyée:', video.id, video.title);
    router.push({
      pathname: '/video-player',
      params: { url: video.video_url, title: video.title, description: video.description },
    });
  };

  const renderItem = ({ item }: { item: ConferenceVideo }) => {
    const dateDisplay = formatFrenchDate(item.event_date);

    return (
      <TouchableOpacity
        style={styles.videoCard}
        onPress={() => handleVideoPress(item)}
        activeOpacity={0.85}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnailWrap}>
          <Image
            source={{ uri: item.thumbnail_url }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          </View>
          {item.duration ? (
            <View style={styles.durationBadge}>
              <Clock size={11} color="#FFFFFF" />
              <Text style={styles.durationText}>{item.duration}</Text>
            </View>
          ) : null}
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          {item.speaker ? (
            <View style={styles.speakerRow}>
              <Mic size={13} color={colors.primary} />
              <Text style={styles.speakerText} numberOfLines={1}>{item.speaker}</Text>
            </View>
          ) : null}
          {dateDisplay ? (
            <Text style={styles.dateText}>{dateDisplay}</Text>
          ) : null}
          {item.description ? (
            <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Conférences',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <FlatList
            data={[1, 2, 3]}
            keyExtractor={(item) => String(item)}
            renderItem={() => <SkeletonCard />}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
          />
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchVideos}>
              <RefreshCw size={16} color="#FFFFFF" />
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Video size={52} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Aucune conférence disponible</Text>
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
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  videoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnailWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(27,122,62,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardInfo: {
    padding: 14,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 22,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  speakerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  descText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  skeletonThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.backgroundAlt,
  },
  skeletonInfo: {
    padding: 14,
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.backgroundAlt,
    width: '80%',
  },
});
