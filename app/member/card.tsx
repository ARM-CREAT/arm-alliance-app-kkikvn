
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

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

export default function MemberCardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    loadMemberCard();
  }, []);

  const loadMemberCard = async () => {
    console.log('[MemberCard] Loading member card data');
    setLoading(true);

    try {
      const { authenticatedGet } = await import('@/utils/api');
      
      const response = await authenticatedGet('/api/members/me');
      
      console.log('[MemberCard] Member data loaded:', response);
      
      setMemberData(response);
    } catch (error: any) {
      console.error('[MemberCard] Error loading member card:', error);
      showModal('Erreur', error?.message || 'Impossible de charger votre carte de membre. Veuillez vous connecter ou vous inscrire.');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handlePayCotisation = () => {
    console.log('User tapped Pay Cotisation button');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/member/cotisation');
  };

  const handleViewMessages = () => {
    console.log('User tapped View Messages button');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/member/messages' as any);
  };

  const handleSubmitElectionResults = () => {
    console.log('User tapped Submit Election Results button');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/member/election-results' as any);
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      active: '#10B981',
      pending: '#F59E0B',
      suspended: '#EF4444',
    };
    return statusColors[status as keyof typeof statusColors] || colors.textSecondary;
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      active: 'Actif',
      pending: 'En attente',
      suspended: 'Suspendu',
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Carte de Membre',
            headerShown: true,
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!memberData) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen
          options={{
            title: 'Carte de Membre',
            headerShown: true,
          }}
        />
        <IconSymbol
          ios_icon_name="exclamationmark.triangle"
          android_material_icon_name="warning"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.errorText}>Aucune carte de membre trouvée</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.push('/member/register')}
        >
          <Text style={styles.retryButtonText}>S&apos;inscrire</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = getStatusColor(memberData.status);
  const statusText = getStatusText(memberData.status);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Carte de Membre',
          headerShown: true,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Digital Member Card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Image
                source={require('@/assets/images/48b93c14-0824-4757-b7a4-95824e04a9a8.jpeg')}
                style={styles.cardLogo}
                resizeMode="contain"
              />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>A.R.M</Text>
                <Text style={styles.cardSubtitle}>Carte de Membre</Text>
              </View>
            </View>

            {/* Member Info */}
            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nom</Text>
                <Text style={styles.infoValue}>{memberData.fullName}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>N° Membre</Text>
                <Text style={styles.infoValueBold}>{memberData.membershipNumber}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Commune</Text>
                <Text style={styles.infoValue}>{memberData.commune}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Profession</Text>
                <Text style={styles.infoValue}>{memberData.profession}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Statut</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusText}>{statusText}</Text>
                </View>
              </View>
            </View>

            {/* QR Code */}
            <View style={styles.qrCodeContainer}>
              <Image
                source={{ uri: memberData.qrCode }}
                style={styles.qrCode}
                resizeMode="contain"
              />
              <Text style={styles.qrCodeLabel}>Code QR de vérification</Text>
            </View>

            {/* Card Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>
                Membre depuis {new Date(memberData.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePayCotisation}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <IconSymbol
                ios_icon_name="creditcard.fill"
                android_material_icon_name="payment"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Payer ma Cotisation</Text>
              <Text style={styles.actionSubtitle}>Mensuelle ou annuelle</Text>
            </View>
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
            <View style={styles.actionIconContainer}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Messages Internes</Text>
              <Text style={styles.actionSubtitle}>Notifications du parti</Text>
            </View>
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
            <View style={styles.actionIconContainer}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Module Sentinelle</Text>
              <Text style={styles.actionSubtitle}>Soumettre résultats électoraux</Text>
            </View>
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
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  cardContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 20,
  },
  cardLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
  },
  cardHeaderText: {
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.background,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.background,
    marginTop: 2,
  },
  cardBody: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  infoValueBold: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  qrCodeContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.backgroundAlt,
  },
  qrCode: {
    width: 180,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
  },
  qrCodeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
  },
  cardFooter: {
    backgroundColor: colors.backgroundAlt,
    padding: 16,
    alignItems: 'center',
  },
  cardFooterText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
