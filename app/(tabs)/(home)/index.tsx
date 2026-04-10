import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

const menuItems = [
  { title: 'Programme', subtitle: 'Notre vision pour la France', route: '/program', icon: '📋' },
  { title: 'Idéologie', subtitle: 'Nos valeurs et principes', route: '/ideology', icon: '⚖️' },
  { title: 'Adhésion', subtitle: 'Rejoindre le mouvement', route: '/(tabs)/profile', icon: '🤝' },
  { title: 'Contact', subtitle: 'Nous contacter', route: '/contact', icon: '✉️' },
  { title: 'Don', subtitle: 'Soutenir notre cause', route: '/donation', icon: '💙' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Alliance ARM</Text>
            <Text style={styles.subtitle}>Mouvement pour la République</Text>
          </View>

          <View style={styles.welcomeCard}>
            <Text style={styles.sectionTitle}>Bienvenue</Text>
            <Text style={styles.sectionText}>
              Alliance ARM est un mouvement politique engagé pour une France forte, juste et souveraine.
            </Text>
          </View>

          <View style={styles.grid}>
            {menuItems.map((item) => {
              const handlePress = () => {
                console.log('[HomeScreen] Menu item pressed:', item.title, 'route:', item.route);
                router.push(item.route as any);
              };
              return (
                <TouchableOpacity
                  key={item.route}
                  style={styles.card}
                  onPress={handlePress}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardIcon}>{item.icon}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
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
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  welcomeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
