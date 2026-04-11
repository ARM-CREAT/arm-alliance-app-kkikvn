import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PROGRAM_POINTS } from '@/constants/programData';
import { BACKEND_URL } from '@/utils/api';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const ARM_LOGO = require('../../assets/images/64266d0b-d3c9-48ba-a184-30883aa2b0fa.jpeg');

const CARD_COLORS = [
  '#1B5E20',
  '#AD1457',
  '#1565C0',
  '#E65100',
  '#4527A0',
  '#00695C',
];

const DIRECTION_MEMBERS = [
  { name: 'Lassine Diakité', role: 'Président', location: 'Spain', phone: '0034632607101' },
  { name: 'Dadou Sangare', role: 'Premier Vice-Président', location: 'Milan, Italie', phone: '' },
  { name: 'Oumar Keita', role: 'Deuxième Vice-Président', location: 'Koutiala, Mali', phone: '0022376304869' },
  { name: 'Karifa Keita', role: 'Secrétaire Général', location: 'Bamako, Mali', phone: '' },
  { name: 'Modibo Keita', role: 'Secrétaire Administratif', location: 'Bamako, Mali', phone: '' },
  { name: 'Sokona Keita', role: 'Trésorière', location: 'Bamako, Mali', phone: '0022375179920' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [memberCount, setMemberCount] = useState<number>(0);

  useEffect(() => {
    const fetchMemberCount = async () => {
      console.log('[Home] Fetching member count from API');
      try {
        const response = await fetch(`${BACKEND_URL}/api/members/count`);
        if (!response.ok) {
          const text = await response.text();
          console.warn('[Home] Member count API error:', response.status, text);
          setMemberCount(0);
          return;
        }
        const data = await response.json();
        console.log('[Home] Member count response:', data);
        let raw: unknown;
        if (typeof data === 'number') {
          raw = data;
        } else if (data !== null && typeof data === 'object') {
          raw = (data as Record<string, unknown>).count
            ?? (data as Record<string, unknown>).total
            ?? (data as Record<string, unknown>).memberCount
            ?? (data as Record<string, unknown>).members
            ?? 0;
        } else {
          raw = 0;
        }
        const count = Number(raw);
        setMemberCount(isNaN(count) ? 0 : count);
      } catch (err) {
        console.warn('[Home] Failed to fetch member count:', err);
        setMemberCount(0);
      }
    };
    fetchMemberCount();
  }, []);

  const displayedProgram = PROGRAM_POINTS.slice(0, 6);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── 1. Hero Header ── */}
      <View style={styles.hero}>
        <Image source={resolveImageSource(ARM_LOGO)} style={styles.heroLogo} />
        <Text style={styles.heroTitle}>A.R.M</Text>
        <Text style={styles.heroSubtitle}>Alliance pour le Rassemblement Malien</Text>
        <View style={styles.taglineRow}>
          <View style={styles.taglineLine} />
          <Text style={styles.taglineText}>Fraternité • Liberté • Égalité</Text>
          <View style={styles.taglineLine} />
        </View>
        <View style={styles.memberCountCard}>
          <Text style={styles.memberCountNumber}>{memberCount}</Text>
          <Text style={styles.memberCountLabel}>membres inscrits</Text>
        </View>
      </View>

      {/* ── 2. Notre Programme ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="document-text" size={22} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Notre Programme</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              console.log('[Home] Voir tout Programme appuyé');
              router.push('/program');
            }}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.programGrid}>
          {displayedProgram.map((item, index) => {
            const cardColor = CARD_COLORS[index % CARD_COLORS.length];
            const cardNumber = String(index + 1);
            return (
              <TouchableOpacity
                key={item.title}
                style={styles.programCard}
                onPress={() => {
                  console.log('[Home] Programme card appuyé:', item.title);
                  router.push({ pathname: '/program', params: { index: String(index) } });
                }}
              >
                <View style={[styles.programCardTop, { backgroundColor: cardColor }]} />
                <View style={styles.programCardBody}>
                  <Text style={[styles.programCardNumber, { color: cardColor }]}>{cardNumber}</Text>
                  <View style={[styles.programIconCircle, { backgroundColor: cardColor + '18' }]}>
                    <Ionicons name={item.icon} size={22} color={cardColor} />
                  </View>
                  <Text style={styles.programCardTitle}>{item.title}</Text>
                  <View style={styles.programCardArrow}>
                    <Ionicons name="chevron-forward" size={16} color={cardColor} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── 3. Notre Idéologie ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="book" size={22} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Notre Idéologie</Text>
          </View>
        </View>
        <View style={styles.ideologyCard}>
          <Text style={styles.ideologyCardTitle}>Une vision, une force, une mission</Text>
          <Text style={styles.ideologyCardDesc}>
            A.R.M est un mouvement politique enraciné dans les réalités du peuple malien, fondé sur la fraternité, la liberté et l'égalité.
          </Text>
          <TouchableOpacity
            style={styles.ideologyBtn}
            onPress={() => {
              console.log('[Home] Découvrir notre idéologie appuyé');
              router.push('/ideology');
            }}
          >
            <Text style={styles.ideologyBtnText}>Découvrir notre idéologie</Text>
            <Text style={styles.ideologyBtnArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 4. Soutenez-nous ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="heart" size={22} color="#F9A825" />
            <Text style={styles.sectionTitle}>Soutenez-nous</Text>
          </View>
        </View>
        <View style={styles.supportCard}>
          <Text style={styles.supportCardText}>
            Votre contribution régulière aide à construire un Mali meilleur
          </Text>
          <View style={styles.supportRow}>
            <Ionicons name="calendar" size={20} color="#555" />
            <Text style={styles.supportRowText}>Contribution mensuelle</Text>
          </View>
          <View style={styles.supportRow}>
            <Ionicons name="calendar" size={20} color="#555" />
            <Text style={styles.supportRowText}>Contribution annuelle</Text>
          </View>
          <TouchableOpacity
            style={styles.donationBtn}
            onPress={() => {
              console.log('[Home] Faire une contribution appuyé');
              router.push('/donation');
            }}
          >
            <Text style={styles.donationBtnText}>Faire une contribution</Text>
            <Text style={styles.donationBtnArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 5. Actions rapides ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="grid" size={22} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Actions rapides</Text>
          </View>
        </View>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              console.log('[Home] Action Adhérer appuyée');
              router.push('/member/register');
            }}
          >
            <Ionicons name="person-add" size={32} color="#2E7D32" />
            <Text style={styles.actionCardTitle}>Adhérer</Text>
            <Text style={styles.actionCardSub}>Rejoindre l'ARM</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              console.log('[Home] Action Ma Carte appuyée');
              router.push('/member/card');
            }}
          >
            <Ionicons name="id-card" size={32} color="#2E7D32" />
            <Text style={styles.actionCardTitle}>Ma Carte</Text>
            <Text style={styles.actionCardSub}>Accès libre</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              console.log('[Home] Action Admin appuyée');
              router.push('/admin');
            }}
          >
            <Ionicons name="shield" size={32} color="#F9A825" />
            <Text style={styles.actionCardTitle}>Admin</Text>
            <Text style={styles.actionCardSub}>Accès sécurisé</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardGreenBg]}
            onPress={() => {
              console.log('[Home] Action Notre Programme appuyée');
              router.push('/program');
            }}
          >
            <Ionicons name="document-text" size={32} color="#2E7D32" />
            <Text style={styles.actionCardTitle}>Notre{'\n'}Programme</Text>
            <Text style={styles.actionCardSub}>Programme politique</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardBlueBg]}
            onPress={() => {
              console.log('[Home] Action Adhérents appuyée');
              router.push('/members-list');
            }}
          >
            <Ionicons name="people" size={32} color="#1565C0" />
            <Text style={[styles.actionCardTitle, { color: '#1565C0' }]}>Adhérents</Text>
            <Text style={[styles.actionCardSub, { color: '#1565C0' }]}>Liste complète</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardGreenBg]}
            onPress={() => {
              console.log('[Home] Action Guide des Partis appuyée');
              router.push('/ideology');
            }}
          >
            <Ionicons name="book" size={32} color="#2E7D32" />
            <Text style={styles.actionCardTitle}>Guide des Partis</Text>
            <Text style={styles.actionCardSub}>Outil pédagogique</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 6. Direction du Parti ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="people" size={22} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Direction du Parti</Text>
          </View>
        </View>
        <View style={styles.card}>
          {DIRECTION_MEMBERS.map((member, index) => (
            <View key={member.name}>
              <View style={styles.memberRow}>
                <Image source={resolveImageSource(ARM_LOGO)} style={styles.memberAvatar} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                  <Text style={styles.memberLocation}>{member.location}</Text>
                  {member.phone ? <Text style={styles.memberPhone}>{member.phone}</Text> : null}
                </View>
              </View>
              {index < DIRECTION_MEMBERS.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      </View>

      {/* ── 7. Siège du Parti ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="business" size={22} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Siège du Parti</Text>
          </View>
        </View>
        <View style={styles.siegeCard}>
          <Text style={styles.siegeText}>Rue 530, Porte 245</Text>
          <Text style={styles.siegeText}>Sebenikoro, Bamako</Text>
          <Text style={styles.siegeText}>Mali</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { paddingBottom: 120 },

  // Hero
  hero: {
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  heroLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#F9A825',
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.95,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  taglineLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#F9A825',
    opacity: 0.8,
  },
  taglineText: {
    color: '#F9A825',
    fontStyle: 'italic',
    fontWeight: '600',
    fontSize: 15,
  },
  memberCountCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  memberCountNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F9A825',
  },
  memberCountLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 2,
  },

  // Section
  section: { marginTop: 24, marginHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
  },

  // Programme grid
  programGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  programCard: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  programCardTop: {
    height: 5,
    width: '100%',
  },
  programCardBody: {
    padding: 14,
  },
  programCardNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  programIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  programCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  programCardArrow: {
    alignItems: 'flex-end',
  },

  // Ideology card
  ideologyCard: {
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    padding: 20,
  },
  ideologyCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 26,
  },
  ideologyCardDesc: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 16,
    opacity: 0.92,
  },
  ideologyBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ideologyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
  },
  ideologyBtnArrow: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: '600',
  },

  // Support card
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  supportCardText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  supportRowText: {
    fontSize: 15,
    color: '#333',
  },
  donationBtn: {
    backgroundColor: '#F9A825',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  donationBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  donationBtnArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Actions grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  actionCardGreenBg: {
    backgroundColor: '#F1F8E9',
  },
  actionCardBlueBg: {
    backgroundColor: '#E3F2FD',
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 10,
    textAlign: 'center',
  },
  actionCardSub: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },

  // Direction card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  memberAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 2,
  },
  memberLocation: {
    fontSize: 13,
    color: '#666',
  },
  memberPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 84,
  },

  // Siège du Parti
  siegeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  siegeText: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
});
