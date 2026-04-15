import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  ImageSourcePropType,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { NotificationBell } from '@/components/NotificationBell';
import { PROGRAM_POINTS } from '@/constants/programData';

// useNativeDriver is not supported on web — always use false there
const nativeDriver = Platform.OS !== 'web';

function resolveImageSource(
  source: string | number | ImageSourcePropType | undefined
): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

// ─── Animated list item ───────────────────────────────────────────────────────
function AnimatedItem({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 70,
        useNativeDriver: nativeDriver,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: index * 70,
        useNativeDriver: nativeDriver,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Quick action card ────────────────────────────────────────────────────────
interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}

function QuickAction({ icon, label, color, bg, onPress }: QuickActionProps) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.quickAction}>
      <View style={[styles.quickActionIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel} numberOfLines={2}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

// ─── Program pill ─────────────────────────────────────────────────────────────
interface ProgramPillProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

function ProgramPill({ title, icon, color, onPress }: ProgramPillProps) {
  return (
    <AnimatedPressable onPress={onPress}>
      <View style={styles.programPill}>
        <View style={[styles.programPillDot, { backgroundColor: color }]}>
          <Ionicons name={icon} size={14} color="#fff" />
        </View>
        <Text style={styles.programPillText} numberOfLines={1}>
          {title}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
      </View>
    </AnimatedPressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: nativeDriver,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        useNativeDriver: nativeDriver,
        speed: 14,
        bounciness: 3,
      }),
    ]).start();
  }, [headerOpacity, heroScale]);

  const handleJoinPress = () => {
    console.log('[Home] Bouton "Adhérer" appuyé');
    router.push('/(tabs)/profile');
  };

  const handleDonatePress = () => {
    console.log('[Home] Bouton "Contribuer" appuyé');
    router.push('/donation');
  };

  const handleProgramPress = () => {
    console.log('[Home] Bouton "Programme" appuyé');
    router.push('/program');
  };

  const handleIdeologyPress = () => {
    console.log('[Home] Bouton "Idéologie" appuyé');
    router.push('/ideology');
  };

  const handleContactPress = () => {
    console.log('[Home] Bouton "Contact" appuyé');
    router.push('/contact');
  };

  const handleMembersPress = () => {
    console.log('[Home] Bouton "Membres" appuyé');
    router.push('/members-list');
  };

  const handleProgramPointPress = (title: string) => {
    console.log('[Home] Programme point appuyé:', title);
    router.push('/program');
  };

  const handleAdminPress = () => {
    console.log('[Home] Bouton "Espace Admin" appuyé');
    router.push('/admin/login');
  };

  const logoSource = resolveImageSource(
    require('@/assets/images/SAVE_20251219_163224.jpg')
  );

  const topProgramPoints = PROGRAM_POINTS.slice(0, 6);

  const paddingTop = Platform.OS === 'web' ? 16 : insets.top + 8;

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <Animated.View
        style={[styles.header, { paddingTop, opacity: headerOpacity }]}
      >
        <View style={styles.headerLeft}>
          <Image
            source={logoSource}
            style={styles.headerLogo}
            resizeMode="cover"
          />
          <View>
            <Text style={styles.headerTitle}>Alliance ARM</Text>
            <Text style={styles.headerSubtitle}>Mali · Unité · Progrès</Text>
          </View>
        </View>
        <NotificationBell variant="compact" size={22} />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero banner ── */}
        <AnimatedItem index={0}>
          <Animated.View
            style={[styles.hero, { transform: [{ scale: heroScale }] }]}
          >
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>A.R.M</Text>
            </View>
            <Text style={styles.heroTitle}>
              Alliance pour le{'\n'}Rassemblement Malien
            </Text>
            <Text style={styles.heroSubtitle}>
              Ensemble, construisons un Mali souverain, juste et prospère pour
              toutes les générations.
            </Text>
            <View style={styles.heroActions}>
              <AnimatedPressable
                onPress={handleJoinPress}
                style={styles.heroPrimaryBtn}
              >
                <Ionicons
                  name="person-add-outline"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.heroPrimaryBtnText}>Adhérer</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleDonatePress}
                style={styles.heroSecondaryBtn}
              >
                <Ionicons
                  name="heart-outline"
                  size={16}
                  color={colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.heroSecondaryBtnText}>Contribuer</Text>
              </AnimatedPressable>
            </View>
          </Animated.View>
        </AnimatedItem>

        {/* ── Quick actions ── */}
        <AnimatedItem index={1}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.quickActionsRow}>
              <QuickAction
                icon="book-outline"
                label="Programme"
                color={colors.primary}
                bg={colors.primaryMuted}
                onPress={handleProgramPress}
              />
              <QuickAction
                icon="bulb-outline"
                label="Idéologie"
                color="#F5C518"
                bg="#FEF9E7"
                onPress={handleIdeologyPress}
              />
              <QuickAction
                icon="people-outline"
                label="Membres"
                color="#2563EB"
                bg="#EFF6FF"
                onPress={handleMembersPress}
              />
              <QuickAction
                icon="mail-outline"
                label="Contact"
                color="#7C3AED"
                bg="#F5F3FF"
                onPress={handleContactPress}
              />
            </View>
          </View>
        </AnimatedItem>

        {/* ── Stats strip ── */}
        <AnimatedItem index={2}>
          <View style={styles.statsStrip}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>15+</Text>
              <Text style={styles.statLabel}>Axes{'\n'}programmatiques</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Régions{'\n'}couvertes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2025</Text>
              <Text style={styles.statLabel}>Année de{'\n'}mobilisation</Text>
            </View>
          </View>
        </AnimatedItem>

        {/* ── Programme highlights ── */}
        <AnimatedItem index={3}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notre programme</Text>
              <TouchableOpacity
                onPress={handleProgramPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.sectionLink}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.programList}>
              {topProgramPoints.map((point, i) => (
                <AnimatedItem key={point.title} index={4 + i}>
                  <ProgramPill
                    title={point.title}
                    icon={point.icon}
                    color={point.color}
                    onPress={() => handleProgramPointPress(point.title)}
                  />
                </AnimatedItem>
              ))}
            </View>
          </View>
        </AnimatedItem>

        {/* ── Call to action ── */}
        <AnimatedItem index={10}>
          <AnimatedPressable onPress={handleJoinPress} style={styles.ctaBanner}>
            <View style={styles.ctaContent}>
              <Ionicons
                name="flag-outline"
                size={28}
                color="#fff"
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.ctaTitle}>Rejoignez le mouvement</Text>
              <Text style={styles.ctaSubtitle}>
                Devenez membre de l'Alliance ARM et participez à la
                transformation du Mali.
              </Text>
            </View>
            <View style={styles.ctaArrow}>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </AnimatedPressable>
        </AnimatedItem>

        {/* ── Admin access ── */}
        <AnimatedItem index={11}>
          <TouchableOpacity
            onPress={handleAdminPress}
            style={styles.adminLink}
            activeOpacity={0.6}
          >
            <Ionicons name="shield-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.adminLinkText}>Espace Admin</Text>
            <Ionicons name="chevron-forward" size={12} color={colors.textTertiary} />
          </TouchableOpacity>
        </AnimatedItem>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  // ── Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  // ── Hero
  hero: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.4,
    lineHeight: 32,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 21,
    marginBottom: 20,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  heroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  heroSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  // ── Section
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  // ── Quick actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 15,
  },
  // ── Stats strip
  statsStrip: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 3,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },
  // ── Program list
  programList: {
    gap: 8,
  },
  programPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  programPillDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  programPillText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  // ── CTA banner
  ctaBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 19,
  },
  ctaArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  // ── Admin link
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  adminLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.2,
  },
});
