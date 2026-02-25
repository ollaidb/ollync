import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useOnboardingStorage } from "../hooks/useOnboardingStorage";
import Onboarding from "../components/onboarding/Onboarding";

export default function OnboardingScreen() {
  const router = useRouter();
  const { markOnboardingSeen } = useOnboardingStorage();

  const handleComplete = () => {
    markOnboardingSeen();
    router.replace("/(tabs)");
  };

  const handleSkip = () => {
    markOnboardingSeen();
    router.replace("/(tabs)");
  };

  return (
    <Onboarding onComplete={handleComplete} onSkip={handleSkip} />
  );
}
