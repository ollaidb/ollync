import { X, Users, Calendar } from 'lucide-react'
import './CreateMessageActionModal.css'

interface CreateMessageActionModalProps {
  visible: boolean
  onClose: () => void
  onCreateGroup: () => void
  onCreateAppointment: () => void
}

const CreateMessageActionModal = ({
  visible,
  onClose,
  onCreateGroup,
  onCreateAppointment
}: CreateMessageActionModalProps) => {
  if (!visible) return null

  return (
    <div className="create-message-action-overlay" onClick={onClose}>
      <div className="create-message-action-content" onClick={(e) => e.stopPropagation()}>
        <div className="create-message-action-header">
          <h2>Que voulez-vous créer ?</h2>
          <button className="create-message-action-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="create-message-action-list">
          <button
            className="create-message-action-item"
            onClick={onCreateGroup}
          >
            <Users size={20} />
            <div className="create-message-action-text">
              <span className="create-message-action-title">Créer un groupe</span>
              <span className="create-message-action-subtitle">Choisir les participants</span>
            </div>
          </button>
          <button
            className="create-message-action-item"
            onClick={onCreateAppointment}
          >
            <Calendar size={20} />
            <div className="create-message-action-text">
              <span className="create-message-action-title">Ajouter un rendez-vous</span>
              <span className="create-message-action-subtitle">Choisir un utilisateur</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateMessageActionModal
