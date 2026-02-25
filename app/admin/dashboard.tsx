
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 68 : 20,
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
  quickSetupBanner: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  quickSetupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
    marginBottom: 8,
  },
  quickSetupText: {
    fontSize: 14,
    color: colors.background,
    lineHeight: 20,
    marginBottom: 16,
  },
  quickSetupButton: {
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSetupButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
    marginLeft: 8,
  },
});

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [showQuickSetup, setShowQuickSetup] = useState(true);

  useEffect(() => {
    const checkQuickSetupStatus = async () => {
      const completed = await AsyncStorage.getItem('quick_setup_completed');
      setShowQuickSetup(!completed);
    };
    
    checkQuickSetupStatus();
  }, []);

  const handleQuickSetup = () => {
    console.log('Navigation vers Configuration Rapide');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    router.push('/admin/quick-setup');
  };

  const handleNavigation = (path: string, label: string) => {
    console.log('Navigation vers', label);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    router.push(path as any);
  };

  const handleLogout = async () => {
    console.log('Déconnexion admin');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await AsyncStorage.removeItem('admin_authenticated');
      router.replace('/admin/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Tableau de Bord Admin',
          headerShown: true,
          headerBackTitle: 'Retour',
        }} 
      />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Tableau de Bord</Text>
            <Text style={styles.subtitle}>Gérez le contenu de votre application</Text>
          </View>

          {showQuickSetup && (
            <View style={styles.quickSetupBanner}>
              <Text style={styles.quickSetupTitle}>🚀 Configuration Rapide</Text>
              <Text style={styles.quickSetupText}>
                Votre application est vide. Ajoutez rapidement des données de démonstration ou commencez à créer votre propre contenu.
              </Text>
              <TouchableOpacity 
                style={styles.quickSetupButton}
                onPress={handleQuickSetup}
                activeOpacity={0.8}
              >
                <IconSymbol 
                  ios_icon_name="wand.and.stars" 
                  android_material_icon_name="auto-fix-high" 
                  size={20} 
                  color={colors.accent} 
                />
                <Text style={styles.quickSetupButtonText}>Démarrer la configuration</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gestion du Contenu</Text>
            <View style={styles.grid}>
              <TouchableOpacity 
                style={styles.card}
                onPress={() => handleNavigation('/admin/news', 'Actualités')}
                activeOpacity={0.8}
              >
                <View style={styles.cardIcon}>
                  <IconSymbol 
                    ios_icon_name="newspaper.fill" 
                    android_material_icon_name="article" 
                    size={32} 
                    color={colors.primary} 
                  />
                </View>
                <Text style={styles.cardTitle}>Actualités</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.card}
                onPress={() => handleNavigation('/admin/events', 'Événements')}
                activeOpacity={0.8}
              >
                <View style={styles.cardIcon}>
                  <IconSymbol 
                    ios_icon_name="calendar.badge.clock" 
                    android_material_icon_name="event" 
                    size={32} 
                    color={colors.primary} 
                  />
                </View>
                <Text style={styles.cardTitle}>Événements</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.card}
                onPress={() => handleNavigation('/admin/leadership', 'Direction')}
                activeOpacity={0.8}
              >
                <View style={styles.cardIcon}>
                  <IconSymbol 
                    ios_icon_name="person.3.fill" 
                    android_material_icon_name="group" 
                    size={32} 
                    color={colors.primary} 
                  />
                </View>
                <Text style={styles.cardTitle}>Direction</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.card}
                onPress={() => handleNavigation('/admin/program', 'Programme')}
                activeOpacity={0.8}
              >
                <View style={styles.cardIcon}>
                  <IconSymbol 
                    ios_icon_name="doc.text.fill" 
                    android_material_icon_name="description" 
                    size={32} 
                    color={colors.primary} 
                  />
                </View>
                <Text style={styles.cardTitle}>Programme</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.card}
                onPress={() => handleNavigation('/admin/members', 'Membres')}
                activeOpacity={0.8}
              >
                <View style={styles.cardIcon}>
                  <IconSymbol 
                    ios_icon_name="person.badge.plus" 
                    android_material_icon_name="person-add" 
                    size={32} 
                    color={colors.primary} 
                  />
                </View>
                <Text style={styles.cardTitle}>Membres</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.card}
                onPress={() => handleNavigation('/admin/media', 'Médias')}
                activeOpacity={0.8}
              >
                <View style={styles.cardIcon}>
                  <IconSymbol 
                    ios_icon_name="photo.fill" 
                    android_material_icon_name="photo-library" 
                    size={32} 
                    color={colors.primary} 
                  />
                </View>
                <Text style={styles.cardTitle}>Médias</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Outils Admin</Text>
            <View style={styles.grid}>
              <TouchableOpacity 
                style={styles.card}
                onPress={() => handleNavigation('/admin/diagnostic', 'Diagnostic')}
                activeOpacity={0.8}
              >
                <View style={styles.cardIcon}>
                  <IconSymbol 
                    ios_icon_name="stethoscope" 
                    android_material_icon_name="healing" 
                    size={32} 
                    color={colors.accent} 
                  />
                </View>
                <Text style={styles.cardTitle}>Diagnostic</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.card}
                onPress={() => handleNavigation('/admin/offline-access', 'Accès Hors Ligne')}
                activeOpacity={0.8}
              >
                <View style={styles.cardIcon}>
                  <IconSymbol 
                    ios_icon_name="wifi.slash" 
                    android_material_icon_name="wifi-off" 
                    size={32} 
                    color={colors.accent} 
                  />
                </View>
                <Text style={styles.cardTitle}>Accès Hors Ligne</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <IconSymbol 
              ios_icon_name="rectangle.portrait.and.arrow.right" 
              android_material_icon_name="logout" 
              size={20} 
              color={colors.background} 
            />
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}
