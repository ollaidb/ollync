import { LucideIcon, MessageCircle, Bell, Heart, FileText, Users, MessageSquare, Archive, Star, Scissors } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './EmptyState.css'

export type EmptyStateType = 
  | 'messages'
  | 'notifications'
  | 'likes'
  | 'posts'
  | 'matches'
  | 'requests'
  | 'archived'
  | 'favorites'
  | 'category'
  | 'profiles'

interface EmptyStateProps {
  type: EmptyStateType
  customIcon?: LucideIcon
  customTitle?: string
  customSubtext?: string
  actionLabel?: string
  onAction?: () => void
  marketing?: boolean
  marketingTone?: 'purple' | 'orange' | 'teal' | 'blue'
}

export const EmptyState = ({ 
  type, 
  customIcon, 
  customTitle, 
  customSubtext,
  actionLabel,
  onAction,
  marketing = false,
  marketingTone = 'purple'
}: EmptyStateProps) => {
  const { t } = useTranslation(['empty'])
  const emptyStateConfig: Record<EmptyStateType, {
    icon: LucideIcon
    title: string
    subtext: string
  }> = {
    messages: {
      icon: MessageCircle,
      title: t('empty:messagesTitle'),
      subtext: t('empty:messagesSubtext')
    },
    notifications: {
      icon: Bell,
      title: t('empty:notificationsTitle'),
      subtext: t('empty:notificationsSubtext')
    },
    likes: {
      icon: Heart,
      title: t('empty:likesTitle'),
      subtext: t('empty:likesSubtext')
    },
    posts: {
      icon: FileText,
      title: t('empty:postsTitle'),
      subtext: t('empty:postsSubtext')
    },
    matches: {
      icon: Users,
      title: t('empty:matchesTitle'),
      subtext: t('empty:matchesSubtext')
    },
    requests: {
      icon: MessageSquare,
      title: t('empty:requestsTitle'),
      subtext: t('empty:requestsSubtext')
    },
    archived: {
      icon: Archive,
      title: t('empty:archivedTitle'),
      subtext: t('empty:archivedSubtext')
    },
    favorites: {
      icon: Star,
      title: t('empty:favoritesTitle'),
      subtext: t('empty:favoritesSubtext')
    },
    category: {
      icon: Scissors,
      title: t('empty:categoryTitle'),
      subtext: t('empty:categorySubtext')
    },
    profiles: {
      icon: Users,
      title: t('empty:profilesTitle'),
      subtext: t('empty:profilesSubtext')
    }
  }
  const config = emptyStateConfig[type]
  const Icon = customIcon || config.icon
  const title = customTitle || config.title
  const subtext = customSubtext || config.subtext

  return (
    <div className={`empty-state-wrapper ${marketing ? `marketing marketing-${marketingTone}` : ''}`}>
      <Icon className="empty-state-icon" strokeWidth={1.5} />
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-subtext">{subtext}</p>
      {actionLabel && onAction && (
        <button type="button" className="empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
