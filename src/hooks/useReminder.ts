import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useSupabase'
import { useUnreadCommunicationCounts } from './useUnreadCommunicationCounts'

const STORAGE_PREFIX = 'ollync_reminder_dismissed_'
const STORAGE_NEVER_PREFIX = 'ollync_reminder_never_'
const STORAGE_LAST_ANY = 'ollync_reminder_last_dismissed_any'
/** Dernière fois qu'on a affiché le rappel "Publie une annonce" (max 1 fois par semaine) */
const STORAGE_PUBLISH_LAST_SHOWN = 'ollync_reminder_publish_last_shown'
/** Dernière fois qu'on a affiché le rappel brouillon (max 1 fois/semaine) */
const STORAGE_DRAFT_LAST_SHOWN = 'ollync_reminder_draft_last_shown'
const STORAGE_CONSENT_LAST_SHOWN = 'ollync_consent_last_shown'
const STORAGE_FIRST_SEEN_MAIN = 'ollync_first_seen_main'
const STORAGE_SPLASH_COMPLETED_AT = 'ollync_splash_completed_at'
/** Délai minimum entre deux rappels (quelle que soit l’action) pour éviter d’enchaîner les questions. */
const GLOBAL_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes
/** Ne pas afficher de rappel juste après la fermeture d'un bloc de consentement. */
const CONSENT_COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes
/** Aucun bloc de demande d'action (rappels) avant ce délai après la fin de l'écran de lancement. */
const POST_SPLASH_REMINDER_DELAY_MS = 2 * 60 * 1000 // 2 minutes
/** Temps minimum dans l'app (connecté) avant de proposer "Publier une annonce". */
const PUBLISH_REMINDER_DELAY_MS = 90 * 1000 // 90 secondes
const MESSAGES_THRESHOLD = 50
const NOTIFICATIONS_THRESHOLD = 50
const COOLDOWN_MS = {
  draft: 7 * 24 * 60 * 60 * 1000,       // 1 semaine
  messages: 24 * 60 * 60 * 1000,        // 24h
  notifications: 24 * 60 * 60 * 1000,   // 24h
  publish: 7 * 24 * 60 * 60 * 1000      // 1 semaine (max 1 fois par semaine)
} as const

export type ReminderType = 'draft' | 'messages' | 'notifications' | 'publish'

export type DismissAction = 'cooldown' | 'never'

export interface ReminderItem {
  type: ReminderType
  title: string
  message: string
  buttonLabel: string
  href: string
}

