import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ImageSourcePropType } from 'react-native';
import { Stack } from 'expo-router';
import BodyScrollView from '@/components/BodyScrollView';
import { subscribeToArmMessages, ArmMessageDoc } from '@/lib/firebase';

const ARM_GREEN = '#1B5E20';
const ARM_GOLD = '#C8A84B';
const BG = '#0A1A0F';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[ArmMessage] Démarrage listener Firestore arm_messages');
    const unsubscribe = subscribeToArmMessages(
      (docs) => {
        console.log('[ArmMessage] Messages reçus:', docs.length);
        setMessages(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[ArmMessage] Erreur Firestore:', err.message);
        setError('Impossible de charger les messages. Vérifiez votre connexion.');
        setLoading(false);
      }
    );
    return () => {
      console.log('[ArmMessage] Désabonnement listener Firestore');
      unsubscribe();
    };
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Messages de l'ARM",
          headerBackTitle: 'Retour',
        }}
      />
      <View style={styles.container}>
        <BodyScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={ARM_GOLD} />
              <Text style={styles.loadingText}>Chargement des messages...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{error}</Text>
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
