import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { BEARER_TOKEN_KEY } from '@/lib/auth';

const API_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

interface Member {
  id: string;
  full_name?: string;
}

async function getBearerToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(BEARER_TOKEN_KEY); } catch { return null; }
  } else {
    try {
      const SecureStore = await import('expo-secure-store');
      return await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
    } catch { return null; }
  }
}

export default function MembersListScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    console.log('[MembersList] GET /api/members');
    setLoading(true);
    setError(null);
    try {
      const token = await getBearerToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/members`, { headers });
      if (!res.ok) {
        const text = await res.text();
        console.error('[MembersList] HTTP error', res.status, text.slice(0, 120));
        throw new Error(`Error ${res.status}`);
      }
      const data = await res.json();
      const list: Member[] = Array.isArray(data) ? data : [];
      console.log('[MembersList] Loaded', list.length, 'members');
      setMembers(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[MembersList] Fetch failed:', msg);
      setError('Failed to load members. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Members' }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Members' }} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Members' }} />
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const name = item.full_name || '—';
          return (
            <View style={styles.row}>
              <Text style={styles.name}>{name}</Text>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No members found.</Text>
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  list: {
    padding: 16,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  name: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
});
