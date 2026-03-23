
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Alert,
  ImageSourcePropType,
  Image,
  RefreshControl,
} from "react-native";
import * as Clipboard from 'expo-clipboard';
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Modal } from "@/components/ui/Modal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND_URL } from "@/utils/api-helpers";

// Try to import QRCode, fall back gracefully
let QRCode: any = null;
try {
  QRCode = require("react-native-qrcode-svg").default;
} catch (e) {
  // package not available
}

const DARK_GREEN = "#1B5E20";
const GOLD = "#FFD700";

interface MemberCardData {
  id: string;
  fullName: string;
  membershipNumber: string;
  commune?: string;
  profession?: string;
  phone?: string;
  status: "pending" | "active" | "suspended";
  role?: string;
  joinDate?: string;
  joinedAt?: string;
  expiryDate?: string;
  createdAt: string;
}

function resolveImageSource(
  source: string | number | ImageSourcePropType | undefined
): ImageSourcePropType {
  if (!source) return { uri: "" };
  if (typeof source === "string") return { uri: source };
  return source as ImageSourcePropType;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    pending: "#FF9500",
    active: "#34C759",
    suspended: "#FF3B30",
  };
  return map[status] || "#8E8E93";
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: "En attente",
    active: "Actif",
    suspended: "Suspendu",
  };
  return map[status] || status;
}

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default function MemberCardScreen() {
  const router = useRouter();
  const { membershipNumber: paramMembershipNumber } = useLocalSearchParams<{ membershipNumber: string }>();
  const [memberData, setMemberData] = useState<MemberCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const showModal = useCallback((title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  }, []);

  const fetchCardByNumber = useCallback(
    async (memberNumber: string) => {
      console.log("[MemberCard] GET /api/members/card/" + memberNumber);
      const res = await fetch(`${BACKEND_URL}/api/members/card/${memberNumber}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("[MemberCard] Public lookup error:", res.status, errText);
        if (res.status === 404) {
          showModal(
            "Membre Non Trouvé",
            "Aucun membre trouvé avec ce numéro. Vérifiez votre numéro ou inscrivez-vous."
          );
          setShowInput(true);
        } else {
          showModal("Erreur", "Impossible de charger votre carte. Veuillez réessayer.");
        }
        return;
      }

      const data: MemberCardData = await res.json();
      console.log("[MemberCard] Card data received:", data.membershipNumber);
      setMemberData(data);
      setShowInput(false);
      await AsyncStorage.setItem("membershipNumber", memberNumber);
    },
    [showModal]
  );

  const loadMemberCard = useCallback(
    async (memberNumber?: string) => {
      console.log("[MemberCard] Loading member card");
      setLoading(true);
      try {
        // If a specific number is provided (from params or manual input), use it directly
        if (memberNumber) {
          await fetchCardByNumber(memberNumber);
          return;
        }

        // Check AsyncStorage for previously saved number
        const storedNumber = await AsyncStorage.getItem("membershipNumber");
        if (storedNumber) {
          await fetchCardByNumber(storedNumber);
          return;
        }

        // No number available — show input
        console.log("[MemberCard] No membership number — showing input");
        setShowInput(true);
      } catch (error: any) {
        console.error("[MemberCard] Error:", error);
        showModal("Erreur", "Impossible de charger votre carte. Veuillez réessayer.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchCardByNumber, showModal]
  );

  useEffect(() => {
    if (paramMembershipNumber) {
      console.log("[MemberCard] Route param membershipNumber:", paramMembershipNumber);
      loadMemberCard(paramMembershipNumber);
    } else {
      loadMemberCard();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(() => {
    console.log("[MemberCard] Pull-to-refresh triggered");
    setRefreshing(true);
    if (memberData?.membershipNumber) {
      loadMemberCard(memberData.membershipNumber);
    } else {
      loadMemberCard();
    }
  }, [loadMemberCard, memberData]);

  const handleLookupCard = () => {
    console.log("[MemberCard] User tapped Rechercher with:", inputValue);
    if (!inputValue.trim()) {
      showModal("Erreur", "Veuillez entrer votre numéro de membre");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLoading(true);
    loadMemberCard(inputValue.trim());
  };

  const handleCopyNumber = () => {
    if (!memberData) return;
    console.log("[MemberCard] User tapped Copier le numéro:", memberData.membershipNumber);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Clipboard.setStringAsync(memberData.membershipNumber);
    Alert.alert("Copié", "Numéro de membre copié dans le presse-papiers.");
  };

  const handleChangeMember = () => {
    console.log("[MemberCard] User tapped Changer de membre");
    setMemberData(null);
    setInputValue("");
    setShowInput(true);
    AsyncStorage.removeItem("membershipNumber");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{ title: "Carte de Membre", headerShown: true, headerBackTitle: "Retour" }}
        />
        <ActivityIndicator size="large" color={DARK_GREEN} />
        <Text style={styles.loadingText}>Chargement de votre carte...</Text>
      </View>
    );
  }

  if (showInput || !memberData) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "Carte de Membre",
            headerShown: true,
            headerBackTitle: "Retour",
            headerStyle: { backgroundColor: DARK_GREEN },
            headerTintColor: "#FFFFFF",
          }}
        />
        <ScrollView contentContainerStyle={styles.inputScreenContent}>
          {/* Header Banner */}
          <View style={styles.lookupBanner}>
            <Image
              source={resolveImageSource(
                require("@/assets/images/48b93c14-0824-4757-b7a4-95824e04a9a8.jpeg")
              )}
              style={styles.lookupLogo}
            />
            <Text style={styles.lookupBannerTitle}>A.R.M</Text>
            <Text style={styles.lookupBannerSubtitle}>Alliance pour le Rassemblement Malien</Text>
          </View>

          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIconText}>🪪</Text>
            </View>
            <Text style={styles.emptyStateTitle}>Accéder à Ma Carte</Text>
            <Text style={styles.emptyStateText}>
              Entrez votre numéro de membre pour accéder à votre carte digitale. Aucune connexion requise.
            </Text>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Numéro de Membre</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: ARM-2024-001"
                placeholderTextColor="#9E9E9E"
                value={inputValue}
                onChangeText={setInputValue}
                autoCapitalize="characters"
                returnKeyType="search"
                onSubmitEditing={handleLookupCard}
              />
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLookupCard}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Rechercher ma carte</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                console.log("[MemberCard] Navigate to register");
                router.push("/member/register");
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>S&apos;inscrire Maintenant</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <Modal
          visible={modalVisible}
          title={modalTitle}
          message={modalMessage}
          type="info"
          onClose={() => setModalVisible(false)}
        />
      </View>
    );
  }

  const statusColor = getStatusColor(memberData.status);
  const statusLabel = getStatusText(memberData.status);
  const joinDateStr = formatDate(memberData.joinedAt || memberData.joinDate || memberData.createdAt);
  const qrValue = memberData.membershipNumber || memberData.id;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Ma Carte de Membre",
          headerShown: true,
          headerBackTitle: "Retour",
          headerStyle: { backgroundColor: DARK_GREEN },
          headerTintColor: "#FFFFFF",
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[DARK_GREEN]}
            tintColor={DARK_GREEN}
          />
        }
      >
        {/* Digital Card */}
        <View style={styles.cardOuter}>
          <View style={styles.digitalCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Image
                source={resolveImageSource(
                  require("@/assets/images/48b93c14-0824-4757-b7a4-95824e04a9a8.jpeg")
                )}
                style={styles.cardLogo}
              />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardPartyName}>A.R.M</Text>
                <Text style={styles.cardPartyFull}>Alliance pour le Rassemblement Malien</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusBadgeText}>{statusLabel}</Text>
              </View>
            </View>

            {/* Gold stripe */}
            <View style={styles.goldStripe} />

            {/* Card Body */}
            <View style={styles.cardBody}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardLabel}>NOM COMPLET</Text>
                <Text style={styles.cardValue}>{memberData.fullName}</Text>

                <Text style={styles.cardLabel}>NUMÉRO DE MEMBRE</Text>
                <Text style={[styles.cardValue, styles.cardMemberNumber]}>
                  {memberData.membershipNumber}
                </Text>

                {memberData.commune ? (
                  <>
                    <Text style={styles.cardLabel}>COMMUNE</Text>
                    <Text style={styles.cardValue}>{memberData.commune}</Text>
                  </>
                ) : null}

                {memberData.profession ? (
                  <>
                    <Text style={styles.cardLabel}>PROFESSION</Text>
                    <Text style={styles.cardValue}>{memberData.profession}</Text>
                  </>
                ) : null}

                {memberData.phone ? (
                  <>
                    <Text style={styles.cardLabel}>TÉLÉPHONE</Text>
                    <Text style={styles.cardValue}>{memberData.phone}</Text>
                  </>
                ) : null}

                <Text style={styles.cardLabel}>DATE D&apos;ADHÉSION</Text>
                <Text style={styles.cardValue}>{joinDateStr}</Text>
              </View>

              {/* QR Code */}
              <View style={styles.qrContainer}>
                {QRCode ? (
                  <QRCode
                    value={qrValue}
                    size={90}
                    color={DARK_GREEN}
                    backgroundColor="transparent"
                  />
                ) : (
                  <View style={styles.qrFallback}>
                    <Text style={styles.qrFallbackNumber}>{memberData.membershipNumber}</Text>
                  </View>
                )}
                <Text style={styles.qrLabel}>Scanner</Text>
              </View>
            </View>

            {/* Card Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>
                Fraternité • Liberté • Égalité
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={handleCopyNumber}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnIcon}>📋</Text>
            <Text style={styles.actionBtnTextPrimary}>Copier le numéro</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={handleChangeMember}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnIcon}>🔄</Text>
            <Text style={styles.actionBtnTextSecondary}>Changer</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Actions */}
        <View style={styles.navSection}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              console.log("[MemberCard] Navigate to cotisation");
              router.push("/member/cotisation");
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.navItemIcon}>💳</Text>
            <Text style={styles.navItemText}>Payer ma Cotisation</Text>
            <Text style={styles.navItemChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              console.log("[MemberCard] Navigate to messages");
              router.push("/member/messages");
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.navItemIcon}>✉️</Text>
            <Text style={styles.navItemText}>Mes Messages</Text>
            <Text style={styles.navItemChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              console.log("[MemberCard] Navigate to election-results");
              router.push("/member/election-results");
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.navItemIcon}>🗳️</Text>
            <Text style={styles.navItemText}>Vérification Électorale</Text>
            <Text style={styles.navItemChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type="info"
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6C757D",
  },
  lookupBanner: {
    backgroundColor: DARK_GREEN,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  lookupLogo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: GOLD,
    marginBottom: 12,
  },
  lookupBannerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: GOLD,
    letterSpacing: 2,
  },
  lookupBannerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 4,
  },
  inputScreenContent: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: "center",
    padding: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DARK_GREEN + "18",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 36,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 15,
    color: "#6C757D",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  inputBlock: {
    width: "100%",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: DARK_GREEN + "60",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1A1A1A",
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: DARK_GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: DARK_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#DEE2E6",
  },
  dividerText: {
    fontSize: 13,
    color: "#6C757D",
    marginHorizontal: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: DARK_GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: DARK_GREEN,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  cardOuter: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  digitalCard: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: GOLD + "60",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DARK_GREEN,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cardLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: GOLD,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardPartyName: {
    fontSize: 20,
    fontWeight: "900",
    color: GOLD,
    letterSpacing: 1,
  },
  cardPartyFull: {
    fontSize: 9,
    color: "rgba(255,255,255,0.85)",
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  goldStripe: {
    height: 4,
    backgroundColor: GOLD,
  },
  cardBody: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: DARK_GREEN,
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 2,
    opacity: 0.7,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  cardMemberNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: DARK_GREEN,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  qrFallback: {
    width: 90,
    height: 90,
    borderWidth: 2,
    borderColor: DARK_GREEN + "40",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
    backgroundColor: DARK_GREEN + "08",
  },
  qrFallbackNumber: {
    fontSize: 9,
    fontWeight: "700",
    color: DARK_GREEN,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  qrLabel: {
    fontSize: 10,
    color: "#6C757D",
    marginTop: 4,
  },
  cardFooter: {
    backgroundColor: DARK_GREEN,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  cardFooterText: {
    fontSize: 11,
    color: GOLD,
    fontStyle: "italic",
    letterSpacing: 1,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnPrimary: {
    backgroundColor: DARK_GREEN,
    shadowColor: DARK_GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnSecondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: DARK_GREEN,
  },
  actionBtnIcon: {
    fontSize: 16,
  },
  actionBtnTextPrimary: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionBtnTextSecondary: {
    fontSize: 14,
    fontWeight: "700",
    color: DARK_GREEN,
  },
  navSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#DEE2E6",
    gap: 12,
  },
  navItemIcon: {
    fontSize: 20,
  },
  navItemText: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  navItemChevron: {
    fontSize: 22,
    color: "#6C757D",
    fontWeight: "300",
  },
});
