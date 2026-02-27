import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ConfirmationModal from './ConfirmationModal'
import './ConsentModal.css'

interface ConsentModalProps {
  visible: boolean
  title: string
  message: string
  onAccept: () => void
  onReject: () => void
  /** Page légale spécifique pour ce consentement (une seule page, pas la liste). */
  learnMoreHref?: string
  onLearnMore?: () => void
  /** Page de retour au clic sur "Voir plus" : retourner exactement où l'utilisateur était. */
  returnTo?: string
  askAgainChecked?: boolean
  onAskAgainChange?: (value: boolean) => void
}

const ConsentModal = ({ 
  visible, 
  title, 
  message, 
  onAccept, 
  onReject,
  learnMoreHref,
  onLearnMore,
  returnTo,
  askAgainChecked = false,
  onAskAgainChange
}: ConsentModalProps) => {
  const { t } = useTranslation('consent')
  const navigate = useNavigate()
  const resolvedLearnMoreHref = learnMoreHref || '/profile/legal/politique-confidentialite'
  const safeLabel = (key: string, fallback: string) => {
    const value = t(key, { defaultValue: fallback })
    if (!value) return fallback
    if (value === key) return fallback
    if (value.startsWith('consent.')) return fallback
    return value
  }

  return (
    <ConfirmationModal
      visible={visible}
      title={title}
      message={message}
      onConfirm={onAccept}
      onCancel={onReject}
      closeOnOverlayClick={false}
      confirmLabel={safeLabel('actions.accept', 'J\'accepte')}
      cancelLabel={safeLabel('actions.decline', 'Refuser')}
      contentClassName="consent-confirmation-modal"
    >
      {resolvedLearnMoreHref && (
        <p className="consent-learn-more">
          <a
            href={resolvedLearnMoreHref}
            style={{ color: 'var(--primary)' }}
            onClick={(event) => {
              event.preventDefault()
              onLearnMore?.()
              navigate(resolvedLearnMoreHref, {
                state: returnTo != null ? { fromConsentLearnMore: true, returnTo } : undefined
              })
            }}
          >
            {safeLabel('actions.learnMore', 'Voir plus')}
          </a>
        </p>
      )}
      {typeof onAskAgainChange === 'function' && (
        <label className="consent-ask-again">
          <input
            type="checkbox"
            checked={askAgainChecked}
            onChange={(e) => onAskAgainChange(e.target.checked)}
          />
          <span>{safeLabel('actions.askAgain', 'Me redemander la prochaine fois')}</span>
        </label>
      )}
    </ConfirmationModal>
  )
}

export default ConsentModal
