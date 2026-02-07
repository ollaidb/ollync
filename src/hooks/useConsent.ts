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

interface ConsentMessages {
  title: string
  message: string
}

interface ConsentRecord {
  accepted: boolean
  ask_again: boolean
  updated_at?: string
}

const STORAGE_KEY_PREFIX = 'consent_'
const SESSION_KEY_PREFIX = 'consent_asked_'

export const useConsent = (consentType: ConsentType) => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [consentRecord, setConsentRecord] = useState<ConsentRecord | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [askAgainNextTime, setAskAgainNextTime] = useState(false)
  const [loading, setLoading] = useState(true)

  const getStorageKey = () => (user ? `${STORAGE_KEY_PREFIX}${user.id}_${consentType}` : '')
  const getSessionKey = () => (user ? `${SESSION_KEY_PREFIX}${user.id}_${consentType}` : '')

  const loadFromStorage = (): ConsentRecord | null => {
    if (typeof window === 'undefined' || !user) return null
    const storageKey = getStorageKey()
    const stored = localStorage.getItem(storageKey)
    if (!stored) return null
    if (stored === 'true' || stored === 'false') {
      return {
        accepted: stored === 'true',
        ask_again: false
      }
    }
    try {
      const parsed = JSON.parse(stored) as ConsentRecord
      if (typeof parsed?.accepted === 'boolean') {
        return {
          accepted: parsed.accepted,
          ask_again: !!parsed.ask_again,
          updated_at: parsed.updated_at
        }
      }
    } catch (error) {
      console.warn('Invalid consent storage format:', error)
    }
    return null
  }

  const saveToStorage = (record: ConsentRecord) => {
    if (typeof window === 'undefined' || !user) return
    const storageKey = getStorageKey()
    localStorage.setItem(storageKey, JSON.stringify(record))
  }

  const markAskedThisSession = () => {
    if (typeof window === 'undefined' || !user) return
    const sessionKey = getSessionKey()
    sessionStorage.setItem(sessionKey, 'true')
  }

  const wasAskedThisSession = () => {
    if (typeof window === 'undefined' || !user) return false
    const sessionKey = getSessionKey()
    return sessionStorage.getItem(sessionKey) === 'true'
  }

  const fetchConsent = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('data_consent')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching consent:', error)
        return
      }

      const dataConsent = (data as { data_consent?: Record<string, ConsentRecord> | null } | null)?.data_consent || {}
      const record = dataConsent?.[consentType]
      if (record && typeof record === 'object') {
        const normalized: ConsentRecord = {
          accepted: !!record.accepted,
          ask_again: !!record.ask_again,
          updated_at: record.updated_at
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
    if (!user) {
      setConsentRecord(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const stored = loadFromStorage()
    if (stored) {
      setConsentRecord(stored)
    }
    fetchConsent().finally(() => {
      setLoading(false)
    })
  }, [user, consentType])

  // Vérifier si le consentement est nécessaire avant une action
  const requireConsent = (action: () => void): boolean => {
    if (!user) {
      // Si l'utilisateur n'est pas connecté, on ne demande pas de consentement
      action()
      return false
    }

    const askedThisSession = wasAskedThisSession()
    const hasRecord = !!consentRecord
    const shouldAskAgain = consentRecord?.ask_again && !askedThisSession

    if (hasRecord) {
      if (consentRecord?.accepted) {
        if (!shouldAskAgain) {
          action()
          return false
        }
      } else {
        if (!shouldAskAgain) {
          if (typeof window !== 'undefined') {
            window.alert(t('consent.blocked'))
          }
          return false
        }
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
    if (!user) return

    const record: ConsentRecord = {
      accepted: true,
      ask_again: askAgainNextTime,
      updated_at: new Date().toISOString()
    }
    setConsentRecord(record)
    saveToStorage(record)
    persistConsent(record)
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
      updated_at: new Date().toISOString()
    }
    setConsentRecord(record)
    saveToStorage(record)
    persistConsent(record)
    markAskedThisSession()
    setShowModal(false)
    setPendingAction(null)
    // L'action n'est pas exécutée, l'utilisateur reste sur la page actuelle
  }

  const consentMessages = {
    title: t(`consent.types.${consentType}.title`),
    message: t(`consent.types.${consentType}.message`)
  }

  return {
    hasConsented: consentRecord?.accepted ?? null,
    showModal,
    requireConsent,
    handleAccept,
    handleReject,
    askAgainNextTime,
    setAskAgainNextTime,
    messages: consentMessages
  }
}
