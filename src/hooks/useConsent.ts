import { useState, useEffect } from 'react'
import { useAuth } from './useSupabase'

export type ConsentType = 
  | 'location'
  | 'media'
  | 'profile_data'

interface ConsentMessages {
  title: string
  message: string
}

const CONSENT_MESSAGES: Record<ConsentType, ConsentMessages> = {
  location: {
    title: 'Utilisation de la localisation',
    message: 'La localisation permet d\'afficher votre profil et vos annonces selon votre zone géographique.\n\nSouhaitez-vous autoriser l\'utilisation de votre localisation ?'
  },
  media: {
    title: 'Utilisation des médias',
    message: 'Les photos et vidéos que vous ajoutez peuvent être visibles par d\'autres utilisateurs selon les paramètres de l\'application.\n\nSouhaitez-vous autoriser l\'utilisation et l\'affichage de vos médias ?'
  },
  profile_data: {
    title: 'Utilisation des données personnelles',
    message: 'Les informations que vous renseignez sur votre profil peuvent être visibles par d\'autres utilisateurs selon les paramètres de l\'application.\n\nSouhaitez-vous autoriser l\'enregistrement et l\'affichage de ces informations ?'
  }
}

const STORAGE_KEY_PREFIX = 'consent_'

export const useConsent = (consentType: ConsentType) => {
  const { user } = useAuth()
  const [hasConsented, setHasConsented] = useState<boolean | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  // Récupérer le consentement depuis le stockage local
  useEffect(() => {
    if (!user) {
      setHasConsented(null)
      return
    }

    const storageKey = `${STORAGE_KEY_PREFIX}${user.id}_${consentType}`
    const stored = localStorage.getItem(storageKey)
    setHasConsented(stored === 'true')
  }, [user, consentType])

  // Vérifier si le consentement est nécessaire avant une action
  const requireConsent = (action: () => void): boolean => {
    if (!user) {
      // Si l'utilisateur n'est pas connecté, on ne demande pas de consentement
      action()
      return false
    }

    // Si le consentement existe déjà, on exécute l'action directement
    if (hasConsented === true) {
      action()
      return false
    }

    // Sinon, on affiche le modal et on stocke l'action
    setPendingAction(() => action)
    setShowModal(true)
    return true
  }

  // Gérer l'acceptation du consentement
  const handleAccept = () => {
    if (!user) return

    const storageKey = `${STORAGE_KEY_PREFIX}${user.id}_${consentType}`
    localStorage.setItem(storageKey, 'true')
    setHasConsented(true)
    setShowModal(false)

    // Exécuter l'action en attente
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  // Gérer le refus du consentement
  const handleReject = () => {
    setShowModal(false)
    setPendingAction(null)
    // L'action n'est pas exécutée, l'utilisateur reste sur la page actuelle
  }

  const consentMessages = CONSENT_MESSAGES[consentType]

  return {
    hasConsented,
    showModal,
    requireConsent,
    handleAccept,
    handleReject,
    messages: consentMessages
  }
}

