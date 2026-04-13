
import React, { useState, useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { BACKEND_URL } from '@/utils/api';

interface Stats {
  total: number;
  pending: number;
  active: number;
  suspended: number;
  by_region: { region: string; count: number }[];
  recent_registrations: number;
  thisMonth: number;
}

interface MonthlyEntry {
  month: string;
  count: number;
}

interface StatCardProps {
  icon_ios: string;
  icon_android: string;
  label: string;
  value: number;
  iconColor: string;
}

function StatCard({ icon_ios, icon_android, label, value, iconColor }: StatCardProps) {
  const displayValue = String(value);
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconRow}>
        <IconSymbol
          ios_icon_name={icon_ios}
          android_material_icon_name={icon_android}
          size={20}
          color={iconColor}
        />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color: iconColor }]}>{displayValue}</Text>
    </View>
  );
}

export default function MembershipStatsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, active: 0, suspended: 0, by_region: [], recent_registrations: 0, thisMonth: 0 });
  const [monthly, setMonthly] = useState<MonthlyEntry[]>([]);

  const loadStats = useCallback(async () => {
    console.log('[MembershipStats] GET /api/members/stats');
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/members/stats`, {
        headers: { 'Content-Type': 'application/json', 'x-admin-password': 'admin123' },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status}: ${text.slice(0, 120)}`);
      }
      const data = await response.json();
      console.log('[MembershipStats] Stats loaded:', JSON.stringify(data));
      setStats({
        total: Number(data.total) || 0,
        pending: Number(data.pending) || 0,
        active: Number(data.active) || 0,
        suspended: Number(data.suspended) || 0,
        by_region: Array.isArray(data.by_region) ? data.by_region : [],
        recent_registrations: Number(data.recent_registrations) || 0,
        thisMonth: Number(data.thisMonth) || 0,
      });
      setMonthly([]);
    } catch (err: any) {
      console.error('[MembershipStats] Error loading stats:', err);
      setError(err.message || 'Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(() => {
    console.log('[MembershipStats] Pull-to-refresh triggered');
    setRefreshing(true);
    loadStats();
  }, [loadStats]);

  const maxCount = monthly.length > 0 ? Math.max(...monthly.map(m => Number(m.count) || 0), 1) : 1;

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Statistiques Adhésion',
            headerShown: true,
            headerBackTitle: 'Retour',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des statistiques...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Statistiques Adhésion',
          headerShown: true,
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
        >
          {error ? (
            <View style={styles.errorContainer}>
              <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={40} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => { setLoading(true); loadStats(); }}
              >
                <Text style={styles.retryBtnText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Statistiques Adhésion</Text>
                <Text style={styles.subtitle}>Vue d'ensemble des membres</Text>
              </View>

              {/* KPI Cards */}
              <View style={styles.grid}>
                <StatCard
                  icon_ios="person.3.fill"
                  icon_android="group"
                  label="Total membres"
                  value={stats.total}
                  iconColor={colors.primary}
                />
                <StatCard
                  icon_ios="clock.fill"
                  icon_android="schedule"
                  label="En attente"
                  value={stats.pending}
                  iconColor="#FF9500"
                />
                <StatCard
                  icon_ios="checkmark.circle.fill"
                  icon_android="check_circle"
                  label="Actifs"
                  value={stats.active}
                  iconColor="#34C759"
                />
                <StatCard
                  icon_ios="xmark.circle.fill"
                  icon_android="cancel"
                  label="Suspendus"
                  value={stats.suspended}
                  iconColor="#FF3B30"
                />
                <StatCard
                  icon_ios="calendar"
                  icon_android="calendar_today"
                  label="Nouveaux ce mois"
                  value={stats.thisMonth}
                  iconColor="#007AFF"
                />
                <StatCard
                  icon_ios="clock.arrow.circlepath"
                  icon_android="history"
                  label="Récents (30j)"
                  value={stats.recent_registrations}
                  iconColor="#AF52DE"
                />
              </View>

              {/* By Region */}
              {stats.by_region.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Membres par région</Text>
                  <View style={styles.listContainer}>
                    {stats.by_region.map((item, index) => {
                      const regionName = String(item.region || 'Inconnue');
                      const regionCount = String(Number(item.count) || 0);
                      const isLast = index === stats.by_region.length - 1;
                      return (
                        <View key={index} style={[styles.listRow, isLast && styles.listRowLast]}>
                          <View style={styles.listRowLeft}>
                            <IconSymbol ios_icon_name="mappin.circle.fill" android_material_icon_name="place" size={20} color={colors.primary} />
                            <Text style={styles.listRowLabel}>{regionName}</Text>
                          </View>
                          <Text style={[styles.listRowValue, { color: colors.primary }]}>{regionCount}</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Detail by status */}
              <Text style={styles.sectionTitle}>Détail par statut</Text>
              <View style={styles.listContainer}>
                <View style={styles.listRow}>
                  <View style={styles.listRowLeft}>
                    <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={20} color="#34C759" />
                    <Text style={styles.listRowLabel}>Actifs</Text>
                  </View>
                  <Text style={[styles.listRowValue, { color: '#34C759' }]}>{String(stats.active)}</Text>
                </View>
                <View style={styles.listRow}>
                  <View style={styles.listRowLeft}>
                    <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={20} color="#FF9500" />
                    <Text style={styles.listRowLabel}>En attente de validation</Text>
                  </View>
                  <Text style={[styles.listRowValue, { color: '#FF9500' }]}>{String(stats.pending)}</Text>
                </View>
                <View style={[styles.listRow, styles.listRowLast]}>
                  <View style={styles.listRowLeft}>
                    <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={20} color="#FF3B30" />
                    <Text style={styles.listRowLabel}>Suspendus</Text>
                  </View>
                  <Text style={[styles.listRowValue, { color: '#FF3B30' }]}>{String(stats.suspended)}</Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    flexShrink: 1,
  },
  statValue: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 14,
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 130,
    paddingTop: 20,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 26,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  barValue: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  listContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  listRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listRowLabel: {
    fontSize: 15,
    color: colors.text,
  },
  listRowValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    color: colors.danger,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
