import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MessageCircle } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/Button";
import NetworkError from "../../components/NetworkError";

export default function MessagesPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setNetworkError(false);
    try {
      const { data: participantRows, error: participantsError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (participantsError) {
        console.error("Error fetching participants:", participantsError);
        if (
          participantsError.message?.includes("Failed to fetch") ||
          participantsError.message?.includes("NetworkError") ||
          participantsError.message?.includes("network")
        ) {
          setNetworkError(true);
        }
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = (participantRows || [])
        .map((r) => r.conversation_id)
        .filter(Boolean);

      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: convsData, error: convsError } = await supabase
        .from("conversations")
        .select("id, user1_id, user2_id, post_id, created_at, last_message_at, is_group, group_name")
        .in("id", conversationIds)
        .is("deleted_at", null)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (convsError) {
        console.error("Error fetching conversations:", convsError);
        setConversations([]);
        setLoading(false);
        return;
      }

      const convs = convsData || [];
      const userIds = [...new Set(convs.flatMap((c) => [c.user1_id, c.user2_id]).filter(Boolean))].filter(
        (id) => id !== user.id
      );

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", userIds);

        const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

        const withProfiles = convs.map((conv) => {
          const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
          const profile = otherId ? profilesMap.get(otherId) : null;
          return {
            ...conv,
            other_user: profile || null,
          };
        });
        setConversations(withProfiles);
      } else {
        setConversations(convs);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      if (
        error instanceof Error &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("network"))
      ) {
        setNetworkError(true);
      }
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setLoading(false);
    }
  }, [user, fetchConversations]);

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MessageCircle size={48} color="#6B7280" />
          <Text style={styles.emptyTitle}>Vous n'êtes pas connecté</Text>
          <Text style={styles.emptyText}>
            Connectez-vous pour voir vos conversations
          </Text>
          <Button
            title="Se connecter"
            onPress={() => router.push("/auth/login")}
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
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Chargement des messages...</Text>
        </View>
      ) : networkError ? (
        <NetworkError
          onRetry={fetchConversations}
          message="Impossible de charger les messages. Vérifiez votre connexion Internet."
        />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={48} color="#6B7280" />
          <Text style={styles.emptyTitle}>Aucun message</Text>
          <Text style={styles.emptyText}>
            Vos conversations apparaîtront ici.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.countText}>
            {conversations.length} conversation
            {conversations.length > 1 ? "s" : ""}
          </Text>
          {conversations.map((conv) => {
            const name =
              conv.is_group && conv.group_name
                ? conv.group_name
                : conv.other_user?.full_name ||
                  conv.other_user?.username ||
                  "Utilisateur";
            const avatar = conv.other_user?.avatar_url;
            return (
              <TouchableOpacity
                key={conv.id}
                style={styles.convCard}
                onPress={() => {
                  // TODO: navigation vers conversation /messages/[id]
                  console.log("Open conversation:", conv.id);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.avatarContainer}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {(name[0] || "?").toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.convInfo}>
                  <Text style={styles.convName} numberOfLines={1}>
                    {name}
                  </Text>
                  {conv.last_message_at && (
                    <Text style={styles.convDate}>
                      {new Date(conv.last_message_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
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
    minHeight: 56,
    justifyContent: "center",
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
  convCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  convInfo: {
    flex: 1,
  },
  convName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  convDate: {
    fontSize: 12,
    color: "#6B7280",
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
