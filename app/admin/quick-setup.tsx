
import { colors } from '@/styles/commonStyles';
import { Modal } from '@/components/ui/Modal';
import { apiPost } from '@/utils/api';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
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
    lineHeight: 24,
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background,
    marginLeft: 8,
  },
  successCard: {
    backgroundColor: colors.success,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: colors.background,
    marginLeft: 12,
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.background,
    marginLeft: 12,
  },
  infoList: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 8,
    fontWeight: 'bold',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});

export default function QuickSetupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleSetupDemoData = async () => {
    console.log('Configuration rapide : Ajout de données de démonstration');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      const demoNews = [
        {
          title: 'Lancement officiel de A.R.M',
          content: 'L\'Alliance pour le Rassemblement Malien (A.R.M) a été officiellement lancée à Bamako. Notre parti s\'engage à construire un Mali meilleur basé sur la fraternité, la liberté et l\'égalité.',
          imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800',
        },
        {
          title: 'Programme éducatif pour tous',
          content: 'A.R.M annonce son programme ambitieux pour l\'éducation : construction de 100 nouvelles écoles, formation de 5000 enseignants, et bourses pour les étudiants méritants.',
          imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
        },
        {
          title: 'Santé pour tous les Maliens',
          content: 'Notre engagement : accès gratuit aux soins de santé de base dans toutes les régions du Mali. Construction de centres de santé communautaires dans chaque commune.',
          imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800',
        },
      ];

      const demoEvents = [
        {
          title: 'Assemblée Générale A.R.M',
          description: 'Première assemblée générale du parti. Tous les membres sont invités à participer pour discuter de notre stratégie et nos objectifs.',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Siège du Parti, Sebenikoro, Bamako',
          imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
        },
        {
          title: 'Campagne de sensibilisation - Koutiala',
          description: 'Rencontre avec les citoyens de Koutiala pour présenter notre programme agricole et écouter leurs préoccupations.',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Place Publique, Koutiala',
          imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
        },
      ];

      const newsResults = await Promise.allSettled(
        demoNews.map(news => apiPost('/api/news', news))
      );

      const eventsResults = await Promise.allSettled(
        demoEvents.map(event => apiPost('/api/events', event))
      );

      const newsSuccess = newsResults.filter(r => r.status === 'fulfilled').length;
      const eventsSuccess = eventsResults.filter(r => r.status === 'fulfilled').length;

      console.log('Configuration terminée:', newsSuccess, 'actualités,', eventsSuccess, 'événements ajoutés');

      setCompleted(true);
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      showModal(
        'Configuration réussie !',
        `${newsSuccess} actualités et ${eventsSuccess} événements ont été ajoutés. Retournez à l'accueil pour voir le contenu.`,
        'success'
      );
    } catch (error: any) {
      console.error('Erreur lors de la configuration:', error);
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      showModal(
        'Erreur',
        'Impossible d\'ajouter les données de démonstration. Vérifiez votre connexion et réessayez.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoToAdmin = () => {
    console.log('Navigation vers le tableau de bord admin');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    router.push('/admin/dashboard');
  };

  const handleGoHome = () => {
    console.log('Navigation vers l\'accueil');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    router.push('/(tabs)/(home)');
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Configuration Rapide',
          headerShown: true,
          headerBackTitle: 'Retour',
        }} 
      />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Bienvenue dans A.R.M !</Text>
            <Text style={styles.subtitle}>
              Votre application est prête. Ajoutez du contenu pour la rendre vivante.
            </Text>
          </View>

          {completed && (
            <View style={styles.successCard}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={24} 
                color={colors.background} 
              />
              <Text style={styles.successText}>
                Données de démonstration ajoutées avec succès !
              </Text>
            </View>
          )}

          <View style={styles.warningCard}>
            <IconSymbol 
              ios_icon_name="info.circle.fill" 
              android_material_icon_name="info" 
              size={24} 
              color={colors.background} 
            />
            <Text style={styles.warningText}>
              Votre base de données est actuellement vide. Ajoutez du contenu pour voir votre application prendre vie.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Option 1 : Données de démonstration</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Configuration automatique</Text>
              <Text style={styles.cardDescription}>
                Ajoutez automatiquement des actualités et événements de démonstration pour tester l&apos;application.
              </Text>
              <TouchableOpacity 
                style={[styles.button, (loading || completed) && styles.buttonDisabled]}
                onPress={handleSetupDemoData}
                disabled={loading || completed}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <>
                    <IconSymbol 
                      ios_icon_name="wand.and.stars" 
                      android_material_icon_name="auto-fix-high" 
                      size={20} 
                      color={colors.background} 
                    />
                    <Text style={styles.buttonText}>
                      {completed ? 'Données ajoutées ✓' : 'Ajouter des données de démo'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Option 2 : Ajouter manuellement</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Panneau d&apos;administration</Text>
              <Text style={styles.cardDescription}>
                Accédez au tableau de bord admin pour ajouter vos propres actualités, événements, et gérer le contenu.
              </Text>
              <View style={styles.infoList}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoText}>Actualités : Partagez les dernières nouvelles du parti</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoText}>Événements : Annoncez les assemblées et campagnes</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoText}>Direction : Gérez les membres de la direction</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoText}>Programme : Détaillez votre programme politique</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoText}>Membres : Gérez les adhésions au parti</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.button}
                onPress={handleGoToAdmin}
                activeOpacity={0.8}
              >
                <IconSymbol 
                  ios_icon_name="lock.shield" 
                  android_material_icon_name="admin-panel-settings" 
                  size={20} 
                  color={colors.background} 
                />
                <Text style={styles.buttonText}>Aller au tableau de bord</Text>
              </TouchableOpacity>
            </View>
          </View>

          {completed && (
            <View style={styles.section}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Voir le résultat</Text>
                <Text style={styles.cardDescription}>
                  Retournez à l&apos;écran d&apos;accueil pour voir les données de démonstration affichées dans l&apos;application.
                </Text>
                <TouchableOpacity 
                  style={styles.button}
                  onPress={handleGoHome}
                  activeOpacity={0.8}
                >
                  <IconSymbol 
                    ios_icon_name="house.fill" 
                    android_material_icon_name="home" 
                    size={20} 
                    color={colors.background} 
                  />
                  <Text style={styles.buttonText}>Retour à l&apos;accueil</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        <Modal
          visible={modalVisible}
          title={modalTitle}
          message={modalMessage}
          type={modalType}
          onClose={() => setModalVisible(false)}
        />
      </View>
    </>
  );
}
