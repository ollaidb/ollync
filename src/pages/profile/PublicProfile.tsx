import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Edit } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import PostCard from '../../components/PostCard'
import { fetchPostsWithRelations } from '../../utils/fetchPostsWithRelations'
import { ProfileAvatar } from '../../components/ProfilePage/ProfileAvatar'
import { ProfileBadges } from '../../components/ProfilePage/ProfileBadges'
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
  mission_type?: string | null
}

const PublicProfile = ({ userId, isOwnProfile = false }: { userId?: string; isOwnProfile?: boolean }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'annonces' | 'match' | 'avis'>('annonces')
  const [posts, setPosts] = useState<Post[]>([])
  const [matchPosts, setMatchPosts] = useState<Post[]>([])
  const [reviews, setReviews] = useState<Rating[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)

  const profileId = userId || user?.id

  useEffect(() => {
    if (profileId) {
      fetchProfile()
      fetchFollowersCount()
      fetchFollowingCount()
      if (!isOwnProfile && user) {
        checkFollowing()
      }
    }
  }, [profileId, user, isOwnProfile])

  useEffect(() => {
    if (profileId && activeTab === 'annonces') {
      fetchPosts()
    } else if (profileId && activeTab === 'match') {
      fetchMatchPosts()
    } else if (profileId && activeTab === 'avis') {
      fetchReviews()
    }
  }, [profileId, activeTab])

  const fetchProfile = async () => {
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
  }

  const fetchFollowersCount = async () => {
    if (!profileId) return

    const { count } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', profileId)

    if (count !== null) {
      setFollowersCount(count)
    }
  }

  const fetchFollowingCount = async () => {
    if (!profileId) return

    const { count } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', profileId)

    if (count !== null) {
      setFollowingCount(count)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('follows') as any)
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
  }

  const fetchMatchPosts = async () => {
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
      setReviews([])
    } else {
      // Transformer les données pour correspondre au format ReviewCard
      const formattedReviews = (data || []).map((review: any) => ({
        id: review.id,
        reviewer_name: review.rater?.full_name || review.rater?.username || null,
        reviewer_avatar: review.rater?.avatar_url || null,
        rating: review.rating,
        comment: review.comment,
        mission_type: review.mission_type || null,
        created_at: review.created_at
      }))
      setReviews(formattedReviews)
    }
    setReviewsLoading(false)
  }

  const handleLike = (postId: string) => {
    console.log('Like post:', postId)
    // La logique de like est gérée par PostCard
  }

  const handleEditProfile = () => {
    navigate('/profile/settings')
  }

  const handleSettings = () => {
    navigate('/profile/settings')
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
    <div className="public-profile-page">
      {/* Header avec Settings */}
      <div className="profile-header-bar">
        <div style={{ flex: 1 }} />
        <button
          className="profile-settings-button"
          onClick={handleSettings}
          aria-label="Paramètres"
        >
          <Settings size={20} />
        </button>
      </div>

      <div className="public-profile-content-wrapper">
        {/* Profil Header */}
        <div className="public-profile-header">
          <ProfileAvatar
            avatar={profile.avatar_url}
            fullName={profile.full_name}
            username={profile.username}
            onPress={() => setShowPhotoModal(true)}
          />

          <h1 className="profile-name">{displayName}</h1>
          {profile.username && (
            <p className="profile-username">@{profile.username}</p>
          )}

          <ProfileBadges badges={profile.badges || []} />

          <ProfileStats
            postsCount={posts.length}
            followersCount={followersCount}
            followingCount={followingCount}
            averageRating={averageRating}
          />

          {/* Bouton Éditer le profil ou Suivre */}
          {isOwnProfile ? (
            <button
              className="edit-profile-button"
              onClick={handleEditProfile}
            >
              <Edit size={18} />
              <span>Éditer le profil</span>
            </button>
          ) : user && (
            <button
              className={`follow-button ${isFollowing ? 'following' : ''}`}
              onClick={handleFollow}
            >
              {isFollowing ? 'Ne plus suivre' : 'Suivre'}
            </button>
          )}

          <ProfileInfo
            bio={profile.bio}
            location={profile.location}
            locationVisible={true}
            availability={profile.availability}
            skills={profile.skills}
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
