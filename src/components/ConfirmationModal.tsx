import { useEffect } from 'react'
import './ConfirmationModal.css'

export interface ConfirmationModalProps {
  visible: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  learnMoreLink?: string
  learnMoreText?: string
}

const ConfirmationModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Accepter',
  cancelLabel = 'Annuler',
  learnMoreLink,
  learnMoreText = 'En savoir plus'
}: ConfirmationModalProps) => {
  // Bloquer le scroll quand le modal est visible
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
    <div 
      className="confirmation-modal-overlay" 
      onClick={onCancel}
    >
      <div 
        className="confirmation-modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="confirmation-modal-title">{title}</h3>
        
        <p className="confirmation-modal-message">{message}</p>
        
        {learnMoreLink && (
          <a 
            href={learnMoreLink} 
            className="confirmation-modal-learn-more"
            target="_blank"
            rel="noopener noreferrer"
          >
            {learnMoreText}
          </a>
        )}
        
        <div className="confirmation-modal-actions">
          <button 
            className="confirmation-modal-button confirmation-modal-button-cancel" 
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button 
            className="confirmation-modal-button confirmation-modal-button-confirm" 
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal

