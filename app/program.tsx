
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiGet } from '@/utils/api';
import * as Haptics from 'expo-haptics';

interface ProgramItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  color?: string;
  content?: string;
  category?: string;
  order?: number;
}

const STATIC_PROGRAMS: ProgramItem[] = [
  {
    id: 'economie',
    title: 'Économie & Développement',
    description: 'Relancer l\'économie malienne par des investissements stratégiques et la création d\'emplois durables.',
    icon: '💰',
    color: '#2D8B3C',
    content: 'Notre programme économique vise à diversifier les sources de revenus du Mali, à soutenir les PME locales, à attirer les investissements étrangers responsables et à développer les infrastructures économiques. Nous nous engageons à réduire le chômage des jeunes de 40% en 5 ans grâce à des programmes de formation professionnelle et de création d\'entreprises.',
  },
  {
    id: 'education',
    title: 'Éducation & Formation',
    description: 'Garantir un accès universel à une éducation de qualité pour tous les enfants maliens.',
    icon: '📚',
    color: '#1565C0',
    content: 'L\'A.R.M s\'engage à construire 500 nouvelles écoles dans les zones rurales, à former 10 000 enseignants qualifiés, à distribuer des manuels scolaires gratuits et à développer l\'enseignement numérique. Nous voulons porter le taux de scolarisation à 95% d\'ici 2030 et réduire l\'analphabétisme de moitié.',
  },
  {
    id: 'sante',
    title: 'Santé & Bien-être',
    description: 'Assurer des soins de santé accessibles et de qualité pour toute la population malienne.',
    icon: '🏥',
    color: '#E63946',
    content: 'Notre programme de santé prévoit la construction de 200 centres de santé communautaires, le recrutement de 5 000 professionnels de santé, la mise en place d\'une couverture maladie universelle et le renforcement de la chaîne d\'approvisionnement en médicaments essentiels. Nous voulons réduire la mortalité infantile de 60% en 10 ans.',
  },
  {
    id: 'securite',
    title: 'Sécurité & Paix',
    description: 'Restaurer la paix et la sécurité sur l\'ensemble du territoire malien.',
    icon: '🛡️',
    color: '#6C3483',
    content: 'L\'A.R.M propose une approche globale de la sécurité : renforcement des forces armées et de sécurité, dialogue inter-communautaire, désarmement des groupes armés, développement des zones de conflit et coopération régionale. Nous croyons que la paix durable passe par la justice sociale et le développement économique des régions marginalisées.',
  },
  {
    id: 'agriculture',
    title: 'Agriculture & Alimentation',
    description: 'Moderniser l\'agriculture malienne pour assurer la souveraineté alimentaire.',
    icon: '🌾',
    color: '#D4AC0D',
    content: 'Notre programme agricole vise à moderniser les techniques de culture, à développer l\'irrigation, à soutenir les coopératives paysannes et à créer des marchés locaux. Nous nous engageons à doubler la production agricole en 5 ans, à réduire les importations alimentaires et à garantir la sécurité alimentaire pour tous les Maliens.',
  },
  {
    id: 'environnement',
    title: 'Environnement & Climat',
    description: 'Protéger l\'environnement malien et lutter contre les effets du changement climatique.',
    icon: '🌿',
    color: '#117A65',
    content: 'Face à la désertification et au changement climatique, l\'A.R.M propose de planter 100 millions d\'arbres, de développer les énergies renouvelables (solaire, éolien), de protéger les ressources en eau et de promouvoir une agriculture durable. Nous voulons que le Mali devienne un modèle africain de développement vert.',
  },
  {
    id: 'infrastructure',
    title: 'Infrastructures & Transport',
    description: 'Développer les infrastructures pour désenclaver les régions et stimuler l\'économie.',
    icon: '🏗️',
    color: '#784212',
    content: 'Notre programme d\'infrastructures prévoit la construction de 3 000 km de routes bitumées, la réhabilitation des voies ferrées, le développement des aéroports régionaux et l\'accès à l\'électricité pour 90% de la population d\'ici 2030. Ces investissements créeront des emplois et faciliteront les échanges commerciaux.',
  },
  {
    id: 'diaspora',
    title: 'Diaspora & Coopération',
    description: 'Mobiliser la diaspora malienne comme levier de développement national.',
    icon: '🌍',
    color: '#1A5276',
    content: 'L\'A.R.M reconnaît le rôle crucial de la diaspora malienne dans le développement du pays. Nous proposons de créer un fonds d\'investissement diaspora, de faciliter les transferts d\'argent, de valoriser les compétences des Maliens de l\'étranger et de renforcer leur participation à la vie politique nationale.',
  },
];

