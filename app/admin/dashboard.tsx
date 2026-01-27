
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedApiCall } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';
import * as Haptics from 'expo-haptics';

interface Analytics {
  totalMembers: number;
  totalDonations: string;
  totalMessages: number;
  recentActivity: any[];
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'confirm' as 'info' | 'success' | 'warning' | 'error' | 'confirm',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
      return;
    }
    if (user) {
      loadAnalytics();
    }
  }, [user, authLoading]);

  const loadAnalytics = async () => {
    console.log('[AdminDashboard] Loading analytics');
    setIsLoading(true);

    try {
      const { data, error } = await authenticatedApiCall<Analytics>(
        '/api/analytics/overview',
        { method: 'GET' }
      );

      if (data) {
        setAnalytics(data);
      } else {
        console.error('[AdminDashboard] Error loading analytics:', error);
      }
    } catch (error) {
      console.error('[AdminDashboard] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalConfig({
      title: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      type: 'confirm',
      onConfirm: async () => {
        setModalVisible(false);
        await signOut();
        router.replace('/auth');
      },
    });
    setModalVisible(true);
  };

  const adminUsername = user?.name || user?.email || 'Admin';

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Tableau de bord',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <IconSymbol
                ios_icon_name="rectangle.portrait.and.arrow.right"
                android_material_icon_name="logout"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Modal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalVisible(false)}
        onConfirm={modalConfig.onConfirm}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.welcomeCard}>
          <IconSymbol
            ios_icon_name="person.circle.fill"
            android_material_icon_name="account-circle"
            size={60}
            color={colors.primary}
          />
          <Text style={styles.welcomeText}>Bienvenue,</Text>
          <Text style={styles.adminName}>{adminUsername}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement des statistiques...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <IconSymbol
                  ios_icon_name="person.3.fill"
                  android_material_icon_name="group"
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.statValue}>{analytics?.totalMembers || 0}</Text>
                <Text style={styles.statLabel}>Membres</Text>
              </View>

              <View style={styles.statCard}>
                <IconSymbol
                  ios_icon_name="dollarsign.circle.fill"
                  android_material_icon_name="payment"
                  size={32}
                  color={colors.secondary}
                />
                <Text style={styles.statValue}>{analytics?.totalDonations || 0}</Text>
                <Text style={styles.statLabel}>Dons</Text>
              </View>

              <View style={styles.statCard}>
                <IconSymbol
                  ios_icon_name="envelope.fill"
                  android_material_icon_name="email"
                  size={32}
                  color={colors.accent}
                />
                <Text style={styles.statValue}>{analytics?.totalMessages || 0}</Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gestion du contenu</Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/admin/manage-news-full');
                }}
              >
                <IconSymbol
                  ios_icon_name="newspaper.fill"
                  android_material_icon_name="article"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.menuItemText}>Gérer les actualités</Text>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/admin/manage-events');
                }}
              >
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="event"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.menuItemText}>Gérer les événements</Text>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/admin/manage-leadership');
                }}
              >
                <IconSymbol
                  ios_icon_name="person.2.fill"
                  android_material_icon_name="people"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.menuItemText}>Gérer les dirigeants</Text>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/admin/manage-conferences');
                }}
              >
                <IconSymbol
                  ios_icon_name="video.fill"
                  android_material_icon_name="videocam"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.menuItemText}>Vidéoconférences</Text>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/admin/media-upload');
                }}
              >
                <IconSymbol
                  ios_icon_name="photo.fill"
                  android_material_icon_name="photo-library"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.menuItemText}>Télécharger des médias</Text>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </>
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
  logoutButton: {
    marginRight: 16,
  },
  welcomeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  welcomeText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 12,
  },
  adminName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
