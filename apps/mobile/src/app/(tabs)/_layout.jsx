import { Tabs, usePathname } from "expo-router";
import { Home, Heart, MessageCircle, User } from "lucide-react-native";

const ACTIVE_COLOR = "#6366F1";
const INACTIVE_COLOR = "#6B7280";

/**
 * Icône d’onglet dont la couleur est dérivée du pathname pour éviter
 * les bugs où focused n’est pas à jour (icône qui reste grise sur l’onglet actif).
 */
function TabIcon({ tabName, Icon, pathname, size }) {
  const isIndex = tabName === "index";
  const isFocused = isIndex
    ? pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/" || pathname === "" || pathname === "/index"
    : pathname === "/" + tabName || pathname.startsWith("/" + tabName + "/");
  const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
  return <Icon color={color} size={size} />;
}

export default function TabLayout() {
  const pathname = usePathname();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingTop: 4,
        },
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ size }) => (
            <TabIcon tabName="index" Icon={Home} pathname={pathname} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoris",
          tabBarIcon: ({ size }) => (
            <TabIcon tabName="favorites" Icon={Heart} pathname={pathname} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ size }) => (
            <TabIcon tabName="messages" Icon={MessageCircle} pathname={pathname} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ size }) => (
            <TabIcon tabName="profile" Icon={User} pathname={pathname} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

