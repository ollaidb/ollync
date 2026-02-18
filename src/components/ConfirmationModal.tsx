import { useEffect, useId, type ReactNode } from 'react'
import './ConfirmationModal.css'

export interface ConfirmationModalProps {
  visible: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  children?: ReactNode
  contentClassName?: string
}

const ConfirmationModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Accepter',
  cancelLabel = 'Annuler',
  isDestructive = false,
  children,
  contentClassName
}: ConfirmationModalProps) => {
  const titleId = useId()
  const messageId = useId()

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
    <div className="confirmation-modal-overlay">
      <div
        className={`confirmation-modal-content${contentClassName ? ` ${contentClassName}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <h3 id={titleId} className="confirmation-modal-title">{title}</h3>
        <p id={messageId} className="confirmation-modal-message">{message}</p>
        {children}
        <div className="confirmation-modal-actions">
          <button
            className="confirmation-modal-button confirmation-modal-button-cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`confirmation-modal-button confirmation-modal-button-confirm${isDestructive ? ' confirmation-modal-button-destructive' : ''}`}
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
