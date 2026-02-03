
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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet } from '@/utils/api';

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

export default function MemberCardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
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
      // If user is authenticated, use their profile
      if (user) {
        const response = await authenticatedGet<{ member?: MemberData }>('/api/members/me');
        
        if (response.member) {
          setMemberData(response.member);
          console.log('[MemberCard] Member data loaded:', response.member);
        } else {
          showModal(
            'Aucune Carte',
            'Vous n\'avez pas encore de carte de membre. Veuillez vous inscrire d\'abord.'
          );
        }
      } else {
        // For non-authenticated users, show registration prompt
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
        {/* Member Card */}
        <View style={styles.cardContainer}>
          <View style={[styles.memberCard, { borderTopColor: statusColor }]}>
            <View style={styles.cardHeader}>
              <Image
                source={require('@/assets/images/48b93c14-0824-4757-b7a4-95824e04a9a8.jpeg')}
                style={styles.cardLogo}
                resizeMode="contain"
              />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardPartyName}>A.R.M</Text>
                <Text style={styles.cardPartySubtitle}>Alliance pour le Rassemblement Malien</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardField}>
                <Text style={styles.cardLabel}>Nom</Text>
                <Text style={styles.cardValue}>{memberData.fullName}</Text>
              </View>

              <View style={styles.cardField}>
                <Text style={styles.cardLabel}>Numéro de Membre</Text>
                <Text style={styles.cardValueHighlight}>{memberData.membershipNumber}</Text>
              </View>

              <View style={styles.cardRow}>
                <View style={[styles.cardField, { flex: 1 }]}>
                  <Text style={styles.cardLabel}>Commune</Text>
                  <Text style={styles.cardValue}>{memberData.commune}</Text>
                </View>

                <View style={[styles.cardField, { flex: 1 }]}>
                  <Text style={styles.cardLabel}>Profession</Text>
                  <Text style={styles.cardValue}>{memberData.profession}</Text>
                </View>
              </View>

              <View style={styles.cardField}>
                <Text style={styles.cardLabel}>Statut</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusText}>{statusText}</Text>
                </View>
              </View>

              {memberData.qrCode && (
                <View style={styles.qrCodeContainer}>
                  <Image
                    source={{ uri: memberData.qrCode }}
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                  <Text style={styles.qrCodeLabel}>Code QR de Membre</Text>
                </View>
              )}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>
                Membre depuis {new Date(memberData.createdAt).toLocaleDateString('fr-FR')}
              </Text>
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
            <Text style={styles.actionButtonText}>Soumettre Résultats Électoraux</Text>
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
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderTopWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 20,
  },
  cardLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 16,
  },
  cardPartyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.background,
  },
  cardPartySubtitle: {
    fontSize: 12,
    color: colors.background,
    marginTop: 2,
  },
  cardBody: {
    padding: 20,
  },
  cardField: {
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  cardValueHighlight: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    color: colors.background,
    fontWeight: '600',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  qrCode: {
    width: width * 0.5,
    height: width * 0.5,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  qrCodeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
  },
  cardFooter: {
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    alignItems: 'center',
  },
  cardFooterText: {
    fontSize: 12,
    color: colors.textSecondary,
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
