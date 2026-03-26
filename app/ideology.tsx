
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/styles/commonStyles";

// ─── Data ────────────────────────────────────────────────────────────────────

interface FamilleItem {
  emoji: string;
  title: string;
  color: string;
  description: string;
  exemples: string[];
}

interface PartiItem {
  emoji: string;
  title: string;
  color: string;
  description: string;
}

interface TransversaleItem {
  emoji: string;
  title: string;
  color: string;
  description: string;
}

const FAMILLES: FamilleItem[] = [
  {
    emoji: "🔴",
    title: "La Gauche",
    color: "#E53935",
    description:
      "Défend l'égalité sociale, la justice et la solidarité. Favorable à l'intervention de l'État dans l'économie. Priorité aux services publics (santé, éducation, emploi).",
    exemples: ["Socialisme", "Progressisme", "Écologisme"],
  },
  {
    emoji: "🔵",
    title: "La Droite",
    color: "#1565C0",
    description:
      "Défend la liberté économique, l'ordre et la tradition. Favorable au secteur privé et à l'initiative individuelle. Moins d'intervention de l'État.",
    exemples: ["Libéralisme économique", "Conservatisme"],
  },
  {
    emoji: "⚪",
    title: "Le Centre",
    color: "#757575",
    description:
      "Position intermédiaire entre gauche et droite. Mélange de politiques sociales et économiques. Recherche du compromis et de la stabilité.",
    exemples: ["Centrisme"],
  },
];

const PARTIS: PartiItem[] = [
  {
    emoji: "🟢",
    title: "Parti Populaire",
    color: "#2E7D32",
    description:
      "Proche du peuple. Défense des classes moyennes et pauvres. Souvent mélange de gauche et de nationalisme.",
  },
  {
    emoji: "🟡",
    title: "Parti Républicain",
    color: "#F9A825",
    description:
      "Défend la République, la démocratie et les institutions. Importance de la loi, de l'État et de la citoyenneté. Peut être de droite ou du centre.",
  },
  {
    emoji: "🔵",
    title: "Parti de l'Unité Nationale",
    color: "#1565C0",
    description:
      "Priorité à la cohésion nationale. Rassemblement au-delà des divisions ethniques ou politiques. Souvent utilisé dans des contextes de crise ou de reconstruction.",
  },
  {
    emoji: "🔴",
    title: "Parti Socialiste",
    color: "#C62828",
    description:
      "Réduction des inégalités. Redistribution des richesses. Services publics forts. Protection des travailleurs.",
  },
  {
    emoji: "🔵",
    title: "Parti Démocrate",
    color: "#1976D2",
    description:
      "Défense de la démocratie, des libertés et des élections libres. Peut être de gauche, centre ou droite selon le pays. Accent sur les droits humains.",
  },
  {
    emoji: "⚪",
    title: "Parti Centriste",
    color: "#616161",
    description:
      "Équilibre entre social et économie. Dialogue et compromis. Gouvernance modérée.",
  },
  {
    emoji: "🟥",
    title: "Parti de Gauche",
    color: "#B71C1C",
    description:
      "Transformation sociale profonde. Lutte contre la pauvreté. Parfois critique du capitalisme.",
  },
  {
    emoji: "🟦",
    title: "Parti de Droite",
    color: "#0D47A1",
    description:
      "Sécurité, ordre, tradition. Économie libérale. Valorisation du mérite individuel.",
  },
  {
    emoji: "🟢",
    title: "Parti Rassemblement",
    color: "#388E3C",
    description:
      "Regroupe plusieurs tendances politiques. Vision d'unité nationale. Souvent pragmatique (moins idéologique).",
  },
  {
    emoji: "🟡",
    title: "Parti Citoyen",
    color: "#F57F17",
    description:
      "Met le citoyen au centre. Participation populaire. Transparence et bonne gouvernance.",
  },
  {
    emoji: "🟠",
    title: "Parti Conservateur",
    color: "#E65100",
    description:
      "Défense des traditions, de la culture et des valeurs. Résistance aux changements rapides.",
  },
  {
    emoji: "🟣",
    title: "Parti Progressiste",
    color: "#6A1B9A",
    description:
      "Favorable au changement social. Modernisation de la société. Droits sociaux avancés.",
  },
  {
    emoji: "⚫",
    title: "Parti Nationaliste",
    color: "#212121",
    description:
      "Défense de la souveraineté nationale. Priorité aux intérêts du pays. Peut être de droite ou populaire.",
  },
  {
    emoji: "🟢",
    title: "Parti Écologiste",
    color: "#1B5E20",
    description:
      "Protection de l'environnement. Développement durable. Transition énergétique.",
  },
];

