import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';

const PRIMARY = '#2d6a4f';
const PRIMARY_DARK = '#1b4332';
const PRIMARY_LIGHT = '#b7e4c7';
const BG = '#f0f4f0';
const WHITE = '#ffffff';
const TEXT_DARK = '#1a1a1a';

const cards = [
  { title: '📰 Actualités', subtitle: 'Dernières nouvelles', route: '/program' },
  { title: '👥 Membres', subtitle: 'Notre communauté', route: '/members-list' },
  { title: '📋 Programme', subtitle: 'Nos engagements', route: '/program' },
  { title: '🏛️ Idéologie', subtitle: 'Nos valeurs', route: '/ideology' },
  { title: '📞 Contact', subtitle: 'Nous joindre', route: '/contact' },
  { title: '💚 Don', subtitle: 'Soutenir ARM', route: '/donation' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ARM</Text>
          </View>
          <Text style={styles.heroTitle}>Alliance ARM</Text>
          <Text style={styles.heroSubtitle}>
            Alliance pour le Renouveau et la Modernité
          </Text>
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => {
              console.log('Button pressed: Adhérer maintenant');
              router.push('/member/register' as any);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.joinBtnText}>Adhérer maintenant</Text>
          </TouchableOpacity>
        </View>

        {/* Cards grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explorer</Text>
        </View>
        <View style={styles.grid}>
          {cards.map((card) => {
            const cardEmoji = card.title.split(' ')[0];
            const cardLabel = card.title.split(' ').slice(1).join(' ');
            return (
              <TouchableOpacity
                key={card.title}
                style={styles.card}
                onPress={() => {
                  console.log(`Card pressed: ${card.title}, navigating to ${card.route}`);
                  router.push(card.route as any);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cardEmoji}>{cardEmoji}</Text>
                <Text style={styles.cardTitle}>{cardLabel}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Admin button */}
        <TouchableOpacity
          style={styles.adminBtn}
          onPress={() => {
            console.log('Button pressed: Espace Admin');
            router.push('/admin' as any);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.adminBtnText}>🔐 Espace Admin</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PRIMARY,
  },
  scroll: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingBottom: 48,
  },
  hero: {
    backgroundColor: PRIMARY,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: PRIMARY,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: PRIMARY_LIGHT,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  joinBtn: {
    backgroundColor: WHITE,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  joinBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: PRIMARY,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 100,
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  adminBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: PRIMARY_DARK,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  adminBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: WHITE,
  },
});
