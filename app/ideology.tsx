
import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { BACKEND_URL } from "@/utils/api-helpers";

interface IdeologySection {
  key: string;
  title: string;
  content: string;
}

// Static fallback content
const STATIC_SECTIONS: IdeologySection[] = [
  {
    key: 'fondements',
    title: 'Fondements de l\'idéologie',
    content: 'L\'Alliance pour le Rassemblement Malien est un mouvement politique qui puise sa légitimité et sa vision dans les réalités profondes du peuple malien. Son idéologie repose sur trois piliers fondamentaux : la fraternité, la liberté et l\'égalité, qui ne sont pas de simples slogans, mais des engagements concrets pour bâtir une société plus juste, plus unie, et plus digne.',
  },
  {
    key: 'fraternite',
    title: 'Fraternité',
    content: 'Rassembler le peuple malien au-delà des appartenances ethniques, religieuses ou régionales. A.R.M croit en un Mali réconcilié avec lui-même, où l\'unité nationale surpasse les divisions.',
  },
  {
    key: 'liberte',
    title: 'Liberté',
    content: 'Défendre l\'État de droit, la démocratie participative, la transparence et l\'alternance. Le parti se veut la voix des silencieux, le bras des laissés-pour-compte.',
  },
  {
    key: 'egalite',
    title: 'Égalité',
    content: 'Garantir la justice sociale pour tous. Le cœur de ceux qui aspirent à une vie meilleure dans la paix, la dignité, et le progrès.',
  },
  {
    key: 'aes',
    title: 'L\'AES et le Mali',
    content: 'L\'Alliance pour le Rassemblement Malien salue la création et la consolidation de l\'Alliance des États du Sahel comme un acte de souveraineté collective. L\'ARM considère l\'AES comme un cadre stratégique déjà structuré, doté de mécanismes de coordination politique, de dispositifs de sécurité collective, et d\'outils économiques et financiers.',
  },
  {
    key: 'vision',
    title: 'Une idéologie en mouvement',
    content: 'A.R.M n\'est pas un parti figé dans le passé : c\'est un mouvement innovant, ambitieux, moderne, qui intègre les outils numériques, la jeunesse, la diaspora et les femmes dans tous ses processus de réflexion et de décision.',
  },
];

