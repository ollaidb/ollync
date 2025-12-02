import { View, Text, ScrollView, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Home } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { fetchPostsWithRelations } from "../../utils/fetchPostsWithRelations";
import PostCard from "../../components/PostCard";
import NetworkError from "../../components/NetworkError";

export default function HomePage() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentPosts, setRecentPosts] = useState([]);
  const [urgentPosts, setUrgentPosts] = useState([]);
  const [networkError, setNetworkError] = useState(false);

  const fetchRecentPosts = async () => {
    try {
      const posts = await fetchPostsWithRelations({
        status: 'active',
        limit: 10,
        orderBy: 'created_at',
        orderDirection: 'desc'
      });
      setRecentPosts(posts);
      setNetworkError(false);
    } catch (error) {
      console.error('Error fetching recent posts:', error);
      // En cas d'erreur réseau, afficher un message
      if (error instanceof Error && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('network'))) {
        setNetworkError(true);
      }
    }
  };

  const fetchUrgentPosts = async () => {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      const allPosts = await fetchPostsWithRelations({
        status: 'active',
        limit: 100,
        orderBy: 'created_at',
        orderDirection: 'desc'
      });

      const urgent = allPosts
        .filter((post) => {
          if (post.is_urgent) return true;
          if (post.needed_date) {
            const neededDate = new Date(post.needed_date);
            return neededDate <= threeDaysFromNow;
          }
          return false;
        })
        .sort((a, b) => {
          if (a.needed_date && b.needed_date) {
            return new Date(a.needed_date).getTime() - new Date(b.needed_date).getTime();
          }
          return 0;
        })
        .slice(0, 10);

      setUrgentPosts(urgent);
      setNetworkError(false);
    } catch (error) {
      console.error('Error fetching urgent posts:', error);
      // En cas d'erreur réseau, afficher un message
      if (error instanceof Error && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('network'))) {
        setNetworkError(true);
      }
    }
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchRecentPosts(), fetchUrgentPosts()]);
    setLoading(false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  useEffect(() => {
    loadAll();
  }, [user, loadAll]);

  const Section = ({ title, posts, loading: sectionLoading }) => {
    if (sectionLoading) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <ActivityIndicator size="small" color="#6366F1" />
        </View>
      );
    }

    if (posts.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Home size={28} color="#6366F1" />
          <Text style={styles.headerTitle}>Ollync</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (networkError && recentPosts.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Home size={28} color="#6366F1" />
          <Text style={styles.headerTitle}>Ollync</Text>
        </View>
        <NetworkError
          onRetry={loadAll}
          message="Impossible de charger les annonces. Vérifiez votre connexion Internet."
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Home size={28} color="#6366F1" />
        <Text style={styles.headerTitle}>Ollync</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Section
          title="Annonces récentes"
          posts={recentPosts}
          loading={false}
        />
        {urgentPosts.length > 0 && (
          <Section
            title="Annonces urgentes"
            posts={urgentPosts}
            loading={false}
          />
        )}
      </ScrollView>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
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
});

