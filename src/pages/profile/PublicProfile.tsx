import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, MessageCircle, Heart, Share2, MapPin, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import PostCard from '../../components/PostCard'
import { fetchPostsWithRelations } from '../../utils/fetchPostsWithRelations'
import { ProfileAvatar } from '../../components/ProfilePage/ProfileAvatar'
import { ProfileStats } from '../../components/ProfilePage/ProfileStats'
import { ProfileInfo } from '../../components/ProfilePage/ProfileInfo'
import { ProfileTabs } from '../../components/ProfilePage/ProfileTabs'
import { EmptyState } from '../../components/ProfilePage/EmptyState'
import { ReviewCard } from '../../components/ProfilePage/ReviewCard'
import { PhotoModal } from '../../components/ProfilePage/PhotoModal'
import './PublicProfile.css'

interface ProfileData {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  created_at: string
  availability?: string | null
  skills?: string[]
  services?: string[]
  languages?: Array<{ name: string; level: string }>
  badges?: string[]
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
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

interface Review {
  id: string
  rating: number
  comment?: string
  created_at: string
  reviewer_name?: string
  reviewer_avatar?: string
  mission_type?: string
}

const PublicProfile = ({ userId, isOwnProfile = false }: { userId?: string; isOwnProfile?: boolean }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'annonces' | 'match' | 'avis'>('annonces')
  const [posts, setPosts] = useState<Post[]>([])
  const [matchPosts, setMatchPosts] = useState<Post[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const profileId = userId || user?.id

  const fetchProfile = useCallback(async () => {
    if (!profileId) return

    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('Profil non trouvé, tentative de création depuis auth.users...')
        
        if (user && user.id === profileId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: newProfile, error: createError } = await (supabase.from('profiles') as any)
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
        }
      } else {
        console.error('Error fetching profile:', error)
      }
    } else if (data) {
      setProfile(data)
    }
    setLoading(false)
  }, [profileId, user])

  const fetchFollowersCount = useCallback(async () => {
    if (!profileId) return

    const { count } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', profileId)

    if (count !== null) {
      setFollowersCount(count)
    }
  }, [profileId])

  const fetchFollowingCount = useCallback(async () => {
    if (!profileId) return

    const { count } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', profileId)

    if (count !== null) {
      setFollowingCount(count)
    }
  }, [profileId])

  const checkFollowing = useCallback(async () => {
    if (!user || !profileId || isOwnProfile) return

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profileId)
      .single()

    setIsFavorite(!!data)
  }, [user, profileId, isOwnProfile])


  const fetchPosts = useCallback(async () => {
    if (!profileId) return

    setPostsLoading(true)
    const fetchedPosts = await fetchPostsWithRelations({
      userId: profileId,
      status: 'active',
      limit: 50,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    // Filtrer les posts qui ne sont pas de type "match"
    const nonMatchPosts = fetchedPosts.filter(post => {
      const categorySlug = post.category?.slug
      return categorySlug !== 'match'
    })

    setPosts(nonMatchPosts)
    setPostsLoading(false)
  }, [profileId])

  const fetchMatchPosts = useCallback(async () => {
    if (!profileId) return

    setPostsLoading(true)
    const fetchedPosts = await fetchPostsWithRelations({
      userId: profileId,
      status: 'active',
      limit: 50,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    // Filtrer uniquement les posts de type "match"
    const matchPostsOnly = fetchedPosts.filter(post => {
      const categorySlug = post.category?.slug
      return categorySlug === 'match'
    })

    setMatchPosts(matchPostsOnly)
    setPostsLoading(false)
  }, [profileId])

  const fetchReviews = useCallback(async () => {
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
      setReviews([])
    } else {
      // Transformer les données pour correspondre au format ReviewCard
      interface ReviewData {
        id: string
        rating: number
        comment: string | null
        mission_type: string | null
        created_at: string
        rater: {
          username: string | null
          full_name: string | null
          avatar_url: string | null
        } | null
      }
      const formattedReviews: Review[] = (data as ReviewData[] || []).map((review) => ({
        id: review.id,
        reviewer_name: review.rater?.full_name || review.rater?.username || undefined,
        reviewer_avatar: review.rater?.avatar_url || undefined,
        rating: review.rating,
        comment: review.comment || undefined,
        mission_type: review.mission_type || undefined,
        created_at: review.created_at
      }))
      setReviews(formattedReviews)
    }
    setReviewsLoading(false)
  }, [profileId])

  const handleLike = (postId: string) => {
    console.log('Like post:', postId)
    // La logique de like est gérée par PostCard
  }

  const handleEditProfile = () => {
    navigate('/profile/edit')
  }

  const handleContact = () => {
    if (!user) {
      navigate('/auth/login')
      return
    }
    if (!profileId) return
    navigate(`/messages/new?user=${profileId}`)
  }

  const handleToggleFavorite = async () => {
    if (!user || !profileId || isOwnProfile) return

    if (isFavorite) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId)

      if (!error) {
        setIsFavorite(false)
        setFollowersCount(prev => Math.max(0, prev - 1))
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('follows') as any)
        .insert({
          follower_id: user.id,
          following_id: profileId
        })

      if (!error) {
        setIsFavorite(true)
        setFollowersCount(prev => prev + 1)
      }
    }
  }

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${profileId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} - Profil`,
          text: `Découvrez le profil de ${displayName}`,
          url: profileUrl
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl)
        alert('Lien du profil copié dans le presse-papier')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        alert('Impossible de copier le lien')
      }
    }
  }

  useEffect(() => {
    if (profileId) {
      fetchProfile()
      fetchFollowersCount()
      fetchFollowingCount()
      if (!isOwnProfile && user) {
        checkFollowing()
      }
    }
  }, [profileId, user, isOwnProfile, fetchProfile, fetchFollowersCount, fetchFollowingCount, checkFollowing])

  useEffect(() => {
    if (profileId && activeTab === 'annonces') {
      fetchPosts()
    } else if (profileId && activeTab === 'match') {
      fetchMatchPosts()
    } else if (profileId && activeTab === 'avis') {
      fetchReviews()
    }
  }, [profileId, activeTab, fetchPosts, fetchMatchPosts, fetchReviews])

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
    <div className="public-profile-page">
      {/* Header avec bouton modifier - seulement pour le propre profil */}
      {isOwnProfile && (
        <div className="profile-header-bar">
          <div style={{ flex: 1 }} />
          <button
            className="profile-edit-button-header"
            onClick={handleEditProfile}
          >
            <Edit size={18} />
            <span>Modifier le profil</span>
          </button>
        </div>
      )}

      <div className="public-profile-content-wrapper">
        {/* Profil Header */}
        <div className="public-profile-header">
          {/* Photo de profil avec badge de vérification */}
          <div className="profile-header-top">
            <div className="profile-avatar-section">
              <ProfileAvatar
                avatar={profile.avatar_url}
                fullName={profile.full_name}
                username={profile.username}
                onPress={() => setShowPhotoModal(true)}
              />
              {profile.badges && profile.badges.includes('verified') && (
                <div className="verified-badge">
                  <CheckCircle2 size={20} />
                </div>
              )}
            </div>

            {/* Nom / Pseudo et Localisation */}
            <div className="profile-header-info">
              <h1 className="profile-name">{displayName}</h1>
              {profile.username && (
                <p className="profile-username">@{profile.username}</p>
              )}
              {profile.location && (
                <div className="profile-location-header">
                  <MapPin size={16} />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Boutons d'action */}
          {!isOwnProfile && user && (
            <div className="profile-action-buttons">
              <button
                className="profile-action-button contact-button"
                onClick={handleContact}
              >
                <MessageCircle size={18} />
                <span>Contacter</span>
              </button>
              <button
                className={`profile-action-button favorite-button ${isFavorite ? 'active' : ''}`}
                onClick={handleToggleFavorite}
              >
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                <span>{isFavorite ? 'Favoris' : 'Ajouter'}</span>
              </button>
              <button
                className="profile-action-button share-button"
                onClick={handleShare}
              >
                <Share2 size={18} />
                <span>Partager</span>
              </button>
            </div>
          )}

          {/* Stats */}
          <ProfileStats
            postsCount={posts.length}
            followersCount={followersCount}
            followingCount={followingCount}
            averageRating={averageRating}
          />

          {/* Bio courte */}
          {profile.bio && (
            <div className="profile-bio-section">
              <p className="profile-bio-text">{profile.bio}</p>
            </div>
          )}

          {/* Compétences / Services */}
          {(profile.skills && profile.skills.length > 0) || (profile.services && profile.services.length > 0) ? (
            <div className="profile-skills-services-section">
              {profile.skills && profile.skills.length > 0 && (
                <div className="profile-skills-group">
                  <h3 className="profile-section-title">Compétences</h3>
                  <div className="profile-skills-tags">
                    {profile.skills.map((skill, index) => (
                      <span key={index} className="profile-skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profile.services && profile.services.length > 0 && (
                <div className="profile-services-group">
                  <h3 className="profile-section-title">Services</h3>
                  <div className="profile-services-tags">
                    {profile.services.map((service, index) => (
                      <span key={index} className="profile-service-tag">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Informations supplémentaires (disponibilité, langues) */}
          <ProfileInfo
            bio={null}
            location={null}
            locationVisible={false}
            availability={profile.availability}
            skills={[]}
            languages={profile.languages}
          />
        </div>

        <ProfileTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          postsCount={posts.length}
          matchCount={matchPosts.length}
          reviewsCount={reviews.length}
        />

        {/* Tab Content */}
        <div className="profile-tab-content">
          {/* Onglet Annonces */}
          {activeTab === 'annonces' && (
            <div>
              {postsLoading ? (
                <div className="loading-state">Chargement...</div>
              ) : posts.length === 0 ? (
                <EmptyState
                  title="Aucune annonce"
                  message="Vous n'avez pas encore publié d'annonce"
                  icon="package"
                />
              ) : (
                <div className="posts-list">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} onLike={() => handleLike(post.id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Match */}
          {activeTab === 'match' && (
            <div>
              {postsLoading ? (
                <div className="loading-state">Chargement...</div>
              ) : matchPosts.length === 0 ? (
                <EmptyState
                  title="Aucun match"
                  message="Aucune annonce Match pour le moment"
                  icon="users"
                />
              ) : (
                <div className="posts-list">
                  {matchPosts.map((post) => (
                    <PostCard key={post.id} post={post} onLike={() => handleLike(post.id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Avis */}
          {activeTab === 'avis' && (
            <div>
              {reviewsLoading ? (
                <div className="loading-state">Chargement...</div>
              ) : reviews.length === 0 ? (
                <EmptyState
                  title="Aucun avis"
                  message="Aucun avis pour le moment"
                  icon="star"
                />
              ) : (
                <div className="reviews-list">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PhotoModal
        visible={showPhotoModal}
        avatar={profile.avatar_url}
        fullName={profile.full_name}
        username={profile.username}
        onClose={() => setShowPhotoModal(false)}
      />
    </div>
  )
}

export default PublicProfile
