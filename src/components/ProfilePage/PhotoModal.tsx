import { X } from 'lucide-react'
import './PhotoModal.css'

interface PhotoModalProps {
  visible: boolean
  avatar?: string | null
  fullName?: string | null
  username?: string | null
  onClose: () => void
}

export const PhotoModal = ({ visible, avatar, fullName, username, onClose }: PhotoModalProps) => {
  if (!visible) return null

  const displayName = fullName || username || 'User'
  const avatarUrl = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`

  return (
    <div className="photo-modal-overlay" onClick={onClose}>
      <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="photo-modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        <img
          src={avatarUrl}
          alt={displayName}
          className="photo-modal-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`
          }}
        />
      </div>
    </div>
  )
}

