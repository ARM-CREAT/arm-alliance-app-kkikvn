import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { colors } from "@/styles/commonStyles";
import { apiGet } from "@/utils/api";
import { IconSymbol } from "@/components/IconSymbol";
import { useFocusEffect } from "@react-navigation/native";

const SHARE_BASE = "https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev/api/public/share/news";

interface NewsItem {
  id: string | number;
  title: string;
  summary?: string;
  ai_summary?: string;
  content?: string;
  image_url?: string;
  published_at?: string;
  created_at?: string;
  author?: string;
}

function formatDateFr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function daysAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Il y a 1 jour";
  return `Il y a ${diff} jours`;
}

function resolveImageSource(source: string | undefined) {
  if (!source) return { uri: "" };
  return { uri: source };
}

export default function NewsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);

  const fetchNews = useCallback(async (isRefresh = false) => {
    console.log("[News] Fetching news list, isRefresh:", isRefresh);
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await apiGet<NewsItem[] | { items?: NewsItem[]; data?: NewsItem[] }>("/api/public/news");
      const list = Array.isArray(data) ? data : (data as any).items || (data as any).data || [];
      console.log("[News] Fetched", list.length, "items");
      setItems(list);
    } catch (e: any) {
      console.error("[News] Fetch error:", e.message);
      setError(e.message || "Impossible de charger les actualités.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNews();
    }, [fetchNews])
  );

  const onRefresh = useCallback(() => {
    console.log("[News] Pull-to-refresh triggered");
    setRefreshing(true);
    fetchNews(true);
  }, [fetchNews]);

  const handleShare = useCallback(async (item: NewsItem) => {
    const dateStr = item.published_at || item.created_at || "";
    const summary = item.ai_summary || item.summary || "";
    const shareText = `${item.title}\n\n${summary}\n\n${SHARE_BASE}/${item.id}`;
    console.log("[News] Share pressed for item:", item.id, item.title);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(SHARE_BASE + "/" + item.id, {
          dialogTitle: item.title,
        });
      } else {
        await Clipboard.setStringAsync(shareText);
        console.log("[News] Sharing not available, copied to clipboard");
      }
    } catch (e: any) {
      console.error("[News] Share error:", e.message);
      try {
        await Clipboard.setStringAsync(shareText);
      } catch {}
    }
  }, []);

  const handleCardPress = useCallback((item: NewsItem) => {
    console.log("[News] Card pressed:", item.id, item.title);
    setSelectedItem(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    console.log("[News] Modal closed");
    setSelectedItem(null);
  }, []);

  const handleBack = useCallback(() => {
    console.log("[News] Back button pressed");
    router.back();
  }, [router]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol android_material_icon_name="article" size={56} color={colors.textTertiary} />
      <Text style={styles.emptyText}>Aucune actualité pour le moment</Text>
      <Text style={styles.emptySubtext}>Revenez bientôt pour les dernières nouvelles de l'Alliance ARM.</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol android_material_icon_name="error-outline" size={56} color={colors.error} />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => { console.log("[News] Retry pressed"); fetchNews(); }}>
        <Text style={styles.retryButtonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCard = (item: NewsItem) => {
    const dateStr = item.published_at || item.created_at || "";
    const dateDisplay = dateStr ? daysAgo(dateStr) : "";
    const dateFormatted = dateStr ? formatDateFr(dateStr) : "";
    const summary = item.ai_summary || item.summary || "";
    const hasImage = !!item.image_url;

    return (
      <TouchableOpacity
        key={String(item.id)}
        style={styles.card}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.85}
      >
        {hasImage && (
          <Image
            source={resolveImageSource(item.image_url)}
            style={styles.cardImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {!!summary && <Text style={styles.cardSummary} numberOfLines={3}>{summary}</Text>}
          <View style={styles.cardFooter}>
            <View style={styles.dateRow}>
              <IconSymbol android_material_icon_name="schedule" size={14} color={colors.textTertiary} />
              <Text style={styles.dateText}>{dateDisplay}</Text>
              {!!dateFormatted && <Text style={styles.dateTextFull}>{dateFormatted}</Text>}
            </View>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => handleShare(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconSymbol android_material_icon_name="share" size={18} color={colors.primary} />
              <Text style={styles.shareButtonText}>Partager</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const modalDateStr = selectedItem?.published_at || selectedItem?.created_at || "";
  const modalDateFormatted = modalDateStr ? formatDateFr(modalDateStr) : "";
  const modalSummary = selectedItem?.ai_summary || selectedItem?.summary || selectedItem?.content || "";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <IconSymbol android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Actualités</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des actualités...</Text>
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
            {items.length} actualité{items.length !== 1 ? "s" : ""} disponible{items.length !== 1 ? "s" : ""}
          </Text>
          {items.length === 0 ? renderEmpty() : items.map(renderCard)}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={["top"]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseBtn}>
              <IconSymbol android_material_icon_name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>Actualité</Text>
            {selectedItem && (
              <TouchableOpacity onPress={() => handleShare(selectedItem)} style={styles.modalShareBtn}>
                <IconSymbol android_material_icon_name="share" size={22} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            {selectedItem?.image_url && (
              <Image
                source={resolveImageSource(selectedItem.image_url)}
                style={styles.modalImage}
                resizeMode="cover"
              />
            )}
            <Text style={styles.modalTitle}>{selectedItem?.title}</Text>
            {!!modalDateFormatted && (
              <View style={styles.modalDateRow}>
                <IconSymbol android_material_icon_name="schedule" size={14} color={colors.textTertiary} />
                <Text style={styles.modalDate}>{modalDateFormatted}</Text>
              </View>
            )}
            {!!selectedItem?.author && (
              <Text style={styles.modalAuthor}>Par {selectedItem.author}</Text>
            )}
            <Text style={styles.modalBody}>{modalSummary}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  retryButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImage: { width: "100%", height: 180 },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 6, lineHeight: 22 },
  cardSummary: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  dateText: { fontSize: 12, color: colors.textTertiary, fontWeight: "500" },
  dateTextFull: { fontSize: 12, color: colors.textTertiary, marginLeft: 4 },
  shareButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: colors.primaryMuted, borderRadius: 6 },
  shareButtonText: { fontSize: 12, color: colors.primary, fontWeight: "600" },
  bottomPadding: { height: 32 },
  modalSafeArea: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseBtn: { padding: 4 },
  modalHeaderTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.text, textAlign: "center", marginHorizontal: 8 },
  modalShareBtn: { padding: 4 },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20 },
  modalImage: { width: "100%", height: 220, borderRadius: 10, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 10, lineHeight: 28 },
  modalDateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  modalDate: { fontSize: 13, color: colors.textTertiary },
  modalAuthor: { fontSize: 13, color: colors.textSecondary, fontStyle: "italic", marginBottom: 12 },
  modalBody: { fontSize: 15, color: colors.text, lineHeight: 24 },
});
