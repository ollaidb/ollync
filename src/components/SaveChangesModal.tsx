import { useEffect } from 'react'
import './ConfirmationModal.css'

export interface SaveChangesModalProps {
  visible: boolean
  message: string
  onDiscard: () => void
  onSave: () => void
  saveLabel?: string
  discardLabel?: string
  isSaving?: boolean
}

const SaveChangesModal = ({
  visible,
  message,
  onDiscard,
  onSave,
  saveLabel = 'Oui',
  discardLabel = 'Non',
  isSaving = false
}: SaveChangesModalProps) => {
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className="confirmation-modal-overlay">
      <div
        className="confirmation-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-changes-modal-title"
        aria-describedby="save-changes-modal-message"
      >
        <h3 id="save-changes-modal-title" className="confirmation-modal-title">
          Enregistrer vos modifications ?
        </h3>
        <p id="save-changes-modal-message" className="confirmation-modal-message">
          {message}
        </p>
        <div className="save-changes-modal-actions">
          <button
            className="confirmation-modal-button save-changes-modal-button-discard"
            onClick={onDiscard}
            disabled={isSaving}
          >
            {discardLabel}
          </button>
          <button
            className="confirmation-modal-button confirmation-modal-button-confirm"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? 'Enregistrement...' : saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SaveChangesModal
