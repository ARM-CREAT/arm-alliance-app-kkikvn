
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '@/utils/api';
import { colors } from '@/styles/commonStyles';

interface ArticleSummary {
  id: string;
  title: string;
  summary: string;
  category: string;
  image_url: string;
  published_at: string;
  published: boolean;
}

interface NewsResponse {
  articles: ArticleSummary[];
  total: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Politique: '#1565C0',
  politique: '#1565C0',
  Sécurité: '#B71C1C',
  securite: '#B71C1C',
  sécurité: '#B71C1C',
  Économie: '#2E7D32',
  economie: '#2E7D32',
  économie: '#2E7D32',
  Social: '#6A1B9A',
  social: '#6A1B9A',
  Diaspora: '#C8A84B',
  diaspora: '#C8A84B',
};

const CATEGORIES = ['Tout', 'Politique', 'Sécurité', 'Économie', 'Social', 'Diaspora'];

const PAGE_SIZE = 20;

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function formatDateFr(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateString;
  }
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#607D8B';
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonBadge} />
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonTitleShort} />
        <View style={styles.skeletonSummary} />
      </View>
    </View>
  );
}

export default function NewsScreen() {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Tout');
  const [offset, setOffset] = useState(0);

  const fetchNews = useCallback(async (category: string, currentOffset: number, append: boolean) => {
    console.log('[NewsScreen] Chargement des actualités, catégorie:', category, 'offset:', currentOffset);
    setError(null);

    const categoryParam = category === 'Tout' ? '' : category;
    const endpoint = categoryParam
      ? `/api/news?category=${encodeURIComponent(categoryParam)}&limit=${PAGE_SIZE}&offset=${currentOffset}`
      : `/api/news?limit=${PAGE_SIZE}&offset=${currentOffset}`;

    try {
      const data = await apiGet<NewsResponse>(endpoint);
      console.log('[NewsScreen] Actualités reçues:', data.articles?.length, '/ total:', data.total);
      const fetched = Array.isArray(data.articles) ? data.articles : [];
      if (append) {
        setArticles(prev => [...prev, ...fetched]);
      } else {
        setArticles(fetched);
      }
      setTotal(typeof data.total === 'number' ? data.total : fetched.length);
    } catch (err: any) {
      console.error('[NewsScreen] Erreur chargement actualités:', err.message);
      setError(err.message || 'Impossible de charger les actualités.');
    }
  }, []);

  const loadInitial = useCallback(async (category: string) => {
    setLoading(true);
    setOffset(0);
    await fetchNews(category, 0, false);
    setLoading(false);
  }, [fetchNews]);

  useEffect(() => {
    console.log('[NewsScreen] Composant monté');
    loadInitial(selectedCategory);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(async () => {
    console.log('[NewsScreen] Pull-to-refresh déclenché');
    setRefreshing(true);
    setOffset(0);
    await fetchNews(selectedCategory, 0, false);
    setRefreshing(false);
  }, [fetchNews, selectedCategory]);

  const handleCategorySelect = useCallback((cat: string) => {
    console.log('[NewsScreen] Filtre catégorie sélectionné:', cat);
    setSelectedCategory(cat);
    loadInitial(cat);
  }, [loadInitial]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || articles.length >= total) return;
    const newOffset = offset + PAGE_SIZE;
    console.log('[NewsScreen] Chargement de plus d\'articles, offset:', newOffset);
    setLoadingMore(true);
    setOffset(newOffset);
    await fetchNews(selectedCategory, newOffset, true);
    setLoadingMore(false);
  }, [loadingMore, articles.length, total, offset, fetchNews, selectedCategory]);

  const handleArticlePress = (article: ArticleSummary) => {
    console.log('[NewsScreen] Article appuyé:', article.id, article.title);
    router.push({ pathname: '/news/[id]', params: { id: article.id } });
  };

  const handleRetry = () => {
    console.log('[NewsScreen] Bouton Réessayer appuyé');
    loadInitial(selectedCategory);
  };

  const renderArticle = ({ item }: { item: ArticleSummary }) => {
    const catColor = getCategoryColor(item.category);
    const dateStr = formatDateFr(item.published_at);
    const imageSource = resolveImageSource(item.image_url);

    return (
      <TouchableOpacity
        style={styles.articleCard}
        onPress={() => handleArticlePress(item)}
        activeOpacity={0.85}
      >
        <Image
          source={imageSource}
          style={styles.articleImage}
          resizeMode="cover"
        />
        <View style={styles.articleBody}>
          <View style={styles.articleMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: catColor }]}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
            <Text style={styles.articleDate}>{dateStr}</Text>
          </View>
          <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.articleSummary} numberOfLines={2}>{item.summary}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Actualités ARM</Text>
        <Text style={styles.headerSubtitle}>Restez informé des dernières nouvelles</Text>
      </View>

      {/* Category filters */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const chipColor = cat === 'Tout' ? colors.primary : getCategoryColor(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  isSelected && { backgroundColor: chipColor, borderColor: chipColor },
                ]}
                onPress={() => handleCategorySelect(cat)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.skeletonList}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="newspaper-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Aucune actualité disponible</Text>
          <Text style={styles.emptySubtitle}>Revenez plus tard pour les dernières nouvelles.</Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          renderItem={renderArticle}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  filtersWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  articleImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E0E0E0',
  },
  articleBody: {
    padding: 14,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  articleDate: {
    fontSize: 12,
    color: '#888',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 22,
    marginBottom: 6,
  },
  articleSummary: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  skeletonList: {
    padding: 16,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  skeletonImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E8E8E8',
  },
  skeletonContent: {
    padding: 14,
  },
  skeletonBadge: {
    width: 80,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8E8E8',
    marginBottom: 10,
  },
  skeletonTitle: {
    width: '90%',
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E8E8E8',
    marginBottom: 6,
  },
  skeletonTitleShort: {
    width: '60%',
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E8E8E8',
    marginBottom: 10,
  },
  skeletonSummary: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EFEFEF',
  },
});
