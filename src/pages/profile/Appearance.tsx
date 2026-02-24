import { useState, useEffect } from 'react'
import { useAccessibility } from '../../contexts/AccessibilityContext'
import type { ContrastMode, FontSizeMode } from '../../contexts/AccessibilityContext'
import './Appearance.css'

const Appearance = () => {
  const { contrast, fontSize, setContrast, setFontSize } = useAccessibility()
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as 'system' | 'light' | 'dark') || 'system'
  })

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches)
      if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
      const sample = document.createElement('div')
      sample.style.backgroundColor = 'var(--background)'
      sample.style.position = 'absolute'
      sample.style.left = '-9999px'
      document.body.appendChild(sample)
      const resolved = getComputedStyle(sample).backgroundColor
      sample.remove()

      let meta = document.querySelector('meta[name="theme-color"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'theme-color')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', resolved)
    }

    applyTheme()
    localStorage.setItem('theme', theme)
    if (theme === 'system') {
      media.addEventListener('change', applyTheme)
      return () => media.removeEventListener('change', applyTheme)
    }
    return undefined
  }, [theme])

  return (
    <div className="page">
      <div className="page-content appearance-page">
        <div className="appearance-container">
          <h2 className="appearance-section-title">Thème</h2>
          <div className="appearance-options">
            <button
              className={`appearance-option ${theme === 'system' ? 'active' : ''}`}
              type="button"
              onClick={() => setTheme('system')}
              aria-pressed={theme === 'system'}
              aria-label="Thème système, s'adapte à l'affichage"
            >
              <div className="appearance-option-text">
                <span className="appearance-option-title">Système</span>
                <span className="appearance-option-desc">
                  S&apos;adapte aux réglages d&apos;affichage du téléphone
                </span>
              </div>
              <span className="appearance-option-radio" aria-hidden />
            </button>
            <button
              className={`appearance-option ${theme === 'dark' ? 'active' : ''}`}
              type="button"
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
              aria-label="Thème sombre"
            >
              <div className="appearance-option-text">
                <span className="appearance-option-title">Thème sombre</span>
                <span className="appearance-option-desc">
                  Contraste élevé, idéal en faible luminosité
                </span>
              </div>
              <span className="appearance-option-radio" aria-hidden />
            </button>
            <button
              className={`appearance-option ${theme === 'light' ? 'active' : ''}`}
              type="button"
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
              aria-label="Thème clair"
            >
              <div className="appearance-option-text">
                <span className="appearance-option-title">Thème clair</span>
                <span className="appearance-option-desc">Interface claire et épurée</span>
              </div>
              <span className="appearance-option-radio" aria-hidden />
            </button>
          </div>

          <h2 className="appearance-section-title">Contraste</h2>
          <div className="appearance-options">
            <button
              className={`appearance-option ${contrast === 'default' ? 'active' : ''}`}
              type="button"
              onClick={() => setContrast('default' as ContrastMode)}
              aria-pressed={contrast === 'default'}
              aria-label="Contraste standard"
            >
              <div className="appearance-option-text">
                <span className="appearance-option-title">Standard</span>
                <span className="appearance-option-desc">Contraste par défaut de l&apos;interface</span>
              </div>
              <span className="appearance-option-radio" aria-hidden />
            </button>
            <button
              className={`appearance-option ${contrast === 'high' ? 'active' : ''}`}
              type="button"
              onClick={() => setContrast('high' as ContrastMode)}
              aria-pressed={contrast === 'high'}
              aria-label="Contraste élevé"
            >
              <div className="appearance-option-text">
                <span className="appearance-option-title">Élevé</span>
                <span className="appearance-option-desc">Renforce la lisibilité du texte et des bordures</span>
              </div>
              <span className="appearance-option-radio" aria-hidden />
            </button>
          </div>

          <h2 className="appearance-section-title">Taille du texte</h2>
          <div className="appearance-options">
            <button
              className={`appearance-option ${fontSize === 'normal' ? 'active' : ''}`}
              type="button"
              onClick={() => setFontSize('normal' as FontSizeMode)}
              aria-pressed={fontSize === 'normal'}
              aria-label="Taille de police normale"
            >
              <div className="appearance-option-text">
                <span className="appearance-option-title">Normale</span>
                <span className="appearance-option-desc">Taille d&apos;affichage standard</span>
              </div>
              <span className="appearance-option-radio" aria-hidden />
            </button>
            <button
              className={`appearance-option ${fontSize === 'large' ? 'active' : ''}`}
              type="button"
              onClick={() => setFontSize('large' as FontSizeMode)}
              aria-pressed={fontSize === 'large'}
              aria-label="Taille de police agrandie"
            >
              <div className="appearance-option-text">
                <span className="appearance-option-title">Agrandie</span>
                <span className="appearance-option-desc">Texte plus grand pour une meilleure lisibilité</span>
              </div>
              <span className="appearance-option-radio" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Appearance

