import React, { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import RNOnboarding from "react-native-onboarding-swiper";
import { ONBOARDING_SLIDES } from "../../constants/onboardingContent";

/** Fond d’une slide : dégradé + overlay qui pulse pour un rendu plus vivant. */
function SlideBackground({ colors }) {
  const opacity = useSharedValue(0.04);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.12, { duration: 2200 }),
        withTiming(0.04, { duration: 2200 })
      ),
      -1,
      true
    );
  }, [opacity]);
  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.glowOverlay, overlayStyle]}
      />
    </View>
  );
}

/**
 * Onboarding basé sur react-native-onboarding-swiper :
 * dégradés plein écran par slide, overlay animé, Lottie, swipe fluide.
 */
export default function Onboarding({ onComplete, onSkip }) {
  const pages = useMemo(
    () =>
      ONBOARDING_SLIDES.map((slide) => ({
        backgroundColor: slide.gradient[slide.gradient.length - 1],
        isLight: false,
        background: <SlideBackground colors={slide.gradient} />,
        image: (
          <View style={styles.lottieContainer}>
            <LottieView
              source={slide.lottieSource}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>
        ),
        title: slide.title,
        subtitle: slide.description,
      })),
    []
  );

  return (
    <>
      <StatusBar style="light" />
      <RNOnboarding
        pages={pages}
        onDone={onComplete}
        onSkip={onSkip}
        showSkip
        showNext
        showDone
        showPagination
        skipLabel="Passer"
        nextLabel="Suivant"
        doneLabel="Get started"
        controlStatusBar={false}
        bottomBarHighlight
        bottomBarHeight={72}
        titleStyles={styles.title}
        subTitleStyles={styles.subtitle}
        containerStyles={styles.container}
        imageContainerStyles={styles.imageContainer}
      />
    </>
  );
}

const styles = StyleSheet.create({
  glowOverlay: {
    backgroundColor: "#fff",
  },
  container: {
    paddingHorizontal: 24,
  },
  imageContainer: {
    paddingBottom: 32,
    minHeight: 200,
  },
  lottieContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: 200,
    height: 200,
  },
  title: {
    fontWeight: "800",
    fontSize: 26,
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    lineHeight: 24,
  },
});
