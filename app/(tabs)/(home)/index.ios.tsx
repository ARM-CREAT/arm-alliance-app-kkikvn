import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const logoSource = require("@/assets/images/f017b698-5f03-4bb9-bbf0-a9094cbe948a.jpeg");
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;

function FadeCard({
  index,
  children,
  style,
}: {
  index: number;
  children: React.ReactNode;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function GridCard({
  icon,
  iconColor,
  label,
  description,
  onPress,
  index,
}: {
  icon: React.ComponentProps<typeof IconSymbol>["android_material_icon_name"];
  iconColor: string;
  label: string;
  description?: string;
  onPress: () => void;
  index: number;
}) {
  const iconBg = iconColor + "22";
  return (
    <FadeCard index={index} style={{ width: CARD_WIDTH }}>
      <Pressable
        style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}
        onPress={onPress}
      >
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <IconSymbol
            android_material_icon_name={icon}
            size={22}
            color={iconColor}
          />
        </View>
        {description ? (
          <Text style={styles.gridCardDesc}>{description}</Text>
        ) : null}
        <Text style={styles.gridCardLabel}>{label}</Text>
      </Pressable>
    </FadeCard>
  );
}

function ListRow({
  icon,
  iconColor,
  label,
  description,
  onPress,
  isLast,
  index,
}: {
  icon: React.ComponentProps<typeof IconSymbol>["android_material_icon_name"];
  iconColor: string;
  label: string;
  description?: string;
  onPress: () => void;
  isLast?: boolean;
  index: number;
}) {
  const iconBg = iconColor + "22";
  return (
    <FadeCard index={index}>
      <Pressable
        style={({ pressed }) => [
          styles.listRow,
          !isLast && styles.listRowBorder,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
      >
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <IconSymbol
            android_material_icon_name={icon}
            size={20}
            color={iconColor}
          />
        </View>
        <View style={styles.listRowContent}>
          <Text style={styles.listRowLabel}>{label}</Text>
          {description ? (
            <Text style={styles.listRowDesc}>{description}</Text>
          ) : null}
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </FadeCard>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { isAdminAuthenticated } = useAdminAuth();

  function nav(route: string) {
    console.log("[Home] Navigating to:", route);
    router.push(route as never);
  }

  const quickItems: {
    icon: React.ComponentProps<typeof IconSymbol>["android_material_icon_name"];
    iconColor: string;
    label: string;
    route: string;
  }[] = [
    { icon: "favorite", iconColor: "#DC2626", label: "Faire un don", route: "/donation" },
    { icon: "credit-card", iconColor: colors.primary, label: "Cotisations", route: "/member/cotisation" },
    { icon: "notifications", iconColor: colors.secondary, label: "Notifications", route: "/notification-preferences" },
    { icon: "qr-code", iconColor: colors.info, label: "Ma carte", route: "/member/card" },
  ];

  const aiItems: {
    icon: React.ComponentProps<typeof IconSymbol>["android_material_icon_name"];
    iconColor: string;
    label: string;
    description: string;
    route: string;
  }[] = [
    {
      icon: "chat",
      iconColor: colors.aiAccent,
      label: "Assistant IA",
      description: "Posez vos questions sur le programme",
      route: "/chat-ia",
    },
    {
      icon: "mic",
      iconColor: "#9333EA",
      label: "Voix IA",
      description: "Parlez à l'application",
      route: "/voice-assistant",
    },
  ];

  const newsItems: {
    icon: React.ComponentProps<typeof IconSymbol>["android_material_icon_name"];
    iconColor: string;
    label: string;
    route: string;
  }[] = [
    { icon: "article", iconColor: colors.primary, label: "Actualités", route: "/news" },
    { icon: "campaign", iconColor: colors.secondary, label: "Annonces", route: "/announcements" },
    { icon: "event", iconColor: colors.info, label: "Événements", route: "/events" },
    { icon: "forum", iconColor: "#065F46", label: "Messages politiques", route: "/political-messages" },
  ];

  const partyItems: {
    icon: React.ComponentProps<typeof IconSymbol>["android_material_icon_name"];
    iconColor: string;
    label: string;
    description: string;
    route: string;
    adminOnly?: boolean;
  }[] = [
    { icon: "description", iconColor: colors.primary, label: "Notre programme", description: "Découvrez notre vision", route: "/program" },
    { icon: "menu-book", iconColor: colors.secondary, label: "Notre idéologie", description: "Nos valeurs fondatrices", route: "/ideology" },
    { icon: "groups", iconColor: colors.primary, label: "Direction du parti", description: "Les responsables nationaux", route: "/admin/leadership", adminOnly: true },
    { icon: "people", iconColor: colors.secondary, label: "Liste des membres", description: "Annuaire des adhérents", route: "/members-list" },
  ];

  const visiblePartyItems = partyItems.filter(
    (item) => !item.adminOnly || isAdminAuthenticated
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={logoSource} style={styles.logo} contentFit="cover" />
        <Text style={styles.title}>Alliance ARM</Text>
        <Text style={styles.subtitle}>Fraternité · Liberté · Égalité</Text>
      </View>

      {/* CTA */}
      <FadeCard index={0} style={styles.ctaWrapper}>
        <Pressable
          style={({ pressed }) => [styles.ctaCard, pressed && styles.pressed]}
          onPress={() => nav("/member/register")}
        >
          <View style={styles.ctaTextBlock}>
            <Text style={styles.ctaTitle}>Rejoignez l'Alliance</Text>
            <Text style={styles.ctaSubtitle}>Devenez membre dès aujourd'hui</Text>
          </View>
          <Text style={styles.ctaChevron}>›</Text>
        </Pressable>
      </FadeCard>

      {/* Accès rapides */}
      <SectionTitle title="Accès rapides" />
      <View style={styles.grid}>
        {quickItems.map((item, i) => (
          <GridCard
            key={item.route}
            icon={item.icon}
            iconColor={item.iconColor}
            label={item.label}
            onPress={() => nav(item.route)}
            index={i + 1}
          />
        ))}
      </View>

      {/* IA */}
      <SectionTitle title="Intelligence Artificielle" />
      <View style={styles.grid}>
        {aiItems.map((item, i) => (
          <GridCard
            key={item.route}
            icon={item.icon}
            iconColor={item.iconColor}
            label={item.label}
            description={item.description}
            onPress={() => nav(item.route)}
            index={i + 5}
          />
        ))}
      </View>

      {/* Démocratie interne */}
      <SectionTitle title="Démocratie interne" />
      <FadeCard index={7} style={styles.horizontalCardWrapper}>
        <Pressable
          style={({ pressed }) => [styles.horizontalCard, pressed && styles.pressed]}
          onPress={() => nav("/polls")}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + "22" }]}>
            <IconSymbol
              android_material_icon_name="bar-chart"
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.horizontalCardText}>
            <Text style={styles.horizontalCardTitle}>Sondages et votes</Text>
            <Text style={styles.horizontalCardDesc}>
              Participez aux consultations des membres
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </FadeCard>

      {/* Actualités */}
      <SectionTitle title="Actualités & événements" />
      <View style={styles.grid}>
        {newsItems.map((item, i) => (
          <GridCard
            key={item.route}
            icon={item.icon}
            iconColor={item.iconColor}
            label={item.label}
            onPress={() => nav(item.route)}
            index={i + 8}
          />
        ))}
      </View>

      {/* Le parti */}
      <SectionTitle title="Le parti" />
      <View style={styles.listCard}>
        {visiblePartyItems.map((item, i) => (
          <ListRow
            key={item.route}
            icon={item.icon}
            iconColor={item.iconColor}
            label={item.label}
            description={item.description}
            onPress={() => nav(item.route)}
            isLast={i === visiblePartyItems.length - 1}
            index={i + 12}
          />
        ))}
      </View>

      {/* Aide & contact */}
      <SectionTitle title="Aide & contact" />
      <View style={styles.grid}>
        <FadeCard index={16} style={{ width: CARD_WIDTH }}>
          <Pressable
            style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}
            onPress={() => nav("/contact")}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + "22" }]}>
              <IconSymbol
                android_material_icon_name="email"
                size={22}
                color={colors.primary}
              />
            </View>
            <Text style={styles.gridCardLabel}>Nous contacter</Text>
          </Pressable>
        </FadeCard>
        <FadeCard index={17} style={{ width: CARD_WIDTH }}>
          <Pressable
            style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}
            onPress={() => nav("/settings")}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#6B728022" }]}>
              <IconSymbol
                android_material_icon_name="settings"
                size={22}
                color="#6B7280"
              />
            </View>
            <Text style={styles.gridCardLabel}>Paramètres</Text>
          </Pressable>
        </FadeCard>
      </View>

      {/* Admin link */}
      <Pressable
        onPress={() => nav("/admin/login")}
        style={({ pressed }) => [styles.adminLink, pressed && { opacity: 0.5 }]}
      >
        <Text style={styles.adminLinkText}>Espace administrateur</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  hero: {
    width: "100%",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: colors.secondary,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.surface,
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 6,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  ctaWrapper: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  ctaCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  ctaTextBlock: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: colors.text,
    marginTop: 4,
    opacity: 0.7,
  },
  ctaChevron: {
    fontSize: 28,
    color: colors.text,
    fontWeight: "300",
    marginLeft: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  gridCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    minHeight: 110,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  gridCardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
  },
  gridCardDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 15,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalCardWrapper: {
    marginHorizontal: 16,
  },
  horizontalCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  horizontalCardText: {
    flex: 1,
    marginLeft: 12,
  },
  horizontalCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  horizontalCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  listCard: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  listRowContent: {
    flex: 1,
    marginLeft: 12,
  },
  listRowLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  listRowDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: colors.textTertiary,
    fontWeight: "300",
    marginLeft: 8,
  },
  adminLink: {
    marginTop: 32,
    marginBottom: 16,
    alignItems: "center",
  },
  adminLinkText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  pressed: {
    opacity: 0.75,
  },
});
