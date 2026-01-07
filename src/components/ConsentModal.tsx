import ConfirmationModal from './ConfirmationModal'

interface ConsentModalProps {
  visible: boolean
  title: string
  message: string
  onAccept: () => void
  onReject: () => void
  learnMoreLink?: string
}

const ConsentModal = ({ 
  visible, 
  title, 
  message, 
  onAccept, 
  onReject,
  learnMoreLink 
}: ConsentModalProps) => {
  return (
    <ConfirmationModal
      visible={visible}
      title={title}
      message={message}
      onConfirm={onAccept}
      onCancel={onReject}
      confirmLabel="Accepter"
      cancelLabel="Annuler"
      learnMoreLink={learnMoreLink}
    />
  )
}

export default ConsentModal

