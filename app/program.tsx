
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Stack } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

interface ProgramSection {
  id?: string;
  title: string;
  description: string;
}

const STATIC_PROGRAM: ProgramSection[] = [
  {
    title: "Démocratie & Gouvernance",
    description:
      "Alliance ARM s'engage pour une démocratie forte, des institutions transparentes et une gouvernance au service du peuple malien. Nous défendons l'État de droit, la séparation des pouvoirs et la lutte contre la corruption.",
  },
  {
    title: "Développement Économique",
    description:
      "Notre programme économique vise à créer des emplois, soutenir l'agriculture, développer les PME et attirer les investissements étrangers. Nous croyons en une économie inclusive qui profite à tous les Maliens.",
  },
  {
    title: "Éducation & Formation",
    description:
      "L'éducation est notre priorité. Nous nous engageons à améliorer la qualité de l'enseignement, construire des écoles, former des enseignants qualifiés et garantir l'accès à l'éducation pour tous les enfants maliens.",
  },
  {
    title: "Santé & Protection Sociale",
    description:
      "Nous voulons un système de santé accessible à tous. Notre programme prévoit la construction d'hôpitaux, le recrutement de personnel médical et la mise en place d'une couverture santé universelle.",
  },
  {
    title: "Sécurité & Paix",
    description:
      "La sécurité du peuple malien est notre engagement premier. Nous travaillerons pour renforcer les forces de défense, promouvoir le dialogue inter-communautaire et restaurer la paix dans toutes les régions du Mali.",
  },
  {
    title: "Agriculture & Environnement",
    description:
      "Le Mali est une terre agricole. Nous soutiendrons les agriculteurs avec des équipements modernes, des semences améliorées et des systèmes d'irrigation. Nous protégerons aussi l'environnement pour les générations futures.",
  },
];

export default function ProgramScreen() {
  const [sections, setSections] = useState<ProgramSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[ProgramScreen] Chargement du programme politique');
    fetchProgram();
  }, []);

  const fetchProgram = async () => {
    console.log('[ProgramScreen] GET /api/program');
    try {
      const res = await fetch(`${BACKEND_URL}/api/program`);
      if (!res.ok) {
        const text = await res.text();
        console.warn('[ProgramScreen] Réponse non-OK:', res.status, text);
        setSections(STATIC_PROGRAM);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log('[ProgramScreen] Programme chargé depuis API:', data.length, 'sections');
        setSections(data);
      } else {
        console.log('[ProgramScreen] API vide, utilisation du contenu statique');
        setSections(STATIC_PROGRAM);
      }
    } catch (err) {
      console.warn('[ProgramScreen] Erreur API, utilisation du contenu statique:', err);
      setSections(STATIC_PROGRAM);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Notre Programme",
            headerShown: true,
            headerBackTitle: "Retour",
            headerStyle: { backgroundColor: '#1B5E20' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement du programme...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Notre Programme",
          headerShown: true,
          headerBackTitle: "Retour",
          headerStyle: { backgroundColor: '#1B5E20' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Hero Header */}
        <View style={styles.hero}>
          <View style={styles.heroIconContainer}>
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={40}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.heroTitle}>Alliance ARM</Text>
          <Text style={styles.heroSubtitle}>Notre Programme Politique</Text>
          <View style={styles.heroSeparator} />
          <Text style={styles.heroTagline}>
            Un programme pour un Mali fort, uni et prospère
          </Text>
        </View>

        {/* Program Sections */}
        <View style={styles.sectionsContainer}>
          {sections.map((section, index) => {
            const sectionNumber = String(index + 1);
            return (
              <View key={section.id || String(index)} style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>{sectionNumber}</Text>
                  </View>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                <Text style={styles.sectionDescription}>{section.description}</Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              console.log('[ProgramScreen] Bouton Actualiser appuyé');
              setLoading(true);
              fetchProgram();
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="arrow.clockwise"
              android_material_icon_name="refresh"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.retryButtonText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  hero: {
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
  },
  heroSeparator: {
    width: 48,
    height: 2,
    backgroundColor: '#F4C430',
    marginBottom: 16,
    borderRadius: 1,
  },
  heroTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  numberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1B5E20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  numberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  retryButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
