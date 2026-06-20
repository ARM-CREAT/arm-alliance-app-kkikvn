import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { colors } from "@/styles/commonStyles";
import { apiGet } from "@/utils/api";
import { IconSymbol } from "@/components/IconSymbol";
import { useFocusEffect } from "@react-navigation/native";

const SHARE_BASE = "https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev/api/public/share/events";

interface EventItem {
  id: string | number;
  title: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  date?: string;
  created_at?: string;
}

function formatDateFr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatTimeFr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDayNumber(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit" });
}

function formatMonthShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase();
}

function isUpcoming(iso: string) {
  return new Date(iso) >= new Date();
}

export default function EventsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<EventItem | null>(null);

  const fetchEvents = useCallback(async (isRefresh = false) => {
    console.log("[Events] Fetching events, isRefresh:", isRefresh);
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await apiGet<EventItem[] | { items?: EventItem[]; data?: EventItem[] }>("/api/events");
      const list = Array.isArray(data) ? data : (data as any).items || (data as any).data || [];
      console.log("[Events] Fetched", list.length, "events");
      setItems(list);
    } catch (e: any) {
      console.error("[Events] Fetch error:", e.message);
      setError(e.message || "Impossible de charger les événements.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const onRefresh = useCallback(() => {
    console.log("[Events] Pull-to-refresh triggered");
    setRefreshing(true);
    fetchEvents(true);
  }, [fetchEvents]);

  const handleShare = useCallback(async (item: EventItem) => {
    const dateStr = item.start_date || item.date || "";
    const shareText = `${item.title}\n\n${item.description || ""}\n${item.location ? "📍 " + item.location : ""}\n${dateStr ? "📅 " + formatDateFr(dateStr) : ""}\n\n${SHARE_BASE}/${item.id}`;
    console.log("[Events] Share pressed for item:", item.id, item.title);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(SHARE_BASE + "/" + item.id, { dialogTitle: item.title });
      } else {
        await Clipboard.setStringAsync(shareText);
        console.log("[Events] Copied to clipboard");
      }
    } catch (e: any) {
      console.error("[Events] Share error:", e.message);
      try { await Clipboard.setStringAsync(shareText); } catch {}
    }
  }, []);

  const handleCardPress = useCallback((item: EventItem) => {
    console.log("[Events] Card pressed:", item.id, item.title);
    setSelectedItem(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    console.log("[Events] Modal closed");
    setSelectedItem(null);
  }, []);

  const handleBack = useCallback(() => {
    console.log("[Events] Back button pressed");
    router.back();
  }, [router]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol android_material_icon_name="event" size={56} color={colors.textTertiary} />
      <Text style={styles.emptyText}>Aucun événement pour le moment</Text>
      <Text style={styles.emptySubtext}>L'agenda des activités de l'Alliance ARM apparaîtra ici.</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol android_material_icon_name="error-outline" size={56} color={colors.error} />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => { console.log("[Events] Retry pressed"); fetchEvents(); }}>
        <Text style={styles.retryButtonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCard = (item: EventItem) => {
    const dateStr = item.start_date || item.date || "";
    const dayNumber = dateStr ? formatDayNumber(dateStr) : "--";
    const monthShort = dateStr ? formatMonthShort(dateStr) : "---";
    const timeStr = dateStr ? formatTimeFr(dateStr) : "";
    const dateFormatted = dateStr ? formatDateFr(dateStr) : "";
    const upcoming = dateStr ? isUpcoming(dateStr) : true;
    const badgeLabel = upcoming ? "À VENIR" : "PASSÉ";
    const badgeBg = upcoming ? colors.primary : colors.textTertiary;

    return (
      <TouchableOpacity
        key={String(item.id)}
        style={styles.card}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.dayNumber}>{dayNumber}</Text>
          <Text style={styles.monthShort}>{monthShort}</Text>
          {!!timeStr && <Text style={styles.timeStr}>{timeStr}</Text>}
        </View>
        <View style={styles.cardRight}>
          <View style={styles.cardTopRow}>
            <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
              <Text style={styles.statusBadgeText}>{badgeLabel}</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {!!item.location && (
            <View style={styles.locationRow}>
              <IconSymbol android_material_icon_name="location-on" size={14} color={colors.textTertiary} />
              <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
            </View>
          )}
          {!!item.description && (
            <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
          )}
          <View style={styles.cardFooter}>
            {!!dateFormatted && <Text style={styles.dateTextFull}>{dateFormatted}</Text>}
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

  const modalDateStr = selectedItem?.start_date || selectedItem?.date || "";
  const modalDateFormatted = modalDateStr ? formatDateFr(modalDateStr) : "";
  const modalTimeStr = modalDateStr ? formatTimeFr(modalDateStr) : "";
  const modalUpcoming = modalDateStr ? isUpcoming(modalDateStr) : true;
  const modalBadgeLabel = modalUpcoming ? "À VENIR" : "PASSÉ";
  const modalBadgeBg = modalUpcoming ? colors.primary : colors.textTertiary;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <IconSymbol android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Événements</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des événements...</Text>
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
            {items.length} événement{items.length !== 1 ? "s" : ""} au programme
          </Text>
          {items.length === 0 ? renderEmpty() : items.map(renderCard)}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

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
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>Événement</Text>
            {selectedItem && (
              <TouchableOpacity onPress={() => handleShare(selectedItem)} style={styles.modalShareBtn}>
                <IconSymbol android_material_icon_name="share" size={22} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            <View style={[styles.statusBadge, { backgroundColor: modalBadgeBg, alignSelf: "flex-start", marginBottom: 12 }]}>
              <Text style={styles.statusBadgeText}>{modalBadgeLabel}</Text>
            </View>
            <Text style={styles.modalTitle}>{selectedItem?.title}</Text>
            {!!modalDateFormatted && (
              <View style={styles.modalInfoRow}>
                <IconSymbol android_material_icon_name="event" size={16} color={colors.primary} />
                <Text style={styles.modalInfoText}>{modalDateFormatted}</Text>
                {!!modalTimeStr && <Text style={styles.modalInfoText}>{modalTimeStr}</Text>}
              </View>
            )}
            {!!selectedItem?.location && (
              <View style={styles.modalInfoRow}>
                <IconSymbol android_material_icon_name="location-on" size={16} color={colors.primary} />
                <Text style={styles.modalInfoText}>{selectedItem.location}</Text>
              </View>
            )}
            {!!selectedItem?.description && (
              <Text style={styles.modalBody}>{selectedItem.description}</Text>
            )}
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
  retryButton: { marginTop: 8, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLeft: {
    width: 64,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  dayNumber: { fontSize: 26, fontWeight: "800", color: colors.primary, lineHeight: 30 },
  monthShort: { fontSize: 12, fontWeight: "600", color: colors.primary, textTransform: "uppercase" },
  timeStr: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  cardRight: { flex: 1, padding: 12 },
  cardTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  statusBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 4, lineHeight: 20 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 4 },
  locationText: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  cardDescription: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  dateTextFull: { fontSize: 11, color: colors.textTertiary },
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
  modalTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 12, lineHeight: 28 },
  modalInfoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  modalInfoText: { fontSize: 14, color: colors.textSecondary },
  modalBody: { fontSize: 15, color: colors.text, lineHeight: 24, marginTop: 12 },
});
