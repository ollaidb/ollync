/**
 * Splash screen : fond uni (blanc en mode clair, noir en mode sombre) + nom « Ollync » en violet.
 * Phrase clé « Un projet, une annonce, une rencontre » affichée ligne par ligne.
 */
import { useEffect } from 'react'
import './SplashScreen.css'

const APP_NAME = 'Ollync'
const TAGLINE_PHRASES = ['Un projet', 'une annonce', 'une rencontre']

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    /* Phrases visibles ~2.5s ; pause lecture ~1.5s ; fade à 4s, fin ~5.4s */
    const timer = setTimeout(onComplete, 5600)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="splash-screen" role="img" aria-label="Ollync">
      <div className="splash-screen__content">
        <h1 className="splash-screen__title">{APP_NAME}</h1>
        <p className="splash-screen__tagline" aria-hidden="true">
          {TAGLINE_PHRASES.map((phrase, i) => (
            <span
              key={i}
              className="splash-screen__phrase"
              style={{ '--phrase-index': i } as React.CSSProperties}
            >
              {phrase}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
