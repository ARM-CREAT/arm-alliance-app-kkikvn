import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
  ImageSourcePropType,
  Image,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#2E7D32';
const DARK_GREEN = '#1a5c2a';
const ACCENT = '#FFC107';
const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

interface MemberData {
  id?: string;
  member_number?: string;
  full_name?: string;
  phone?: string;
  commune?: string;
  status?: string;
  created_at?: string;
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

export default function MemberCardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    member?: string;
    member_number?: string;
    full_name?: string;
    commune?: string;
    status?: string;
    created_at?: string;
  }>();

  let member: MemberData | null = null;

  if (params.member) {
    try {
      member = JSON.parse(params.member) as MemberData;
      console.log('[MemberCard] Données reçues via param member:', member.member_number);
    } catch {
      console.log('[MemberCard] Erreur parsing param member');
    }
  } else if (params.member_number) {
    member = {
      member_number: params.member_number,
      full_name: params.full_name,
      commune: params.commune,
      status: params.status,
      created_at: params.created_at,
    };
    console.log('[MemberCard] Données reçues via params individuels:', member.member_number);
  }

  const handleHome = () => {
    console.log('[MemberCard] Bouton Retour à l\'accueil appuyé');
    router.replace('/(tabs)');
  };

  const handleShare = () => {
    console.log('[MemberCard] Bouton Partager ma carte appuyé');
    Alert.alert('Partager', 'Fonctionnalité de partage bientôt disponible.');
  };

  if (!member) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen
          options={{
            title: 'Carte de Membre',
            headerShown: true,
            headerBackTitle: 'Retour',
            headerStyle: { backgroundColor: PRIMARY },
            headerTintColor: '#fff',
          }}
        />
        <Ionicons name="card-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Aucune donnée de carte disponible</Text>
        <TouchableOpacity style={styles.homeButton} onPress={handleHome} activeOpacity={0.85}>
          <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const memberNumber = member.member_number || '—';
  const fullName = member.full_name || '—';
  const commune = member.commune || '—';
  const statusRaw = member.status || 'active';
  const statusLabel = statusRaw === 'active' ? 'Actif' : statusRaw === 'pending' ? 'En attente' : statusRaw;
  const statusColor = statusRaw === 'active' ? '#34C759' : statusRaw === 'pending' ? '#FF9500' : '#8E8E93';
  const joinDate = formatDate(member.created_at);
  const monoFont = Platform.OS === 'ios' ? 'Courier' : 'monospace';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Carte de Membre',
          headerShown: true,
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: PRIMARY },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success banner */}
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={28} color={ACCENT} />
          <Text style={styles.successText}>Inscription confirmée !</Text>
        </View>

        {/* Digital Card */}
        <View style={styles.cardShadow}>
          <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Image
                source={resolveImageSource(require('@/assets/images/48b93c14-0824-4757-b7a4-95824e04a9a8.jpeg'))}
                style={styles.cardLogo}
              />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardOrgName}>ALLIANCE POUR LE RENOUVEAU DU MALI</Text>
                <Text style={styles.cardLabel}>CARTE DE MEMBRE</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusBadgeText}>{statusLabel}</Text>
              </View>
            </View>

            {/* Gold stripe */}
            <View style={styles.goldStripe} />

            {/* Shield icon */}
            <View style={styles.shieldRow}>
              <Ionicons name="shield-checkmark" size={32} color={ACCENT} />
            </View>

            {/* Member number */}
            <View style={styles.memberNumberBox}>
              <Text style={styles.memberNumberLabel}>NUMÉRO DE MEMBRE</Text>
              <Text style={[styles.memberNumber, { fontFamily: monoFont }]}>{memberNumber}</Text>
            </View>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Info rows */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>NOM COMPLET</Text>
                <Text style={styles.infoValue}>{fullName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>COMMUNE / VILLE</Text>
                <Text style={styles.infoValue}>{commune}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>DATE D'ADHÉSION</Text>
                <Text style={styles.infoValue}>{joinDate}</Text>
              </View>
            </View>

            {/* Card Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Fraternité • Liberté • Égalité</Text>
            </View>
          </View>
        </View>

        {/* Hint */}
        <Text style={styles.hint}>Conservez ce numéro précieusement</Text>

        {/* Action buttons */}
        <TouchableOpacity style={styles.homeButton} onPress={handleHome} activeOpacity={0.85}>
          <Ionicons name="home" size={18} color="#fff" style={styles.btnIcon} />
          <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
          <Ionicons name="share-social-outline" size={18} color={PRIMARY} style={styles.btnIcon} />
          <Text style={styles.shareButtonText}>Partager ma carte</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_GREEN,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
    width: '100%',
  },
  successText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderRadius: 20,
    marginBottom: 16,
    width: CARD_WIDTH,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: DARK_GREEN,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: ACCENT + '60',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cardLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: ACCENT,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardOrgName: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
    lineHeight: 13,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 1.5,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  goldStripe: {
    height: 3,
    backgroundColor: ACCENT,
  },
  shieldRow: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  memberNumberBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  memberNumberLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  memberNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: ACCENT,
    letterSpacing: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 16,
  },
  infoSection: {
    padding: 16,
    gap: 12,
  },
  infoRow: {
    gap: 3,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  cardFooter: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  cardFooterText: {
    fontSize: 11,
    color: ACCENT,
    fontStyle: 'italic',
    letterSpacing: 1,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  homeButton: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  shareButton: {
    borderWidth: 2,
    borderColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  shareButtonText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  btnIcon: {
    marginRight: 8,
  },
});
