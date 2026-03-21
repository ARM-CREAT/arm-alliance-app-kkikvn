
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedGet, authenticatedPatch } from '@/utils/api';

interface Member {
  id: string;
  fullName: string;
  membershipNumber: string;
  commune?: string;
  region?: string;
  profession?: string;
  phone?: string;
  email?: string;
  status: string;
  role?: string;
  createdAt: string;
}

type FilterStatus = 'all' | 'pending' | 'active' | 'suspended';

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateString);
  }
}

function getStatusColor(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active') return '#34C759';
  if (s === 'pending') return '#FF9500';
  if (s === 'suspended') return '#FF3B30';
  if (s === 'rejected') return '#8E8E93';
  return '#8E8E93';
}

function getStatusLabel(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active') return 'Actif';
  if (s === 'pending') return 'En attente';
  if (s === 'suspended') return 'Suspendu';
  if (s === 'rejected') return 'Rejeté';
  return status || '—';
}

export default function AdminMembershipsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadMembers = useCallback(async (status?: FilterStatus) => {
    const activeFilter = status ?? filter;
    const endpoint = activeFilter === 'all'
      ? '/api/admin/memberships'
      : `/api/admin/memberships?status=${activeFilter}`;
    console.log('[AdminMemberships] GET', endpoint);
    setError(null);
    try {
      const data = await authenticatedGet<{ members: Member[] }>(endpoint);
      const list: Member[] = data?.members ?? (Array.isArray(data) ? data : []);
      console.log('[AdminMemberships] Members loaded:', list.length);
      setMembers(list);
    } catch (err: any) {
      console.error('[AdminMemberships] Error loading members:', err);
      setError(err.message || 'Impossible de charger les adhésions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    loadMembers(filter);
  }, [filter, loadMembers]);

  const onRefresh = useCallback(() => {
    console.log('[AdminMemberships] Pull-to-refresh triggered');
    setRefreshing(true);
    loadMembers(filter);
  }, [filter, loadMembers]);

  const handleFilterChange = (newFilter: FilterStatus) => {
    console.log('[AdminMemberships] User changed filter to:', newFilter);
    setFilter(newFilter);
  };

  const handleMemberPress = (member: Member) => {
    console.log('[AdminMemberships] User tapped member:', member.id, member.fullName);
    setSelectedMember(member);
    setDetailVisible(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedMember) return;
    console.log('[AdminMemberships] User tapped status change:', selectedMember.id, '->', newStatus);
    setActionLoading(true);
    try {
      const response = await authenticatedPatch<{ success: boolean; member: Member }>(
        `/api/admin/memberships/${selectedMember.id}/status`,
        { status: newStatus }
      );
      console.log('[AdminMemberships] Status change response:', JSON.stringify(response));
      setDetailVisible(false);
      setSelectedMember(null);
      loadMembers(filter);
    } catch (err: any) {
      console.error('[AdminMemberships] Status change error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filterTabs: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'pending', label: 'En attente' },
    { value: 'active', label: 'Actifs' },
    { value: 'suspended', label: 'Suspendus' },
  ];

  const totalCount = String(members.length);
  const activeCount = String(members.filter(m => m.status === 'active').length);
  const pendingCount = String(members.filter(m => m.status === 'pending').length);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Adhésions',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <View style={styles.container}>
        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{activeCount}</Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterBarContent}
        >
          {filterTabs.map((tab) => {
            const isActive = filter === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => handleFilterChange(tab.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={40} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => { setLoading(true); loadMembers(filter); }}
            >
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
            }
          >
            {members.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol ios_icon_name="person.3" android_material_icon_name="group" size={56} color={colors.textSecondary} />
                <Text style={styles.emptyText}>Aucun membre trouvé</Text>
              </View>
            ) : (
              members.map((member) => {
                const statusColor = getStatusColor(member.status);
                const statusLabel = getStatusLabel(member.status);
                const dateStr = formatDate(member.createdAt);
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.memberCard}
                    onPress={() => handleMemberPress(member)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.memberCardRow}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {(member.fullName || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName} numberOfLines={1}>{member.fullName}</Text>
                        <Text style={styles.memberNumber}>{member.membershipNumber}</Text>
                        <Text style={styles.memberMeta} numberOfLines={1}>
                          {member.commune || member.region || '—'}
                        </Text>
                      </View>
                      <View style={styles.memberRight}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                        </View>
                        <Text style={styles.memberDate}>{dateStr}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      {/* Member Detail Modal */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailVisible(false)}
      >
        {selectedMember && (
          <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle} numberOfLines={1}>{selectedMember.fullName}</Text>
              <TouchableOpacity
                style={styles.detailCloseBtn}
                onPress={() => {
                  console.log('[AdminMemberships] User closed member detail');
                  setDetailVisible(false);
                }}
              >
                <Text style={styles.detailCloseBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailScrollContent}>
              {/* Status badge */}
              <View style={styles.detailStatusRow}>
                <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedMember.status) + '22' }]}>
                  <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedMember.status) }]}>
                    {getStatusLabel(selectedMember.status)}
                  </Text>
                </View>
              </View>

              {/* Info rows */}
              {[
                { label: 'Numéro de membre', value: selectedMember.membershipNumber },
                { label: 'Téléphone', value: selectedMember.phone },
                { label: 'Email', value: selectedMember.email },
                { label: 'Commune', value: selectedMember.commune },
                { label: 'Région', value: selectedMember.region },
                { label: 'Profession', value: selectedMember.profession },
                { label: 'Rôle', value: selectedMember.role },
                { label: 'Date d\'inscription', value: formatDate(selectedMember.createdAt) },
              ].map((row) => {
                if (!row.value) return null;
                return (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>{row.label}</Text>
                    <Text style={styles.detailRowValue}>{row.value}</Text>
                  </View>
                );
              })}

              {/* Action buttons */}
              <Text style={styles.actionsTitle}>Actions</Text>

              {selectedMember.status !== 'active' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnApprove, actionLoading && styles.actionBtnDisabled]}
                  onPress={() => handleStatusChange('active')}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.actionBtnText}>Approuver</Text>
                  )}
                </TouchableOpacity>
              )}

              {selectedMember.status !== 'suspended' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnSuspend, actionLoading && styles.actionBtnDisabled]}
                  onPress={() => handleStatusChange('suspended')}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.actionBtnText}>Suspendre</Text>
                  )}
                </TouchableOpacity>
              )}

              {selectedMember.status !== 'rejected' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnReject, actionLoading && styles.actionBtnDisabled]}
                  onPress={() => handleStatusChange('rejected')}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.actionBtnText}>Rejeter</Text>
                  )}
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 4,
  },
  filterBar: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 52,
  },
  filterBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  memberCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  memberCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  memberNumber: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  memberMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  memberRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  memberDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  // Detail modal
  detailContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    gap: 12,
  },
  detailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  detailCloseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    flexShrink: 0,
  },
  detailCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  detailStatusRow: {
    marginBottom: 20,
  },
  statusBadgeLarge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusTextLarge: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailRowValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionBtnApprove: {
    backgroundColor: '#34C759',
  },
  actionBtnSuspend: {
    backgroundColor: '#FF9500',
  },
  actionBtnReject: {
    backgroundColor: '#FF3B30',
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
