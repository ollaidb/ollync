import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { useBackHandler } from '../hooks/useBackHandler'
import './BackButton.css'

interface BackButtonProps {
  to?: string
  onClick?: () => void
  className?: string
  hideOnHome?: boolean // Si true, cache le bouton sur la page d'accueil
}

const BackButton = ({ to, onClick, className = '', hideOnHome = false }: BackButtonProps) => {
  const location = useLocation()
  const handleBack = useBackHandler({ to, onClick })
  const { t } = useTranslation()

  // Cacher le bouton sur la page d'accueil si hideOnHome est true
  if (hideOnHome && (location.pathname === '/home' || location.pathname === '/')) {
    return null
  }

  return (
    <button 
      className={`back-button tap-effect ${className}`}
      onClick={handleBack}
      aria-label={t('back')}
    >
      <ChevronLeft size={24} />
    </button>
  )
}

export default BackButton
