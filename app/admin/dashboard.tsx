
import React, { useState, useEffect, useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import * as Haptics from 'expo-haptics';
import { BACKEND_URL } from '@/utils/api-helpers';

const ADMIN_HEADERS = { 'Content-Type': 'application/json', 'x-admin-password': 'admin123' };

interface Stats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
}

interface RecentMember {
  id: string;
  member_number: string;
  full_name: string;
  commune: string;
  status: string;
  created_at: string;
}

function getStatusColor(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'active') return colors.success;
  if (s === 'pending') return colors.warning;
  if (s === 'suspended') return colors.danger;
  return colors.textSecondary;
}

function getStatusLabel(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'active') return 'Actif';
  if (s === 'pending') return 'En attente';
  if (s === 'suspended') return 'Suspendu';
  return status;
}

function formatDate(dateString?: string) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateString; }
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { logout } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    console.log('[AdminDashboard] GET /api/members/stats + /api/members?limit=5');
    setError(null);
    try {
      const [statsRes, membersRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/members/stats`, { headers: ADMIN_HEADERS }),
        fetch(`${BACKEND_URL}/api/members?limit=5`, { headers: ADMIN_HEADERS }),
      ]);

      if (!statsRes.ok) {
        const text = await statsRes.text();
        console.error('[AdminDashboard] Stats erreur:', statsRes.status, text);
        throw new Error(`Erreur stats ${statsRes.status}`);
      }
      if (!membersRes.ok) {
        const text = await membersRes.text();
        console.error('[AdminDashboard] Members erreur:', membersRes.status, text);
        throw new Error(`Erreur membres ${membersRes.status}`);
      }

      const [statsData, membersData] = await Promise.all([
        statsRes.json(),
        membersRes.json(),
      ]);

      console.log('[AdminDashboard] Stats chargées:', JSON.stringify(statsData));
      console.log('[AdminDashboard] Derniers adhérents chargés:', membersData?.members?.length ?? 0);

      setStats(statsData);
      setRecentMembers(membersData?.members ?? []);
    } catch (err: any) {
      console.error('[AdminDashboard] Erreur chargement:', err.message);
      setError(err.message || 'Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const checkSetup = async () => {
      await AsyncStorage.getItem('quick_setup_completed');
    };
    checkSetup();
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = useCallback(() => {
    console.log('[AdminDashboard] Pull-to-refresh');
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  const handleNavigation = (path: string, label: string) => {
    console.log('[AdminDashboard] Navigation vers', label);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  const handleLogout = async () => {
    console.log('[AdminDashboard] Bouton Déconnexion appuyé');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace('/admin/login');
  };

  const totalStr = String(stats?.total ?? 0);
  const activeStr = String(stats?.active ?? 0);
  const pendingStr = String(stats?.pending ?? 0);
  const suspendedStr = String(stats?.suspended ?? 0);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Tableau de Bord',
          headerShown: true,
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          {/* Stats section */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingText}>Chargement des statistiques...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Impossible de charger les stats</Text>
              <Text style={styles.errorText}>{error}</Text>
              <AnimatedPressable
                style={styles.retryBtn}
                onPress={() => {
                  console.log('[AdminDashboard] Bouton Réessayer appuyé');
                  setLoading(true);
                  loadDashboard();
                }}
              >
                <Text style={styles.retryBtnText}>Réessayer</Text>
              </AnimatedPressable>
            </View>
          ) : (
            <>
              {/* Total card */}
              <View style={styles.totalCard}>
                <Text style={styles.totalNumber}>{totalStr}</Text>
                <Text style={styles.totalLabel}>Adhérents inscrits</Text>
              </View>

              {/* Stats grid */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
                  <Text style={[styles.statNumber, { color: colors.success }]}>{activeStr}</Text>
                  <Text style={styles.statLabel}>Actifs</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: colors.warning }]}>
                  <Text style={[styles.statNumber, { color: colors.warning }]}>{pendingStr}</Text>
                  <Text style={styles.statLabel}>En attente</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: colors.danger }]}>
                  <Text style={[styles.statNumber, { color: colors.danger }]}>{suspendedStr}</Text>
                  <Text style={styles.statLabel}>Suspendus</Text>
                </View>
              </View>

              {/* Recent members */}
              {recentMembers.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Derniers adhérents</Text>
                    <AnimatedPressable onPress={() => handleNavigation('/admin/memberships', 'Adhésions')}>
                      <Text style={styles.sectionLink}>Voir tous →</Text>
                    </AnimatedPressable>
                  </View>
                  {recentMembers.map((member) => {
                    const statusColor = getStatusColor(member.status);
                    const statusLabel = getStatusLabel(member.status);
                    const dateStr = formatDate(member.created_at);
                    const initial = (member.full_name || '?').charAt(0).toUpperCase();
                    return (
                      <View key={member.id} style={styles.memberRow}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>{initial}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName} numberOfLines={1}>{member.full_name}</Text>
                          <Text style={styles.memberNumber}>{member.member_number}</Text>
                          <Text style={styles.memberMeta}>{member.commune || '—'}</Text>
                          <Text style={styles.memberDate}>{dateStr}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {/* Quick actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.actionsRow}>
              <AnimatedPressable
                style={styles.actionBtn}
                onPress={() => handleNavigation('/admin/memberships', 'Adhésions')}
              >
                <Text style={styles.actionBtnIcon}>📋</Text>
                <Text style={styles.actionBtnText}>Gérer les adhésions</Text>
                <Text style={styles.actionBtnChevron}>›</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.actionBtn}
                onPress={() => handleNavigation('/admin/leadership', 'Direction')}
              >
                <Text style={styles.actionBtnIcon}>👤</Text>
                <Text style={styles.actionBtnText}>Gérer la direction</Text>
                <Text style={styles.actionBtnChevron}>›</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.actionBtn}
                onPress={() => handleNavigation('/admin/membership-stats', 'Statistiques')}
              >
                <Text style={styles.actionBtnIcon}>📊</Text>
                <Text style={styles.actionBtnText}>Statistiques détaillées</Text>
                <Text style={styles.actionBtnChevron}>›</Text>
              </AnimatedPressable>
            </View>
          </View>

          {/* Content management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gestion</Text>
            <View style={styles.grid}>
              {[
                { path: '/admin/leadership', label: 'Direction', icon: '👤' },
                { path: '/admin/membership-stats', label: 'Stats', icon: '📊' },
                { path: '/admin/contacts', label: 'Contacts', icon: '📞' },
                { path: '/admin/program', label: 'Programme', icon: '📜' },
                { path: '/admin/offline-access', label: 'Hors ligne', icon: '📴' },
              ].map((item) => (
                <AnimatedPressable
                  key={item.path}
                  style={styles.gridCard}
                  onPress={() => handleNavigation(item.path, item.label)}
                >
                  <Text style={styles.gridCardIcon}>{item.icon}</Text>
                  <Text style={styles.gridCardLabel}>{item.label}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>

          {/* Logout */}
          <AnimatedPressable style={styles.logoutButton} onPress={handleLogout}>
            <IconSymbol
              ios_icon_name="rectangle.portrait.and.arrow.right"
              android_material_icon_name="logout"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </AnimatedPressable>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
  },
  errorText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  totalNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  totalLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  memberNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFC107',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 1,
  },
  memberMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  memberDate: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  actionBtnIcon: {
    fontSize: 20,
  },
  actionBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  actionBtnChevron: {
    fontSize: 22,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridCardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  gridCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: colors.danger,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
