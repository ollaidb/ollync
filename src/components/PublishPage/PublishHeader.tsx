import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { PublicationType } from '../../constants/publishData'
import { useNavigationHistory } from '../../hooks/useNavigationHistory'
import BackButton from '../BackButton'
import './PublishHeader.css'

interface PublishHeaderProps {
  step: number
  onBack: () => void
  breadcrumb: string
  selectedCategory?: PublicationType | null
  onOpenGuide: () => void
}

export const PublishHeader = ({ step, onBack, breadcrumb, selectedCategory: _selectedCategory, onOpenGuide }: PublishHeaderProps) => {
  const navigate = useNavigate()
  const { getPreviousPath, markNavigatingBack, canGoBack } = useNavigationHistory()
  const { t } = useTranslation(['publish'])
  const totalSteps = 6
  const progress = step > 0 ? ((step + 1) / totalSteps) * 100 : 0

  const handleBack = () => {
    if (step > 0) {
      onBack()
    } else {
      // Utiliser l'historique de navigation pour retourner à la page précédente
      const previousPath = getPreviousPath()
      if (canGoBack() && previousPath) {
        markNavigatingBack()
        navigate(previousPath)
      } else {
        // Fallback: retourner vers /home
        markNavigatingBack()
        navigate('/home')
      }
    }
  }

  return (
    <div className="publish-header-container">
      <div className="publish-header-content">
        <BackButton className="publish-back-button" onClick={handleBack} />
        <div className="publish-header-text">
          <h1 className="publish-title">{t('publish:title')}</h1>
          {breadcrumb && (
            <p className="publish-breadcrumb">{breadcrumb}</p>
          )}
        </div>
        <button
          className="publish-guide-button"
          onClick={onOpenGuide}
          aria-label={t('publish:guideAria')}
          title={t('publish:guideTitle')}
        >
          <Info size={20} />
        </button>
      </div>
      {step > 0 && (
        <div className="publish-progress-bar">
          <div 
            className="publish-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
