
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiCall } from '@/utils/api';
import * as Haptics from 'expo-haptics';

interface Conference {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  meetingUrl: string;
  status: string;
  createdAt: string;
}

export default function ConferencesScreen() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConferences();
  }, []);

  const loadConferences = async () => {
    console.log('[Conferences] Loading conferences');
    setIsLoading(true);

    try {
      // TODO: Backend Integration - GET /api/conferences
      const { data, error } = await apiCall<Conference[]>('/api/conferences', {
        method: 'GET',
      });

      if (data) {
        setConferences(data);
      } else {
        console.error('[Conferences] Error loading conferences:', error);
      }
    } catch (error) {
      console.error('[Conferences] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConferences();
    setRefreshing(false);
  }, []);

  const handleJoinConference = async (conference: Conference) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[Conferences] Joining conference:', conference.title);

    try {
      const canOpen = await Linking.canOpenURL(conference.meetingUrl);
      if (canOpen) {
        await Linking.openURL(conference.meetingUrl);
      } else {
        console.error('[Conferences] Cannot open URL:', conference.meetingUrl);
      }
    } catch (error) {
      console.error('[Conferences] Error opening URL:', error);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'scheduled':
        return colors.warning;
      case 'completed':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return 'En cours';
      case 'scheduled':
        return 'Programmée';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Vidéoconférences',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="video.fill"
            android_material_icon_name="videocam"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.title}>Vidéoconférences A.R.M</Text>
          <Text style={styles.subtitle}>
            Participez aux réunions et événements en ligne du parti
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement des conférences...</Text>
          </View>
        ) : conferences.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="video.slash"
              android_material_icon_name="videocam-off"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>Aucune conférence disponible</Text>
            <Text style={styles.emptySubtext}>
              Les prochaines vidéoconférences seront affichées ici
            </Text>
          </View>
        ) : (
          <View style={styles.conferencesList}>
            {conferences.map((conference) => {
              const statusColor = getStatusColor(conference.status);
              const statusText = getStatusText(conference.status);
              const formattedDate = formatDate(conference.scheduledAt);

              return (
                <View key={conference.id} style={styles.conferenceCard}>
                  <View style={styles.conferenceHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.statusText}>{statusText}</Text>
                    </View>
                  </View>

                  <Text style={styles.conferenceTitle}>{conference.title}</Text>
                  <Text style={styles.conferenceDescription}>{conference.description}</Text>

                  <View style={styles.conferenceInfo}>
                    <IconSymbol
                      ios_icon_name="calendar"
                      android_material_icon_name="event"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.conferenceDate}>{formattedDate}</Text>
                  </View>

                  {conference.status !== 'completed' && (
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={() => handleJoinConference(conference)}
                    >
                      <IconSymbol
                        ios_icon_name="video.fill"
                        android_material_icon_name="videocam"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.joinButtonText}>
                        {conference.status === 'active' ? 'Rejoindre maintenant' : 'Voir les détails'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  conferencesList: {
    gap: 16,
  },
  conferenceCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  conferenceHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conferenceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  conferenceDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  conferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  conferenceDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
