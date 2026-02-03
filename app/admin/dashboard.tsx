
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
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { adminGet } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Analytics {
  totalMembers: number;
  totalDonations: string;
  totalMessages: number;
  recentActivity: any[];
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');

  const checkAdminAuth = useCallback(async () => {
    console.log('[AdminDashboard] Checking admin authentication');
    try {
      const password = await AsyncStorage.getItem('admin_password');
      const secretCode = await AsyncStorage.getItem('admin_secret_code');
      
      // Also check localStorage for web
      const webPassword = Platform.OS === 'web' ? localStorage.getItem('admin_password') : null;
      const webSecretCode = Platform.OS === 'web' ? localStorage.getItem('admin_secret_code') : null;
      
      const hasCredentials = (password && secretCode) || (webPassword && webSecretCode);
      
      if (hasCredentials) {
        console.log('[AdminDashboard] Admin credentials found');
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('[AdminDashboard] No admin credentials, redirecting to login');
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
    try {
      const response = await adminGet<Analytics>('/api/admin/analytics');
      
      setAnalytics(response);
      console.log('[AdminDashboard] Analytics loaded:', response);
    } catch (error) {
      console.error('[AdminDashboard] Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initDashboard = async () => {
      const authenticated = await checkAdminAuth();
      if (authenticated) {
        console.log('[AdminDashboard] Admin authenticated, loading analytics');
        loadAnalytics();
      }
    };
    
    initDashboard();
  }, [checkAdminAuth, loadAnalytics]);

  const handleLogout = async () => {
    console.log('Admin logout requested');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Clear admin credentials
    try {
      await AsyncStorage.removeItem('admin_password');
      await AsyncStorage.removeItem('admin_secret_code');
      
      if (Platform.OS === 'web') {
        localStorage.removeItem('admin_password');
        localStorage.removeItem('admin_secret_code');
      }
      
      console.log('[AdminDashboard] Admin credentials cleared');
    } catch (error) {
      console.error('[AdminDashboard] Error clearing credentials:', error);
    }
    
    router.replace('/admin/login');
  };

  if (!isAuthenticated || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Tableau de Bord',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Analytics Cards */}
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <IconSymbol
              ios_icon_name="person.3.fill"
              android_material_icon_name="group"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.analyticsValue}>{analytics?.totalMembers || 0}</Text>
            <Text style={styles.analyticsLabel}>Membres</Text>
          </View>

          <View style={styles.analyticsCard}>
            <IconSymbol
              ios_icon_name="dollarsign.circle.fill"
              android_material_icon_name="attach-money"
              size={32}
              color={colors.accent}
            />
            <Text style={styles.analyticsValue}>{analytics?.totalDonations || '0 €'}</Text>
            <Text style={styles.analyticsLabel}>Contributions</Text>
          </View>

          <View style={styles.analyticsCard}>
            <IconSymbol
              ios_icon_name="envelope.fill"
              android_material_icon_name="email"
              size={32}
              color={colors.secondary}
            />
            <Text style={styles.analyticsValue}>{analytics?.totalMessages || 0}</Text>
            <Text style={styles.analyticsLabel}>Messages</Text>
          </View>
        </View>

        {/* Management Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestion</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/member-registry')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.menuItemText}>Registre des Inscriptions</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/manage-news-full')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="newspaper.fill"
              android_material_icon_name="article"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.menuItemText}>Gérer les Actualités</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/manage-events')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.menuItemText}>Gérer les Événements</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/manage-members')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="person.3.fill"
              android_material_icon_name="group"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.menuItemText}>Gérer les Membres</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/manage-leadership')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.menuItemText}>Gérer la Direction</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/send-message')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="paperplane.fill"
              android_material_icon_name="send"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.menuItemText}>Envoyer un Message</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/election-verification')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="checkmark.seal.fill"
              android_material_icon_name="verified"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.menuItemText}>Vérification Électorale</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/media-upload')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="photo.fill"
              android_material_icon_name="photo-library"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.menuItemText}>Médias</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="rectangle.portrait.and.arrow.right"
              android_material_icon_name="logout"
              size={20}
              color={colors.error}
            />
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
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
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
  },
  analyticsCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  analyticsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  analyticsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
});
