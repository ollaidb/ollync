import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import './Toast.css'

export interface ToastProps {
  id: string
  message: string
  type?: 'success' | 'info' | 'error'
  duration?: number
  onClose: (id: string) => void
}

const Toast = ({ id, message, type = 'success', duration = 2500, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    // Déclencher l'animation de fermeture 200ms avant la suppression
    const fadeOutTimer = setTimeout(() => {
      setIsClosing(true)
    }, duration - 200)

    // Supprimer le toast après la durée complète
    const removeTimer = setTimeout(() => {
      setIsVisible(false)
      onClose(id)
    }, duration)

    return () => {
      clearTimeout(fadeOutTimer)
      clearTimeout(removeTimer)
    }
  }, [id, duration, onClose])

  if (!isVisible) return null

  return (
    <div className={`toast toast-${type} ${isClosing ? 'toast-closing' : ''}`}>
      <div className="toast-content">
        {type === 'success' && (
          <div className="toast-icon">
            <Check size={16} />
          </div>
        )}
        <span className="toast-message">{message}</span>
      </div>
    </div>
  )
}

export default Toast

