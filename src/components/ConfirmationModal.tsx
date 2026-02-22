import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import './ConfirmationModal.css'

export interface ConfirmationModalProps {
  visible: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  closeOnOverlayClick?: boolean
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  children?: ReactNode
  contentClassName?: string
  presentation?: 'center' | 'bottom-sheet'
}

const ConfirmationModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  closeOnOverlayClick = true,
  confirmLabel = 'Accepter',
  cancelLabel = 'Annuler',
  isDestructive = false,
  children,
  contentClassName,
  presentation = 'center'
}: ConfirmationModalProps) => {
  const titleId = useId()
  const messageId = useId()
  const [keyboardInset, setKeyboardInset] = useState(0)

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

  useEffect(() => {
    if (!visible || presentation !== 'bottom-sheet' || typeof window === 'undefined') {
      setKeyboardInset(0)
      return
    }

    const viewport = window.visualViewport
    if (!viewport) return

    const updateInset = () => {
      const nextInset = Math.max(
        0,
        Math.round(window.innerHeight - viewport.height - viewport.offsetTop)
      )
      setKeyboardInset(nextInset)
    }

    updateInset()
    viewport.addEventListener('resize', updateInset)
    viewport.addEventListener('scroll', updateInset)

    return () => {
      viewport.removeEventListener('resize', updateInset)
      viewport.removeEventListener('scroll', updateInset)
      setKeyboardInset(0)
    }
  }, [visible, presentation])

  if (!visible) return null

  const overlayStyle: CSSProperties = presentation === 'bottom-sheet' && keyboardInset > 0
    ? { paddingBottom: keyboardInset }
    : {}

  const contentStyle: CSSProperties = presentation === 'bottom-sheet' && keyboardInset > 0
    ? { maxHeight: `calc(100vh - env(safe-area-inset-top, 0px) - 84px - ${keyboardInset}px)` }
    : {}

  return (
    <div
      className={`confirmation-modal-overlay ${
        presentation === 'bottom-sheet' ? 'confirmation-modal-overlay--bottom-sheet' : ''
      }`.trim()}
      style={overlayStyle}
      onClick={() => {
        if (closeOnOverlayClick) onCancel()
      }}
    >
      <div
        className={`confirmation-modal-content ${
          presentation === 'bottom-sheet' ? 'confirmation-modal-content--bottom-sheet' : ''
        }${contentClassName ? ` ${contentClassName}` : ''}`.trim()}
        style={contentStyle}
        onClick={(event) => event.stopPropagation()}
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