export default function IdeologyScreen() {
  const [sections, setSections] = useState<IdeologySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const loadIdeology = useCallback(async () => {
    console.log('[Ideology] GET /api/ideology');
    try {
      const res = await fetch(`${BACKEND_URL}/api/ideology`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn('[Ideology] API error:', res.status, errText, '— using static fallback');
        setSections(STATIC_SECTIONS);
        setUsingFallback(true);
        return;
      }

      const data = await res.json();
      console.log('[Ideology] API response received');

      const apiSections: IdeologySection[] = Array.isArray(data?.sections)
        ? data.sections
        : Array.isArray(data)
        ? data
        : [];

      if (apiSections.length > 0) {
        setSections(apiSections);
        setUsingFallback(false);
        console.log('[Ideology] Loaded', apiSections.length, 'sections from API');
      } else {
        console.warn('[Ideology] Empty API response — using static fallback');
        setSections(STATIC_SECTIONS);
        setUsingFallback(true);
      }
    } catch (err: any) {
      console.error('[Ideology] Fetch error:', err.message, '— using static fallback');
      setSections(STATIC_SECTIONS);
      setUsingFallback(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadIdeology();
  }, [loadIdeology]);

  const onRefresh = useCallback(() => {
    console.log('[Ideology] Pull-to-refresh triggered');
    setRefreshing(true);
    loadIdeology();
  }, [loadIdeology]);

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Idéologie du Parti",
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.background,
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Idéologie du Parti",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.background,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Card */}
        <View style={styles.section}>
          <View style={styles.headerCard}>
            <Text style={styles.mainTitle}>Alliance pour le Rassemblement Malien</Text>
            <Text style={styles.subtitle}>Une vision, une force, une mission</Text>
          </View>
        </View>

        {/* Dynamic sections from API */}
        {sections.map((sec, index) => (
          <View key={sec.key || String(index)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={22}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>{sec.title}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.bodyText}>{sec.content}</Text>
            </View>
          </View>
        ))}

        {/* Static speech section — always shown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="megaphone.fill"
              android_material_icon_name="campaign"
              size={22}
              color={colors.accent}
            />
            <Text style={styles.sectionTitle}>Discours Officiel du Président</Text>
          </View>

          <View style={styles.speechCard}>
            <Text style={styles.speechSubtitle}>Sur l&apos;Alliance des États du Sahel (AES)</Text>

            <View style={styles.speechHighlight}>
              <Text style={styles.speechHighlightText}>L&apos;AES n&apos;est pas un slogan.</Text>
              <Text style={styles.speechHighlightText}>L&apos;AES n&apos;est pas une simple organisation de plus.</Text>
              <Text style={styles.speechHighlightText}>L&apos;AES est une réponse historique à des décennies de dépendance, d&apos;insécurité imposée et de modèles de développement inadaptés à nos réalités.</Text>
            </View>

            <View style={styles.speechSection}>
              <View style={styles.speechSectionHeader}>
                <Text style={styles.speechSectionNumber}>1.</Text>
                <Text style={styles.speechSectionTitle}>La vision de l&apos;ARM sur l&apos;AES</Text>
              </View>
              <Text style={styles.speechText}>
                L&apos;Alliance pour le Rassemblement Malien salue la création et la consolidation de l&apos;AES comme un acte de souveraineté collective. Notre rôle, en tant que parti politique responsable, n&apos;est pas de réinventer l&apos;AES, mais de l&apos;accompagner, de l&apos;enraciner et de l&apos;intégrer intelligemment dans les politiques nationales du Mali.
              </Text>
            </View>

            <View style={styles.speechSection}>
              <View style={styles.speechSectionHeader}>
                <Text style={styles.speechSectionNumber}>2.</Text>
                <Text style={styles.speechSectionTitle}>AES et gouvernance intègre</Text>
              </View>
              <Text style={styles.speechText}>
                Aucune intégration régionale ne peut réussir sans une gouvernance exemplaire. C&apos;est pourquoi l&apos;ARM lie indissociablement l&apos;accompagnement de l&apos;AES à une lutte ferme contre la corruption.
              </Text>
            </View>

            <View style={styles.speechFinalMessage}>
              <Text style={styles.speechFinalText}>Notre destin est lié.</Text>
              <Text style={styles.speechFinalText}>Nos combats sont communs.</Text>
              <Text style={styles.speechFinalText}>Nos victoires seront partagées.</Text>
            </View>
          </View>
        </View>

        {/* Conclusion */}
        <View style={styles.section}>
          <View style={styles.conclusionCard}>
            <Text style={styles.conclusionText}>
              L&apos;Alliance pour le Rassemblement Malien est née d&apos;un cri du cœur : celui de tout un peuple qui aspire à être entendu, respecté et servi.
            </Text>
            <Text style={styles.conclusionHighlight}>
              A.R.M n&apos;est pas seulement un nom. C&apos;est une vision, une force, une mission.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { paddingTop: Platform.OS === 'android' ? 16 : 0, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: colors.textSecondary },
  section: { paddingHorizontal: 20, marginTop: 24 },
  headerCard: { backgroundColor: colors.primary, borderRadius: 16, padding: 24, alignItems: 'center' },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: colors.background, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.secondary, textAlign: 'center', fontStyle: 'italic' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 8, flex: 1 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  bodyText: { fontSize: 16, color: colors.text, lineHeight: 24, marginBottom: 8 },
  speechCard: { backgroundColor: colors.card, borderRadius: 16, padding: 24, borderLeftWidth: 6, borderLeftColor: colors.accent, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  speechSubtitle: { fontSize: 18, fontWeight: 'bold', color: colors.accent, textAlign: 'center', marginBottom: 20 },
  speechText: { fontSize: 16, color: colors.text, lineHeight: 26, marginBottom: 16, textAlign: 'justify' },
  speechHighlight: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, marginVertical: 16 },
  speechHighlightText: { fontSize: 16, color: colors.background, lineHeight: 24, marginBottom: 8, fontWeight: '600' },
  speechSection: { marginTop: 24, marginBottom: 16 },
  speechSectionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  speechSectionNumber: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginRight: 8 },
  speechSectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, flex: 1 },
  speechFinalMessage: { backgroundColor: colors.accent, borderRadius: 12, padding: 16, marginVertical: 16 },
  speechFinalText: { fontSize: 17, color: colors.background, lineHeight: 26, marginBottom: 8, fontWeight: 'bold', textAlign: 'center' },
  conclusionCard: { backgroundColor: colors.primary, borderRadius: 12, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  conclusionText: { fontSize: 16, color: colors.background, lineHeight: 24, marginBottom: 16 },
  conclusionHighlight: { fontSize: 18, fontWeight: 'bold', color: colors.secondary, lineHeight: 26, textAlign: 'center', fontStyle: 'italic' },
  bottomSpacer: { height: 20 },
});
