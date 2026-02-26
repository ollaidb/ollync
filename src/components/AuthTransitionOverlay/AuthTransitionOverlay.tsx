/**
 * Overlay de transition après connexion ou déconnexion.
 * Réutilise le fond AuthBackground (sans le nom de l'app), puis disparaît en fondu.
 * Affiché sur la page d'accueil pour un retour fluide et cohérent avec le design.
 */
import { useEffect } from 'react'
import { AuthBackground } from '../Auth/AuthBackground'
import './AuthTransitionOverlay.css'

interface AuthTransitionOverlayProps {
  onComplete: () => void
}

export function AuthTransitionOverlay({ onComplete }: AuthTransitionOverlayProps) {
  useEffect(() => {
    // Affichage 1.4s puis fondu 1s = 2.4s total (transition moins rapide)
    const timer = setTimeout(onComplete, 2400)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      className="auth-transition-overlay"
      role="presentation"
      aria-hidden
    >
      <AuthBackground />
    </div>
  )
}
