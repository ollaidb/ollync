import { View, Text, StyleSheet } from "react-native";
import { WifiOff } from "lucide-react-native";
import Button from "./Button";

export default function NetworkError({ onRetry, message }) {
  return (
    <View style={styles.container}>
      <WifiOff size={48} color="#6B7280" />
      <Text style={styles.title}>Problème de connexion</Text>
      <Text style={styles.message}>
        {message || "Vérifiez votre connexion Internet et réessayez."}
      </Text>
      {onRetry && (
        <Button
          title="Réessayer"
          onPress={onRetry}
          variant="primary"
          style={{ marginTop: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 300,
  },
});

