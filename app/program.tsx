import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PROGRAM_POINTS } from '@/constants/programData';

const ARM_GREEN = '#1B5E20';
const ARM_GOLD = '#C8A84B';

export default function ProgramScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ index?: string }>();
  const pointIndex = params.index !== undefined ? parseInt(params.index, 10) : -1;

  const isDetail = pointIndex >= 0 && pointIndex < PROGRAM_POINTS.length;
  const point = isDetail ? PROGRAM_POINTS[pointIndex] : null;

  const handleBack = () => {
    console.log('[ProgramScreen] Bouton retour appuyé');
    router.back();
  };

  const handlePointPress = (idx: number) => {
    console.log('[ProgramScreen] Carte programme appuyée, point:', idx + 1, PROGRAM_POINTS[idx].title);
    router.push({ pathname: '/program', params: { index: String(idx) } });
  };

  if (isDetail && point) {
    const pointNumber = String(pointIndex + 1);
    const accentColor = point.color;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.header, { backgroundColor: accentColor }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {point.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.detailHero, { backgroundColor: accentColor }]}>
            <View style={styles.detailNumberBadge}>
              <Text style={[styles.detailNumber, { color: accentColor }]}>{pointNumber}</Text>
            </View>
            <View style={styles.detailHeroIcon}>
              <Ionicons name={point.icon} size={36} color="#fff" />
            </View>
            <Text style={styles.detailHeroTitle}>{point.title}</Text>
          </View>

          <View style={styles.detailBody}>
            {point.subpoints.map((sub, i) => {
              const subKey = String(i);
              return (
                <View key={subKey} style={styles.subpointCard}>
                  <View style={[styles.subpointDot, { backgroundColor: accentColor }]} />
                  <View style={styles.subpointContent}>
                    <Text style={[styles.subpointTitle, { color: accentColor }]}>{sub.title}</Text>
                    <Text style={styles.subpointDescription}>{sub.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // List view — all 16 points
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notre Programme</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.listIntro}>
          <Text style={styles.listIntroTitle}>Programme Politique</Text>
          <Text style={styles.listIntroText}>
            Découvrez les 16 points du programme d'Alliance ARM pour un Mali prospère, démocratique et souverain.
          </Text>
        </View>

        <View style={styles.grid}>
          {PROGRAM_POINTS.map((pt, idx) => {
            const num = String(idx + 1);
            return (
              <TouchableOpacity
                key={num}
                style={styles.gridCard}
                onPress={() => handlePointPress(idx)}
                activeOpacity={0.8}
              >
                <View style={[styles.gridCardAccent, { backgroundColor: pt.color }]} />
                <View style={styles.gridCardInner}>
                  <Text style={[styles.gridCardNumber, { color: pt.color }]}>{num}</Text>
                  <View style={[styles.gridCardIconWrap, { backgroundColor: pt.color + '18' }]}>
                    <Ionicons name={pt.icon} size={22} color={pt.color} />
                  </View>
                  <Text style={styles.gridCardTitle} numberOfLines={2}>{pt.title}</Text>
                  <View style={styles.gridCardArrow}>
                    <Ionicons name="chevron-forward" size={14} color={pt.color} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.messageCard}
          onPress={() => {
            console.log('[ProgramScreen] Message au Rassemblement Malien appuyé');
            router.push('/arm-message');
          }}
          activeOpacity={0.8}
        >
          <View style={styles.messageCardAccent} />
          <View style={styles.messageCardInner}>
            <View style={styles.messageCardIconWrap}>
              <Ionicons name="mail-open-outline" size={22} color={ARM_GOLD} />
            </View>
            <View style={styles.messageCardText}>
              <Text style={styles.messageCardTitle}>Message au Rassemblement Malien</Text>
              <Text style={styles.messageCardSub}>Lire le message officiel de l'ARM Alliance</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={ARM_GOLD} />
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
  header: {
    backgroundColor: ARM_GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  // List view
  listIntro: {
    backgroundColor: ARM_GREEN,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 4,
  },
  listIntroTitle: {
    color: ARM_GOLD,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  listIntroText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 10,
  },
  gridCard: {
    width: '47.5%',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 3,
  },
  gridCardAccent: {
    height: 4,
    width: '100%',
  },
  gridCardInner: {
    padding: 12,
  },
  gridCardNumber: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 6,
  },
  gridCardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 18,
    marginBottom: 8,
  },
  gridCardArrow: {
    alignSelf: 'flex-end',
  },
  // Detail view
  detailHero: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  detailNumberBadge: {
    backgroundColor: '#fff',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  detailNumber: {
    fontSize: 22,
    fontWeight: '900',
  },
  detailHeroIcon: {
    marginBottom: 12,
  },
  detailHeroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
  },
  detailBody: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  subpointCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  subpointDot: {
    width: 5,
    borderRadius: 3,
  },
  subpointContent: {
    flex: 1,
    padding: 14,
  },
  subpointTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  subpointDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 21,
  },
  // Message card
  messageCard: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 3,
  },
  messageCardAccent: {
    height: 4,
    width: '100%',
    backgroundColor: ARM_GOLD,
  },
  messageCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  messageCardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: ARM_GREEN + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageCardText: {
    flex: 1,
  },
  messageCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  messageCardSub: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});