function getDismissedAt(type: ReminderType): number | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${type}`)
    if (!raw) return null
    const t = parseInt(raw, 10)
    return Number.isFinite(t) ? t : null
  } catch {
    return null
  }
}

function isNeverAsk(type: ReminderType): boolean {
  try {
    return localStorage.getItem(`${STORAGE_NEVER_PREFIX}${type}`) === 'true'
  } catch {
    return false
  }
}

function isInCooldown(type: ReminderType): boolean {
  const dismissed = getDismissedAt(type)
  if (dismissed == null) return false
  const cooldown = COOLDOWN_MS[type]
  return Date.now() - dismissed < cooldown
}

function getDraftLastShown(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_DRAFT_LAST_SHOWN)
    if (!raw) return null
    const t = parseInt(raw, 10)
    return Number.isFinite(t) ? t : null
  } catch {
    return null
  }
}

function setDraftLastShown(): void {
  try {
    localStorage.setItem(STORAGE_DRAFT_LAST_SHOWN, String(Date.now()))
  } catch {
    // ignore
  }
}

function getPublishLastShown(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_PUBLISH_LAST_SHOWN)
    if (!raw) return null
    const t = parseInt(raw, 10)
    return Number.isFinite(t) ? t : null
  } catch {
    return null
  }
}

function setPublishLastShown(): void {
  try {
    localStorage.setItem(STORAGE_PUBLISH_LAST_SHOWN, String(Date.now()))
  } catch {
    // ignore
  }
}

/** Vrai si on vient de fermer un rappel (quel qu’il soit) : on n’en affiche pas un autre tout de suite. */
function isInGlobalCooldown(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_LAST_ANY)
    if (!raw) return false
    const t = parseInt(raw, 10)
    if (!Number.isFinite(t)) return false
    return Date.now() - t < GLOBAL_COOLDOWN_MS
  } catch {
    return false
  }
}

export function useReminder() {
  const { user } = useAuth()
  const { counts: unreadCounts } = useUnreadCommunicationCounts()
  const [draftCount, setDraftCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setDraftCount(0)
      setLoading(false)
      return
    }

    let isMounted = true

    const loadDraftCount = async () => {
      const { count, error } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'draft')

      if (error) {
        console.error('Error loading draft count for reminder:', error)
        if (isMounted) setDraftCount(0)
        return
      }
      if (isMounted) setDraftCount(count ?? 0)
    }

    loadDraftCount().finally(() => {
      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const reminder: ReminderItem | null = (() => {
    if (!user) return null
    if (isInGlobalCooldown()) return null

    // Ne pas afficher de bloc de demande d'action dès la fin du splash : attendre que l'utilisateur soit déjà dans l'app
    try {
      const splashRaw = sessionStorage.getItem(STORAGE_SPLASH_COMPLETED_AT)
      if (splashRaw) {
        const t = parseInt(splashRaw, 10)
        if (Number.isFinite(t) && Date.now() - t < POST_SPLASH_REMINDER_DELAY_MS) return null
      }
    } catch {
      // ignore
    }

    // Ne pas afficher un rappel juste après un bloc de consentement (cookies, etc.)
    try {
      const consentRaw = localStorage.getItem(STORAGE_CONSENT_LAST_SHOWN)
      if (consentRaw) {
        const t = parseInt(consentRaw, 10)
        if (Number.isFinite(t) && Date.now() - t < CONSENT_COOLDOWN_MS) return null
      }
    } catch {
      // ignore
    }

    // Brouillons : maximum une fois par semaine ; si l'utilisateur a choisi "Ne plus demander", ne plus jamais afficher.
    if (!loading && draftCount > 0 && !isNeverAsk('draft')) {
      const lastShown = getDraftLastShown()
      const dismissed = getDismissedAt('draft')
      const lastInteraction = lastShown != null && dismissed != null
        ? Math.max(lastShown, dismissed)
        : lastShown ?? dismissed
      if (lastInteraction != null && Date.now() - lastInteraction < COOLDOWN_MS.draft) {
        // Pas encore 7 jours depuis la dernière affichage ou fermeture → ne pas afficher
      } else {
        // On affiche au plus une fois par semaine ; setDraftLastShown() est appelé dans le useEffect plus bas (une seule fois à l'affichage)
        return {
          type: 'draft',
          title: 'Terminer ton brouillon',
          message: draftCount === 1
          ? 'Tu as une annonce en brouillon. Termine-la et publie-la pour qu’elle soit visible.'
          : `Tu as ${draftCount} annonces en brouillon. Termine-les et publie-les pour qu’elles soient visibles.`,
          buttonLabel: 'Voir mes brouillons',
          href: '/profile/annonces'
        }
      }
    }

    // Messages non lus : afficher dès l’entrée dans l’app (sans attendre le chargement des brouillons)
    const messagesCount = unreadCounts?.message ?? 0
    if (messagesCount >= MESSAGES_THRESHOLD && !isNeverAsk('messages') && !isInCooldown('messages')) {
      return {
        type: 'messages',
        title: 'Des échanges t’attendent',
        message: `Tu as ${messagesCount} messages ou demandes non lus. Réponds pour avancer.`,
        buttonLabel: 'Voir les messages',
        href: '/messages'
      }
    }

    // Notifications : seulement à partir de 50 non lues
    const notificationsCount = (unreadCounts?.request ?? 0) + (unreadCounts?.match ?? 0) + (unreadCounts?.appointment ?? 0)
    if (notificationsCount >= NOTIFICATIONS_THRESHOLD && !isNeverAsk('notifications') && !isInCooldown('notifications')) {
      return {
        type: 'notifications',
        title: 'Des notifications t\'attendent',
        message: `Tu as ${notificationsCount} notifications non lues. Consulte-les pour ne rien manquer.`,
        buttonLabel: 'Voir les notifications',
        href: '/notifications'
      }
    }

    // Publier une annonce : afficher dès l’entrée si pas de brouillon ni messages en attente
    if (false && !isNeverAsk('publish') && !isInCooldown('publish')) {
      const publishLastShown = getPublishLastShown()
      const oneWeekMs = COOLDOWN_MS.publish
      if (publishLastShown != null && Date.now() - publishLastShown < oneWeekMs) {
        // Déjà affiché cette semaine
      } else {
        try {
          const firstSeenRaw = sessionStorage.getItem(STORAGE_FIRST_SEEN_MAIN)
          const firstSeen = firstSeenRaw ? parseInt(firstSeenRaw, 10) : 0
          const elapsed = Number.isFinite(firstSeen) ? Date.now() - firstSeen : 0
          if (elapsed >= PUBLISH_REMINDER_DELAY_MS) {
            return {
              type: 'publish',
              title: 'Publie une annonce',
              message: 'Un projet en tête ? Publie une annonce et trouve les bons profils.',
              buttonLabel: 'Publier une annonce',
              href: '/publish'
            }
          }
        } catch {
          // ignore
        }
      }
    }

    return null
  })()

  const [, forceUpdate] = useState(0)

  const dismiss = useCallback((type: ReminderType, action: DismissAction) => {
    try {
      const now = Date.now()
      // "never" = l'utilisateur a choisi "Ne plus demander" → on ne redemande plus jamais (persisté en localStorage)
      if (action === 'never') {
        localStorage.setItem(`${STORAGE_NEVER_PREFIX}${type}`, 'true')
      }
      localStorage.setItem(`${STORAGE_PREFIX}${type}`, String(now))
      localStorage.setItem(STORAGE_LAST_ANY, String(now))
      forceUpdate((n) => n + 1)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (reminder?.type === 'publish') {
      setPublishLastShown()
    }
    if (reminder?.type === 'draft') {
      setDraftLastShown()
    }
  }, [reminder?.type])

  return { reminder, dismiss, loading }
}

/** Clé sessionStorage pour enregistrer la première visite sur une route "reminder" (utilisée par App). */
export const REMINDER_FIRST_SEEN_KEY = STORAGE_FIRST_SEEN_MAIN
