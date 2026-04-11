import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const ARM_LOGO = require('../../../assets/images/e97792f8-db87-47a2-a255-29e780e8a073.jpeg');

const DIRECTION_MEMBERS = [
  { name: 'Lassine Diakité', role: 'Président', location: 'Spain', phone: '0034632607101' },
  { name: 'Dadou Sangare', role: 'Premier Vice-Président', location: 'Milan, Italie', phone: '' },
  { name: 'Oumar Keita', role: 'Deuxième Vice-Président', location: 'Koutiala, Mali', phone: '0022376304869' },
  { name: 'Karifa Keita', role: 'Secrétaire Général', location: 'Bamako, Mali', phone: '' },
  { name: 'Modibo Keita', role: 'Secrétaire Administratif', location: 'Bamako, Mali', phone: '' },
  { name: 'Sokona Keita', role: 'Trésorière', location: 'Bamako, Mali', phone: '0022375179920' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={ARM_LOGO} style={styles.headerLogo} />
        <Text style={styles.headerTitle}>Alliance ARM</Text>
        <Text style={styles.headerSubtitle}>Alliance pour le Rassemblement du Mali</Text>
      </View>

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            console.log('[Home] Bouton Adhésion appuyé');
            router.push('/member/register');
          }}
        >
          <Text style={styles.actionBtnText}>Adhésion</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            console.log('[Home] Bouton Messages appuyé');
            router.push('/arm-message');
          }}
        >
          <Text style={styles.actionBtnText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            console.log('[Home] Bouton Membres appuyé');
            router.push('/members-list');
          }}
        >
          <Text style={styles.actionBtnText}>Membres</Text>
        </TouchableOpacity>
      </View>

      {/* Direction du Parti */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Direction du Parti</Text>
        <View style={styles.card}>
          {DIRECTION_MEMBERS.map((member, index) => (
            <View key={member.name}>
              <View style={styles.memberRow}>
                <Image source={ARM_LOGO} style={styles.logo} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                  <Text style={styles.memberLocation}>{member.location}</Text>
                  {member.phone ? <Text style={styles.memberPhone}>{member.phone}</Text> : null}
                </View>
              </View>
              {index < DIRECTION_MEMBERS.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      </View>

      {/* Siège du Parti */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏢 Siège du Parti</Text>
        <View style={styles.card}>
          <View style={styles.memberRow}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>Alliance ARM</Text>
              <Text style={styles.memberLocation}>Rue 530, Porte 245</Text>
              <Text style={styles.memberLocation}>Bamako, Mali</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Admin access */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.adminBtn}
          onPress={() => {
            console.log('[Home] Bouton Panneau Admin appuyé');
            router.push('/admin');
          }}
        >
          <Text style={styles.adminBtnText}>⚙️ Panneau Admin</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 120 },
  header: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  headerLogo: { width: 90, height: 90, borderRadius: 45, marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: '#666', textAlign: 'center' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  logo: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 },
  memberRole: { fontSize: 14, color: '#4CAF50', fontWeight: '600', marginBottom: 2 },
  memberLocation: { fontSize: 13, color: '#666' },
  memberPhone: { fontSize: 13, color: '#666' },
  separator: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 74 },
  adminBtn: {
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  adminBtnText: { fontSize: 15, color: '#555', fontWeight: '600' },
});
