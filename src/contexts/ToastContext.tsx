import { createContext, useContext, ReactNode } from 'react'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'info' | 'error', duration?: number) => string
  showSuccess: (message: string, duration?: number) => string
  showError: (message: string, duration?: number) => string
  showInfo: (message: string, duration?: number) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const { toasts, showToast, showSuccess, showError, showInfo, removeToast } = useToast()

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

export const useToastContext = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

