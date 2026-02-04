
import React, { useState, useEffect, useCallback } from 'react';
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
import { Modal } from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import { adminGet, getAdminCredentials, clearAdminCredentials } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface Analytics {
  totalMembers: number;
  totalDonations: string;
  totalMessages: number;
  recentActivity: any[];
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAdminAuth = useCallback(async () => {
    console.log('[AdminDashboard] Checking admin authentication');
    try {
      const credentials = await getAdminCredentials();
      
      if (credentials) {
        console.log('[AdminDashboard] Admin credentials found');
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('[AdminDashboard] No admin credentials found, redirecting to login');
        router.replace('/admin/login');
        return false;
      }
    } catch (error) {
      console.error('[AdminDashboard] Error checking admin auth:', error);
      router.replace('/admin/login');
      return false;
    }
  }, [router]);

  const loadAnalytics = useCallback(async () => {
    console.log('[AdminDashboard] Loading analytics');
    setLoading(true);

    try {
      const data = await adminGet('/api/admin/analytics');
      console.log('[AdminDashboard] Analytics loaded:', data);
      setAnalytics(data);
    } catch (error: any) {
      console.error('[AdminDashboard] Error loading analytics:', error);
      setModalTitle('Erreur');
      setModalMessage(error?.message || 'Impossible de charger les statistiques');
      setModalType('error');
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initDashboard = async () => {
      console.log('[AdminDashboard] Admin authenticated, loading analytics');
      const authenticated = await checkAdminAuth();
      if (authenticated) {
        await loadAnalytics();
      }
    };

    initDashboard();
  }, [checkAdminAuth, loadAnalytics]);

  const handleLogout = async () => {
    console.log('[AdminDashboard] User tapped Logout');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setModalTitle('Déconnexion');
    setModalMessage('Voulez-vous vraiment vous déconnecter ?');
    setModalType('confirm');
    setModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      await clearAdminCredentials();
      console.log('[AdminDashboard] Admin logged out successfully');
      router.replace('/admin/login');
    } catch (error) {
      console.error('[AdminDashboard] Error during logout:', error);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Tableau de Bord',
            headerShown: true,
            headerBackTitle: 'Retour',
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const totalMembersDisplay = analytics?.totalMembers?.toString() || '0';
  const totalDonationsDisplay = analytics?.totalDonations || '0 XOF';
  const totalMessagesDisplay = analytics?.totalMessages?.toString() || '0';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Tableau de Bord Admin',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Statistics Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <IconSymbol
              ios_icon_name="person.3.fill"
              android_material_icon_name="group"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.statValue}>{totalMembersDisplay}</Text>
            <Text style={styles.statLabel}>Membres Totaux</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol
              ios_icon_name="dollarsign.circle.fill"
              android_material_icon_name="payments"
              size={32}
              color={colors.success}
            />
            <Text style={styles.statValue}>{totalDonationsDisplay}</Text>
            <Text style={styles.statLabel}>Dons Totaux</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol
              ios_icon_name="envelope.fill"
              android_material_icon_name="email"
              size={32}
              color={colors.warning}
            />
            <Text style={styles.statValue}>{totalMessagesDisplay}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
        </View>

        {/* Management Sections */}
        <View style={styles.managementSection}>
          <Text style={styles.sectionTitle}>Gestion du Contenu</Text>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/admin/manage-news-full');
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="newspaper.fill"
              android_material_icon_name="article"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.managementButtonText}>Gérer les Actualités</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/admin/manage-events');
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.managementButtonText}>Gérer les Événements</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/admin/manage-leadership');
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="person.badge.key.fill"
              android_material_icon_name="admin-panel-settings"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.managementButtonText}>Gérer les Dirigeants</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/admin/manage-members');
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="person.3"
              android_material_icon_name="group"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.managementButtonText}>Gérer les Membres</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/admin/member-registry');
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="list.bullet.rectangle"
              android_material_icon_name="list-alt"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.managementButtonText}>Registre des Membres</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/admin/election-verification');
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="checkmark.seal.fill"
              android_material_icon_name="verified"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.managementButtonText}>Vérification Électorale</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/admin/media-upload');
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="photo.fill"
              android_material_icon_name="photo-library"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.managementButtonText}>Photos, Vidéos et Documents</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/admin/send-message');
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="paperplane.fill"
              android_material_icon_name="send"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.managementButtonText}>Envoyer un Message</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <IconSymbol
            ios_icon_name="arrow.right.square.fill"
            android_material_icon_name="logout"
            size={24}
            color={colors.error}
          />
          <Text style={styles.logoutButtonText}>Se Déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
        onConfirm={modalType === 'confirm' ? confirmLogout : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 40,
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
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  managementSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  managementButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.error,
  },
  logoutButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.error,
    marginLeft: 12,
  },
});
