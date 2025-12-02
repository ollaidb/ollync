import { Package, Users, Star } from 'lucide-react'
import './ProfileTabs.css'

interface ProfileTabsProps {
  activeTab: 'annonces' | 'match' | 'avis'
  onTabChange: (tab: 'annonces' | 'match' | 'avis') => void
  postsCount?: number
  matchCount?: number
  reviewsCount?: number
}

export const ProfileTabs = ({ 
  activeTab, 
  onTabChange,
  postsCount = 0,
  matchCount = 0,
  reviewsCount = 0
}: ProfileTabsProps) => {
  return (
    <div className="profile-tabs-container">
      <button
        className={`profile-tab-item ${activeTab === 'annonces' ? 'active' : ''}`}
        onClick={() => onTabChange('annonces')}
      >
        <Package size={18} />
        <span>Annonces {postsCount > 0 && `(${postsCount})`}</span>
      </button>
      <button
        className={`profile-tab-item ${activeTab === 'match' ? 'active' : ''}`}
        onClick={() => onTabChange('match')}
      >
        <Users size={18} />
        <span>Match {matchCount > 0 && `(${matchCount})`}</span>
      </button>
      <button
        className={`profile-tab-item ${activeTab === 'avis' ? 'active' : ''}`}
        onClick={() => onTabChange('avis')}
      >
        <Star size={18} />
        <span>Avis {reviewsCount > 0 && `(${reviewsCount})`}</span>
      </button>
    </div>
  )
}