const TRANSVERSALES: TransversaleItem[] = [
  {
    emoji: "🗽",
    title: "Libéralisme",
    color: "#1565C0",
    description:
      "Liberté individuelle et économique. L'État doit intervenir le moins possible dans la vie des citoyens et l'économie.",
  },
  {
    emoji: "🏴",
    title: "Nationalisme",
    color: "#37474F",
    description:
      "Souveraineté nationale. Priorité aux intérêts et à l'identité du pays face aux influences extérieures.",
  },
  {
    emoji: "🌍",
    title: "Panafricanisme",
    color: "#C8A84B",
    description:
      "Unité et développement de l'Afrique. Solidarité entre les peuples africains pour construire un continent fort et indépendant.",
  },
  {
    emoji: "⚖️",
    title: "Démocratie Sociale",
    color: "#2E7D32",
    description:
      "Équilibre entre marché et justice sociale. L'État régule l'économie pour garantir l'égalité des chances.",
  },
  {
    emoji: "✊",
    title: "Populisme",
    color: "#E65100",
    description:
      "Défense directe du peuple contre les élites. Le pouvoir doit appartenir au peuple ordinaire, pas aux privilégiés.",
  },
];

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabKey = "familles" | "partis" | "transversales";

const TABS: { key: TabKey; label: string }[] = [
  { key: "familles", label: "Familles" },
  { key: "partis", label: "Partis" },
  { key: "transversales", label: "Transversales" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FamilleCard({ item }: { item: FamilleItem }) {
  return (
    <View style={[styles.card, styles.cardRow]}>
      <View style={[styles.colorBand, { backgroundColor: item.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <Text style={styles.cardDescription}>{item.description}</Text>
        <View style={styles.badgesRow}>
          {item.exemples.map((ex) => (
            <View key={ex} style={[styles.badge, { backgroundColor: item.color + "18", borderColor: item.color + "40" }]}>
              <Text style={[styles.badgeText, { color: item.color }]}>{ex}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function PartiCard({ item }: { item: PartiItem }) {
  return (
    <View style={[styles.card, styles.cardRow]}>
      <View style={[styles.colorBand, { backgroundColor: item.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <Text style={styles.cardDescription}>{item.description}</Text>
      </View>
    </View>
  );
}

function TransversaleCard({ item }: { item: TransversaleItem }) {
  return (
    <View style={[styles.card, styles.cardRow]}>
      <View style={[styles.colorBand, { backgroundColor: item.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <Text style={styles.cardDescription}>{item.description}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function IdeologyGuideScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("familles");

  const handleTabPress = (key: TabKey) => {
    console.log("[IdeologyGuide] Onglet sélectionné:", key);
    setActiveTab(key);
  };

  const sectionCount =
    activeTab === "familles"
      ? FAMILLES.length
      : activeTab === "partis"
      ? PARTIS.length
      : TRANSVERSALES.length;

  const sectionCountText = String(sectionCount);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Guide Idéologique",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />

      <View style={styles.container}>
        {/* Hero header */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Guide Idéologique</Text>
          <Text style={styles.heroSubtitle}>Comprendre les partis politiques</Text>
          <View style={styles.heroCountBadge}>
            <Text style={styles.heroCountText}>{sectionCountText}</Text>
            <Text style={styles.heroCountLabel}> entrées</Text>
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => handleTabPress(tab.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "familles" && (
            <>
              <Text style={styles.sectionIntro}>
                Les grandes familles politiques définissent les grandes orientations idéologiques d'un parti.
              </Text>
              {FAMILLES.map((item) => (
                <FamilleCard key={item.title} item={item} />
              ))}
            </>
          )}

          {activeTab === "partis" && (
            <>
              <Text style={styles.sectionIntro}>
                Chaque type de parti porte une identité politique distincte. Découvrez leurs caractéristiques.
              </Text>
              {PARTIS.map((item) => (
                <PartiCard key={item.title} item={item} />
              ))}
            </>
          )}

          {activeTab === "transversales" && (
            <>
              <Text style={styles.sectionIntro}>
                Ces idéologies traversent les clivages gauche/droite et influencent de nombreux partis.
              </Text>
              {TRANSVERSALES.map((item) => (
                <TransversaleCard key={item.title} item={item} />
              ))}
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ARM_GREEN = "#2E7D32";
const ARM_GOLD = "#C8A84B";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  // Hero
  hero: {
    backgroundColor: ARM_GREEN,
    paddingTop: Platform.OS === "android" ? 16 : 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontStyle: "italic",
  },
  heroCountBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  heroCountText: {
    fontSize: 18,
    fontWeight: "900",
    color: ARM_GOLD,
  },
  heroCountLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  },
  tabItemActive: {
    backgroundColor: "#FAFAFA",
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9E9E9E",
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: ARM_GREEN,
    fontWeight: "700",
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: "15%",
    right: "15%",
    height: 3,
    backgroundColor: ARM_GOLD,
    borderRadius: 2,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Section intro
  sectionIntro: {
    fontSize: 13,
    color: "#616161",
    lineHeight: 19,
    marginBottom: 14,
    paddingHorizontal: 4,
    fontStyle: "italic",
  },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  cardRow: {
    flexDirection: "row",
  },
  colorBand: {
    width: 5,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
  },
  cardDescription: {
    fontSize: 13,
    color: "#424242",
    lineHeight: 20,
  },

  // Badges (familles only)
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  bottomSpacer: {
    height: 20,
  },
});
