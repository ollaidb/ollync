import { PublicationType } from '../../constants/publishData'
import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './Step2Subcategory.css'

interface Step2SubcategoryProps {
  selectedCategory: PublicationType | null
  onSelectSubcategory: (subcategoryId: string) => void
  examplePosts: any[]
  loadingPosts: boolean
}

export const Step2Subcategory = ({ 
  selectedCategory, 
  onSelectSubcategory,
  examplePosts,
  loadingPosts 
}: Step2SubcategoryProps) => {
  const navigate = useNavigate()
  
  if (!selectedCategory) return null

  const Icon = selectedCategory.icon
  
  const handleProfileClick = (e: React.MouseEvent, userId?: string) => {
    e.stopPropagation()
    if (userId) {
      navigate(`/profile/${userId}`)
    }
  }

  return (
    <div className="step2-subcategory">
      <h2 className="step-title">Choisissez une sous-catégorie</h2>
      <div className="subcategories-list">
        {selectedCategory.subcategories.map((subcategory) => (
          <button
            key={subcategory.id}
            className="subcategory-card"
            onClick={() => onSelectSubcategory(subcategory.id)}
            style={{ '--category-color': selectedCategory.color } as React.CSSProperties}
          >
            <div className="subcategory-icon-wrapper">
              <Icon size={24} />
            </div>
            <div className="subcategory-content">
              <span className="subcategory-name">{subcategory.name}</span>
            </div>
          </button>
        ))}
      </div>
      
      {examplePosts.length > 0 && (
        <div className="example-posts-section">
          <h3 className="example-posts-title">Exemples d'annonces</h3>
          {loadingPosts ? (
            <div className="loading-posts">Chargement...</div>
          ) : (
            <div className="example-posts-grid">
              {examplePosts.map((post) => {
                const displayName = post.user?.username || post.user?.full_name || 'Utilisateur'
                return (
                  <div key={post.id} className="example-post-card">
                    <div className="example-post-image-wrapper">
                      {post.images && post.images.length > 0 && (
                        <img 
                          src={post.images[0]} 
                          alt={post.title}
                          className="example-post-image"
                        />
                      )}
                      
                      {/* Badge urgent en haut à gauche */}
                      {post.is_urgent && (
                        <div className="example-post-urgent-badge">URGENT</div>
                      )}
                      
                      {/* Bouton like en haut à droite */}
                      <div className="example-post-like">
                        <Heart size={16} fill="currentColor" />
                      </div>
                      
                      {/* Profil utilisateur en bas à gauche */}
                      {post.user_id && (
                        <div 
                          className="example-post-profile"
                          onClick={(e) => handleProfileClick(e, post.user_id)}
                        >
                          <div className="example-post-avatar">
                            {post.user?.avatar_url ? (
                              <img 
                                src={post.user.avatar_url} 
                                alt={displayName}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName)
                                }}
                              />
                            ) : (
                              <div className="example-post-avatar-placeholder">
                                {(displayName[0] || 'U').toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="example-post-profile-name">{displayName}</div>
                        </div>
                      )}
                    </div>
                    <div className="example-post-content">
                      <h4 className="example-post-title">{post.title}</h4>
                      <p className="example-post-description">{post.description?.substring(0, 100)}...</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

