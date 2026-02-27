import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useSupabase'

const STORAGE_PREFIX = 'ollync_usage_'
const USAGE_THRESHOLD_MS = 60 * 60 * 1000 // 1 heure
const PERSIST_INTERVAL_MS = 30 * 1000 // Sauvegarder toutes les 30 secondes
const COMPLETED_KEY = 'ollync_personalization_questionnaire_completed'
const REMIND_LATER_KEY = 'ollync_personalization_remind_later_at'
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

/** Retourne true si l'utilisateur a déjà complété le questionnaire de personnalisation */
export function hasCompletedPersonalizationQuestionnaire(): boolean {
  try {
    return localStorage.getItem(COMPLETED_KEY) === 'true'
  } catch {
    return false
  }
}

/** Marque le questionnaire comme complété */
export function markPersonalizationQuestionnaireCompleted(): void {
  try {
    localStorage.setItem(COMPLETED_KEY, 'true')
    localStorage.removeItem(REMIND_LATER_KEY)
  } catch {
    // ignore
  }
}

/** Enregistre "Répondre plus tard" ou fermeture (X) : on redemandera après 24 h */
export function setPersonalizationRemindLater(): void {
  try {
    localStorage.setItem(REMIND_LATER_KEY, String(Date.now()))
  } catch {
    // ignore
  }
}

function getRemindLaterAt(): number | null {
  try {
    const raw = localStorage.getItem(REMIND_LATER_KEY)
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

    if (hasCompletedPersonalizationQuestionnaire()) {
      setShouldShow(false)
      return
    }

    const remindAt = getRemindLaterAt()
    if (remindAt && Date.now() - remindAt < REMIND_LATER_HOURS_MS) {
      setShouldShow(false)
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
      const remindLater = getRemindLaterAt()
      const withinRemindPeriod = remindLater && now - remindLater < REMIND_LATER_HOURS_MS
      setShouldShow(nextTotal >= USAGE_THRESHOLD_MS && !withinRemindPeriod)
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
  }, [user?.id])

  const markCompleted = useCallback(() => {
    markPersonalizationQuestionnaireCompleted()
    setShouldShow(false)
  }, [])

  const skipAndRemindLater = useCallback(() => {
    setPersonalizationRemindLater()
    setShouldShow(false)
  }, [])

  return { shouldShowQuestionnaire: shouldShow, markCompleted, skipAndRemindLater }
}
