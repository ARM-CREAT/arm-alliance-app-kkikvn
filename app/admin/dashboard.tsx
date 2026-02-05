
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}

const dashboardCards: DashboardCard[] = [
  {
    id: 'news',
    title: 'Actualités',
    description: 'Créer, modifier et supprimer les articles d\'actualité',
    icon: 'article',
    route: '/admin/news',
  },
  {
    id: 'events',
    title: 'Événements',
    description: 'Gérer les événements et rassemblements du parti',
    icon: 'event',
    route: '/admin/events',
  },
  {
    id: 'leadership',
    title: 'Direction',
    description: 'Gérer les membres de la direction du parti',
    icon: 'group',
    route: '/admin/leadership',
  },
  {
    id: 'media',
    title: 'Médias',
    description: 'Télécharger et gérer photos, vidéos et documents',
    icon: 'photo',
    route: '/admin/media',
  },
  {
    id: 'members',
    title: 'Membres',
    description: 'Gérer les adhésions et les membres du parti',
    icon: 'person',
    route: '/admin/members',
  },
  {
    id: 'program',
    title: 'Programme Politique',
    description: 'Gérer le programme et les propositions du parti',
    icon: 'description',
    route: '/admin/program',
  },
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('Admin Dashboard - Checking authentication');
    try {
      const adminPassword = await AsyncStorage.getItem('admin_password');
      if (!adminPassword) {
        console.log('Admin Dashboard - No admin password found, redirecting to login');
        router.replace('/admin/login');
        return;
      }
      console.log('Admin Dashboard - Authentication verified');
    } catch (error) {
      console.error('Admin Dashboard - Auth check error:', error);
      router.replace('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkAuth();
    setRefreshing(false);
  };

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm' = 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleCardPress = (route: string) => {
    console.log('Admin Dashboard - Navigating to:', route);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const handleLogout = async () => {
    console.log('Admin Dashboard - Logout initiated');
    setShowLogoutConfirm(false);
    
    try {
      await AsyncStorage.removeItem('admin_password');
      console.log('Admin Dashboard - Admin password removed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showModal('Déconnexion', 'Vous avez été déconnecté avec succès.', 'success');
      
      setTimeout(() => {
        router.replace('/');
      }, 1000);
    } catch (error) {
      console.error('Admin Dashboard - Logout error:', error);
      showModal('Erreur', 'Erreur lors de la déconnexion.', 'error');
    }
  };

  if (loading) {
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
          title: 'Tableau de Bord',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Tableau de Bord Administrateur</Text>
          <Text style={styles.subtitle}>
            Gérez tous les aspects de l'application A.R.M
          </Text>
        </View>

        <View style={styles.grid}>
          {dashboardCards.map((card) => (
            <View key={card.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <IconSymbol
                    ios_icon_name={card.icon}
                    android_material_icon_name={card.icon}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.cardTitle}>{card.title}</Text>
              </View>
              <Text style={styles.cardDescription}>{card.description}</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => handleCardPress(card.route)}
              >
                <Text style={styles.buttonText}>Gérer</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutConfirm(true)}
        >
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showLogoutConfirm}
        title="Confirmer la déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter de l'espace administrateur?"
        type="confirm"
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />

      <Modal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}
