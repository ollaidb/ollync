import { Package, Users, Star } from 'lucide-react'
import './EmptyState.css'

interface EmptyStateProps {
  title: string
  message: string
  icon?: 'package' | 'users' | 'star'
}

export const EmptyState = ({ title, message, icon = 'package' }: EmptyStateProps) => {
  const iconMap = {
    package: Package,
    users: Users,
    star: Star
  }

  const Icon = iconMap[icon]

  return (
    <div className="empty-state-container">
      <div className="empty-state-icon-wrapper">
        <Icon size={48} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
    </div>
  )
}

