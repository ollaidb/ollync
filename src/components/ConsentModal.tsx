import './ConsentModal.css'

interface ConsentModalProps {
  visible: boolean
  title: string
  message: string
  onAccept: () => void
  onReject: () => void
}

const ConsentModal = ({ visible, title, message, onAccept, onReject }: ConsentModalProps) => {
  if (!visible) return null

  // Convertir les sauts de ligne en éléments <p>
  const messageParagraphs = message.split('\n\n').filter(p => p.trim())

  return (
    <div className="consent-modal-overlay" onClick={onReject}>
      <div className="consent-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="consent-modal-title">{title}</h3>
        <div className="consent-modal-message">
          {messageParagraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div className="consent-modal-actions">
          <button 
            className="consent-modal-button consent-modal-button-reject" 
            onClick={onReject}
          >
            Annuler
          </button>
          <button 
            className="consent-modal-button consent-modal-button-accept" 
            onClick={onAccept}
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConsentModal

