import ConfirmationModal from './ConfirmationModal'

interface ConsentModalProps {
  visible: boolean
  title: string
  message: string
  onAccept: () => void
  onReject: () => void
}

const ConsentModal = ({ 
  visible, 
  title, 
  message, 
  onAccept, 
  onReject 
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
    />
  )
}

export default ConsentModal

