import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ImageSourcePropType, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import BodyScrollView from '@/components/BodyScrollView';
import { BACKEND_URL } from '@/utils/api';

const ARM_GREEN = '#1B5E20';
const ARM_GOLD = '#C8A84B';
const BG = '#0A1A0F';

interface ArmMessageDoc {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function formatDateFr(dateString?: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(dateString);
  }
}

export default function ArmMessageScreen() {
  const [messages, setMessages] = useState<ArmMessageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async (isRefresh = false) => {
    console.log('[ArmMessage] GET /api/arm-messages');
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${BACKEND_URL}/api/arm-messages`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const text = await res.text();
        console.error('[ArmMessage] Erreur HTTP', res.status, text.slice(0, 120));
        throw new Error(`Erreur ${res.status}`);
      }
      const data = await res.json();
      const list: ArmMessageDoc[] = Array.isArray(data) ? data : (data.messages ?? []);
      console.log('[ArmMessage] Messages chargés:', list.length);
      setMessages(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[ArmMessage] Erreur chargement:', msg);
      setError('Impossible de charger les messages. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMessages(false);
  }, [loadMessages]);

  const onRefresh = useCallback(() => {
    console.log('[ArmMessage] Pull-to-refresh');
    setRefreshing(true);
    loadMessages(true);
  }, [loadMessages]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Messages de l'ARM",
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: ARM_GREEN },
          headerTintColor: ARM_GOLD,
          headerTitleStyle: { fontWeight: 'bold', color: ARM_GOLD },
        }}
      />
      <View style={styles.container}>
        <BodyScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={ARM_GOLD}
              colors={[ARM_GOLD]}
            />
          }
        >
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={ARM_GOLD} />
              <Text style={styles.loadingText}>Chargement des messages...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  console.log('[ArmMessage] Bouton Réessayer appuyé');
                  loadMessages(false);
                }}
              >
                <Text style={styles.retryBtnText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>Aucun message pour le moment.</Text>
            </View>
          ) : (
            messages.map((msg, index) => {
              const dateStr = formatDateFr(msg.created_at);
              const hasImage = !!msg.image_url;
              const imageSource = resolveImageSource(msg.image_url);
              const isLast = index === messages.length - 1;

              return (
                <View key={msg.id} style={[styles.messageCard, isLast && styles.messageCardLast]}>
                  <Text style={styles.title}>{msg.title}</Text>
                  <View style={styles.separator} />
                  {hasImage && (
                    <Image
                      source={imageSource}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={styles.body}>{msg.content}</Text>
                  {!!dateStr && (
                    <Text style={styles.footer}>{dateStr}</Text>
                  )}
                </View>
              );
            })
          )}
        </BodyScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(232,245,238,0.5)',
  },
  errorText: {
    fontSize: 15,
    color: '#EF5350',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(232,245,238,0.5)',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: ARM_GOLD,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: '#0A1A0F',
    fontWeight: '700',
    fontSize: 15,
  },
  messageCard: {
    marginBottom: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,168,75,0.15)',
  },
  messageCardLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: ARM_GOLD,
    lineHeight: 28,
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(200,168,75,0.25)',
    marginBottom: 16,
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  body: {
    fontSize: 15,
    color: 'rgba(232,245,238,0.92)',
    lineHeight: 26,
    marginBottom: 12,
  },
  footer: {
    fontSize: 13,
    color: 'rgba(232,245,238,0.5)',
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: 4,
  },
});
