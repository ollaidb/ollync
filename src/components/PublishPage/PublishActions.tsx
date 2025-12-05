import { PublicationType } from '../../constants/publishData'
import './PublishActions.css'

interface PublishActionsProps {
  selectedCategory: PublicationType | null
  onSaveDraft: () => void
  onPreview: () => void
  onPublish: () => void
  insets?: { bottom: number }
}

export const PublishActions = ({ 
  selectedCategory: _selectedCategory, 
  onSaveDraft, 
  onPreview: _onPreview, 
  onPublish 
}: PublishActionsProps) => {
  return (
    <div className="publish-actions">
      <div className="publish-actions-content">
        <button
          className="publish-action-button secondary"
          onClick={onSaveDraft}
        >
          Enregistrer comme brouillon
        </button>
        <button
          className="publish-action-button primary"
          onClick={onPublish}
        >
          Publier
        </button>
      </div>
    </div>
  )
}

