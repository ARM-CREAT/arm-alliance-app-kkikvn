
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
  Clipboard,
  Alert,
  ImageSourcePropType,
  Image,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import * as Haptics from "expo-haptics";
import { Modal } from "@/components/ui/Modal";
import { apiGet } from "@/utils/api";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Try to import QRCode, fall back gracefully
let QRCode: any = null;
try {
  QRCode = require("react-native-qrcode-svg").default;
} catch (e) {
  // package not available
}

interface MemberCardData {
  id: string;
  fullName: string;
  membershipNumber: string;
  commune?: string;
  profession?: string;
  status: "pending" | "active" | "suspended";
  role?: string;
  joinDate?: string;
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
    pending: colors.warning,
    active: colors.success,
    suspended: colors.danger,
  };
  return map[status] || colors.textSecondary;
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
  const insets = useSafeAreaInsets();
  const [memberData, setMemberData] = useState<MemberCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
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

  const loadMemberCard = useCallback(
    async (memberNumber?: string) => {
      console.log("[MemberCard] Loading member card");
      setLoading(true);
      try {
        let storedNumber = memberNumber;
        if (!storedNumber) {
          storedNumber = (await AsyncStorage.getItem("membershipNumber")) || "";
        }

        if (!storedNumber) {
          console.log("[MemberCard] No membership number — showing input");
          setShowInput(true);
          setLoading(false);
          return;
        }

        console.log("[MemberCard] GET /api/membership/my-card");
        // Try authenticated endpoint first, fall back to public lookup
        let data: MemberCardData;
        try {
          data = await apiGet<MemberCardData>("/api/membership/my-card");
        } catch {
          console.log("[MemberCard] Falling back to /api/members/card/:number");
          data = await apiGet<MemberCardData>(`/api/members/card/${storedNumber}`);
        }

        console.log("[MemberCard] Card data received:", data);
        setMemberData(data);
        setShowInput(false);
        await AsyncStorage.setItem("membershipNumber", storedNumber);
      } catch (error: any) {
        console.error("[MemberCard] Error:", error);
        const msg = String(error?.message || "");
        if (msg.includes("404") || msg.includes("not found")) {
          showModal(
            "Membre Non Trouvé",
            "Aucun membre trouvé avec ce numéro. Vérifiez votre numéro ou inscrivez-vous."
          );
          setShowInput(true);
        } else {
          showModal("Erreur", "Impossible de charger votre carte. Veuillez réessayer.");
        }
      } finally {
        setLoading(false);
      }
    },
    [showModal]
  );

  useEffect(() => {
    loadMemberCard();
  }, [loadMemberCard]);

  const handleLookupCard = () => {
    console.log("[MemberCard] User tapped Rechercher with:", inputValue);
    if (!inputValue.trim()) {
      showModal("Erreur", "Veuillez entrer votre numéro de membre");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    loadMemberCard(inputValue.trim());
  };

  const handleCopyNumber = () => {
    if (!memberData) return;
    console.log("[MemberCard] User tapped Copier le numéro:", memberData.membershipNumber);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Clipboard.setString(memberData.membershipNumber);
    Alert.alert("Copié", "Numéro de membre copié dans le presse-papiers.");
  };

  const handleShareCard = async () => {
    console.log("[MemberCard] User tapped Partager la carte");
    if (!memberData) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSharing(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // Share the membership number as text via a temp file approach
        // Since we can't easily share a view snapshot, share the info as text
        await Sharing.shareAsync(
          `data:text/plain;base64,${btoa(
            `Carte de Membre A.R.M\nNom: ${memberData.fullName}\nN°: ${memberData.membershipNumber}\nStatut: ${getStatusText(memberData.status)}`
          )}`,
          { mimeType: "text/plain", dialogTitle: "Partager ma carte A.R.M" }
        );
      } else {
        showModal("Non disponible", "Le partage n'est pas disponible sur cet appareil.");
      }
    } catch (error: any) {
      console.error("[MemberCard] Share error:", error);
      showModal("Erreur", "Impossible de partager la carte.");
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{ title: "Carte de Membre", headerShown: true, headerBackTitle: "Retour" }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de votre carte...</Text>
      </View>
    );
  }

  if (showInput || !memberData) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{ title: "Carte de Membre", headerShown: true, headerBackTitle: "Retour" }}
        />
        <ScrollView contentContainerStyle={styles.inputScreenContent}>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIconText}>🪪</Text>
            </View>
            <Text style={styles.emptyStateTitle}>Accéder à Ma Carte</Text>
            <Text style={styles.emptyStateText}>
              Entrez votre numéro de membre pour accéder à votre carte digitale.
            </Text>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Numéro de Membre</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: ARM-2024-001"
                placeholderTextColor={colors.textSecondary}
                value={inputValue}
                onChangeText={setInputValue}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLookupCard}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Rechercher</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/member/register")}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>S'inscrire Maintenant</Text>
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
  const joinDateStr = formatDate(memberData.joinDate || memberData.createdAt);
  const expiryDateStr = formatDate(memberData.expiryDate);
  const qrValue = memberData.membershipNumber || memberData.id;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: "Ma Carte de Membre", headerShown: true, headerBackTitle: "Retour" }}
      />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
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

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Card Body */}
            <View style={styles.cardBody}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardLabel}>NOM COMPLET</Text>
                <Text style={styles.cardValue}>{memberData.fullName}</Text>

                <Text style={styles.cardLabel}>NUMÉRO DE MEMBRE</Text>
                <Text style={[styles.cardValue, styles.cardMemberNumber]}>
                  {memberData.membershipNumber}
                </Text>

                <View style={styles.cardDates}>
                  <View style={styles.cardDateItem}>
                    <Text style={styles.cardLabel}>DATE D'ADHÉSION</Text>
                    <Text style={styles.cardValue}>{joinDateStr}</Text>
                  </View>
                  {memberData.expiryDate && (
                    <View style={styles.cardDateItem}>
                      <Text style={styles.cardLabel}>EXPIRATION</Text>
                      <Text style={styles.cardValue}>{expiryDateStr}</Text>
                    </View>
                  )}
                </View>

                {memberData.commune && (
                  <>
                    <Text style={styles.cardLabel}>COMMUNE</Text>
                    <Text style={styles.cardValue}>{memberData.commune}</Text>
                  </>
                )}
              </View>

              {/* QR Code */}
              <View style={styles.qrContainer}>
                {QRCode ? (
                  <QRCode
                    value={qrValue}
                    size={90}
                    color={colors.text}
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
              <View style={styles.cardStripe} />
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
            onPress={handleShareCard}
            disabled={sharing}
            activeOpacity={0.8}
          >
            {sharing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Text style={styles.actionBtnIcon}>📤</Text>
                <Text style={styles.actionBtnTextSecondary}>Partager la carte</Text>
              </>
            )}
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
    backgroundColor: colors.backgroundAlt,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  inputScreenContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  emptyState: {
    alignItems: "center",
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + "18",
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
    color: colors.text,
    marginBottom: 10,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.textSecondary,
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
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: colors.primary,
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
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginHorizontal: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  scrollContent: {
    padding: 20,
  },
  cardOuter: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  digitalCard: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cardLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardPartyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cardPartyFull: {
    fontSize: 10,
    color: "#FFFFFF",
    opacity: 0.85,
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
  cardDivider: {
    height: 3,
    backgroundColor: colors.secondary,
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
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  cardMemberNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  cardDates: {
    flexDirection: "row",
    gap: 16,
  },
  cardDateItem: {
    flex: 1,
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
    borderColor: colors.border,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
  qrFallbackNumber: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  qrLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cardFooter: {
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  cardStripe: {
    height: 2,
    width: "100%",
    backgroundColor: colors.primary + "30",
    marginBottom: 6,
  },
  cardFooterText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: "italic",
    letterSpacing: 0.5,
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
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
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
    color: colors.primary,
  },
  navSection: {
    backgroundColor: colors.card,
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
    borderBottomColor: colors.border,
    gap: 12,
  },
  navItemIcon: {
    fontSize: 20,
  },
  navItemText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
  },
  navItemChevron: {
    fontSize: 22,
    color: colors.textSecondary,
    fontWeight: "300",
  },
});
