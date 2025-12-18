import { LucideIcon, MessageCircle, Bell, Heart, FileText, Users, MessageSquare, Archive, Star, Scissors } from 'lucide-react'
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
}

const emptyStateConfig: Record<EmptyStateType, {
  icon: LucideIcon
  title: string
  subtext: string
}> = {
  messages: {
    icon: MessageCircle,
    title: 'Vous n\'avez aucun message',
    subtext: 'Vos messages apparaîtront ici dès que vous en recevrez.'
  },
  notifications: {
    icon: Bell,
    title: 'Aucune notification',
    subtext: 'Vos notifications s\'afficheront ici lorsqu\'il y aura du nouveau.'
  },
  likes: {
    icon: Heart,
    title: 'Aucun like pour le moment',
    subtext: 'Les likes apparaîtront ici lorsqu\'un utilisateur aimera l\'une de vos annonces.'
  },
  posts: {
    icon: FileText,
    title: 'Aucune annonce pour l\'instant',
    subtext: 'Vos annonces seront affichées ici dès que vous en publierez une.'
  },
  matches: {
    icon: Users,
    title: 'Aucun match trouvé',
    subtext: 'Vos futurs matchs apparaîtront ici lorsqu\'une annonce correspondra à votre recherche.'
  },
  requests: {
    icon: MessageSquare,
    title: 'Aucune demande reçue',
    subtext: 'Les demandes liées à vos annonces seront affichées ici.'
  },
  archived: {
    icon: Archive,
    title: 'Aucune archive',
    subtext: 'Les conversations que vous archivez apparaîtront ici.'
  },
  favorites: {
    icon: Star,
    title: 'Aucun favori',
    subtext: 'Ajoutez des annonces en favori pour les retrouver ici.'
  },
  category: {
    icon: Scissors,
    title: 'Aucun résultat',
    subtext: 'Aucune annonce n\'est disponible dans cette catégorie pour le moment.'
  },
  profiles: {
    icon: Users,
    title: 'Aucun profil suivi',
    subtext: 'Les profils que vous suivez apparaîtront ici.'
  }
}

export const EmptyState = ({ 
  type, 
  customIcon, 
  customTitle, 
  customSubtext 
}: EmptyStateProps) => {
  const config = emptyStateConfig[type]
  const Icon = customIcon || config.icon
  const title = customTitle || config.title
  const subtext = customSubtext || config.subtext

  return (
    <div className="empty-state-wrapper">
      <Icon className="empty-state-icon" strokeWidth={1.5} />
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-subtext">{subtext}</p>
    </div>
  )
}

