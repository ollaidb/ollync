import { useState, useCallback } from 'react'

export interface ToastData {
  id: string
  message: string
  type?: 'success' | 'info' | 'error'
  duration?: number
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback((
    message: string,
    type: 'success' | 'info' | 'error' = 'success',
    duration: number = 2500
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast: ToastData = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
    
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // Méthodes de convenance pour les types courants
  const showSuccess = useCallback((message: string, duration?: number) => {
    return showToast(message, 'success', duration)
  }, [showToast])

  const showError = useCallback((message: string, duration?: number) => {
    return showToast(message, 'error', duration)
  }, [showToast])

  const showInfo = useCallback((message: string, duration?: number) => {
    return showToast(message, 'info', duration)
  }, [showToast])

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showInfo,
    removeToast
  }
}

