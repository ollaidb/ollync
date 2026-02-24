import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useSupabase'
import { useUnreadCommunicationCounts } from './useUnreadCommunicationCounts'

const STORAGE_PREFIX = 'ollync_reminder_dismissed_'
const STORAGE_LAST_ANY = 'ollync_reminder_last_dismissed_any'
/** Délai minimum entre deux rappels (quelle que soit l’action) pour éviter d’enchaîner les questions. */
const GLOBAL_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes
const COOLDOWN_MS = {
  draft: 24 * 60 * 60 * 1000,      // 24h
  messages: 24 * 60 * 60 * 1000,   // 24h
  publish: 5 * 24 * 60 * 60 * 1000 // 5 jours
} as const

export type ReminderType = 'draft' | 'messages' | 'publish'

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

function isInCooldown(type: ReminderType): boolean {
  const dismissed = getDismissedAt(type)
  if (dismissed == null) return false
  const cooldown = COOLDOWN_MS[type]
  return Date.now() - dismissed < cooldown
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
  const { total: unreadTotal } = useUnreadCommunicationCounts()
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
    if (!user || loading) return null
    if (isInGlobalCooldown()) return null

    if (draftCount > 0 && !isInCooldown('draft')) {
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

    if (unreadTotal > 0 && !isInCooldown('messages')) {
      return {
        type: 'messages',
        title: 'Des échanges t’attendent',
        message: unreadTotal === 1
          ? 'Tu as un message ou une demande non lue. Réponds pour avancer.'
          : `Tu as ${unreadTotal} messages ou demandes non lus. Réponds pour avancer.`,
        buttonLabel: 'Voir les messages',
        href: '/messages'
      }
    }

    if (!isInCooldown('publish')) {
      return {
        type: 'publish',
        title: 'Publie une annonce',
        message: 'Un projet en tête ? Publie une annonce et trouve les bons profils.',
        buttonLabel: 'Publier une annonce',
        href: '/publish'
      }
    }

    return null
  })()

  const [, forceUpdate] = useState(0)

  const dismiss = useCallback((type: ReminderType) => {
    try {
      const now = Date.now()
      localStorage.setItem(`${STORAGE_PREFIX}${type}`, String(now))
      localStorage.setItem(STORAGE_LAST_ANY, String(now))
      forceUpdate((n) => n + 1)
    } catch {
      // ignore
    }
  }, [])

  return { reminder, dismiss, loading }
}
