import { useState, useCallback, useEffect } from 'react'
import type { OnboardingGuideId } from '../constants/onboardingGuides'
import {
  ONBOARDING_STORAGE_KEY_PREFIX,
  ONBOARDING_GUIDES_CONTENT_VERSION,
} from '../constants/onboardingGuides'

function getStored(guideId: OnboardingGuideId): boolean {
  if (typeof window === 'undefined') return false
  try {
    const key = ONBOARDING_STORAGE_KEY_PREFIX + guideId
    return localStorage.getItem(key) === ONBOARDING_GUIDES_CONTENT_VERSION
  } catch {
    return false
  }
}

/**
 * "Vu" = même version de contenu que l’actuelle. Si on incrémente ONBOARDING_GUIDES_CONTENT_VERSION,
 * tous les profils revoient les guides (nouveaux slides).
 */
export function useOnboardingSeen(guideId: OnboardingGuideId): {
  seen: boolean
  markSeen: () => void
} {
  const [seen, setSeen] = useState<boolean>(() => getStored(guideId))

  useEffect(() => {
    setSeen(getStored(guideId))
  }, [guideId])

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(
        ONBOARDING_STORAGE_KEY_PREFIX + guideId,
        ONBOARDING_GUIDES_CONTENT_VERSION
      )
      setSeen(true)
    } catch {
      setSeen(true)
    }
  }, [guideId])

  return { seen, markSeen }
}

/** Réafficher tous les guides (pour tests / suggestions). */
export function clearAllOnboardingSeen(): void {
  if (typeof window === 'undefined') return
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(ONBOARDING_STORAGE_KEY_PREFIX)) keys.push(key)
    }
    keys.forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignore
  }
}
