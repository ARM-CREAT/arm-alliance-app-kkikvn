
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '@/styles/commonStyles';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = width * (9 / 16);

export default function VideoPlayerScreen() {
  const { url, title, description } = useLocalSearchParams<{
    url: string;
    title: string;
    description?: string;
  }>();

  const player = useVideoPlayer(url ?? '', (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    console.log('[VideoPlayer] Lecture de la vidéo:', title, url);
    return () => {
      console.log('[VideoPlayer] Arrêt de la vidéo');
      player.pause();
    };
  }, []);

  const isBuffering = player.status === 'loading';

  return (
    <>
      <Stack.Screen
        options={{
          title: title ?? 'Vidéo',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <View style={styles.container}>
        <View style={styles.videoWrapper}>
          <VideoView
            player={player}
            style={styles.video}
            allowsFullscreen
            allowsPictureInPicture
            contentFit="contain"
          />
          {isBuffering && (
            <View style={styles.bufferingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
        </View>

        <ScrollView style={styles.infoScroll} contentContainerStyle={styles.infoContent}>
          {title ? (
            <Text style={styles.videoTitle}>{title}</Text>
          ) : null}
          {description ? (
            <Text style={styles.videoDescription}>{description}</Text>
          ) : null}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoWrapper: {
    width,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  infoScroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  infoContent: {
    padding: 20,
    paddingBottom: 60,
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    lineHeight: 26,
  },
  videoDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
