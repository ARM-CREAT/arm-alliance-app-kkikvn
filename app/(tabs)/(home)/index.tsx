
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const menuItems = [
  {
    title: 'Programme',
    subtitle: 'Notre vision pour la France',
    route: '/program',
    icon: 'document-text' as const,
    color: colors.primary,
  },
  {
    title: 'Idéologie',
    subtitle: 'Nos valeurs et principes',
    route: '/ideology',
    icon: 'shield-checkmark' as const,
    color: colors.primaryLight,
  },
  {
    title: 'Adhésion',
    subtitle: 'Rejoindre le mouvement',
    route: '/(tabs)/profile',
    icon: 'people' as const,
    color: colors.primary,
  },
  {
    title: 'Contact',
    subtitle: 'Nous contacter',
    route: '/contact',
    icon: 'mail' as const,
    color: colors.primaryLight,
  },
  {
    title: 'Don',
    subtitle: 'Soutenir notre cause',
    route: '/donation',
    icon: 'heart' as const,
    color: colors.secondary,
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>ARM</Text>
            </View>
            <Text style={styles.title}>Alliance ARM</Text>
            <Text style={styles.subtitle}>Alliance pour le Rassemblement Malien</Text>
          </View>

          {/* Welcome card */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeIconRow}>
              <Ionicons name="flag" size={20} color={colors.primary} />
              <Text style={styles.welcomeLabel}>Bienvenue</Text>
            </View>
            <Text style={styles.welcomeText}>
              Alliance ARM est un mouvement politique engagé pour un Mali fort, juste et souverain.
            </Text>
          </View>

          {/* Navigation cards */}
          <Text style={styles.sectionHeading}>Découvrir</Text>
          <View style={styles.grid}>
            {menuItems.map((item) => {
              const handlePress = () => {
                console.log('[HomeScreen] Menu item pressed:', item.title, 'route:', item.route);
                router.push(item.route as any);
              };
              const iconBg = item.color + '18';
              return (
                <TouchableOpacity
                  key={item.route}
                  style={styles.card}
                  onPress={handlePress}
                  activeOpacity={0.75}
                >
                  <View style={[styles.cardIconWrap, { backgroundColor: iconBg }]}>
                    <Ionicons name={item.icon} size={24} color={item.color} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  welcomeCard: {
    backgroundColor: colors.primaryMuted,
    marginHorizontal: 20,
    marginTop: -16,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  welcomeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 28,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  grid: {
    paddingHorizontal: 20,
    gap: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
