import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Heart } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import { mapPosts } from "../../utils/postMapper";
import PostCard from "../../components/PostCard";
import Button from "../../components/Button";
import NetworkError from "../../components/NetworkError";

export default function FavoritesPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  const fetchLikedPosts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (likesError) {
        console.error('Error fetching likes:', likesError);
        // Vérifier si c'est une erreur réseau
        if (likesError.message?.includes('Failed to fetch') || 
            likesError.message?.includes('NetworkError') ||
            likesError.message?.includes('network')) {
          setNetworkError(true);
        }
        setLoading(false);
        return;
      }
      
      setNetworkError(false);

      if (!likes || likes.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const postIds = likes.map((like) => like.post_id);
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        setLoading(false);
        return;
      }

      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map((p) => p.user_id).filter(Boolean))];
        const categoryIds = [...new Set(postsData.map((p) => p.category_id).filter(Boolean))];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds);

        const { data: categories } = await supabase
          .from('categories')
          .select('id, name, slug')
          .in('id', categoryIds);

        const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));
        const categoriesMap = new Map((categories || []).map((c) => [c.id, c]));

        const postsWithRelations = postsData.map((post) => ({
          ...post,
          profiles: profilesMap.get(post.user_id) || null,
          categories: categoriesMap.get(post.category_id) || null
        }));

        setPosts(mapPosts(postsWithRelations));
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      // Gérer les erreurs réseau
      if (error instanceof Error && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('network'))) {
        setNetworkError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchLikedPosts();
    } else {
      setLoading(false);
    }
  }, [user, fetchLikedPosts]);

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes Favoris</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Heart size={48} color="#6B7280" />
          <Text style={styles.emptyTitle}>Vous n'êtes pas connecté</Text>
          <Text style={styles.emptyText}>
            Connectez-vous pour voir vos annonces likées
          </Text>
          <Button
            title="Se connecter"
            onPress={() => router.push('/auth/login')}
            style={{ marginTop: 20 }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Favoris</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Chargement de vos favoris...</Text>
        </View>
      ) : networkError ? (
        <NetworkError
          onRetry={fetchLikedPosts}
          message="Impossible de charger vos favoris. Vérifiez votre connexion Internet."
        />
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Heart size={48} color="#6B7280" />
          <Text style={styles.emptyTitle}>Aucun favori</Text>
          <Text style={styles.emptyText}>
            Vous n'avez pas encore liké d'annonces.
          </Text>
          <Button
            title="Découvrir des annonces"
            onPress={() => router.push('/(tabs)/')}
            style={{ marginTop: 20 }}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.countText}>
            {posts.length} annonce{posts.length > 1 ? 's' : ''} likée{posts.length > 1 ? 's' : ''}
          </Text>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLiked={true}
              onLike={fetchLikedPosts}
              titleLines={1}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  countText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});

