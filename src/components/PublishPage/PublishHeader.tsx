import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PublicationType } from '../../constants/publishData'
import { useNavigationHistory } from '../../hooks/useNavigationHistory'
import './PublishHeader.css'

interface PublishHeaderProps {
  step: number
  onBack: () => void
  breadcrumb: string
  selectedCategory?: PublicationType | null
}

export const PublishHeader = ({ step, onBack, breadcrumb, selectedCategory: _selectedCategory }: PublishHeaderProps) => {
  const navigate = useNavigate()
  const { getPreviousPath, markNavigatingBack, canGoBack } = useNavigationHistory()
  const totalSteps = 5
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
        <button className="publish-back-button" onClick={handleBack}>
          <ArrowLeft size={24} />
        </button>
        <div className="publish-header-text">
          <h1 className="publish-title">Publier une annonce</h1>
          {breadcrumb && (
            <p className="publish-breadcrumb">{breadcrumb}</p>
          )}
        </div>
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

