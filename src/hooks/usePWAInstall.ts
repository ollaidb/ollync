import { useEffect, useState } from 'react'

const DISMISS_STORAGE_KEY = 'ollync_add_to_home_dismissed'

/** Type pour l’événement d’installation PWA (Chrome/Android). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Détecte si l'app tourne en mode PWA (déjà installée / standalone). */
function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return true
  // display-mode: standalone (PWA installée)
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // iOS Safari en mode "ajouté à l'écran d'accueil"
  if ((navigator as { standalone?: boolean }).standalone === true) return true
  // Certains navigateurs
  if ((window as { standalone?: boolean }).standalone === true) return true
  return false
}

/** Détecte iOS pour afficher les instructions "Partager > Sur l'écran d'accueil". */
function getIsIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** Détecte Android pour proposer le bouton d'installation natif. */
function getIsAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

export interface UsePWAInstallReturn {
  /** L'app est déjà ouverte en mode installé (écran d'accueil). */
  isStandalone: boolean
  /** Appareil mobile (petit écran). */
  isMobile: boolean
  /** Sur Android, le navigateur propose l'installation (beforeinstallprompt disponible). */
  canInstall: boolean
  /** L'utilisateur a fermé la bannière "Ajouter à l'écran d'accueil". */
  dismissed: boolean
  /** Fermer la bannière (et ne plus l'afficher jusqu'à effacer le stockage). */
  dismiss: () => void
  /** Déclencher l’installation (Android). À appeler sur clic du bouton "Installer". */
  install: () => Promise<void>
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [isStandalone, setIsStandalone] = useState(getIsStandalone)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  )
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissedState] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const standalone = getIsStandalone()
    setIsStandalone(standalone)

    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const handleResize = () => setIsMobile(mediaQuery.matches)
    handleResize()
    mediaQuery.addEventListener('change', handleResize)

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      mediaQuery.removeEventListener('change', handleResize)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, '1')
    } catch {
      // ignore
    }
    setDismissedState(true)
  }

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
  }

  return {
    isStandalone,
    isMobile,
    canInstall: !!deferredPrompt && getIsAndroid(),
    dismissed,
    dismiss,
    install,
  }
}

export { getIsIOS }
