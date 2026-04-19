import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const PRIMARY = '#2d6a4f';
const PRIMARY_DARK = '#1b4332';
const PRIMARY_LIGHT = '#b7e4c7';
const BG = '#f0f4f0';
const WHITE = '#ffffff';
const TEXT_DARK = '#1a1a1a';
const TEXT_MUTED = '#555555';

const MEMBERSHIP_OPTIONS = [
  {
    type: 'standard',
    label: 'Membre Standard',
    description: 'Accès aux événements et actualités du parti',
    icon: '🌱',
    price: 'Gratuit',
  },
  {
    type: 'actif',
    label: 'Membre Actif',
    description: 'Participation aux votes et décisions internes',
    icon: '⭐',
    price: '5 000 FCFA/an',
  },
  {
    type: 'sympathisant',
    label: 'Sympathisant',
    description: 'Soutien au mouvement sans engagement formel',
    icon: '💚',
    price: 'Libre',
  },
];

export default function ProfileScreen() {
  const router = useRouter();

  const handleRegister = (type: string) => {
    console.log('[Profile] Bouton Adhérer appuyé, type:', type);
    router.push({ pathname: '/member/register' as any, params: { type } });
  };

  const handleRecover = () => {
    console.log('[Profile] Bouton Retrouver ma carte appuyé');
    router.push('/member/recover' as any);
  };

  const handleCotisation = () => {
    console.log('[Profile] Bouton Cotisation appuyé');
    router.push('/member/cotisation' as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
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
          <Text style={styles.heroTitle}>Espace Adhésion</Text>
          <Text style={styles.heroSubtitle}>
            Rejoignez l'Alliance pour le Renouveau et la Modernité
          </Text>
        </View>

        {/* Membership options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisissez votre adhésion</Text>
          {MEMBERSHIP_OPTIONS.map((opt) => {
            const optIcon = opt.icon;
            const optLabel = opt.label;
            const optDesc = opt.description;
            const optPrice = opt.price;
            const optType = opt.type;
            return (
              <View key={optType} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>{optIcon}</Text>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardLabel}>{optLabel}</Text>
                    <Text style={styles.cardDesc}>{optDesc}</Text>
                  </View>
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>{optPrice}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.joinBtn}
                  onPress={() => handleRegister(optType)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.joinBtnText}>Adhérer</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Already a member */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Déjà membre ?</Text>
          <View style={styles.existingCard}>
            <TouchableOpacity
              style={styles.existingBtn}
              onPress={handleRecover}
              activeOpacity={0.8}
            >
              <Text style={styles.existingBtnIcon}>🔍</Text>
              <View style={styles.existingBtnInfo}>
                <Text style={styles.existingBtnLabel}>Retrouver ma carte</Text>
                <Text style={styles.existingBtnDesc}>Accédez à votre carte de membre</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.existingBtn}
              onPress={handleCotisation}
              activeOpacity={0.8}
            >
              <Text style={styles.existingBtnIcon}>💳</Text>
              <View style={styles.existingBtnInfo}>
                <Text style={styles.existingBtnLabel}>Payer ma cotisation</Text>
                <Text style={styles.existingBtnDesc}>Gérez vos cotisations annuelles</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
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
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: PRIMARY_LIGHT,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: TEXT_MUTED,
    lineHeight: 17,
  },
  priceBadge: {
    backgroundColor: PRIMARY + '18',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
  },
  joinBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: WHITE,
  },
  existingCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  existingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  existingBtnIcon: {
    fontSize: 24,
  },
  existingBtnInfo: {
    flex: 1,
  },
  existingBtnLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 2,
  },
  existingBtnDesc: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  chevron: {
    fontSize: 22,
    color: TEXT_MUTED,
  },
  divider: {
    height: 1,
    backgroundColor: '#e8e8e8',
    marginHorizontal: 16,
  },
  bottomSpacer: {
    height: 20,
  },
});
