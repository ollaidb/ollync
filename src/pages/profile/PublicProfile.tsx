import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Star, Package } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import PostCard from '../../components/PostCard'
import { fetchPostsWithRelations } from '../../utils/fetchPostsWithRelations'
import './PublicProfile.css'

interface ProfileData {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  created_at: string
}

interface Post {
  id: string
  title: string
  description: string
  images?: string[] | null
  price?: number | null
  location?: string | null
  likes_count: number
  comments_count: number
  created_at: string
  needed_date?: string | null
  number_of_people?: number | null
  delivery_available: boolean
  category?: {
    name: string
    slug: string
  } | null
  user?: {
    username: string | null
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface Rating {
  id: string
  rating: number
  comment: string | null
  created_at: string
  rater: {
    username: string | null
    full_name: string | null
    avatar_url: string | null
  } | null
}

const PublicProfile = ({ userId, isOwnProfile = false }: { userId?: string; isOwnProfile?: boolean }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [followersCount, setFollowersCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews'>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [reviews, setReviews] = useState<Rating[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)

  const profileId = userId || user?.id

  useEffect(() => {
    if (profileId) {
      fetchProfile()
      fetchFollowersCount()
      if (!isOwnProfile && user) {
        checkFollowing()
      }
    }
  }, [profileId, user])

  useEffect(() => {
    if (profileId && activeTab === 'posts') {
      fetchPosts()
    } else if (profileId && activeTab === 'reviews') {
      fetchReviews()
    }
  }, [profileId, activeTab])

  const fetchProfile = async () => {
    if (!profileId) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (error) {
      // Si le profil n'existe pas (code PGRST116), créer le profil depuis auth.users
      if (error.code === 'PGRST116') {
        console.log('Profil non trouvé, tentative de création depuis auth.users...')
        
        // Vérifier si c'est le profil de l'utilisateur connecté
        if (user && user.id === profileId) {
          // Créer le profil avec les données de auth.users
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || null,
              full_name: user.user_metadata?.full_name || null,
              username: user.user_metadata?.username || null
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            // Même en cas d'erreur, on peut afficher un profil minimal
            setProfile({
              id: user.id,
              username: user.user_metadata?.username || null,
              full_name: user.user_metadata?.full_name || null,
              avatar_url: null,
              bio: null,
              location: null,
              created_at: new Date().toISOString()
            })
          } else if (newProfile) {
            setProfile(newProfile)
            setLoading(false)
            return
          }
        } else {
          // Ce n'est pas le profil de l'utilisateur connecté, on ne peut pas le créer
          console.warn('Profil introuvable et ce n\'est pas le profil de l\'utilisateur connecté')
        }
      } else {
        console.error('Error fetching profile:', error)
      }
    } else if (data) {
      setProfile(data)
    }
    setLoading(false)
  }

  const fetchFollowersCount = async () => {
    if (!profileId) return

    const { data, error } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', profileId)

    if (!error && data !== null) {
      setFollowersCount(data as unknown as number)
    }
  }

  const checkFollowing = async () => {
    if (!user || !profileId || isOwnProfile) return

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profileId)
      .single()

    setIsFollowing(!!data)
  }

  const handleFollow = async () => {
    if (!user || !profileId || isOwnProfile) return

    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId)

      if (!error) {
        setIsFollowing(false)
        setFollowersCount(prev => Math.max(0, prev - 1))
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: profileId
        })

      if (!error) {
        setIsFollowing(true)
        setFollowersCount(prev => prev + 1)
      }
    }
  }


  const fetchPosts = async () => {
    if (!profileId) return

    setPostsLoading(true)
    const posts = await fetchPostsWithRelations({
      userId: profileId,
      status: 'active',
      limit: 50,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    setPosts(posts)
    setPostsLoading(false)
  }

  const fetchReviews = async () => {
    if (!profileId) return

    setReviewsLoading(true)
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        rater:profiles!ratings_rater_id_fkey(username, full_name, avatar_url)
      `)
      .eq('rated_user_id', profileId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
    } else {
      setReviews(data || [])
    }
    setReviewsLoading(false)
  }

  if (loading) {
    return (
      <div className="public-profile-loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="public-profile-empty">
        <p>Profil introuvable</p>
      </div>
    )
  }

  const displayName = profile.full_name || profile.username || 'Utilisateur'
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="public-profile">
      <div className="public-profile-header">
        <div className="profile-avatar-wrapper">
          <img
            src={profile.avatar_url || '/default-avatar.png'}
            alt={displayName}
            className="profile-avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName)
            }}
          />
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{displayName}</h1>
          {profile.username && (
            <p className="profile-username">@{profile.username}</p>
          )}
          {profile.bio && (
            <p className="profile-bio">{profile.bio}</p>
          )}
          <div className="profile-meta">
            {profile.location && (
              <div className="profile-meta-item">
                <MapPin size={16} />
                <span>{profile.location}</span>
              </div>
            )}
            <div className="profile-meta-item">
              <Calendar size={16} />
              <span>Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-value">{followersCount}</span>
              <span className="stat-label">Abonnés</span>
            </div>
            {reviews.length > 0 && (
              <div className="profile-stat">
                <span className="stat-value">
                  {averageRating.toFixed(1)}
                  <Star size={14} className="star-icon" />
                </span>
                <span className="stat-label">Note moyenne</span>
              </div>
            )}
            <div className="profile-stat">
              <span className="stat-value">{posts.length}</span>
              <span className="stat-label">Annonces</span>
            </div>
          </div>
          {!isOwnProfile && user && (
            <button
              className={`follow-button ${isFollowing ? 'following' : ''}`}
              onClick={handleFollow}
            >
              {isFollowing ? 'Ne plus suivre' : 'Suivre'}
            </button>
          )}
          {isOwnProfile && (
            <button
              className="edit-profile-button"
              onClick={() => navigate('/profile/settings')}
            >
              Modifier le profil
            </button>
          )}
        </div>
      </div>

      <div className="public-profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <Package size={18} />
          <span>{isOwnProfile ? 'Mes annonces' : 'Annonces'} ({posts.length})</span>
        </button>
        <button
          className={`profile-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <Star size={18} />
          <span>Avis ({reviews.length})</span>
        </button>
      </div>

      <div className="public-profile-content">
        {activeTab === 'posts' && (
          <div className="profile-posts">
            {postsLoading ? (
              <div className="loading-state">Chargement...</div>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <Package size={48} />
                <p>Aucune annonce pour le moment</p>
              </div>
            ) : (
              <div className="posts-grid">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="profile-reviews">
            {reviewsLoading ? (
              <div className="loading-state">Chargement...</div>
            ) : reviews.length === 0 ? (
              <div className="empty-state">
                <Star size={48} />
                <p>Aucun avis pour le moment</p>
              </div>
            ) : (
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="review-author">
                        {review.rater?.avatar_url ? (
                          <img
                            src={review.rater.avatar_url}
                            alt={review.rater.full_name || review.rater.username || 'Utilisateur'}
                            className="review-avatar"
                          />
                        ) : (
                          <div className="review-avatar-placeholder">
                            {(review.rater?.full_name || review.rater?.username || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="review-author-name">
                            {review.rater?.full_name || review.rater?.username || 'Utilisateur anonyme'}
                          </p>
                          <p className="review-date">
                            {new Date(review.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
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
                    {review.comment && (
                      <p className="review-comment">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PublicProfile

