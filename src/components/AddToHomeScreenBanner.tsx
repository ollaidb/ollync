import { X } from 'lucide-react'
import { useEffect } from 'react'
import { usePWAInstall, getIsIOS } from '../hooks/usePWAInstall'
import './AddToHomeScreenBanner.css'

const BODY_ATTR = 'data-ath-banner'

export default function AddToHomeScreenBanner() {
  const { isMobile, isStandalone, canInstall, dismissed, dismiss, install } = usePWAInstall()
  const isIOS = getIsIOS()

  const visible = isMobile && !isStandalone && !dismissed

  useEffect(() => {
    if (visible) {
      document.body.setAttribute(BODY_ATTR, 'true')
    } else {
      document.body.removeAttribute(BODY_ATTR)
    }
    return () => document.body.removeAttribute(BODY_ATTR)
  }, [visible])

  if (!visible) return null

  return (
    <div className="ath-banner" role="region" aria-label="Installer l’application">
      <button
        type="button"
        className="ath-banner-close"
        onClick={dismiss}
        aria-label="Fermer"
      >
        <X size={18} strokeWidth={2} />
      </button>
      <p className="ath-banner-title">Ajouter Ollync à l’écran d’accueil</p>
      <p className="ath-banner-desc">
        Tu auras l’app avec tes autres applications et un accès rapide.
      </p>
      {canInstall ? (
        <button type="button" className="ath-banner-install" onClick={install}>
          Installer l’application
        </button>
      ) : isIOS ? (
        <p className="ath-banner-steps">
          <strong>Sur iPhone/iPad :</strong> appuie sur <strong>Partager</strong> (icône en bas), puis « Sur l’écran d’accueil ».
        </p>
      ) : (
        <p className="ath-banner-steps">
          Dans le menu du navigateur (⋮), choisis « Ajouter à l’écran d’accueil » ou « Installer l’application ».
        </p>
      )}
    </div>
  )
}
