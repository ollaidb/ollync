import { CheckCircle, Award } from 'lucide-react'
import './ProfileBadges.css'

interface ProfileBadgesProps {
  badges?: string[]
}

export const ProfileBadges = ({ badges = [] }: ProfileBadgesProps) => {
  if (!badges || badges.length === 0) return null

  const badgeConfig: Record<string, { icon: typeof CheckCircle; label: string; color: string }> = {
    verified: {
      icon: CheckCircle,
      label: 'Vérifié',
      color: '#10B981'
    },
    top_creator: {
      icon: Award,
      label: 'Top Créateur',
      color: '#F59E0B'
    }
  }

  return (
    <div className="profile-badges">
      {badges.map((badge) => {
        const config = badgeConfig[badge]
        if (!config) return null

        const Icon = config.icon
        return (
          <div
            key={badge}
            className="profile-badge"
            style={{ '--badge-color': config.color } as React.CSSProperties}
          >
            <Icon size={16} />
            <span>{config.label}</span>
          </div>
        )
      })}
    </div>
  )
}

