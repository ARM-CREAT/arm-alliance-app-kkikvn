import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { AnimatedPressable } from '@/components/AnimatedPressable';

const Haptics = {
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
};

interface NavCard {
  icon: string;
  label: string;
  description: string;
  path: string;
  color: string;
}

const NAV_CARDS: NavCard[] = [
  {
    icon: '📰',
    label: 'Actualités',
    description: 'Gérer les articles et publications',
    path: '/admin/news',
    color: '#2563EB',
  },
  {
    icon: '📢',
    label: 'Annonces',
    description: 'Publier des annonces urgentes',
    path: '/admin/announcements',
    color: '#D97706',
  },
  {
    icon: '💬',
    label: 'Messages politiques',
    description: 'Communiqués et messages officiels',
    path: '/admin/political-messages',
    color: '#7C3AED',
  },
  {
    icon: '👥',
    label: 'Adhérents',
    description: 'Consulter et gérer les membres',
    path: '/admin/memberships',
    color: colors.primary,
  },
  {
    icon: '📊',
    label: 'Statistiques',
    description: 'Statistiques des militants',
    path: '/admin/stats',
    color: '#0369A1',
  },
];

export default function AdminIndexScreen() {
  const router = useRouter();

  const handleNav = (card: NavCard) => {
    console.log('[AdminIndex] Navigation vers', card.label, card.path);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(card.path as any);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Tableau de bord',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeTitle}>Tableau de bord</Text>
            <Text style={styles.welcomeSubtitle}>Gestion du contenu Alliance ARM</Text>
          </View>

          <View style={styles.grid}>
            {NAV_CARDS.map((card) => (
              <AnimatedPressable
                key={card.path}
                style={styles.card}
                onPress={() => handleNav(card)}
              >
                <View style={[styles.cardIconWrap, { backgroundColor: card.color + '18' }]}>
                  <Text style={styles.cardIcon}>{card.icon}</Text>
                </View>
                <Text style={styles.cardLabel}>{card.label}</Text>
                <Text style={styles.cardDesc}>{card.description}</Text>
                <View style={[styles.cardArrow, { backgroundColor: card.color }]}>
                  <Text style={styles.cardArrowText}>›</Text>
                </View>
              </AnimatedPressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeBox: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardIcon: {
    fontSize: 26,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  cardArrow: {
    alignSelf: 'flex-end',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  cardArrowText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
});
