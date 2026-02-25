/**
 * Fond des pages de connexion/inscription : corail + bulles violettes animées + boule type économiseur d’écran.
 * Pas de texte, uniquement le background avec les mouvements.
 */
import './AuthBackground.css'

export function AuthBackground() {
  return (
    <div className="auth-bg" aria-hidden>
      <div className="auth-bg__blob auth-bg__blob--1" />
      <div className="auth-bg__blob auth-bg__blob--2" />
      <div className="auth-bg__blob auth-bg__blob--3" />
      <div className="auth-bg__screensaver-ball" />
    </div>
  )
}
