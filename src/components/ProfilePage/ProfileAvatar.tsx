import './ProfileAvatar.css'

interface ProfileAvatarProps {
  avatar?: string | null
  fullName?: string | null
  username?: string | null
  onPress?: () => void
}

export const ProfileAvatar = ({ avatar, fullName, username, onPress }: ProfileAvatarProps) => {
  const displayName = fullName || username || 'User'
  const avatarUrl = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`

  return (
    <div className="profile-avatar-container" onClick={onPress}>
      <img
        src={avatarUrl}
        alt={displayName}
        className="profile-avatar-image"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`
        }}
      />
      {onPress && (
        <div className="profile-avatar-overlay">
          <span className="profile-avatar-edit-text">Modifier</span>
        </div>
      )}
    </div>
  )
}

