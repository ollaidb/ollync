import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Heart, MessageCircle, MapPin, Calendar } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabaseClient";

export default function PostCard({ post, isLiked = false, onLike }) {
  const router = useRouter();
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [checkingLike, setCheckingLike] = useState(true);

  useEffect(() => {
    const checkLiked = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCheckingLike(false);
          return;
        }

        const { data, error } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', post.id)
          .maybeSingle();

        if (error || !data) {
          setLiked(false);
        } else {
          setLiked(true);
        }
        setCheckingLike(false);
      } catch (error) {
        console.error('Error checking like:', error);
        setLiked(false);
        setCheckingLike(false);
      }
    };

    checkLiked();
  }, [post.id]);

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (liked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);

        if (!error) {
          setLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
          onLike?.();
        }
      } else {
        const { data, error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: post.id })
          .select()
          .single();

        if (!error && data) {
          setLiked(true);
          setLikesCount(prev => prev + 1);
          onLike?.();
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const mainImage = post.images && post.images.length > 0 ? post.images[0] : null;

  const handleCardPress = () => {
    // TODO: Implémenter la navigation vers les détails du post
    // router.push(`/post/${post.id}`);
    console.log('Navigate to post:', post.id);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      {mainImage && (
        <Image source={{ uri: mainImage }} style={styles.image} />
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        {post.price && (
          <Text style={styles.price}>{post.price} €</Text>
        )}
        <View style={styles.info}>
          {post.location && (
            <View style={styles.infoItem}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.infoText}>{post.location}</Text>
            </View>
          )}
          {post.needed_date && (
            <View style={styles.infoItem}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.infoText}>
                {new Date(post.needed_date).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, liked && styles.actionButtonLiked]}
            onPress={handleLike}
            disabled={checkingLike}
          >
            <Heart
              size={18}
              color={liked ? "#EF4444" : "#6B7280"}
              fill={liked ? "#EF4444" : "none"}
            />
            <Text style={[styles.actionText, liked && styles.actionTextLiked]}>
              {likesCount}
            </Text>
          </TouchableOpacity>
          <View style={styles.actionButton}>
            <MessageCircle size={18} color="#6B7280" />
            <Text style={styles.actionText}>{post.comments_count || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6366F1",
    marginBottom: 12,
  },
  info: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionButtonLiked: {
    // Style pour le bouton liké
  },
  actionText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  actionTextLiked: {
    color: "#EF4444",
  },
});

