import { useTranslation } from 'react-i18next'
import './HeroSection.css'

const HeroSection = () => {
  const { t } = useTranslation(['home', 'common'])
  return (
    <div className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">{t('home:heroTitle')}</h1>
        <p className="hero-subtitle">{t('home:heroSubtitle')}</p>
        <div className="hero-actions">
          <button className="hero-button primary">{t('home:discover')}</button>
          <button className="hero-button secondary">{t('common:actions.publishListing')}</button>
        </div>
      </div>
    </div>
  )
}

export default HeroSection

