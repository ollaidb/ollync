/**
 * Splash screen : fond AuthBackground + nom « Ollync » animé.
 * Les lettres arrivent depuis différents points et se rejoignent au centre.
 * Affiché à chaque ouverture complète de l'application.
 */
import { useEffect } from 'react'
import { AuthBackground } from '../Auth/AuthBackground'
import './SplashScreen.css'

const APP_NAME = 'Ollync'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    /* Fade finit à 2.6s + 1.2s = 3.8s ; on masque juste après */
    const timer = setTimeout(onComplete, 3900)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="splash-screen" role="img" aria-label="Ollync">
      <AuthBackground />
      <div className="splash-screen__content">
        <h1 className="splash-screen__title">
          {APP_NAME.split('').map((letter, i) => (
            <span
              key={i}
              className="splash-screen__letter"
              style={{ '--letter-index': i } as React.CSSProperties}
            >
              {letter}
            </span>
          ))}
        </h1>
      </div>
    </div>
  )
}
