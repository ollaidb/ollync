import './ProfileStats.css'

interface ProfileStatsProps {
  postsCount?: number
  followersCount?: number
  followingCount?: number
  averageRating?: number
}

export const ProfileStats = ({ 
  postsCount = 0, 
  followersCount = 0, 
  followingCount = 0,
  averageRating
}: ProfileStatsProps) => {
  return (
    <div className="profile-stats-container">
      <div className="profile-stat">
        <span className="stat-value">{postsCount}</span>
        <span className="stat-label">Annonces</span>
      </div>
      <div className="profile-stat">
        <span className="stat-value">{followersCount}</span>
        <span className="stat-label">Abonnés</span>
      </div>
      <div className="profile-stat">
        <span className="stat-value">{followingCount}</span>
        <span className="stat-label">Abonnements</span>
      </div>
      {averageRating !== undefined && averageRating > 0 && (
        <div className="profile-stat">
          <span className="stat-value">{averageRating.toFixed(1)}</span>
          <span className="stat-label">Note moyenne</span>
        </div>
      )}
    </div>
  )
}

