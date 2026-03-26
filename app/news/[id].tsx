
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '@/utils/api';
import { colors } from '@/styles/commonStyles';

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  image_url: string;
  published_at: string;
  published: boolean;
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

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[ArticleDetail] Composant monté, id:', id);
    if (!id) return;

    const fetchArticle = async () => {
      console.log('[ArticleDetail] Chargement de l\'article:', id);
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet<Article>(`/api/news/${id}`);
        console.log('[ArticleDetail] Article chargé:', data.title);
        setArticle(data);
      } catch (err: any) {
        console.error('[ArticleDetail] Erreur chargement article:', err.message);
        setError(err.message || 'Impossible de charger cet article.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const handleBack = () => {
    console.log('[ArticleDetail] Bouton retour appuyé');
    router.back();
  };

  const handleShare = async () => {
    if (!article) return;
    console.log('[ArticleDetail] Bouton partager appuyé, article:', article.id);
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\n${article.summary}\n\n— Alliance ARM`,
      });
      console.log('[ArticleDetail] Partage effectué');
    } catch (err: any) {
      console.error('[ArticleDetail] Erreur partage:', err.message);
    }
  };

  const handleRetry = () => {
    console.log('[ArticleDetail] Bouton Réessayer appuyé');
    if (!id) return;
    setLoading(true);
    setError(null);
    apiGet<Article>(`/api/news/${id}`)
      .then((data) => {
        console.log('[ArticleDetail] Article rechargé:', data.title);
        setArticle(data);
      })
      .catch((err: any) => {
        console.error('[ArticleDetail] Erreur rechargement:', err.message);
        setError(err.message || 'Impossible de charger cet article.');
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Chargement de l&apos;article...</Text>
        </View>
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={styles.container}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color="#999" />
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorMessage}>{error || 'Article introuvable.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const catColor = getCategoryColor(article.category);
  const dateStr = formatDateFr(article.published_at);
  const imageSource = resolveImageSource(article.image_url);

  return (
    <View style={styles.container}>
      {/* Navigation bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{article.title}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        <Image
          source={imageSource}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={styles.articleContainer}>
          {/* Category badge */}
          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge, { backgroundColor: catColor }]}>
              <Text style={styles.categoryBadgeText}>{article.category}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.articleTitle}>{article.title}</Text>

          {/* Date */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color="#888" />
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Summary */}
          <Text style={styles.summaryText}>{article.summary}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Content */}
          <Text style={styles.contentText}>{article.content}</Text>

          {/* Share button at bottom */}
          <TouchableOpacity style={styles.shareBottomButton} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
            <Text style={styles.shareBottomButtonText}>Partager cet article</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  heroImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#E0E0E0',
  },
  articleContainer: {
    padding: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  articleTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
    lineHeight: 32,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.07)',
    marginVertical: 16,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 26,
    fontStyle: 'italic',
  },
  contentText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 26,
  },
  shareBottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 32,
    gap: 8,
  },
  shareBottomButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 15,
    color: '#888',
    marginTop: 16,
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
});
