import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Tag, Heart } from 'lucide-react'
import BackButton from '../components/BackButton'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import type { MappedPost } from '../utils/postMapper'
import './SwipePage.css'

type Post = MappedPost

const RecentPosts = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const fetchedPosts = await fetchPostsWithRelations({
        status: 'active',
        limit: 100,
        orderBy: 'created_at',
        orderDirection: 'desc',
        useCache: true
      })

      setPosts(fetchedPosts)
      setError(null)
    } catch (err) {
      console.error('Error fetching recent posts:', err)
      setError('Erreur lors du chargement des annonces récentes')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    fetchPosts()
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handlePostClick = (post: Post) => {
    navigate(`/post/${post.id}`)
  }

  const handleProfileClick = (e: React.MouseEvent, userId?: string) => {
    e.stopPropagation()
    if (userId) {
      navigate(`/profile/public/${userId}`)
    }
  }

  return (
    <div className="swipe-page">
      {/* Header fixe */}
      <div className="swipe-header-fixed">
        <div className="swipe-header-content">
          <BackButton className="swipe-back-button" />
          <h1 className="swipe-title">Annonces récentes</h1>
          <div className="swipe-header-spacer"></div>
        </div>
      </div>

      {/* Zone scrollable */}
      <div className="swipe-scrollable">
        {loading ? (
          <div className="swipe-loading">
            <p>Chargement des annonces...</p>
          </div>
        ) : error ? (
          <div className="swipe-empty">
            <p>{error}</p>
            <button onClick={handleRetry} className="swipe-btn-primary">
              <RefreshCw size={16} style={{ marginRight: '8px', display: 'inline' }} />
              Réessayer
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="swipe-empty">
            <p>Aucune annonce récente disponible</p>
            <button onClick={() => navigate('/home')} className="swipe-btn-primary">
              Retour à l'accueil
            </button>
          </div>
        ) : (
          <div className="swipe-masonry">
            {posts.map((post) => {
              const mainImage = post.images && post.images.length > 0 ? post.images[0] : null
              const displayName = post.user?.username || post.user?.full_name || 'Utilisateur'

              return (
                <div
                  key={post.id}
                  className="swipe-card"
                  onClick={() => handlePostClick(post)}
                >
                  <div className="swipe-card-title-top">
                    <span className="swipe-card-title-text">{post.title}</span>
                  </div>

                  <div className={`swipe-card-image-wrapper ${post.is_urgent ? 'swipe-card-urgent' : ''}`}>
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={post.title}
                        className="swipe-card-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="swipe-card-image-placeholder">
                        <Tag size={32} />
                      </div>
                    )}

                    {post.category && (
                      <div className="swipe-card-category">
                        {post.category.name}
                      </div>
                    )}

                    <div className="swipe-card-like">
                      <Heart size={16} fill="currentColor" />
                    </div>

                    <div className="swipe-card-overlay">
                      <div
                        className="swipe-card-profile"
                        onClick={(e) => handleProfileClick(e, post.user_id)}
                      >
                        <div className="swipe-card-avatar">
                          {post.user?.avatar_url ? (
                            <img
                              src={post.user.avatar_url}
                              alt={displayName}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName)
                              }}
                            />
                          ) : (
                            <div className="swipe-card-avatar-placeholder">
                              {(displayName[0] || 'U').toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="swipe-card-profile-name">{displayName}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecentPosts


