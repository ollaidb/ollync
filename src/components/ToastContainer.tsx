import Toast from './Toast'
import './Toast.css'

export interface ToastData {
  id: string
  message: string
  type?: 'success' | 'info' | 'error'
  duration?: number
}

interface ToastContainerProps {
  toasts: ToastData[]
  onClose: (id: string) => void
}

const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={onClose}
        />
      ))}
    </div>
  )
}

export default ToastContainer

