import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";

const SPRING_CONFIG = { damping: 18, stiffness: 120 };

export default function OnboardingSlide({
  slide,
  index,
  isActive,
  scrollX,
  width,
}) {
  const { title, description, lottieSource } = slide;
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const descOpacity = useSharedValue(0);
  const descTranslateY = useSharedValue(16);
  const lottieScale = useSharedValue(0.92);
  const lottiePulse = useSharedValue(1);

  useEffect(() => {
    if (!isActive) {
      titleOpacity.value = 0;
      titleTranslateY.value = 20;
      descOpacity.value = 0;
      descTranslateY.value = 16;
      lottieScale.value = 0.92;
      lottiePulse.value = 1;
      return;
    }
    titleOpacity.value = withTiming(1, { duration: 400 });
    titleTranslateY.value = withSpring(0, SPRING_CONFIG);
    descOpacity.value = withDelay(120, withTiming(1, { duration: 400 }));
    descTranslateY.value = withDelay(120, withSpring(0, SPRING_CONFIG));
    lottieScale.value = withSpring(1, SPRING_CONFIG);
    lottiePulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, [isActive]);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const descAnimatedStyle = useAnimatedStyle(() => ({
    opacity: descOpacity.value,
    transform: [{ translateY: descTranslateY.value }],
  }));

  const lottieAnimatedStyle = useAnimatedStyle(() => {
    const x = scrollX.value;
    const parallax = interpolate(
      x,
      [(index - 1) * width, index * width, (index + 1) * width],
      [-20, 0, 20]
    );
    const scale = lottieScale.value * lottiePulse.value;
    return {
      transform: [{ scale }, { translateX: parallax * 0.4 }],
    };
  });

  const gradients = [
    { colors: ["#6366F1", "#8B5CF6", "#A855F7"] },
    { colors: ["#0EA5E9", "#6366F1", "#8B5CF6"] },
    { colors: ["#8B5CF6", "#EC4899", "#F43F5E"] },
    { colors: ["#059669", "#10B981", "#34D399"] },
  ];
  const gradient = gradients[index % gradients.length];

  return (
    <View style={[styles.slide, { width }]}>
      <LinearGradient
        colors={gradient.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glow} />
      <View style={styles.content}>
        <Animated.View style={[styles.lottieWrap, lottieAnimatedStyle]}>
          <LottieView
            source={lottieSource}
            autoPlay
            loop
            style={styles.lottie}
          />
        </Animated.View>
        <Animated.Text style={[styles.title, titleAnimatedStyle]}>
          {title}
        </Animated.Text>
        <Animated.Text style={[styles.description, descAnimatedStyle]}>
          {description}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  content: {
    paddingHorizontal: 32,
    alignItems: "center",
    maxWidth: 360,
  },
  lottieWrap: {
    width: 180,
    height: 180,
    marginBottom: 40,
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    lineHeight: 24,
  },
});
