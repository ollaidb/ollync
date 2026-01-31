import { useState, useEffect } from 'react'
import PageHeader from '../../components/PageHeader'
import './Appearance.css'

const Appearance = () => {
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
      <PageHeader title="Apparence" />
      <div className="page-content appearance-page">
        <div className="appearance-container">
          <div className="appearance-options">
            <button
              className={`appearance-option ${theme === 'system' ? 'active' : ''}`}
              type="button"
              onClick={() => setTheme('system')}
            >
              <div className="appearance-option-text">
                <span className="appearance-option-title">Système</span>
                <span className="appearance-option-desc">
                  S&apos;adapte aux réglages d&apos;affichage du téléphone
                </span>
              </div>
              <span className="appearance-option-radio" />
            </button>
            <button
              className={`appearance-option ${theme === 'dark' ? 'active' : ''}`}
              type="button"
              onClick={() => setTheme('dark')}
            >
              <div className="appearance-option-text">
                <span className="appearance-option-title">Thème sombre</span>
                <span className="appearance-option-desc">
                  Contraste élevé, idéal en faible luminosité
                </span>
              </div>
              <span className="appearance-option-radio" />
            </button>
            <button
              className={`appearance-option ${theme === 'light' ? 'active' : ''}`}
              type="button"
              onClick={() => setTheme('light')}
            >
              <div className="appearance-option-text">
                <span className="appearance-option-title">Thème clair</span>
                <span className="appearance-option-desc">Interface claire et épurée</span>
              </div>
              <span className="appearance-option-radio" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Appearance

