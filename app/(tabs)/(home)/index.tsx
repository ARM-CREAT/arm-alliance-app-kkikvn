import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRealtimeApi } from '@/hooks/useRealtimeApi';

// ─── Constants ────────────────────────────────────────────────────────────────
const ARM_GREEN = '#1B7A3E';
const ARM_GREEN_DARK = '#0D5C2E';
const ARM_YELLOW = '#F5C518';
const ARM_BLACK = '#0D0D0D';
const ARM_WHITE = '#FFFFFF';
const ARM_RED = '#DC2626';
const ARM_BLUE = '#2563EB';
const GREY = '#9CA3AF';
const BG = '#F7FAF8';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;

// ─── Image helper ─────────────────────────────────────────────────────────────
function resolveImageSource(
  source: string | number | ImageSourcePropType | undefined
): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const logoSource = require('@/assets/images/15eeca6b-b1c8-4619-80b4-a98acd035b28.jpeg');

// ─── Types ────────────────────────────────────────────────────────────────────
interface NewsItem {
  id: string | number;
  title: string;
  created_at?: string;
  date?: string;
  category?: string;
}

interface EventItem {
  id: string | number;
  title: string;
  date?: string;
  start_date?: string;
  location?: string;
  lieu?: string;
}

interface PollItem {
  id: string | number;
  question?: string;
  title?: string;
  total_votes?: number;
  options?: { text?: string; label?: string; votes?: number; count?: number }[];
}

interface NewsResponse {
  news?: NewsItem[];
  data?: NewsItem[];
  items?: NewsItem[];
}

interface EventsResponse {
  events?: EventItem[];
  data?: EventItem[];
  items?: EventItem[];
}

