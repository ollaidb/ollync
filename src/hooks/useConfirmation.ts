import { useState } from 'react'

export interface ConfirmationOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
}

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmationOptions | null>(null)
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null)
  const [onCancelCallback, setOnCancelCallback] = useState<(() => void) | null>(null)

  const confirm = (
    options: ConfirmationOptions,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    setOptions(options)
    setOnConfirmCallback(() => onConfirm || null)
    setOnCancelCallback(() => onCancel || null)
    setIsOpen(true)
  }

  const handleConfirm = () => {
    if (onConfirmCallback) {
      onConfirmCallback()
    }
    setIsOpen(false)
    setOptions(null)
    setOnConfirmCallback(null)
    setOnCancelCallback(null)
  }

  const handleCancel = () => {
    if (onCancelCallback) {
      onCancelCallback()
    }
    setIsOpen(false)
    setOptions(null)
    setOnConfirmCallback(null)
    setOnCancelCallback(null)
  }

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel
  }
}

