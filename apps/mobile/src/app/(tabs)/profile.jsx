import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Settings, Shield, HelpCircle, FileText, LogOut, ChevronRight, RotateCcw } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import { ONBOARDING_STORAGE_KEY } from "../../constants/onboardingContent";
import Button from "../../components/Button";

export default function ProfilePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            const profileInsert = {
              id: user.id,
              email: user.email || null,
              full_name: user.user_metadata?.full_name || null,
              username: user.user_metadata?.username || null
            };
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert(profileInsert)
              .select('id, username, full_name, avatar_url')
              .single();

            if (newProfile) {
              setProfile(newProfile);
            } else {
              setProfile({
                id: user.id,
                username: user.user_metadata?.username || null,
                full_name: user.user_metadata?.full_name || null,
                avatar_url: null
              });
            }
          } else {
            setProfile({
              id: user.id,
              username: user.user_metadata?.username || null,
              full_name: user.user_metadata?.full_name || null,
              avatar_url: null
            });
          }
        } else if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile({
          id: user.id,
          username: user.user_metadata?.username || null,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: null
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(tabs)');
  };

  const displayName = user
    ? (profile?.full_name || profile?.username || 'Utilisateur')
    : 'Se connecter';

  const menuItems = user
    ? [
        {
          id: 'settings',
          icon: Settings,
          label: 'Paramètres',
          onPress: () => router.push('/profile/settings'),
        },
        {
          id: 'security',
          icon: Shield,
          label: 'Connexion et sécurité',
          onPress: () => router.push('/profile/security'),
        },
        {
          id: 'help',
          icon: HelpCircle,
          label: 'Aide',
          onPress: () => router.push('/profile/help'),
        },
        {
          id: 'legal',
          icon: FileText,
          label: 'Pages légales',
          onPress: () => router.push('/profile/legal'),
        },
        {
          id: 'reset-onboarding',
          icon: RotateCcw,
          label: "Réafficher l'onboarding",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
              router.replace('/onboarding');
            } catch (e) {
              console.warn(e);
            }
          },
        },
      ]
    : [
        {
          id: 'help',
          icon: HelpCircle,
          label: 'Aide',
          onPress: () => router.push('/profile/help'),
        },
        {
          id: 'legal',
          icon: FileText,
          label: 'Pages légales',
          onPress: () => router.push('/profile/legal'),
        },
      ];

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon compte</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => {
            if (user) {
              router.push('/profile/public');
            } else {
              router.push('/auth/login');
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            {user && profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(displayName[0] || 'U').toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <ChevronRight size={20} color="#6B7280" />
        </TouchableOpacity>

        <View style={styles.menuList}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemIcon}>
                  <Icon size={20} color="#6B7280" />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                <ChevronRight size={18} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>

        {user ? (
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLogout]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemIcon}>
              <LogOut size={20} color="#EF4444" />
            </View>
            <Text style={[styles.menuItemLabel, styles.menuItemLogoutText]}>
              Déconnexion
            </Text>
          </TouchableOpacity>
        ) : (
          <Button
            title="Se connecter"
            onPress={() => router.push('/auth/login')}
            style={{ marginTop: 20 }}
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
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
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
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  menuList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  menuItemIcon: {
    width: 24,
    marginRight: 12,
    alignItems: "center",
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  menuItemLogout: {
    borderBottomWidth: 0,
  },
  menuItemLogoutText: {
    color: "#EF4444",
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

