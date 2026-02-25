import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import {
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_CONTENT_VERSION,
} from "../constants/onboardingContent";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

/** Version "vue" = app + contenu des slides. Si on met à jour les slides, on incrémente ONBOARDING_CONTENT_VERSION. */
const SEEN_VERSION = `${APP_VERSION}|${ONBOARDING_CONTENT_VERSION}`;

/**
 * Onboarding réaffiché à chaque mise à jour de l'app ou du contenu des slides
 * (incrémenter ONBOARDING_CONTENT_VERSION pour forcer tout le monde à revoir).
 */
export function useOnboardingStorage() {
  const [seenForCurrentVersion, setSeenForCurrentVersion] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        setSeenForCurrentVersion(cancelled ? null : stored === SEEN_VERSION);
      } catch {
        setSeenForCurrentVersion(cancelled ? null : false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const markOnboardingSeen = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, SEEN_VERSION);
      setSeenForCurrentVersion(true);
    } catch (e) {
      console.warn("useOnboardingStorage: markSeen failed", e);
    }
  }, []);

  return {
    /** true = déjà vu pour cette version, false = pas vu, null = en cours de lecture */
    seenForCurrentVersion,
    markOnboardingSeen,
    appVersion: APP_VERSION,
  };
}
