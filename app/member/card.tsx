
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet } from '@/utils/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

interface MemberData {
  id: string;
  fullName: string;
  membershipNumber: string;
  commune: string;
  profession: string;
  status: 'pending' | 'active' | 'suspended';
  role: string;
  qrCode: string;
  createdAt: string;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = (CARD_WIDTH * 638) / 1013; // Aspect ratio from the image

export default function MemberCardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const loadMemberCard = useCallback(async () => {
    console.log('[MemberCard] Loading member card data');
    setLoading(true);

    try {
      if (user) {
        const response = await authenticatedGet<MemberData>('/api/members/me');
        
        if (response) {
          setMemberData(response);
          console.log('[MemberCard] Member data loaded:', response);
        } else {
          showModal(
            'Aucune Carte',
            'Vous n\'avez pas encore de carte de membre. Veuillez vous inscrire d\'abord.'
          );
        }
      } else {
        showModal(
          'Inscription Requise',
          'Veuillez vous inscrire pour obtenir votre carte de membre.'
        );
      }
    } catch (error: any) {
      console.error('[MemberCard] Error loading member card:', error);
      showModal(
        'Erreur',
        'Impossible de charger votre carte de membre. Veuillez vous inscrire si vous n\'êtes pas encore membre.'
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMemberCard();
  }, [loadMemberCard]);

  const handleDownloadCard = async () => {
    console.log('[MemberCard] User tapped Download Card');
    
    if (!memberData) {
      showModal('Erreur', 'Aucune carte à télécharger');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setDownloading(true);

    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        showModal(
          'Permission Requise',
          'Veuillez autoriser l\'accès à la galerie pour télécharger votre carte.'
        );
        setDownloading(false);
        return;
      }

      // For now, we'll share the card image URL
      // In a production app, you would generate a custom card image with the member's data
      const cardImageUrl = require('@/assets/images/0be5c379-285b-4791-9ed0-c19c441eb117.png');
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share the card
        await Sharing.shareAsync(cardImageUrl, {
          mimeType: 'image/png',
          dialogTitle: 'Télécharger votre carte de membre',
        });
        
        showModal(
          'Succès',
          'Votre carte de membre a été partagée avec succès!'
        );
      } else {
        showModal(
          'Non Disponible',
          'Le partage n\'est pas disponible sur cet appareil.'
        );
      }
    } catch (error: any) {
      console.error('[MemberCard] Error downloading card:', error);
      showModal(
        'Erreur',
        'Impossible de télécharger la carte. Veuillez réessayer.'
      );
    } finally {
      setDownloading(false);
    }
  };

  const handlePayCotisation = () => {
    console.log('[MemberCard] User tapped Pay Cotisation');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/member/cotisation');
  };

  const handleViewMessages = () => {
    console.log('[MemberCard] User tapped View Messages');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/member/messages');
  };

  const handleSubmitElectionResults = () => {
    console.log('[MemberCard] User tapped Submit Election Results');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/member/election-results');
  };

  const getStatusColor = (status: string) => {
    const statusColorMap: Record<string, string> = {
      pending: colors.warning,
      active: colors.success,
      suspended: colors.error,
    };
    return statusColorMap[status] || colors.textSecondary;
  };

  const getStatusText = (status: string) => {
    const statusTextMap: Record<string, string> = {
      pending: 'En attente',
      active: 'Actif',
      suspended: 'Suspendu',
    };
    return statusTextMap[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de votre carte...</Text>
      </View>
    );
  }

  if (!memberData) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Carte de Membre',
            headerShown: true,
            headerBackTitle: 'Retour',
          }}
        />

        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="person.crop.circle.badge.xmark"
            android_material_icon_name="badge"
            size={80}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyStateTitle}>Aucune Carte de Membre</Text>
          <Text style={styles.emptyStateText}>
            Vous devez d&apos;abord vous inscrire pour obtenir votre carte de membre.
          </Text>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/member/register')}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="person.badge.plus"
              android_material_icon_name="person-add"
              size={20}
              color={colors.background}
            />
            <Text style={styles.registerButtonText}>S&apos;inscrire Maintenant</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={modalVisible}
          title={modalTitle}
          message={modalMessage}
          type="info"
          onClose={() => {
            setModalVisible(false);
            router.back();
          }}
        />
      </View>
    );
  }

  const statusColor = getStatusColor(memberData.status);
  const statusText = getStatusText(memberData.status);
  const formattedDate = formatDate(memberData.createdAt);

  // Split full name into first name and last name
  const nameParts = memberData.fullName.split(' ');
  const lastName = nameParts[0] || '';
  const firstName = nameParts.slice(1).join(' ') || '';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Ma Carte de Membre',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Member Card with Background Image */}
        <View style={styles.cardContainer}>
          <View style={styles.memberCard}>
            <Image
              source={require('@/assets/images/0be5c379-285b-4791-9ed0-c19c441eb117.png')}
              style={styles.cardBackground}
              resizeMode="cover"
            />
            
            {/* Overlay with member data */}
            <View style={styles.cardOverlay}>
              {/* Name fields */}
              <View style={styles.nameContainer}>
                <Text style={styles.cardDataText}>{lastName}</Text>
              </View>
              
              <View style={styles.firstNameContainer}>
                <Text style={styles.cardDataText}>{firstName}</Text>
              </View>
              
              {/* Membership number */}
              <View style={styles.membershipNumberContainer}>
                <Text style={styles.cardDataText}>{memberData.membershipNumber}</Text>
              </View>
              
              {/* Date */}
              <View style={styles.dateContainer}>
                <Text style={styles.cardDataText}>{formattedDate}</Text>
              </View>
            </View>
          </View>

          {/* Download Button */}
          <TouchableOpacity
            style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
            onPress={handleDownloadCard}
            disabled={downloading}
            activeOpacity={0.8}
          >
            {downloading ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="arrow.down.circle.fill"
                  android_material_icon_name="download"
                  size={24}
                  color={colors.background}
                />
                <Text style={styles.downloadButtonText}>Télécharger ma carte</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>Statut: {statusText}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePayCotisation}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="creditcard.fill"
              android_material_icon_name="payment"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.actionButtonText}>Payer ma Cotisation</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewMessages}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="envelope.fill"
              android_material_icon_name="email"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.actionButtonText}>Mes Messages</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSubmitElectionResults}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="checkmark.seal.fill"
              android_material_icon_name="how-to-vote"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.actionButtonText}>Vérification Électorale</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type="info"
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
    marginLeft: 8,
  },
  cardContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  memberCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  cardBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardOverlay: {
    flex: 1,
    padding: 20,
  },
  nameContainer: {
    position: 'absolute',
    left: 180,
    top: 290,
    width: 200,
  },
  firstNameContainer: {
    position: 'absolute',
    left: 180,
    top: 330,
    width: 200,
  },
  membershipNumberContainer: {
    position: 'absolute',
    left: 180,
    top: 370,
    width: 200,
  },
  dateContainer: {
    position: 'absolute',
    left: 180,
    top: 410,
    width: 200,
  },
  cardDataText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textTransform: 'uppercase',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  downloadButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.background,
    marginLeft: 12,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    color: colors.background,
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  actionButton: {
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
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginLeft: 12,
  },
});
