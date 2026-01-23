import { Star } from 'lucide-react'
import { formatDate } from '../../utils/profileHelpers'
import './ReviewCard.css'

interface ReviewCardProps {
  review: {
    id: string
    reviewer_name?: string
    reviewer_avatar?: string
    rating: number
    comment?: string
    mission_type?: string
    created_at: string
  }
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const displayName = review.reviewer_name || 'Utilisateur anonyme'
  const avatarUrl = review.reviewer_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`

  return (
    <div className="review-card-container">
      <div className="review-header">
        <div className="review-author">
          <img
            src={avatarUrl}
            alt={displayName}
            className="review-avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`
            }}
          />
          <div className="review-author-info">
            <p className="review-author-name">{displayName}</p>
            <p className="review-date">{formatDate(review.created_at)}</p>
            {review.mission_type && (
              <p className="review-mission-type">{review.mission_type}</p>
            )}
          </div>
        </div>
        <div className="review-rating">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={20}
              className={i < review.rating ? 'filled' : 'empty'}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

