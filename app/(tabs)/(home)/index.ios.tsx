
import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  RefreshControl,
  ActivityIndicator,
  Animated
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { apiGet } from "@/utils/api";
import { colors } from "@/styles/commonStyles";
import * as Haptics from 'expo-haptics';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

interface MemberStats {
  totalMembers: number;
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  imageUrl?: string;
  createdAt: string;
}

interface LeadershipMember {
  id: string;
  name: string;
  position: string;
  phone?: string;
  location?: string;
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

function formatDateFr(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [leadership, setLeadership] = useState<LeadershipMember[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const loadAllData = useCallback(async () => {
    console.log('[HomeScreen iOS] Chargement de toutes les données');
    setError(null);

    try {
      const [notifResult, leaderResult, statsResult] = await Promise.allSettled([
        fetch(`${BACKEND_URL}/api/notifications`).then(async (res) => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Notifications: ${res.status} ${text}`);
          }
          return res.json();
        }),
        apiGet<LeadershipMember[]>('/api/leadership'),
        fetch(`${BACKEND_URL}/api/members/stats`).then(async (res) => {
          if (!res.ok) throw new Error(`Stats: ${res.status}`);
          return res.json();
        }),
      ]);

      if (notifResult.status === 'fulfilled' && Array.isArray(notifResult.value)) {
        console.log('[HomeScreen iOS] Notifications chargées:', notifResult.value.length, 'éléments');
        setNotifications(notifResult.value);
      } else {
        console.warn('[HomeScreen iOS] Échec du chargement des notifications:', notifResult);
      }

      if (leaderResult.status === 'fulfilled' && Array.isArray(leaderResult.value)) {
        console.log('[HomeScreen iOS] Direction chargée:', leaderResult.value.length, 'éléments');
        setLeadership(leaderResult.value);
      } else {
        console.warn('[HomeScreen iOS] Échec du chargement de la direction:', leaderResult);
      }

      if (statsResult.status === 'fulfilled') {
        console.log('[HomeScreen iOS] Stats membres chargées:', statsResult.value);
        setMemberStats(statsResult.value);
      }

      const allFailed = notifResult.status === 'rejected' && leaderResult.status === 'rejected';
      if (allFailed) {
        setError('Impossible de charger les données. Affichage du contenu par défaut.');
      }
    } catch (err: any) {
      console.error('[HomeScreen iOS] Erreur lors du chargement:', err);
      setError('Une erreur est survenue. Affichage du contenu par défaut.');
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [fadeAnim]);

  useEffect(() => {
    console.log('[HomeScreen iOS] Composant monté, chargement des données');

    const loadingTimeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn('[HomeScreen iOS] Délai de chargement dépassé');
          setError('Chargement lent. Affichage du contenu par défaut.');
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
          return false;
        }
        return prev;
      });
    }, 3000);

    loadAllData();

    return () => clearTimeout(loadingTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAllData]);

  const onRefresh = useCallback(async () => {
    console.log('[HomeScreen iOS] Actualisation par glissement');
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [loadAllData]);

  const handleDonation = () => {
    console.log('[HomeScreen iOS] Bouton Don appuyé');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/donation');
  };

  const handleJoinParty = () => {
    console.log('[HomeScreen iOS] Bouton Adhérer appuyé');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/member/register');
  };

  const handleMemberCard = () => {
    console.log('[HomeScreen iOS] Bouton Carte de Membre appuyé');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/member/card');
  };

  const handleChat = () => {
    console.log('[HomeScreen iOS] Bouton Chat Public appuyé');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/chat/public');
  };

  const handleIdeology = () => {
    console.log('[HomeScreen iOS] Bouton Idéologie appuyé');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/ideology');
  };

  const handleAdminAccess = () => {
    console.log('[HomeScreen iOS] Bouton Accès Admin appuyé');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/admin/login');
  };

  const handleAIAssistant = () => {
    console.log('[HomeScreen iOS] Bouton Assistant IA appuyé');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/ai-assistant');
  };

  const handleProgram = () => {
    console.log('[HomeScreen iOS] Bouton Notre Programme appuyé');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/program');
  };

  const handleMembersList = () => {
    console.log('[HomeScreen iOS] Bouton Liste des adhérents appuyé');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/members-list');
  };

  const handleVoirToutNotifications = () => {
    console.log('[HomeScreen iOS] Bouton Voir tout (notifications) appuyé');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/notifications');
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Image
            source={require('@/assets/images/48b93c14-0824-4757-b7a4-95824e04a9a8.jpeg')}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Chargement de A.R.M...</Text>
        </View>
      </>
    );
  }

  const displayedNotifications = notifications.slice(0, 5);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {error && (
              <View style={styles.errorContainer}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="warning"
                  size={24}
                  color={colors.warning}
                />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={loadAllData} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.header}>
              <Image
                source={require('@/assets/images/48b93c14-0824-4757-b7a4-95824e04a9a8.jpeg')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.partyName}>A.R.M</Text>
              <Text style={styles.partyFullName}>Alliance pour le Rassemblement Malien</Text>
              <View style={styles.mottoContainer}>
                <View style={styles.mottoLine} />
                <Text style={styles.motto}>Fraternité • Liberté • Égalité</Text>
                <View style={styles.mottoLine} />
              </View>
              {memberStats != null && (
                <View style={styles.statsBanner}>
                  <Text style={styles.statsBannerNumber}>{String(memberStats.totalMembers)}</Text>
                  <Text style={styles.statsBannerLabel}>membres inscrits</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="book.fill"
                  android_material_icon_name="menu-book"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.sectionTitle}>Notre Idéologie</Text>
              </View>
              <TouchableOpacity
                style={styles.ideologyCard}
                onPress={handleIdeology}
                activeOpacity={0.8}
              >
                <View style={styles.ideologyContent}>
                  <Text style={styles.ideologyTitle}>Une vision, une force, une mission</Text>
                  <Text style={styles.ideologyText}>
                    A.R.M est un mouvement politique enraciné dans les réalités du peuple malien, fondé sur la fraternité, la liberté et l&apos;égalité.
                  </Text>
                  <View style={styles.ideologyButton}>
                    <Text style={styles.ideologyButtonText}>Découvrir notre idéologie</Text>
                    <IconSymbol
                      ios_icon_name="arrow.right"
                      android_material_icon_name="arrow-forward"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="heart.fill"
                  android_material_icon_name="favorite"
                  size={24}
                  color={colors.accent}
                />
                <Text style={styles.sectionTitle}>Soutenez-nous</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.donationText}>Votre contribution régulière aide à construire un Mali meilleur</Text>
                <View style={styles.contributionInfo}>
                  <View style={styles.contributionOption}>
                    <IconSymbol
                      ios_icon_name="calendar"
                      android_material_icon_name="event"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.contributionOptionText}>Contribution mensuelle</Text>
                  </View>
                  <View style={styles.contributionOption}>
                    <IconSymbol
                      ios_icon_name="calendar.badge.clock"
                      android_material_icon_name="date-range"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.contributionOptionText}>Contribution annuelle</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.contributionButton}
                  onPress={handleDonation}
                  activeOpacity={0.8}
                >
                  <Text style={styles.contributionButtonText}>Faire une contribution</Text>
                  <IconSymbol
                    ios_icon_name="arrow.right"
                    android_material_icon_name="arrow-forward"
                    size={20}
                    color={colors.background}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeader}>
                  <IconSymbol
                    ios_icon_name="bell.fill"
                    android_material_icon_name="notifications"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.sectionTitle}>Actualités & Annonces</Text>
                </View>
                <TouchableOpacity onPress={handleVoirToutNotifications} activeOpacity={0.7}>
                  <Text style={styles.voirToutText}>Voir tout</Text>
                </TouchableOpacity>
              </View>

              {displayedNotifications.length === 0 ? (
                <View style={styles.emptyNotifications}>
                  <IconSymbol
                    ios_icon_name="bell.slash"
                    android_material_icon_name="notifications-off"
                    size={32}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyNotificationsText}>Aucune actualité pour le moment</Text>
                </View>
              ) : (
                displayedNotifications.map((item) => {
                  const catColor = CATEGORY_COLORS[item.category] || '#607D8B';
                  const catLabel = CATEGORY_LABELS[item.category] || item.category;
                  const dateStr = formatDateFr(item.createdAt);
                  return (
                    <View key={item.id} style={styles.notifCard}>
                      <View style={styles.notifHeader}>
                        <View style={[styles.categoryBadge, { backgroundColor: catColor }]}>
                          <Text style={styles.categoryBadgeText}>{catLabel}</Text>
                        </View>
                        <Text style={styles.notifDate}>{dateStr}</Text>
                      </View>
                      <Text style={styles.notifTitle}>{item.title}</Text>
                      <Text style={styles.notifContent} numberOfLines={2}>{item.content}</Text>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={handleJoinParty}
                  activeOpacity={0.8}
                >
                  <IconSymbol
                    ios_icon_name="person.badge.plus"
                    android_material_icon_name="person-add"
                    size={32}
                    color={colors.primary}
                  />
                  <Text style={styles.actionTitle}>Adhérer</Text>
                  <Text style={styles.actionSubtitle}>Sans mot de passe</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={handleMemberCard}
                  activeOpacity={0.8}
                >
                  <IconSymbol
                    ios_icon_name="person.text.rectangle"
                    android_material_icon_name="badge"
                    size={32}
                    color={colors.primary}
                  />
                  <Text style={styles.actionTitle}>Ma Carte</Text>
                  <Text style={styles.actionSubtitle}>Accès libre</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={handleChat}
                  activeOpacity={0.8}
                >
                  <IconSymbol
                    ios_icon_name="bubble.left.and.bubble.right.fill"
                    android_material_icon_name="chat"
                    size={32}
                    color={colors.primary}
                  />
                  <Text style={styles.actionTitle}>Chat Public</Text>
                  <Text style={styles.actionSubtitle}>Discutez</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={handleAdminAccess}
                  activeOpacity={0.8}
                >
                  <IconSymbol
                    ios_icon_name="lock.shield"
                    android_material_icon_name="admin-panel-settings"
                    size={32}
                    color={colors.accent}
                  />
                  <Text style={styles.actionTitle}>Admin</Text>
                  <Text style={styles.actionSubtitle}>Accès sécurisé</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, styles.actionCardAI]}
                  onPress={handleAIAssistant}
                  activeOpacity={0.8}
                >
                  <IconSymbol
                    ios_icon_name="brain"
                    android_material_icon_name="smart-toy"
                    size={32}
                    color="#1565C0"
                  />
                  <Text style={styles.actionTitle}>Assistant IA</Text>
                  <Text style={[styles.actionSubtitle, { color: '#1565C0' }]}>Posez vos questions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, styles.actionCardProgram]}
                  onPress={handleProgram}
                  activeOpacity={0.8}
                >
                  <IconSymbol
                    ios_icon_name="doc.text"
                    android_material_icon_name="description"
                    size={32}
                    color="#1B5E20"
                  />
                  <Text style={styles.actionTitle}>Notre Programme</Text>
                  <Text style={[styles.actionSubtitle, { color: '#1B5E20' }]}>Programme politique</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, styles.actionCardMembers]}
                  onPress={handleMembersList}
                  activeOpacity={0.8}
                >
                  <IconSymbol
                    ios_icon_name="person.3.fill"
                    android_material_icon_name="group"
                    size={32}
                    color="#0369A1"
                  />
                  <Text style={styles.actionTitle}>Adhérents</Text>
                  <Text style={[styles.actionSubtitle, { color: '#0369A1' }]}>Liste complète</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="person.3.fill"
                  android_material_icon_name="group"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.sectionTitle}>Direction du Parti</Text>
              </View>
              <View style={styles.card}>
                {leadership.length > 0 ? (
                  leadership.map((leader) => (
                    <LeaderCard
                      key={leader.id}
                      name={leader.name}
                      position={leader.position}
                      location={leader.location}
                      phone={leader.phone}
                    />
                  ))
                ) : (
                  <>
                    <LeaderCard name="Lassine Diakité" position="Président" location="Yuncos, Toledo, Espagne" phone="0034632607101" />
                    <LeaderCard name="Dadou Sangare" position="Premier Vice-Président" location="Milan, Italie" />
                    <LeaderCard name="Oumar Keita" position="Deuxième Vice-Président" location="Koutiala, Mali" phone="0022376304869" />
                    <LeaderCard name="Karifa Keita" position="Secrétaire Général" location="Bamako, Mali" />
                    <LeaderCard name="Modibo Keita" position="Secrétaire Administratif" location="Bamako Sebenikoro, Mali" />
                    <LeaderCard name="Sokona Keita" position="Trésorière" location="Bamako Sebenikoro, Mali" phone="0022375179920" />
                  </>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="building.2.fill"
                  android_material_icon_name="location-city"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.sectionTitle}>Siège du Parti</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.addressText}>Rue 530, Porte 245</Text>
                <Text style={styles.addressText}>Sebenikoro, Bamako</Text>
                <Text style={styles.addressText}>Mali</Text>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </Animated.View>
        </ScrollView>
      </View>
    </>
  );
}

function LeaderCard({ name, position, location, phone }: {
  name: string;
  position: string;
  location?: string;
  phone?: string;
}) {
  return (
    <View style={styles.leaderCard}>
      <View style={styles.leaderIcon}>
        <Image
          source={require('@/assets/images/48b93c14-0824-4757-b7a4-95824e04a9a8.jpeg')}
          style={styles.leaderAvatar}
          resizeMode="cover"
        />
      </View>
      <View style={styles.leaderInfo}>
        <Text style={styles.leaderName}>{name}</Text>
        <Text style={styles.leaderPosition}>{position}</Text>
        {location && <Text style={styles.leaderDetail}>{location}</Text>}
        {phone && <Text style={styles.leaderDetail}>{phone}</Text>}
      </View>
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
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingLogo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 60,
  },
  loadingSpinner: {
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    margin: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
    borderRadius: 60,
    backgroundColor: colors.background,
    borderWidth: 3,
    borderColor: colors.secondary,
  },
  partyName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.background,
    marginBottom: 4,
  },
  partyFullName: {
    fontSize: 16,
    color: colors.background,
    textAlign: 'center',
    marginBottom: 16,
  },
  mottoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  mottoLine: {
    width: 40,
    height: 1,
    backgroundColor: colors.secondary,
    marginHorizontal: 12,
  },
  motto: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  voirToutText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  ideologyCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  ideologyContent: {
    flex: 1,
  },
  ideologyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.background,
    marginBottom: 12,
  },
  ideologyText: {
    fontSize: 15,
    color: colors.background,
    lineHeight: 22,
    marginBottom: 16,
  },
  ideologyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  ideologyButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  donationText: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  contributionInfo: {
    marginBottom: 16,
  },
  contributionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contributionOptionText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 12,
  },
  contributionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  contributionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  notifCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
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
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  notifContent: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
  },
  emptyNotificationsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
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
  actionCardAI: {
    borderWidth: 1.5,
    borderColor: '#1565C020',
    backgroundColor: '#EEF4FF',
  },
  actionCardProgram: {
    borderWidth: 1.5,
    borderColor: '#1B5E2020',
    backgroundColor: '#F1F8F1',
  },
  actionCardMembers: {
    borderWidth: 1.5,
    borderColor: '#0369A120',
    backgroundColor: '#F0F9FF',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.success,
    marginTop: 2,
    fontWeight: '600',
  },
  leaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leaderIcon: {
    marginRight: 12,
  },
  leaderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  leaderPosition: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  leaderDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addressText: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    marginVertical: 2,
  },
  statsBanner: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statsBannerNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: -0.5,
  },
  statsBannerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 20,
  },
});
