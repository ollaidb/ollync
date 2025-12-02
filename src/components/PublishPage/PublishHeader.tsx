import { ArrowLeft } from 'lucide-react'
import { PublicationType } from '../../constants/publishData'
import './PublishHeader.css'

interface PublishHeaderProps {
  step: number
  onBack: () => void
  breadcrumb: string
  selectedCategory?: PublicationType | null
}

export const PublishHeader = ({ step, onBack, breadcrumb, selectedCategory }: PublishHeaderProps) => {
  const totalSteps = 5
  const progress = step > 0 ? ((step + 1) / totalSteps) * 100 : 0

  return (
    <div className="publish-header-container">
      <div className="publish-header-content">
        {step > 0 && (
          <button className="publish-back-button" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
        )}
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

