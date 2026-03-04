import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useSupabase'
import { supabase } from '../lib/supabaseClient'

const STORAGE_PREFIX = 'ollync_usage_'
const USAGE_THRESHOLD_MS = 60 * 60 * 1000 // 1 heure
const PERSIST_INTERVAL_MS = 30 * 1000 // Sauvegarder toutes les 30 secondes
const QUESTIONNAIRE_VERSION = '1'
const COMPLETED_KEY_PREFIX = 'ollync_personalization_questionnaire_completed_v'
const REMIND_LATER_KEY_PREFIX = 'ollync_personalization_remind_later_at_v'
const REMIND_LATER_HOURS_MS = 24 * 60 * 60 * 1000 // 24 heures

export interface UsageState {
  /** Temps cumulé en ms */
  totalMs: number
  /** Timestamp de début de la session en cours */
  sessionStartAt: number
}

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`
}

function loadUsage(userId: string): UsageState | null {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { totalMs?: number; sessionStartAt?: number }
    if (typeof parsed.totalMs !== 'number' || typeof parsed.sessionStartAt !== 'number') return null
    return { totalMs: parsed.totalMs, sessionStartAt: parsed.sessionStartAt }
  } catch {
    return null
  }
}

function saveUsage(userId: string, state: UsageState): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state))
  } catch {
    // ignore
  }
}

function getCompletedKey(userId?: string): string {
  return `${COMPLETED_KEY_PREFIX}${QUESTIONNAIRE_VERSION}${userId ? `_${userId}` : ''}`
}

function getRemindLaterKey(userId?: string): string {
  return `${REMIND_LATER_KEY_PREFIX}${QUESTIONNAIRE_VERSION}${userId ? `_${userId}` : ''}`
}

/** Retourne true si l'utilisateur a déjà complété le questionnaire de personnalisation */
export function hasCompletedPersonalizationQuestionnaire(userId?: string): boolean {
  try {
    return localStorage.getItem(getCompletedKey(userId)) === 'true'
  } catch {
    return false
  }
}

/** Marque le questionnaire comme complété */
export function markPersonalizationQuestionnaireCompleted(userId?: string): void {
  try {
    localStorage.setItem(getCompletedKey(userId), 'true')
    localStorage.removeItem(getRemindLaterKey(userId))
  } catch {
    // ignore
  }
}

/** Enregistre "Répondre plus tard" ou fermeture (X) : on redemandera après 24 h */
export function setPersonalizationRemindLater(userId?: string): void {
  try {
    localStorage.setItem(getRemindLaterKey(userId), String(Date.now()))
  } catch {
    // ignore
  }
}

function getRemindLaterAt(userId?: string): number | null {
  try {
    const raw = localStorage.getItem(getRemindLaterKey(userId))
    if (!raw) return null
    const t = parseInt(raw, 10)
    return Number.isFinite(t) ? t : null
  } catch {
    return null
  }
}

/**
 * Hook qui track le temps d'utilisation cumulé de l'app pour un utilisateur connecté.
 * Retourne true quand l'utilisateur a cumulé >= 1 heure et n'a pas encore complété le questionnaire.
 * "Plus tard" ou la croix reporte l'affichage de 24 heures.
 */
export function useAppUsageTime(): {
  shouldShowQuestionnaire: boolean
  markCompleted: () => void
  skipAndRemindLater: () => void
} {
  const { user } = useAuth()
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setShouldShow(false)
      return
    }

    let disposed = false

    const initialize = async () => {
      if (hasCompletedPersonalizationQuestionnaire(user.id)) {
        if (!disposed) setShouldShow(false)
        return
      }

      // Sécurité: si le profil a déjà des préférences, considérer le questionnaire comme déjà traité
      // même si le localStorage a été purgé après une mise à jour/appareil.
      try {
        const { data: profile } = await (supabase.from('profiles') as any)
          .select('display_categories, display_subcategories, profile_type')
          .eq('id', user.id)
          .single()

        const hasProfilePreferences =
          (Array.isArray(profile?.display_categories) && profile.display_categories.length > 0) ||
          (Array.isArray(profile?.display_subcategories) && profile.display_subcategories.length > 0) ||
          (typeof profile?.profile_type === 'string' && profile.profile_type.trim().length > 0)

        if (hasProfilePreferences) {
          markPersonalizationQuestionnaireCompleted(user.id)
          if (!disposed) setShouldShow(false)
          return
        }
      } catch {
        // ignore
      }

      const remindAt = getRemindLaterAt(user.id)
      if (remindAt && Date.now() - remindAt < REMIND_LATER_HOURS_MS) {
        if (!disposed) setShouldShow(false)
        return
      }

      // Charger l'état initial ou démarrer une nouvelle session
      let state = loadUsage(user.id)
      const now = Date.now()
      if (!state) {
        state = { totalMs: 0, sessionStartAt: now }
        saveUsage(user.id, state)
      }

      const checkAndUpdate = () => {
        const now = Date.now()
        const current = loadUsage(user.id) ?? state!
        const elapsed = now - current.sessionStartAt
        const nextTotal = current.totalMs + elapsed
        const nextState: UsageState = { totalMs: nextTotal, sessionStartAt: now }
        saveUsage(user.id, nextState)
        const remindLater = getRemindLaterAt(user.id)
        const withinRemindPeriod = remindLater && now - remindLater < REMIND_LATER_HOURS_MS
        if (!disposed) setShouldShow(nextTotal >= USAGE_THRESHOLD_MS && !withinRemindPeriod)
      }

      // Persister périodiquement
      const interval = setInterval(checkAndUpdate, PERSIST_INTERVAL_MS)

      // Persister quand l'utilisateur quitte l'onglet
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          checkAndUpdate()
        }
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Vérification initiale
      checkAndUpdate()

      return () => {
        clearInterval(interval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }

    let cleanup: (() => void) | undefined
    void initialize().then((fn) => {
      cleanup = fn
    })

    return () => {
      disposed = true
      if (cleanup) cleanup()
    }
  }, [user?.id])

  const markCompleted = useCallback(() => {
    markPersonalizationQuestionnaireCompleted(user?.id)
    setShouldShow(false)
  }, [user?.id])

  const skipAndRemindLater = useCallback(() => {
    setPersonalizationRemindLater(user?.id)
    setShouldShow(false)
  }, [user?.id])

  return { shouldShowQuestionnaire: shouldShow, markCompleted, skipAndRemindLater }
}