interface PollsResponse {
  polls?: PollItem[];
  data?: PollItem[];
  items?: PollItem[];
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  title,
  linkLabel,
  onLink,
}: {
  title: string;
  linkLabel?: string;
  onLink?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {linkLabel && onLink ? (
        <TouchableOpacity onPress={onLink} activeOpacity={0.7}>
          <Text style={styles.sectionLink}>{linkLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── Quick action card ────────────────────────────────────────────────────────
function QuickCard({
  icon,
  label,
  borderColor,
  onPress,
}: {
  icon: string;
  label: string;
  borderColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickCard, { borderLeftColor: borderColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.quickCardIcon}>{icon}</Text>
      <Text style={styles.quickCardLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── More grid item ───────────────────────────────────────────────────────────
function MoreItem({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.moreItem} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.moreItemIcon}>{icon}</Text>
      <Text style={styles.moreItemLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();

  function nav(route: string) {
    console.log('[HomeScreen] Navigating to:', route);
    router.push(route as never);
  }

  // ── API calls ──
  const {
    data: newsRaw,
    loading: newsLoading,
    error: newsError,
  } = useRealtimeApi<NewsResponse | NewsItem[]>('/api/news?limit=3', { intervalSeconds: 30 });

  const {
    data: eventsRaw,
    loading: eventsLoading,
    error: eventsError,
  } = useRealtimeApi<EventsResponse | EventItem[]>('/api/events?limit=2&upcoming=true', {
    intervalSeconds: 60,
  });

  const {
    data: pollsRaw,
    loading: pollsLoading,
    error: pollsError,
  } = useRealtimeApi<PollsResponse | PollItem[]>('/api/polls', {
    intervalSeconds: 15,
  });

  // ── Normalise API responses ──
  function extractArray<T>(raw: any, keys: string[]): T[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as T[];
    for (const k of keys) {
      if (Array.isArray(raw[k])) return raw[k] as T[];
    }
    return [];
  }

  const newsList = extractArray<NewsItem>(newsRaw, ['news', 'data', 'items']);
  const eventsList = extractArray<EventItem>(eventsRaw, ['events', 'data', 'items']);
  const pollsList = extractArray<PollItem>(pollsRaw, ['polls', 'data', 'items']);
  const activePoll = pollsList.length > 0 ? pollsList[0] : null;

  // ── Poll progress ──
  const pollTitle = activePoll ? (activePoll.question || activePoll.title || '') : '';
  const pollOptions = activePoll?.options || [];
  const pollTotal = activePoll?.total_votes || pollOptions.reduce((s, o) => s + (o.votes || o.count || 0), 0) || 0;

  // ── News date formatter ──
  function formatDate(raw?: string): string {
    if (!raw) return '';
    try {
      return new Date(raw).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return raw;
    }
  }

  // ── Event date badge ──
  function eventDateBadge(item: EventItem): string {
    const d = item.start_date || item.date || '';
    if (!d) return '—';
    try {
      const dt = new Date(d);
      const day = dt.getDate().toString().padStart(2, '0');
      const month = dt.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
      return `${day}\n${month}`;
    } catch {
      return d;
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Image
              source={resolveImageSource(logoSource)}
              style={styles.heroLogo}
              resizeMode="cover"
            />
            <Text style={styles.heroTitle}>A.R.M</Text>
            <Text style={styles.heroSubtitle}>Fraternité · Liberté · Égalité</Text>
          </View>
          <View style={styles.heroBanner}>
            <Text style={styles.heroBannerText}>Alliance pour le Rassemblement Malien</Text>
          </View>
        </View>

        {/* ── Stats bar ── */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statFlag}>🇲🇱</Text>
            <Text style={styles.statValue}>Mali</Text>
            <Text style={styles.statLabel}>Pays</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statFlag}>👥</Text>
            <Text style={styles.statValue}>Membres</Text>
            <Text style={styles.statLabel}>Adhérents</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statFlag}>🌍</Text>
            <Text style={styles.statValue}>Diaspora</Text>
            <Text style={styles.statLabel}>Monde</Text>
          </View>
        </View>

        {/* ── Actions rapides ── */}
        <SectionHeader title="⚡ Actions rapides" />
        <View style={styles.quickGrid}>
          <QuickCard
            icon="📋"
            label="Adhérer"
            borderColor={ARM_GREEN}
            onPress={() => {
              console.log('[HomeScreen] Action rapide: Adhérer');
              nav('/member/register');
            }}
          />
          <QuickCard
            icon="💰"
            label="Contribuer"
            borderColor={ARM_RED}
            onPress={() => {
              console.log('[HomeScreen] Action rapide: Contribuer');
              nav('/donation');
            }}
          />
          <QuickCard
            icon="🗳️"
            label="Sondages"
            borderColor={ARM_YELLOW}
            onPress={() => {
              console.log('[HomeScreen] Action rapide: Sondages');
              nav('/polls');
            }}
          />
          <QuickCard
            icon="💬"
            label="Chat IA"
            borderColor={ARM_BLUE}
            onPress={() => {
              console.log('[HomeScreen] Action rapide: Chat IA');
              nav('/chat-ia');
            }}
          />
        </View>

        {/* ── Actualités ── */}
        <SectionHeader
          title="📰 Actualités"
          linkLabel="Voir tout"
          onLink={() => {
            console.log('[HomeScreen] Voir tout actualités');
            nav('/news');
          }}
        />
        {newsLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={ARM_GREEN} />
          </View>
        ) : newsError ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Impossible de charger les actualités</Text>
          </View>
        ) : newsList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucune actualité pour le moment</Text>
          </View>
        ) : (
          <View style={styles.newsContainer}>
            {newsList.map((item) => {
              const newsDate = formatDate(item.created_at || item.date);
              const newsCategory = item.category || 'Actualité';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.newsCard}
                  onPress={() => {
                    console.log('[HomeScreen] Actualité pressed:', item.id, item.title);
                    nav('/news');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.newsCardContent}>
                    <View style={styles.newsCardMeta}>
                      <View style={styles.newsCategoryBadge}>
                        <Text style={styles.newsCategoryText}>{newsCategory}</Text>
                      </View>
                      <Text style={styles.newsDate}>{newsDate}</Text>
                    </View>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>
                  <Text style={styles.newsChevron}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Événements ── */}
        <SectionHeader
          title="📅 Événements"
          linkLabel="Voir tout"
          onLink={() => {
            console.log('[HomeScreen] Voir tout événements');
            nav('/events');
          }}
        />
        {eventsLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={ARM_GREEN} />
          </View>
        ) : eventsError ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Impossible de charger les événements</Text>
          </View>
        ) : eventsList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucun événement à venir</Text>
          </View>
        ) : (
          <View style={styles.eventsContainer}>
            {eventsList.map((item) => {
              const dateBadge = eventDateBadge(item);
              const eventLocation = item.location || item.lieu || '';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.eventCard}
                  onPress={() => {
                    console.log('[HomeScreen] Événement pressed:', item.id, item.title);
                    nav('/events');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.eventDateBadge}>
                    <Text style={styles.eventDateText}>{dateBadge}</Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {eventLocation ? (
                      <Text style={styles.eventLocation} numberOfLines={1}>
                        📍 {eventLocation}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.newsChevron}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Sondage du moment ── */}
        <SectionHeader title="🗳️ Sondage du moment" />
        {pollsLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={ARM_GREEN} />
          </View>
        ) : pollsError ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Impossible de charger le sondage</Text>
          </View>
        ) : !activePoll ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucun sondage actif pour le moment</Text>
          </View>
        ) : (
          <View style={styles.pollCard}>
            <Text style={styles.pollQuestion}>{pollTitle}</Text>
            {pollOptions.slice(0, 3).map((opt, idx) => {
              const optLabel = opt.text || opt.label || `Option ${idx + 1}`;
              const optVotes = opt.votes || opt.count || 0;
              const pct = pollTotal > 0 ? Math.round((optVotes / pollTotal) * 100) : 0;
              const pctLabel = `${pct}%`;
              const pctWidth = `${pct}%` as `${number}%`;
              return (
                <View key={idx} style={styles.pollOption}>
                  <View style={styles.pollOptionHeader}>
                    <Text style={styles.pollOptionLabel}>{optLabel}</Text>
                    <Text style={styles.pollOptionPct}>{pctLabel}</Text>
                  </View>
                  <View style={styles.pollBar}>
                    <View style={[styles.pollBarFill, { width: pctWidth }]} />
                  </View>
                </View>
              );
            })}
            <TouchableOpacity
              style={styles.pollVoteBtn}
              onPress={() => {
                console.log('[HomeScreen] Voter maintenant pressed, poll:', activePoll.id);
                nav('/polls');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.pollVoteBtnText}>Voter maintenant</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Plus ── */}
        <SectionHeader title="🔗 Plus" />
        <View style={styles.moreGrid}>
          <MoreItem
            icon="📢"
            label="Annonces"
            onPress={() => {
              console.log('[HomeScreen] Plus: Annonces');
              nav('/announcements');
            }}
          />
          <MoreItem
            icon="💬"
            label="Messages"
            onPress={() => {
              console.log('[HomeScreen] Plus: Messages politiques');
              nav('/political-messages');
            }}
          />
          <MoreItem
            icon="🌟"
            label="Idéologie"
            onPress={() => {
              console.log('[HomeScreen] Plus: Idéologie');
              nav('/ideology');
            }}
          />
          <MoreItem
            icon="📞"
            label="Contact"
            onPress={() => {
              console.log('[HomeScreen] Plus: Contact');
              nav('/contact');
            }}
          />
          <MoreItem
            icon="📖"
            label="Programme"
            onPress={() => {
              console.log('[HomeScreen] Plus: Programme');
              nav('/program');
            }}
          />
          <MoreItem
            icon="⚙️"
            label="Paramètres"
            onPress={() => {
              console.log('[HomeScreen] Plus: Paramètres');
              nav('/settings');
            }}
          />
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Alliance pour le Rassemblement Malien</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ARM_GREEN,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingBottom: 40,
  },

  // Hero
  hero: {
    backgroundColor: ARM_GREEN,
  },
  heroTop: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: ARM_GREEN,
  },
  heroLogo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: ARM_YELLOW,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: ARM_WHITE,
    marginTop: 12,
    letterSpacing: 2,
  },
  heroSubtitle: {
    fontSize: 14,
    color: ARM_YELLOW,
    fontStyle: 'italic',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  heroBanner: {
    backgroundColor: ARM_YELLOW,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  heroBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: ARM_BLACK,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: ARM_WHITE,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statFlag: {
    fontSize: 20,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: ARM_GREEN,
  },
  statLabel: {
    fontSize: 11,
    color: GREY,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ARM_BLACK,
  },
  sectionLink: {
    fontSize: 13,
    color: ARM_GREEN,
    fontWeight: '600',
  },

  // Quick actions grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  quickCard: {
    width: CARD_WIDTH,
    backgroundColor: ARM_WHITE,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickCardIcon: {
    fontSize: 22,
  },
  quickCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: ARM_BLACK,
    flex: 1,
  },

  // Loading / empty
  loadingBox: {
    marginHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyBox: {
    marginHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: ARM_WHITE,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: GREY,
    textAlign: 'center',
  },

  // News
  newsContainer: {
    marginHorizontal: 16,
    gap: 8,
  },
  newsCard: {
    backgroundColor: ARM_WHITE,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  newsCardContent: {
    flex: 1,
  },
  newsCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  newsCategoryBadge: {
    backgroundColor: ARM_GREEN + '20',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newsCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: ARM_GREEN,
    textTransform: 'uppercase',
  },
  newsDate: {
    fontSize: 11,
    color: GREY,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ARM_BLACK,
    lineHeight: 20,
  },
  newsChevron: {
    fontSize: 22,
    color: GREY,
    marginLeft: 8,
  },

  // Events
  eventsContainer: {
    marginHorizontal: 16,
    gap: 8,
  },
  eventCard: {
    backgroundColor: ARM_WHITE,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventDateBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: ARM_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: ARM_WHITE,
    textAlign: 'center',
    lineHeight: 15,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ARM_BLACK,
    lineHeight: 20,
  },
  eventLocation: {
    fontSize: 12,
    color: GREY,
    marginTop: 3,
  },

  // Poll
  pollCard: {
    marginHorizontal: 16,
    backgroundColor: ARM_WHITE,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pollQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: ARM_BLACK,
    marginBottom: 14,
    lineHeight: 22,
  },
  pollOption: {
    marginBottom: 10,
  },
  pollOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pollOptionLabel: {
    fontSize: 13,
    color: ARM_BLACK,
    flex: 1,
  },
  pollOptionPct: {
    fontSize: 13,
    fontWeight: '700',
    color: ARM_GREEN,
    marginLeft: 8,
  },
  pollBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  pollBarFill: {
    height: 6,
    backgroundColor: ARM_GREEN,
    borderRadius: 3,
  },
  pollVoteBtn: {
    marginTop: 14,
    backgroundColor: ARM_GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pollVoteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: ARM_WHITE,
  },

  // More grid
  moreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  moreItem: {
    width: CARD_WIDTH,
    backgroundColor: ARM_WHITE,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moreItemIcon: {
    fontSize: 24,
  },
  moreItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ARM_BLACK,
    textAlign: 'center',
  },

  // Footer
  footer: {
    marginTop: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: GREY,
    textAlign: 'center',
  },
});
