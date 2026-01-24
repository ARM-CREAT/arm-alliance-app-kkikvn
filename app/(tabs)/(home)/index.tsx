
import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  Dimensions,
  Platform,
  ImageSourcePropType
} from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useRouter } from "expo-router";

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

  useEffect(() => {
    console.log('HomeScreen: Loading party data');
    loadNews();
    loadEvents();
    loadLeadership();
  }, []);

  const loadNews = async () => {
    console.log('Loading news articles');
    try {
      const { apiCall } = await import('@/utils/api');
      const { data, error } = await apiCall<NewsItem[]>('/api/news');
      
      if (error) {
        console.error('Failed to load news:', error);
        return;
      }
      
      if (data) {
        setNews(data);
        console.log('Loaded', data.length, 'news articles');
      }
    } catch (error) {
      console.error('Error loading news:', error);
    }
  };

  const loadEvents = async () => {
    console.log('Loading events');
    try {
      const { apiCall } = await import('@/utils/api');
      const { data, error } = await apiCall<EventItem[]>('/api/events');
      
      if (error) {
        console.error('Failed to load events:', error);
        return;
      }
      
      if (data) {
        setEvents(data);
        console.log('Loaded', data.length, 'events');
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadLeadership = async () => {
    console.log('Loading leadership members');
    try {
      const { apiCall } = await import('@/utils/api');
      const { data, error } = await apiCall<LeadershipMember[]>('/api/leadership');
      
      if (error) {
        console.error('Failed to load leadership:', error);
        return;
      }
      
      if (data) {
        setLeadership(data);
        console.log('Loaded', data.length, 'leadership members');
      }
    } catch (error) {
      console.error('Error loading leadership:', error);
    }
  };

  const handleDonation = (amount: number) => {
    console.log('User tapped donation button:', amount, 'EUR');
    router.push('/donation');
  };

  const handleJoinParty = () => {
    console.log('User tapped Join Party button');
    router.push('/(tabs)/profile');
  };

  const handleContact = () => {
    console.log('User tapped Contact button');
    router.push('/contact');
  };

  const handleChat = () => {
    console.log('User tapped Public Chat button');
    router.push('/chat/public');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header avec logo */}
      <View style={styles.header}>
        <Image 
          source={resolveImageSource('https://prod-finalquest-user-projects-storage-bucket-aws.s3.amazonaws.com/user-projects/74f29b97-c31f-462c-8ec5-6f7655e33c4b/assets/images/2889d5a4-a959-4c51-8000-e693ffffc1fd.jpeg?AWSAccessKeyId=AKIAVRUVRKQJC5DISQ4Q&Signature=u9g3MpsH%2BQuiumXms90t3jriaWA%3D&Expires=1769359070')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.partyName}>A.R.M</Text>
        <Text style={styles.partyFullName}>Alliance pour le Rassemblement Malien</Text>
        <Text style={styles.motto}>Fraternité • Liberté • Égalité</Text>
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
          <TouchableOpacity style={styles.linkButton}>
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

      {/* Dons */}
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
          <Text style={styles.donationText}>Votre contribution aide à construire un Mali meilleur</Text>
          <View style={styles.donationButtons}>
            <TouchableOpacity 
              style={styles.donationButton}
              onPress={() => handleDonation(5)}
            >
              <Text style={styles.donationAmount}>5€</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.donationButton}
              onPress={() => handleDonation(10)}
            >
              <Text style={styles.donationAmount}>10€</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.donationButton}
              onPress={() => handleDonation(20)}
            >
              <Text style={styles.donationAmount}>20€</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.customDonationButton}>
            <Text style={styles.customDonationText}>Montant personnalisé</Text>
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
              <View key={item.id} style={styles.newsCard}>
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
              </View>
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
            <View key={item.id} style={styles.eventCard}>
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
            </View>
          ))}
        </View>
      )}

      {/* Actions rapides */}
      <View style={styles.section}>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={handleJoinParty}>
            <IconSymbol 
              ios_icon_name="person.badge.plus" 
              android_material_icon_name="person-add" 
              size={32} 
              color={colors.primary} 
            />
            <Text style={styles.actionTitle}>Adhérer</Text>
            <Text style={styles.actionSubtitle}>Rejoignez-nous</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleContact}>
            <IconSymbol 
              ios_icon_name="envelope.fill" 
              android_material_icon_name="email" 
              size={32} 
              color={colors.primary} 
            />
            <Text style={styles.actionTitle}>Contact</Text>
            <Text style={styles.actionSubtitle}>Écrivez-nous</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleChat}>
            <IconSymbol 
              ios_icon_name="bubble.left.and.bubble.right.fill" 
              android_material_icon_name="chat" 
              size={32} 
              color={colors.primary} 
            />
            <Text style={styles.actionTitle}>Chat Public</Text>
            <Text style={styles.actionSubtitle}>Discutez</Text>
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
    </ScrollView>
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
        <IconSymbol 
          ios_icon_name="person.circle.fill" 
          android_material_icon_name="account-circle" 
          size={40} 
          color={colors.primary} 
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
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 48 : 0,
    paddingBottom: 100,
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
    marginBottom: 8,
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
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  donationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  donationButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  donationAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.background,
  },
  customDonationButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  customDonationText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventDate: {
    width: 60,
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: 8,
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
});