function ProgramCard({ item, isExpanded, onToggle }: {
  item: ProgramItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const cardColor = item.color || colors.primary;
  const iconText = item.icon || '📋';
  const expandedText = isExpanded ? 'Réduire' : 'Lire plus';
  const chevronIcon = isExpanded ? 'expand-less' : 'expand-more';

  return (
    <TouchableOpacity
      style={[styles.programCard, { borderLeftColor: cardColor }]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: cardColor + '18' }]}>
          <Text style={styles.iconEmoji}>{iconText}</Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={[styles.cardTitle, { color: cardColor }]}>{item.title}</Text>
          <Text style={styles.cardDescription} numberOfLines={isExpanded ? undefined : 2}>
            {item.description}
          </Text>
        </View>
        <IconSymbol
          android_material_icon_name={chevronIcon}
          size={24}
          color={cardColor}
        />
      </View>

      {isExpanded && item.content ? (
        <View style={styles.cardContent}>
          <View style={[styles.contentDivider, { backgroundColor: cardColor + '40' }]} />
          <Text style={styles.contentText}>{item.content}</Text>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={[styles.readMoreText, { color: cardColor }]}>{expandedText}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProgramScreen() {
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramItem[]>(STATIC_PROGRAMS);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [fadeAnim] = useState(new Animated.Value(1));

  const loadPrograms = useCallback(async () => {
    console.log('[ProgramScreen] Chargement du programme politique depuis /api/programs');
    setError(null);

    try {
      const data = await apiGet<ProgramItem[]>('/api/programs');
      console.log('[ProgramScreen] Programme chargé avec succès:', Array.isArray(data) ? data.length : 0, 'éléments');

      if (Array.isArray(data) && data.length > 0) {
        setPrograms(data);
      } else {
        console.log('[ProgramScreen] API vide - utilisation du contenu statique de démonstration');
        setPrograms(STATIC_PROGRAMS);
      }
    } catch (err: any) {
      console.warn('[ProgramScreen] Erreur API - utilisation du contenu statique:', err.message);
      setPrograms(STATIC_PROGRAMS);
    }
  }, []);

  useEffect(() => {
    console.log('[ProgramScreen] Composant monté');
    loadPrograms();
  }, [loadPrograms]);

  const onRefresh = useCallback(async () => {
    console.log('[ProgramScreen] Actualisation par l\'utilisateur');
    setRefreshing(true);
    await loadPrograms();
    setRefreshing(false);
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [loadPrograms]);

  const handleToggleExpand = (id: string) => {
    console.log('[ProgramScreen] Utilisateur a cliqué sur la carte programme:', id);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBack = () => {
    console.log('[ProgramScreen] Utilisateur a appuyé sur le bouton retour');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleExpandAll = () => {
    console.log('[ProgramScreen] Utilisateur a appuyé sur Tout développer');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (expandedIds.size === programs.length) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(programs.map(p => p.id)));
    }
  };

  const allExpanded = expandedIds.size === programs.length && programs.length > 0;
  const toggleAllLabel = allExpanded ? 'Tout réduire' : 'Tout développer';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Programme Politique',
          headerBackTitle: 'Retour',
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Hero Header */}
          <View style={styles.hero}>
            <View style={styles.heroIconRow}>
              <Text style={styles.heroEmoji}>📋</Text>
            </View>
            <Text style={styles.heroTitle}>Programme Politique</Text>
            <Text style={styles.heroSubtitle}>A.R.M — Alliance pour le Rassemblement Malien</Text>
            <View style={styles.mottoRow}>
              <View style={styles.mottoLine} />
              <Text style={styles.mottoText}>Fraternité • Liberté • Égalité</Text>
              <View style={styles.mottoLine} />
            </View>
          </View>

          {/* Intro */}
          <View style={styles.introCard}>
            <IconSymbol
              android_material_icon_name="info"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.introText}>
              Découvrez les engagements concrets de l&apos;A.R.M pour transformer le Mali. Appuyez sur chaque thème pour lire le détail du programme.
            </Text>
          </View>

          {/* Expand All */}
          {programs.length > 0 ? (
            <View style={styles.actionsRow}>
              <Text style={styles.programCount}>
                {programs.length}
                {' '}
                thèmes
              </Text>
              <TouchableOpacity
                style={styles.expandAllButton}
                onPress={handleExpandAll}
                activeOpacity={0.7}
              >
                <IconSymbol
                  android_material_icon_name={allExpanded ? 'unfold-less' : 'unfold-more'}
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.expandAllText}>{toggleAllLabel}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Program Cards */}
          <View style={styles.cardsContainer}>
            {programs.map(item => (
              <ProgramCard
                key={item.id}
                item={item}
                isExpanded={expandedIds.has(item.id)}
                onToggle={() => handleToggleExpand(item.id)}
              />
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <Text style={styles.footerText}>Fraternité • Liberté • Égalité</Text>
            <Text style={styles.footerSub}>© A.R.M — Alliance pour le Rassemblement Malien</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <IconSymbol
                android_material_icon_name="arrow-back"
                size={18}
                color={colors.background}
              />
              <Text style={styles.backButtonText}>Retour à l&apos;accueil</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  contentContainer: {
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
  },
  heroIconRow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 36,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.background,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 16,
  },
  mottoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mottoLine: {
    width: 32,
    height: 1,
    backgroundColor: colors.secondary,
    marginHorizontal: 10,
  },
  mottoText: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  // Intro
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Actions row
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  programCount: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  expandAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  expandAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  // Cards
  cardsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  programCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 24,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardContent: {
    marginTop: 12,
  },
  contentDivider: {
    height: 1,
    marginBottom: 12,
  },
  contentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  cardFooter: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  footerDivider: {
    width: 60,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 15,
    color: colors.text,
    fontStyle: 'italic',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background,
  },
});
