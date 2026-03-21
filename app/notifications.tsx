
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  imageUrl?: string;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  actualite: '#1565C0',
  evenement: '#2E7D32',
  annonce: '#E65100',
  urgent: '#C62828',
};

const CATEGORY_LABELS: Record<string, string> = {
  actualite: 'Actualité',
  evenement: 'Événement',
  annonce: 'Annonce',
  urgent: 'Urgent',
};

const FILTER_TABS = [
  { key: 'all', label: 'Tout' },
  { key: 'actualite', label: 'Actualités' },
  { key: 'evenement', label: 'Événements' },
  { key: 'annonce', label: 'Annonces' },
  { key: 'urgent', label: 'Urgent' },
];

function formatDateFr(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadNotifications = useCallback(async () => {
    console.log('[Notifications] GET /api/notifications');
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text}`);
      }
      const data = await res.json();
      const list: NotificationItem[] = Array.isArray(data) ? data : [];
      console.log('[Notifications] Chargées:', list.length, 'éléments');
      setNotifications(list);
    } catch (err: any) {
      console.error('[Notifications] Erreur de chargement:', err);
      setError('Impossible de charger les notifications. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = useCallback(async () => {
    console.log('[Notifications] Actualisation par glissement');
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handleFilterPress = (key: string) => {
    console.log('[Notifications] Filtre sélectionné:', key);
    setActiveFilter(key);
  };

  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.category === activeFilter);

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Actualités & Annonces',
            headerShown: true,
            headerBackTitle: 'Retour',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Actualités & Annonces',
          headerShown: true,
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <View style={styles.container}>
        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterBarContent}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => handleFilterPress(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {error ? (
            <View style={styles.errorContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={32}
                color={colors.danger}
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadNotifications}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="bell.slash"
                android_material_icon_name="notifications-off"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateTitle}>Aucune notification</Text>
              <Text style={styles.emptyStateText}>
                Il n&apos;y a pas encore de contenu dans cette catégorie.
              </Text>
            </View>
          ) : (
            filteredNotifications.map((item) => {
              const catColor = CATEGORY_COLORS[item.category] || '#607D8B';
              const catLabel = CATEGORY_LABELS[item.category] || item.category;
              const dateStr = formatDateFr(item.createdAt);
              return (
                <View key={item.id} style={styles.notifCard}>
                  <View style={styles.notifCardHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: catColor }]}>
                      <Text style={styles.categoryBadgeText}>{catLabel}</Text>
                    </View>
                    <Text style={styles.notifDate}>{dateStr}</Text>
                  </View>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifContent}>{item.content}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textSecondary,
  },
  filterBar: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 52,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 15,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  notifCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  notifCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notifDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  notifContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
});
