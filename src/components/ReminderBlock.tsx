import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import type { ReminderItem } from '../hooks/useReminder'
import './ReminderBlock.css'

interface ReminderBlockProps {
  reminder: ReminderItem
  onDismiss: (type: ReminderItem['type']) => void
}

export default function ReminderBlock({ reminder, onDismiss }: ReminderBlockProps) {
  const navigate = useNavigate()

  const handleAction = () => {
    onDismiss(reminder.type)
    navigate(reminder.href)
  }

  const handleClose = () => {
    onDismiss(reminder.type)
  }

  return (
    <div
      className="reminder-block-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-block-title"
      aria-describedby="reminder-block-message"
    >
      <div className="reminder-block-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="reminder-block-close"
          onClick={handleClose}
          aria-label="Fermer le rappel"
        >
          <X size={20} strokeWidth={2} />
        </button>

        <h2 id="reminder-block-title" className="reminder-block-title">
          {reminder.title}
        </h2>
        <p id="reminder-block-message" className="reminder-block-message">
          {reminder.message}
        </p>
        <button
          type="button"
          className="reminder-block-cta"
          onClick={handleAction}
        >
          {reminder.buttonLabel}
        </button>
      </div>
    </div>
  )
}
