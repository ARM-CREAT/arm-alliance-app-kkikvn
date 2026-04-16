import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ImageSourcePropType,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PROGRAM_POINTS } from '@/constants/programData';
import { apiGet } from '@/utils/api';

const PRIMARY = '#1B7A3E';
const GOLD = '#F5C518';
const WHITE = '#FFFFFF';
const BG = '#F7FAF8';
const TEXT_DARK = '#0D2818';
const TEXT_MUTED = '#4A7060';
const CARD_BG = '#FFFFFF';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const LOGO = require('@/assets/images/0be5c379-285b-4791-9ed0-c19c441eb117.png');

export default function HomeScreenIOS() {
  const router = useRouter();
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMemberCount = useCallback(async () => {
    console.log('[Home iOS] Fetching member count');
    try {
      const data = await apiGet<{ count?: number; total?: number; data?: { count?: number } }>('/api/members/count');
      const count = data?.count ?? data?.total ?? data?.data?.count ?? null;
      console.log('[Home iOS] Member count received:', count);
      setMemberCount(typeof count === 'number' ? count : null);
    } catch (err) {
      console.warn('[Home iOS] Failed to fetch member count (non-blocking):', err);
      setMemberCount(null);
    }
  }, []);

  useEffect(() => {
    fetchMemberCount();
  }, [fetchMemberCount]);

  const onRefresh = useCallback(async () => {
    console.log('[Home iOS] Pull-to-refresh triggered');
    setRefreshing(true);
    await fetchMemberCount();
    setRefreshing(false);
  }, [fetchMemberCount]);

  const handleProgramPress = (index: number) => {
    console.log('[Home iOS] Programme card pressed, index:', index);
    router.push('/program' as any);
  };

  const handleSeeAllProgram = () => {
    console.log('[Home iOS] Voir tout programme pressed');
    router.push('/program' as any);
  };

  const handleIdeologyPress = () => {
    console.log('[Home iOS] Idéologie pressed');
    router.push('/ideology' as any);
  };

  const handleContactPress = () => {
    console.log('[Home iOS] Contact pressed');
    router.push('/contact' as any);
  };

  const handleDonationPress = () => {
    console.log('[Home iOS] Don pressed');
    router.push('/donation' as any);
  };

  const memberCountDisplay = memberCount !== null && memberCount !== undefined
    ? String(memberCount)
    : '...';

  const previewProgram = PROGRAM_POINTS.slice(0, 6);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={WHITE}
            colors={[PRIMARY]}
          />
        }
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={resolveImageSource(LOGO)}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>A.R.M</Text>
          <Text style={styles.heroSubtitle}>Alliance pour le Rassemblement Malien</Text>

          <View style={styles.mottoRow}>
            <View style={styles.mottoDivider} />
            <Text style={styles.mottoText}>Fraternité</Text>
            <Text style={styles.mottoDot}> • </Text>
            <Text style={styles.mottoText}>Liberté</Text>
            <Text style={styles.mottoDot}> • </Text>
            <Text style={styles.mottoText}>Égalité</Text>
            <View style={styles.mottoDivider} />
          </View>

          {/* Member count */}
          <View style={styles.memberBox}>
            <Text style={styles.memberCount}>{memberCountDisplay}</Text>
            <Text style={styles.memberLabel}>membres inscrits</Text>
          </View>
        </View>

        {/* Programme section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="document-text-outline" size={20} color={PRIMARY} />
              <Text style={styles.sectionTitle}>Notre Programme</Text>
            </View>
            <TouchableOpacity onPress={handleSeeAllProgram} activeOpacity={0.7}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.programGrid}>
            {previewProgram.map((point, index) => {
              const num = index + 1;
              const pointTitle = point.title;
              const pointColor = point.color;
              const pointIcon = point.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.programCard}
                  onPress={() => handleProgramPress(index)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.programCardAccent, { backgroundColor: pointColor }]} />
                  <Text style={[styles.programNum, { color: pointColor }]}>{num}</Text>
                  <View style={styles.programIconWrap}>
                    <Ionicons name={pointIcon} size={22} color={pointColor} />
                  </View>
                  <Text style={styles.programCardTitle}>{pointTitle}</Text>
                  <Ionicons name="chevron-forward" size={14} color={TEXT_MUTED} style={styles.programChevron} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionCard} onPress={handleIdeologyPress} activeOpacity={0.85}>
              <View style={[styles.actionIcon, { backgroundColor: PRIMARY + '18' }]}>
                <Ionicons name="book-outline" size={22} color={PRIMARY} />
              </View>
              <Text style={styles.actionLabel}>Idéologie</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={handleContactPress} activeOpacity={0.85}>
              <View style={[styles.actionIcon, { backgroundColor: '#2563EB18' }]}>
                <Ionicons name="mail-outline" size={22} color="#2563EB" />
              </View>
              <Text style={styles.actionLabel}>Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={handleDonationPress} activeOpacity={0.85}>
              <View style={[styles.actionIcon, { backgroundColor: GOLD + '28' }]}>
                <Ionicons name="heart-outline" size={22} color={GOLD} />
              </View>
              <Text style={styles.actionLabel}>Don</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
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
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: WHITE,
    letterSpacing: 2,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  mottoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 0,
  },
  mottoDivider: {
    flex: 1,
    height: 1.5,
    backgroundColor: GOLD,
    opacity: 0.6,
  },
  mottoText: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
    fontStyle: 'italic',
    marginHorizontal: 4,
  },
  mottoDot: {
    fontSize: 14,
    color: GOLD,
    fontWeight: '700',
  },
  memberBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  memberCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: GOLD,
    marginBottom: 4,
  },
  memberLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },
  programGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  programCard: {
    width: '47%',
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  programCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  programNum: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 4,
  },
  programIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  programCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
    lineHeight: 18,
    marginBottom: 8,
  },
  programChevron: {
    alignSelf: 'flex-end',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
});
