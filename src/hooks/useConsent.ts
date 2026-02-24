import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from './useSupabase'
import { supabase } from '../lib/supabaseClient'

export type ConsentType = 
  | 'location'
  | 'media'
  | 'profile_data'
  | 'messaging'
  | 'cookies'
  | 'behavioral_data'

interface ConsentRecord {
  accepted: boolean
  ask_again: boolean
  updated_at?: string
  version?: string
}

const STORAGE_KEY_PREFIX = 'consent_'
const SESSION_KEY_PREFIX = 'consent_asked_'
const CONSENT_VERSION: Record<ConsentType, string> = {
  location: 'v1',
  media: 'v1',
  profile_data: 'v1',
  messaging: 'v1',
  cookies: 'v1',
  behavioral_data: 'v1'
}

export const useConsent = (consentType: ConsentType) => {
  const { user } = useAuth()
  const { t } = useTranslation('consent')
  const isGuestConsent = false
  const [consentRecord, setConsentRecord] = useState<ConsentRecord | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [askAgainNextTime, setAskAgainNextTime] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cookiesProfileReady, setCookiesProfileReady] = useState(consentType !== 'cookies')
  const [cookiesDelayElapsed, setCookiesDelayElapsed] = useState(consentType !== 'cookies')
  const consentVersion = CONSENT_VERSION[consentType]
  const COOKIE_PROMPT_DELAY_MS = 5 * 60 * 1000
  const getCookiesFirstSeenKey = () => (user ? `${STORAGE_KEY_PREFIX}cookies_first_seen_${user.id}` : '')

  const getStorageKey = () => {
    // Cookies consent is app-wide for the browser session/profile lifecycle
    if (consentType === 'cookies') return `${STORAGE_KEY_PREFIX}global_${consentType}`
    if (user) return `${STORAGE_KEY_PREFIX}${user.id}_${consentType}`
    if (isGuestConsent) return `${STORAGE_KEY_PREFIX}guest_${consentType}`
    return ''
  }
  const getSessionKey = () => {
    if (user) return `${SESSION_KEY_PREFIX}${user.id}_${consentType}`
    if (isGuestConsent) return `${SESSION_KEY_PREFIX}guest_${consentType}`
    return ''
  }

  const loadFromStorage = (): ConsentRecord | null => {
    if (typeof window === 'undefined' || (!user && !isGuestConsent)) return null
    const storageKey = getStorageKey()
    let stored = localStorage.getItem(storageKey)
    // Backward compatibility: migrate legacy cookies key to global key.
    if (!stored && consentType === 'cookies') {
      const legacyUserKey = user ? `${STORAGE_KEY_PREFIX}${user.id}_${consentType}` : null
      const legacyGuestKey = `${STORAGE_KEY_PREFIX}guest_${consentType}`
      stored = (legacyUserKey ? localStorage.getItem(legacyUserKey) : null) || localStorage.getItem(legacyGuestKey)
      if (stored) {
        localStorage.setItem(storageKey, stored)
      }
    }
    if (!stored) return null
    if (stored === 'true' || stored === 'false') {
      return {
        accepted: stored === 'true',
        ask_again: false,
        version: consentVersion
      }
    }
    try {
      const parsed = JSON.parse(stored) as ConsentRecord
      if (typeof parsed?.accepted === 'boolean') {
        return {
          accepted: parsed.accepted,
          ask_again: !!parsed.ask_again,
          updated_at: parsed.updated_at,
          version: parsed.version || consentVersion
        }
      }
    } catch (error) {
      console.warn('Invalid consent storage format:', error)
    }
    return null
  }

  const saveToStorage = (record: ConsentRecord) => {
    if (typeof window === 'undefined' || (!user && !isGuestConsent)) return
    const storageKey = getStorageKey()
    localStorage.setItem(storageKey, JSON.stringify(record))
  }

  const markAskedThisSession = () => {
    if (typeof window === 'undefined' || (!user && !isGuestConsent)) return
    const sessionKey = getSessionKey()
    sessionStorage.setItem(sessionKey, 'true')
  }

  const wasAskedThisSession = () => {
    if (typeof window === 'undefined' || (!user && !isGuestConsent)) return false
    const sessionKey = getSessionKey()
    return sessionStorage.getItem(sessionKey) === 'true'
  }

  const fetchConsent = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('data_consent, full_name, username')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching consent:', error)
        return
      }

      const typedData = data as {
        data_consent?: Record<string, ConsentRecord> | null
        full_name?: string | null
        username?: string | null
      } | null
      const dataConsent = typedData?.data_consent || {}
      const record = dataConsent?.[consentType]
      if (consentType === 'cookies') {
        const hasProfileIdentity = !!(typedData?.full_name?.trim() || typedData?.username?.trim())
        setCookiesProfileReady(hasProfileIdentity)
      }
      if (record && typeof record === 'object') {
        const normalized: ConsentRecord = {
          accepted: !!record.accepted,
          ask_again: !!record.ask_again,
          updated_at: record.updated_at,
          version: record.version || consentVersion
        }
        setConsentRecord(normalized)
        saveToStorage(normalized)
        return
      }
    } catch (error) {
      console.error('Error in fetchConsent:', error)
    }
  }

  const persistConsent = async (record: ConsentRecord) => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('data_consent')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading existing consent:', error)
        return
      }

      const existing = (data as { data_consent?: Record<string, ConsentRecord> | null } | null)?.data_consent || {}
      const nextConsent = {
        ...existing,
        [consentType]: record
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('profiles') as any)
        .update({
          data_consent: nextConsent,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating consent:', updateError)
      }
    } catch (error) {
      console.error('Error in persistConsent:', error)
    }
  }

  // Récupérer le consentement depuis le stockage local + base de données
  useEffect(() => {
    if (!user && !isGuestConsent) {
      setConsentRecord(null)
      if (consentType === 'cookies') {
        setCookiesProfileReady(false)
        setCookiesDelayElapsed(false)
      }
      setLoading(false)
      return
    }

    setLoading(true)
    const stored = loadFromStorage()
    if (stored) {
      setConsentRecord(stored)
    }
    if (!user) {
      setLoading(false)
      return
    }
    fetchConsent().finally(() => {
      setLoading(false)
    })
  }, [user, consentType, isGuestConsent])

  useEffect(() => {
    if (consentType !== 'cookies') return
    if (!user || typeof window === 'undefined') {
      setCookiesDelayElapsed(false)
      return
    }

    const firstSeenKey = getCookiesFirstSeenKey()
    const storedFirstSeen = localStorage.getItem(firstSeenKey)
    const firstSeen = storedFirstSeen ? Number(storedFirstSeen) : Date.now()
    if (!storedFirstSeen || Number.isNaN(firstSeen)) {
      localStorage.setItem(firstSeenKey, String(Date.now()))
    }

    const elapsed = Date.now() - firstSeen
    if (elapsed >= COOKIE_PROMPT_DELAY_MS) {
      setCookiesDelayElapsed(true)
      return
    }

    setCookiesDelayElapsed(false)
    const timeout = window.setTimeout(() => {
      setCookiesDelayElapsed(true)
    }, COOKIE_PROMPT_DELAY_MS - elapsed)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [consentType, user])

  const canPromptNow =
    consentType !== 'cookies' || (!!user && cookiesProfileReady && cookiesDelayElapsed)

  // Vérifier si le consentement est nécessaire avant une action
  const requireConsent = (action: () => void): boolean => {
    if (consentType === 'cookies' && !canPromptNow) {
      action()
      return false
    }

    if (!user && !isGuestConsent) {
      // Si l'utilisateur n'est pas connecté, on ne demande pas de consentement
      action()
      return false
    }

    const askedThisSession = wasAskedThisSession()
    const hasRecord = !!consentRecord
    const versionMatches = consentRecord?.version === consentVersion
    const shouldAskAgain = consentRecord?.ask_again && !askedThisSession

    if (hasRecord) {
      if (consentRecord?.accepted) {
        if (!shouldAskAgain && versionMatches) {
          action()
          return false
        }
      } else {
        // L'utilisateur a refusé : ne pas bloquer l'accès, re-afficher le modal à chaque tentative
        // On ne fait pas de return ici pour tomber dans le flux qui affiche le modal
      }
    } else if (loading) {
      // Si le chargement est en cours, on attend la décision en ouvrant le modal
    }

    // Sinon, on affiche le modal et on stocke l'action
    setAskAgainNextTime(consentRecord?.ask_again ?? false)
    setPendingAction(() => action)
    setShowModal(true)
    return true
  }

  // Gérer l'acceptation du consentement
  const handleAccept = () => {
    if (!user && !isGuestConsent) return

    const record: ConsentRecord = {
      accepted: true,
      ask_again: askAgainNextTime,
      updated_at: new Date().toISOString(),
      version: consentVersion
    }
    setConsentRecord(record)
    saveToStorage(record)
    if (user) {
      persistConsent(record)
    }
    markAskedThisSession()
    setShowModal(false)

    // Exécuter l'action en attente
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  // Gérer le refus du consentement
  const handleReject = () => {
    const record: ConsentRecord = {
      accepted: false,
      ask_again: askAgainNextTime,
      updated_at: new Date().toISOString(),
      version: consentVersion
    }
    setConsentRecord(record)
    saveToStorage(record)
    if (user) {
      persistConsent(record)
    }
    markAskedThisSession()
    setShowModal(false)
    setPendingAction(null)
    // L'action n'est pas exécutée, l'utilisateur reste sur la page actuelle
  }

  // Ferme le modal sans accepter/refuser (utilisé pour "En savoir plus")
  const dismissModal = () => {
    setShowModal(false)
    setPendingAction(null)
  }

  const consentFallbacks: Record<ConsentType, { title: string; message: string }> = {
    location: {
      title: 'Utilisation de la localisation',
      message: 'Nous utilisons votre position pour afficher les annonces proches de vous.'
    },
    media: {
      title: 'Utilisation des médias',
      message: 'Nous utilisons vos photos et vidéos pour publier votre annonce.'
    },
    profile_data: {
      title: 'Utilisation des données de profil',
      message: 'Nous utilisons vos infos de profil pour identifier votre compte.'
    },
    messaging: {
      title: 'Utilisation de la messagerie',
      message: 'Nous utilisons la messagerie pour envoyer, recevoir et garder l’historique des échanges.'
    },
    cookies: {
      title: 'Utilisation des cookies',
      message: 'Nous utilisons des cookies nécessaires, et avec votre accord, des cookies de mesure.'
    },
    behavioral_data: {
      title: 'Analyse d\'utilisation',
      message: 'Nous analysons certaines actions pour améliorer les fonctionnalités.'
    }
  }

  const safeTranslate = (key: string, fallback: string) => {
    const value = t(key, { defaultValue: fallback })
    if (!value) return fallback
    if (value === key) return fallback
    if (value.startsWith('consent.')) return fallback
    return value
  }

  const isRetryAfterRefusal = !!consentRecord && !consentRecord.accepted
  const retryFallback = 'Pour continuer, vous devez accepter.'
  const retryMessage = safeTranslate('retryMessage', retryFallback)

  const consentMessages = {
    title: safeTranslate(`types.${consentType}.title`, consentFallbacks[consentType].title),
    message: isRetryAfterRefusal
      ? retryMessage
      : safeTranslate(`types.${consentType}.message`, consentFallbacks[consentType].message)
  }

  return {
    hasConsented: consentRecord?.accepted ?? null,
    loading,
    canPromptNow,
    showModal,
    requireConsent,
    handleAccept,
    handleReject,
    dismissModal,
    askAgainNextTime,
    setAskAgainNextTime,
    messages: consentMessages
  }
}
