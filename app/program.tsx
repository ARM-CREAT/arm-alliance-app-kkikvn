
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  RefreshControl
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiGet } from '@/utils/api';
import * as Haptics from 'expo-haptics';

interface ProgramItem {
  id: string;
  category: string;
  title: string;
  description: string;
  order?: number;
}

interface GroupedProgram {
  [category: string]: ProgramItem[];
}

export default function ProgramScreen() {
  const router = useRouter();
  const [program, setProgram] = useState<GroupedProgram>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProgram = useCallback(async () => {
    console.log('[ProgramScreen] Loading political program');
    setError(null);
    
    try {
      const data = await apiGet<ProgramItem[]>('/api/program');
      console.log('[ProgramScreen] Program loaded successfully:', data.length, 'items');
      
      // Group by category
      const grouped: GroupedProgram = data.reduce((acc: GroupedProgram, item: ProgramItem) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {});
      
      // Sort items within each category by order
      Object.keys(grouped).forEach(category => {
        grouped[category].sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      
      setProgram(grouped);
    } catch (err: any) {
      console.error('[ProgramScreen] Error loading program:', err);
      setError(err.message || 'Erreur lors du chargement du programme');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('[ProgramScreen] Component mounted');
    loadProgram();
  }, [loadProgram]);

  const onRefresh = useCallback(async () => {
    console.log('[ProgramScreen] User pulled to refresh');
    setRefreshing(true);
    await loadProgram();
    setRefreshing(false);
    
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [loadProgram]);

  const handleBack = () => {
    console.log('[ProgramScreen] User tapped back button');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  if (loading) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Programme Politique',
            headerBackTitle: 'Retour',
            headerStyle: {
              backgroundColor: colors.primary,
            },
            headerTintColor: colors.background,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement du programme...</Text>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Programme Politique',
            headerBackTitle: 'Retour',
            headerStyle: {
              backgroundColor: colors.primary,
            },
            headerTintColor: colors.background,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
        <View style={styles.centered}>
          <IconSymbol 
            ios_icon_name="exclamationmark.triangle.fill" 
            android_material_icon_name="warning" 
            size={48} 
            color={colors.warning} 
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadProgram} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const categories = Object.keys(program).sort();
  const hasProgram = categories.length > 0;

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Programme Politique',
          headerBackTitle: 'Retour',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.background,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <IconSymbol 
            ios_icon_name="doc.text.fill" 
            android_material_icon_name="description" 
            size={48} 
            color={colors.primary} 
          />
          <Text style={styles.headerTitle}>Programme Politique</Text>
          <Text style={styles.headerSubtitle}>A.R.M - Alliance pour le Rassemblement Malien</Text>
        </View>

        {!hasProgram ? (
          <View style={styles.emptyContainer}>
            <IconSymbol 
              ios_icon_name="doc.text" 
              android_material_icon_name="description" 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyText}>Aucun programme disponible pour le moment</Text>
            <Text style={styles.emptySubtext}>Le programme politique sera bientôt publié</Text>
          </View>
        ) : (
          categories.map((category) => (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <IconSymbol 
                  ios_icon_name="bookmark.fill" 
                  android_material_icon_name="bookmark" 
                  size={24} 
                  color={colors.accent} 
                />
                <Text style={styles.categoryTitle}>{category}</Text>
              </View>
              
              {program[category].map((item) => (
                <View key={item.id} style={styles.programCard}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </View>
              ))}
            </View>
          ))
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Fraternité • Liberté • Égalité</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  programCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
