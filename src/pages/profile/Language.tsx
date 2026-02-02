import { useState } from 'react'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './Language.css'

type LanguageOption = {
  code: string
  label: string
  nativeLabel: string
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'fr', label: 'Français (France)', nativeLabel: 'Français' },
  { code: 'en', label: 'Anglais (États-Unis)', nativeLabel: 'English' }
]

const Language = () => {
  const { t, i18n } = useTranslation(['common', 'settings'])
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return i18n.language || localStorage.getItem('app_language') || 'fr'
  })

  const getDisplayName = (code: string, locale: string) => {
    try {
      const displayNames = new Intl.DisplayNames([locale], { type: 'language' })
      return displayNames.of(code) || code
    } catch {
      return code
    }
  }

  const activeLanguage =
    LANGUAGE_OPTIONS.find((language) => language.code === currentLanguage) || LANGUAGE_OPTIONS[0]

  const otherLanguages = LANGUAGE_OPTIONS.filter((language) => language.code !== currentLanguage)

  const handleSelect = (code: string) => {
    setCurrentLanguage(code)
    localStorage.setItem('app_language', code)
    i18n.changeLanguage(code)
    document.documentElement.lang = code
  }

  return (
    <div className="page">
      <div className="page-content language-page">
        <div className="language-container">
          <div className="language-section">
            <h3 className="language-section-title">{t('currentLanguage')}</h3>
            <button className="language-option active" type="button">
              <div className="language-option-text">
                <span className="language-option-label">
                  {getDisplayName(activeLanguage.code, i18n.language)}
                </span>
                {getDisplayName(activeLanguage.code, activeLanguage.code) !==
                  getDisplayName(activeLanguage.code, i18n.language) && (
                  <span className="language-option-native">
                    {getDisplayName(activeLanguage.code, activeLanguage.code)}
                  </span>
                )}
              </div>
              <div className="language-option-indicator active">
                <Check size={14} />
              </div>
            </button>
          </div>

          <div className="language-section">
            <h3 className="language-section-title">{t('otherLanguages')}</h3>
            <div className="language-options-list">
              {otherLanguages.map((language) => (
                <button
                  key={language.code}
                  className="language-option"
                  type="button"
                  onClick={() => handleSelect(language.code)}
                >
                  <div className="language-option-text">
                    <span className="language-option-label">
                      {getDisplayName(language.code, i18n.language)}
                    </span>
                    {getDisplayName(language.code, language.code) !==
                      getDisplayName(language.code, i18n.language) && (
                      <span className="language-option-native">
                        {getDisplayName(language.code, language.code)}
                      </span>
                    )}
                  </div>
                  <div className="language-option-indicator" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Language
