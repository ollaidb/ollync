import { useTranslation } from 'react-i18next'
import ConfirmationModal from './ConfirmationModal'
import './ConsentModal.css'

interface ConsentModalProps {
  visible: boolean
  title: string
  message: string
  onAccept: () => void
  onReject: () => void
  askAgainChecked?: boolean
  onAskAgainChange?: (value: boolean) => void
}

const ConsentModal = ({ 
  visible, 
  title, 
  message, 
  onAccept, 
  onReject,
  askAgainChecked = false,
  onAskAgainChange
}: ConsentModalProps) => {
  const { t } = useTranslation()

  return (
    <ConfirmationModal
      visible={visible}
      title={title}
      message={message}
      onConfirm={onAccept}
      onCancel={onReject}
      confirmLabel={t('consent.actions.accept')}
      cancelLabel={t('consent.actions.decline')}
    >
      {typeof onAskAgainChange === 'function' && (
        <label className="consent-ask-again">
          <input
            type="checkbox"
            checked={askAgainChecked}
            onChange={(e) => onAskAgainChange(e.target.checked)}
          />
          <span>{t('consent.actions.askAgain')}</span>
        </label>
      )}
    </ConfirmationModal>
  )
}

export default ConsentModal
