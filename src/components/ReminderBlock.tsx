import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import type { ReminderItem } from '../hooks/useReminder'
import './ReminderBlock.css'

interface ReminderBlockProps {
  reminder: ReminderItem
  onDismiss: (type: ReminderItem['type'], action: import('../hooks/useReminder').DismissAction) => void
}

export default function ReminderBlock({ reminder, onDismiss }: ReminderBlockProps) {
  const navigate = useNavigate()

  const handleAction = () => {
    onDismiss(reminder.type, 'cooldown')
    navigate(reminder.href)
  }

  const handleNeverAsk = () => {
    onDismiss(reminder.type, 'never')
  }

  const handleClose = () => {
    onDismiss(reminder.type, 'cooldown')
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
          aria-label="Fermer"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <h2 id="reminder-block-title" className="reminder-block-title">
          {reminder.title}
        </h2>
        <p id="reminder-block-message" className="reminder-block-message">
          {reminder.message}
        </p>
        <div className="reminder-block-actions">
          <button
            type="button"
            className="reminder-block-button reminder-block-button-cancel"
            onClick={handleNeverAsk}
          >
            Ne plus demander
          </button>
          <button
            type="button"
            className="reminder-block-button reminder-block-button-primary"
            onClick={handleAction}
          >
            {reminder.buttonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
