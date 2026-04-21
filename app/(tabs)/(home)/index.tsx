import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ImageSourcePropType,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles/commonStyles';
import { PROGRAM_POINTS } from '@/constants/programData';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function AnimatedPressable({
  onPress,
  style,
  children,
}: {
  onPress: () => void;
  style?: object | object[];
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, [scale]);
  const animOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, [scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPressIn={animIn}
        onPressOut={animOut}
        onPress={onPress}
        activeOpacity={1}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

function FadeInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translateY]);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

const QUICK_ACTIONS = [
  { icon: 'person-add-outline' as const, label: 'Adhérer', route: '/member/register' as const, color: colors.primary },
  { icon: 'document-text-outline' as const, label: 'Programme', route: '/program' as const, color: '#1565C0' },
  { icon: 'heart-outline' as const, label: 'Contribuer', route: '/donation' as const, color: '#C62828' },
  { icon: 'people-outline' as const, label: 'Membres', route: '/members-list' as const, color: '#6A1B9A' },
];

const FEATURED_PILLARS = PROGRAM_POINTS.slice(0, 4);

export default function HomeScreen() {
  const router = useRouter();

  const handleQuickAction = (label: string, route: string) => {
    console.log('[Home] Quick action pressed:', label, '->', route);
    router.push(route as any);
  };

  const handlePillarPress = (title: string) => {
    console.log('[Home] Programme pillar pressed:', title);
    router.push('/program');
  };

  const handleSeeAllProgram = () => {
    console.log('[Home] Voir tout le programme pressed');
    router.push('/program');
  };

  const handleContactPress = () => {
    console.log('[Home] Contact pressed');
    router.push('/contact');
  };

  const handleIdeologyPress = () => {
    console.log('[Home] Idéologie pressed');
    router.push('/ideology');
  };

  const handleSettingsPress = () => {
    console.log('[Home] Paramètres pressed');
    router.push('/settings');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <FadeInView delay={0}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.logoCircle}>
                <Image
                  source={resolveImageSource(require('@/assets/images/SAVE_20251219_163224.jpg'))}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>Alliance ARM</Text>
                <Text style={styles.headerSubtitle}>Alliance pour le Renouveau et la Modernité</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSettingsPress}
              style={styles.settingsBtn}
              accessibilityLabel="Paramètres"
            >
              <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* Hero Banner */}
        <FadeInView delay={80}>
          <View style={styles.heroBanner}>
            <View style={styles.heroBannerInner}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>🇲🇱 Mali</Text>
              </View>
              <Text style={styles.heroHeadline}>Pour un Mali{'\n'}Renouvelé et Moderne</Text>
              <Text style={styles.heroBody}>
                Rejoignez le mouvement qui porte les valeurs de démocratie, de justice et de développement durable.
              </Text>
              <AnimatedPressable onPress={() => handleQuickAction('Adhérer', '/member/register')} style={styles.heroBtn}>
                <Text style={styles.heroBtnText}>Rejoindre le mouvement</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </AnimatedPressable>
            </View>
          </View>
        </FadeInView>

        {/* Quick Actions */}
        <FadeInView delay={160}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.quickActionsGrid}>
              {QUICK_ACTIONS.map((action) => {
                const actionColor = action.color;
                const actionIcon = action.icon;
                const actionLabel = action.label;
                const actionRoute = action.route;
                return (
                  <AnimatedPressable
                    key={actionLabel}
                    onPress={() => handleQuickAction(actionLabel, actionRoute)}
                    style={styles.quickActionCard}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: actionColor + '18' }]}>
                      <Ionicons name={actionIcon} size={22} color={actionColor} />
                    </View>
                    <Text style={styles.quickActionLabel}>{actionLabel}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        </FadeInView>

        {/* Programme Pillars */}
        <FadeInView delay={240}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notre Programme</Text>
              <TouchableOpacity onPress={handleSeeAllProgram}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pillarsGrid}>
              {FEATURED_PILLARS.map((pillar, index) => {
                const pillarColor = pillar.color;
                const pillarTitle = pillar.title;
                const pillarIcon = pillar.icon;
                const subCount = pillar.subpoints.length;
                const subCountText = subCount + ' axes';
                return (
                  <AnimatedPressable
                    key={pillarTitle}
                    onPress={() => handlePillarPress(pillarTitle)}
                    style={[styles.pillarCard, index % 2 === 0 ? styles.pillarCardLeft : styles.pillarCardRight]}
                  >
                    <View style={[styles.pillarIconWrap, { backgroundColor: pillarColor + '18' }]}>
                      <Ionicons name={pillarIcon as any} size={20} color={pillarColor} />
                    </View>
                    <Text style={styles.pillarTitle} numberOfLines={2}>{pillarTitle}</Text>
                    <Text style={styles.pillarSub}>{subCountText}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        </FadeInView>

        {/* Values Strip */}
        <FadeInView delay={320}>
          <View style={styles.valuesStrip}>
            <Text style={styles.valuesSectionTitle}>Nos Valeurs</Text>
            <View style={styles.valuesRow}>
              <View style={styles.valueItem}>
                <Text style={styles.valueIcon}>⚖️</Text>
                <Text style={styles.valueLabel}>Justice</Text>
              </View>
              <View style={styles.valueDivider} />
              <View style={styles.valueItem}>
                <Text style={styles.valueIcon}>🤝</Text>
                <Text style={styles.valueLabel}>Solidarité</Text>
              </View>
              <View style={styles.valueDivider} />
              <View style={styles.valueItem}>
                <Text style={styles.valueIcon}>🌱</Text>
                <Text style={styles.valueLabel}>Progrès</Text>
              </View>
              <View style={styles.valueDivider} />
              <View style={styles.valueItem}>
                <Text style={styles.valueIcon}>🛡️</Text>
                <Text style={styles.valueLabel}>Intégrité</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Info Cards */}
        <FadeInView delay={400}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>En savoir plus</Text>
            <AnimatedPressable onPress={handleIdeologyPress} style={styles.infoCard}>
              <View style={[styles.infoCardIcon, { backgroundColor: '#1565C0' + '18' }]}>
                <Ionicons name="bulb-outline" size={22} color="#1565C0" />
              </View>
              <View style={styles.infoCardBody}>
                <Text style={styles.infoCardTitle}>Notre Idéologie</Text>
                <Text style={styles.infoCardDesc}>Découvrez les fondements politiques et philosophiques de l'Alliance ARM</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </AnimatedPressable>

            <AnimatedPressable onPress={handleContactPress} style={styles.infoCard}>
              <View style={[styles.infoCardIcon, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="mail-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoCardBody}>
                <Text style={styles.infoCardTitle}>Nous Contacter</Text>
                <Text style={styles.infoCardDesc}>Prenez contact avec nos équipes régionales et nationales</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Footer */}
        <FadeInView delay={480}>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Alliance ARM — Alliance pour le Renouveau et la Modernité</Text>
            <Text style={styles.footerSub}>© 2025 Tous droits réservés</Text>
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero Banner
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  heroBannerInner: {
    padding: 24,
    paddingBottom: 28,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  heroHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.4,
    lineHeight: 32,
    marginBottom: 10,
  },
  heroBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 21,
    marginBottom: 20,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  heroBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },

  // Programme Pillars
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pillarCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  pillarCardLeft: {
    width: '47.5%',
  },
  pillarCardRight: {
    width: '47.5%',
  },
  pillarIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pillarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  pillarSub: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Values Strip
  valuesStrip: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  valuesSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  valueIcon: {
    fontSize: 22,
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  valueDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.divider,
  },

  // Info Cards
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardBody: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  infoCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 8,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  footerSub: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
