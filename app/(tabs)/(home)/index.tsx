
import React, { useState, useEffect, useCallback } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  Dimensions,
  Platform,
  ImageSourcePropType,
  RefreshControl,
  ActivityIndicator,
  Animated
} from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';
import { apiGet } from "@/utils/api";

// Helper to resolve image sources
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  publishedAt: string;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
}

interface LeadershipMember {
  id: string;
  name: string;
  position: string;
  phone?: string;
  location?: string;
}

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [leadership, setLeadership] = useState<LeadershipMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const fabScale = useState(new Animated.Value(1))[0];

  const loadAllData = useCallback(async () => {
    console.log('[HomeScreen] Loading all data (PUBLIC - no authentication required)');
    setError(null);
    
    try {
      // Load all data in parallel with individual error handling
      const results = await Promise.allSettled([
        apiGet<NewsItem[]>('/api/news'),
        apiGet<EventItem[]>('/api/events'),
        apiGet<LeadershipMember[]>('/api/leadership'),
      ]);

      // Handle news
      if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) {
        setNews(results[0].value);
      } else {
        console.error('[HomeScreen] Failed to load news:', results[0]);
      }

      // Handle events
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
        setEvents(results[1].value);
      } else {
        console.error('[HomeScreen] Failed to load events:', results[1]);
      }

      // Handle leadership
      if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
        setLeadership(results[2].value);
      } else {
        console.error('[HomeScreen] Failed to load leadership:', results[2]);
      }

      // Check if all failed
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) {
        setError('Impossible de charger les données. Vérifiez votre connexion.');
      }
    } catch (error: any) {
      console.error('[HomeScreen] Error loading data:', error);
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [fadeAnim]);

  useEffect(() => {
    console.log('[HomeScreen] Component mounted, loading data');
    loadAllData();
  }, [loadAllData]);

  const onRefresh = useCallback(async () => {
    console.log('User pulled to refresh');
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    
    // Haptic feedback on refresh complete
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [loadAllData]);

  const handleDonation = (amount: number) => {
    console.log('User tapped donation button:', amount, 'EUR');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/donation');
  };

  const handleJoinParty = () => {
    console.log('User tapped Join Party button (PUBLIC - no login required)');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/member/register');
  };

  const handleMemberCard = () => {
    console.log('User tapped Member Card button (PUBLIC - no login required)');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/member/card');
  };

  const handleContact = () => {
    console.log('User tapped Contact button');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/contact');
  };

  const handleChat = () => {
    console.log('User tapped Public Chat button');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/chat/public');
  };

  const handleIdeology = () => {
    console.log('User tapped Ideology button');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/ideology');
  };

  const handleAIChat = () => {
    console.log('User tapped AI Assistant button');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    // Animate button press
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    router.push('/ai-chat');
  };

  const handleSettings = () => {
    console.log('User tapped Settings button');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/settings');
  };

  const handleAdminAccess = () => {
    console.log('User tapped Admin Access button');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
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
          {/* Error message */}
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

          {/* Header avec logo */}
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
          </View>

          {/* Idéologie du parti */}
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

          {/* Programme politique */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol 
                ios_icon_name="doc.text.fill" 
                android_material_icon_name="description" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.sectionTitle}>Notre Programme</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.programText}>
                L&apos;A.R.M s&apos;engage pour le développement du Mali à travers des programmes concrets dans tous les secteurs : éducation, santé, économie, agriculture, et infrastructure.
              </Text>
              <TouchableOpacity style={styles.linkButton} activeOpacity={0.7}>
                <Text style={styles.linkButtonText}>Voir le programme complet</Text>
                <IconSymbol 
                  ios_icon_name="chevron.right" 
                  android_material_icon_name="chevron-right" 
                  size={20} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Contributions */}
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
                onPress={() => handleDonation(0)}
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

          {/* Actualités */}
          {news.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol 
                  ios_icon_name="newspaper.fill" 
                  android_material_icon_name="article" 
                  size={24} 
                  color={colors.primary} 
                />
                <Text style={styles.sectionTitle}>Actualités</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {news.slice(0, 5).map((item) => (
                  <TouchableOpacity key={item.id} style={styles.newsCard} activeOpacity={0.9}>
                    {item.imageUrl && (
                      <Image 
                        source={resolveImageSource(item.imageUrl)}
                        style={styles.newsImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.newsContent}>
                      <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.newsExcerpt} numberOfLines={3}>{item.content}</Text>
                      <Text style={styles.newsDate}>
                        {new Date(item.publishedAt).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Événements */}
          {events.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol 
                  ios_icon_name="calendar.badge.clock" 
                  android_material_icon_name="event" 
                  size={24} 
                  color={colors.primary} 
                />
                <Text style={styles.sectionTitle}>Événements à venir</Text>
              </View>
              {events.slice(0, 3).map((item) => (
                <TouchableOpacity key={item.id} style={styles.eventCard} activeOpacity={0.9}>
                  <View style={styles.eventDate}>
                    <Text style={styles.eventDay}>
                      {new Date(item.date).getDate()}
                    </Text>
                    <Text style={styles.eventMonth}>
                      {new Date(item.date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <Text style={styles.eventDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <View style={styles.eventLocation}>
                      <IconSymbol 
                        ios_icon_name="location.fill" 
                        android_material_icon_name="place" 
                        size={14} 
                        color={colors.textSecondary} 
                      />
                      <Text style={styles.eventLocationText}>{item.location}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Actions rapides */}
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
                onPress={handleSettings}
                activeOpacity={0.8}
              >
                <IconSymbol 
                  ios_icon_name="gear" 
                  android_material_icon_name="settings" 
                  size={32} 
                  color={colors.primary} 
                />
                <Text style={styles.actionTitle}>Paramètres</Text>
                <Text style={styles.actionSubtitle}>Langue & Devise</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard} 
                onPress={handleContact}
                activeOpacity={0.8}
              >
                <IconSymbol 
                  ios_icon_name="envelope.fill" 
                  android_material_icon_name="email" 
                  size={32} 
                  color={colors.primary} 
                />
                <Text style={styles.actionTitle}>Contact</Text>
                <Text style={styles.actionSubtitle}>Écrivez-nous</Text>
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
            </View>
          </View>

          {/* Direction du parti */}
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
                  <LeaderCard 
                    name="Lassine Diakité"
                    position="Président"
                    location="Yuncos, Toledo, Espagne"
                    phone="0034632607101"
                  />
                  <LeaderCard 
                    name="Dadou Sangare"
                    position="Premier Vice-Président"
                    location="Milan, Italie"
                  />
                  <LeaderCard 
                    name="Oumar Keita"
                    position="Deuxième Vice-Président"
                    location="Koutiala, Mali"
                    phone="0022376304869"
                  />
                  <LeaderCard 
                    name="Karifa Keita"
                    position="Secrétaire Général"
                    location="Bamako, Mali"
                  />
                  <LeaderCard 
                    name="Modibo Keita"
                    position="Secrétaire Administratif"
                    location="Bamako Sebenikoro, Mali"
                  />
                  <LeaderCard 
                    name="Sokona Keita"
                    position="Trésorière"
                    location="Bamako Sebenikoro, Mali"
                    phone="0022375179920"
                  />
                </>
              )}
            </View>
          </View>

          {/* Siège du parti */}
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

      {/* Floating AI Button */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleAIChat}
          activeOpacity={0.9}
        >
          <View style={styles.fabGradient}>
            <IconSymbol 
              ios_icon_name="sparkles" 
              android_material_icon_name="auto-awesome" 
              size={28} 
              color="#FFFFFF" 
            />
            <Text style={styles.fabText}>IA</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
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
    paddingTop: Platform.OS === 'android' ? 48 : 0,
    paddingBottom: 100,
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
  programText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  linkButtonText: {
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
  bottomSpacer: {
    height: 20,
  },
  newsCard: {
    width: width * 0.75,
    backgroundColor: colors.card,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  newsImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.border,
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  newsExcerpt: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  newsDate: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  eventDate: {
    width: 60,
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.background,
  },
  eventMonth: {
    fontSize: 12,
    color: colors.background,
    textTransform: 'uppercase',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocationText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  fab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  fabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
});
