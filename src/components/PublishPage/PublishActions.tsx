import { PublicationType } from '../../constants/publishData'
import './PublishActions.css'

interface PublishActionsProps {
  selectedCategory: PublicationType | null
  onSaveDraft: () => void
  onPreview: () => void
  onPublish: () => void
  onInvalidPublishAttempt?: () => void
  isValid?: boolean
  validationErrors?: string[]
  insets?: { bottom: number }
  /** Désactive le bouton Publier pendant l'envoi pour éviter le double clic */
  isPublishing?: boolean
}

export const PublishActions = ({ 
  selectedCategory: _selectedCategory, 
  onSaveDraft, 
  onPreview: _onPreview, 
  onPublish,
  onInvalidPublishAttempt,
  isValid = true,
  validationErrors = [],
  isPublishing = false
}: PublishActionsProps) => {
  const rawFirstError = !isValid ? validationErrors[0] : null
  const firstError =
    rawFirstError && /lieu est obligatoire|adresse est obligatoire/i.test(rawFirstError)
      ? null
      : rawFirstError

  const publishDisabled = !isValid || isPublishing

  return (
    <div className="publish-actions">
      {firstError && (
        <div className="publish-actions-validation" role="alert">
          {firstError}
        </div>
      )}
      <div className="publish-actions-content">
        <button
          className="publish-action-button secondary"
          onClick={onSaveDraft}
          disabled={isPublishing}
          aria-disabled={isPublishing}
        >
          Enregistrer comme brouillon
        </button>
        <button
          className={`publish-action-button primary ${publishDisabled ? 'is-disabled' : ''}`}
          onClick={() => {
            if (publishDisabled) {
              if (!isValid) onInvalidPublishAttempt?.()
              return
            }
            onPublish()
          }}
          disabled={isPublishing}
          aria-disabled={publishDisabled}
          title={!isValid ? firstError || 'Veuillez compléter les champs obligatoires' : isPublishing ? 'Publication en cours...' : undefined}
        >
          {isPublishing ? 'Publication...' : 'Publier'}
        </button>
      </div>
    </div>
  )
}
