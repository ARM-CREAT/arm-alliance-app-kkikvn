import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/styles/commonStyles";
import { apiGet } from "@/utils/api";
import { IconSymbol } from "@/components/IconSymbol";
import { useFocusEffect } from "@react-navigation/native";

interface PollOption {
  id: string | number;
  text: string;
  votes?: number;
}

interface Poll {
  id: string | number;
  title: string;
  question?: string;
  category?: string;
  options?: PollOption[];
  total_votes?: number;
  closes_at?: string;
  end_date?: string;
  has_voted?: boolean;
  status?: string;
}

function formatDateFr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function daysUntil(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Terminé";
  if (diff === 1) return "Se termine demain";
  return `Se termine dans ${diff} jours`;
}

const CATEGORY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  politique: { label: "Politique", bg: colors.primary, text: "#fff" },
  economie: { label: "Économie", bg: "#f59e0b", text: "#fff" },
  social: { label: "Social", bg: "#3b82f6", text: "#fff" },
  securite: { label: "Sécurité", bg: "#ef4444", text: "#fff" },
  education: { label: "Éducation", bg: "#8b5cf6", text: "#fff" },
  sante: { label: "Santé", bg: "#10b981", text: "#fff" },
};

function getCategoryConfig(cat?: string) {
  if (!cat) return { label: "Général", bg: colors.textTertiary, text: "#fff" };
  const key = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return CATEGORY_CONFIG[key] || { label: cat, bg: colors.primary, text: "#fff" };
}

export default function PollsScreen() {
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolls = useCallback(async (isRefresh = false) => {
    console.log("[Polls] Fetching polls, isRefresh:", isRefresh);
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Poll[] | { items?: Poll[]; data?: Poll[]; polls?: Poll[] }>("/api/polls");
      const list = Array.isArray(data) ? data : (data as any).polls || (data as any).items || (data as any).data || [];
      console.log("[Polls] Fetched", list.length, "polls");
      setPolls(list);
    } catch (e: any) {
      console.error("[Polls] Fetch error:", e.message);
      setError(e.message || "Impossible de charger les sondages.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPolls();
    }, [fetchPolls])
  );

  const onRefresh = useCallback(() => {
    console.log("[Polls] Pull-to-refresh triggered");
    setRefreshing(true);
    fetchPolls(true);
  }, [fetchPolls]);

  const handleVote = useCallback((poll: Poll) => {
    console.log("[Polls] Vote button pressed for poll:", poll.id, poll.title);
    router.push(`/polls/${poll.id}` as any);
  }, [router]);

  const handleViewResults = useCallback((poll: Poll) => {
    console.log("[Polls] View results pressed for poll:", poll.id, poll.title);
    router.push(`/polls/${poll.id}` as any);
  }, [router]);

  const handleBack = useCallback(() => {
    console.log("[Polls] Back button pressed");
    router.back();
  }, [router]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol android_material_icon_name="how-to-vote" size={56} color={colors.textTertiary} />
      <Text style={styles.emptyText}>Aucun sondage actif</Text>
      <Text style={styles.emptySubtext}>Revenez bientôt pour participer aux consultations des membres.</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol android_material_icon_name="error-outline" size={56} color={colors.error} />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => { console.log("[Polls] Retry pressed"); fetchPolls(); }}>
        <Text style={styles.retryButtonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPollCard = (poll: Poll) => {
    const catConfig = getCategoryConfig(poll.category);
    const closingDateStr = poll.closes_at || poll.end_date || "";
    const closingLabel = closingDateStr ? daysUntil(closingDateStr) : "";
    const closingFormatted = closingDateStr ? formatDateFr(closingDateStr) : "";
    const totalVotes = poll.total_votes ?? 0;
    const optionCount = poll.options?.length ?? 0;
    const hasVoted = poll.has_voted ?? false;
    const isEnded = closingDateStr ? new Date(closingDateStr) < new Date() : false;

    return (
      <View key={String(poll.id)} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: catConfig.bg }]}>
            <Text style={[styles.categoryText, { color: catConfig.text }]}>{catConfig.label}</Text>
          </View>
          {hasVoted && (
            <View style={styles.votedBadge}>
              <IconSymbol android_material_icon_name="check-circle" size={14} color={colors.primary} />
              <Text style={styles.votedBadgeText}>Vous avez voté</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle}>{poll.title}</Text>
        {!!poll.question && poll.question !== poll.title && (
          <Text style={styles.cardQuestion}>{poll.question}</Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <IconSymbol android_material_icon_name="people" size={16} color={colors.textTertiary} />
            <Text style={styles.statText}>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</Text>
          </View>
          {optionCount > 0 && (
            <View style={styles.statItem}>
              <IconSymbol android_material_icon_name="list" size={16} color={colors.textTertiary} />
              <Text style={styles.statText}>{optionCount} option{optionCount !== 1 ? "s" : ""}</Text>
            </View>
          )}
        </View>

        {!!closingLabel && (
          <View style={styles.closingRow}>
            <IconSymbol
              android_material_icon_name="timer"
              size={14}
              color={isEnded ? colors.textTertiary : colors.warning}
            />
            <Text style={[styles.closingText, { color: isEnded ? colors.textTertiary : colors.warning }]}>
              {closingLabel}
            </Text>
            {!!closingFormatted && (
              <Text style={styles.closingDate}>{closingFormatted}</Text>
            )}
          </View>
        )}

        <View style={styles.cardActions}>
          {hasVoted || isEnded ? (
            <TouchableOpacity
              style={styles.resultsButton}
              onPress={() => handleViewResults(poll)}
            >
              <IconSymbol android_material_icon_name="bar-chart" size={18} color={colors.primary} />
              <Text style={styles.resultsButtonText}>Voir résultats</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.voteButton}
              onPress={() => handleVote(poll)}
            >
              <IconSymbol android_material_icon_name="how-to-vote" size={18} color="#fff" />
              <Text style={styles.voteButtonText}>Voter</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <IconSymbol android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sondages & votes</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des sondages...</Text>
        </View>
      ) : error ? (
        renderError()
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionSubtitle}>
            {polls.length} sondage{polls.length !== 1 ? "s" : ""} actif{polls.length !== 1 ? "s" : ""}
          </Text>
          {polls.length === 0 ? renderEmpty() : polls.map(renderPollCard)}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "center" },
  headerRight: { width: 32 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", color: colors.textSecondary, textAlign: "center" },
  emptySubtext: { fontSize: 13, color: colors.textTertiary, textAlign: "center" },
  errorText: { fontSize: 15, color: colors.error, textAlign: "center" },
  retryButton: { marginTop: 8, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  categoryText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  votedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primaryMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  votedBadgeText: { fontSize: 11, color: colors.primary, fontWeight: "600" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 4, lineHeight: 22 },
  cardQuestion: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 10 },
  statsRow: { flexDirection: "row", gap: 16, marginBottom: 8 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 13, color: colors.textSecondary },
  closingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" },
  closingText: { fontSize: 13, fontWeight: "600" },
  closingDate: { fontSize: 12, color: colors.textTertiary },
  cardActions: { flexDirection: "row", justifyContent: "flex-end" },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  voteButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  resultsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resultsButtonText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  bottomPadding: { height: 32 },
});
