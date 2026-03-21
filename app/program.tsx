import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

const STATIC_PROGRAM = [
  {
    id: '1',
    icon: 'people-outline',
    title: 'Démocratie & Gouvernance',
    description:
      "Alliance ARM s'engage pour une démocratie forte, des institutions transparentes et une gouvernance au service du peuple malien. Nous défendons l'État de droit, la séparation des pouvoirs et la lutte contre la corruption à tous les niveaux de l'État.",
    color: '#1B5E20',
  },
  {
    id: '2',
    icon: 'trending-up-outline',
    title: 'Développement Économique',
    description:
      "Notre programme économique vise à créer des emplois durables, soutenir l'agriculture, développer les PME et attirer les investissements étrangers. Nous croyons en une économie inclusive qui profite à tous les Maliens sans exception.",
    color: '#E65100',
  },
  {
    id: '3',
    icon: 'school-outline',
    title: 'Éducation & Formation',
    description:
      "L'éducation est notre priorité absolue. Nous nous engageons à améliorer la qualité de l'enseignement, construire des écoles modernes, former des enseignants qualifiés et garantir l'accès à l'éducation pour tous les enfants maliens.",
    color: '#1565C0',
  },
  {
    id: '4',
    icon: 'medkit-outline',
    title: 'Santé & Protection Sociale',
    description:
      "Nous voulons un système de santé accessible à tous les Maliens. Notre programme prévoit la construction d'hôpitaux, le recrutement de personnel médical qualifié et la mise en place d'une couverture santé universelle.",
    color: '#AD1457',
  },
  {
    id: '5',
    icon: 'shield-outline',
    title: 'Sécurité & Paix',
    description:
      "La sécurité du peuple malien est notre engagement premier. Nous travaillerons pour renforcer les forces de défense et de sécurité, promouvoir le dialogue inter-communautaire et restaurer la paix dans toutes les régions du Mali.",
    color: '#4527A0',
  },
  {
    id: '6',
    icon: 'leaf-outline',
    title: 'Agriculture & Environnement',
    description:
      "Le Mali est une terre agricole. Nous soutiendrons les agriculteurs avec des équipements modernes, des semences améliorées et des systèmes d'irrigation performants. Nous protégerons aussi l'environnement pour les générations futures.",
    color: '#2E7D32',
  },
];

interface ProgramItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

const ICON_MAP: Record<number, string> = {
  0: 'people-outline',
  1: 'trending-up-outline',
  2: 'school-outline',
  3: 'medkit-outline',
  4: 'shield-outline',
  5: 'leaf-outline',
};

const COLOR_MAP: Record<number, string> = {
  0: '#1B5E20',
  1: '#E65100',
  2: '#1565C0',
  3: '#AD1457',
  4: '#4527A0',
  5: '#2E7D32',
};

export default function ProgramScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [programData, setProgramData] = useState<ProgramItem[]>(STATIC_PROGRAM);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgram();
  }, []);

  const fetchProgram = async () => {
    console.log('[ProgramScreen] GET /api/program');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/program`);
      if (res.ok) {
        const data = await res.json();
        const sections = data.sections || [];
        if (sections.length > 0) {
          const mapped: ProgramItem[] = sections.map((s: any, i: number) => ({
            id: s.id || String(i + 1),
            icon: ICON_MAP[i] || 'document-outline',
            title: s.title,
            description: s.description,
            color: COLOR_MAP[i] || '#1B5E20',
          }));
          setProgramData(mapped);
        } else {
          setProgramData(STATIC_PROGRAM);
        }
      } else {
        setProgramData(STATIC_PROGRAM);
      }
    } catch {
      setProgramData(STATIC_PROGRAM);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    console.log('[ProgramScreen] Carte dépliée:', id);
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notre Programme</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B5E20" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            console.log('[ProgramScreen] Bouton retour appuyé');
            router.back();
          }}
          style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notre Programme</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Notre Programme Politique</Text>
          <Text style={styles.introText}>
            Découvrez les grandes lignes du programme d'Alliance ARM pour un Mali prospère,
            démocratique et en paix.
          </Text>
        </View>

        {programData.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => toggleExpand(item.id)}
            activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Ionicons
                name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
              />
            </View>
            {expandedId === item.id && (
              <View style={styles.cardBody}>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1B5E20',
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
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introSection: {
    backgroundColor: '#1B5E20',
    padding: 20,
    paddingTop: 0,
  },
  introTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  introText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  cardDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
});
