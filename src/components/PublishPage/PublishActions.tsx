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
}

export const PublishActions = ({ 
  selectedCategory: _selectedCategory, 
  onSaveDraft, 
  onPreview: _onPreview, 
  onPublish,
  onInvalidPublishAttempt,
  isValid = true,
  validationErrors = []
}: PublishActionsProps) => {
  const rawFirstError = !isValid ? validationErrors[0] : null
  const firstError =
    rawFirstError && /lieu est obligatoire|adresse est obligatoire/i.test(rawFirstError)
      ? null
      : rawFirstError

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
        >
          Enregistrer comme brouillon
        </button>
        <button
          className={`publish-action-button primary ${!isValid ? 'is-disabled' : ''}`}
          onClick={() => {
            if (!isValid) {
              onInvalidPublishAttempt?.()
              return
            }
            onPublish()
          }}
          aria-disabled={!isValid}
          title={!isValid ? firstError || 'Veuillez compléter les champs obligatoires' : undefined}
        >
          Publier
        </button>
      </div>
    </div>
  )
}
