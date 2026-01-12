import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Loader, Search, WifiOff } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import PostCard from '../components/PostCard'
import BackButton from '../components/BackButton'
import Footer from '../components/Footer'
import { EmptyState } from '../components/EmptyState'
import { mapPosts } from '../utils/postMapper'
import './Favorites.css'

interface Post {
  id: string
  title: string
  description: string
  price?: number | null
  location?: string | null
  images?: string[] | null
  likes_count: number
  comments_count: number
  created_at: string
  needed_date?: string | null
  number_of_people?: number | null
  delivery_available: boolean
  user?: {
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
  category?: {
    name: string
    slug: string
  } | null
}

interface FollowedProfile {
  id: string
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  postsCount?: number
  followers?: number
}

const Favorites = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'posts' | 'profiles'>('posts')
  const [favoritePosts, setFavoritePosts] = useState<Post[]>([])
  const [followedProfiles, setFollowedProfiles] = useState<FollowedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [networkError, setNetworkError] = useState(false)

  const fetchLikedPosts = useCallback(async () => {
    if (!user) return

    try {
      setNetworkError(false)
      // Récupérer les IDs des posts likés
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (likesError) {
        console.error('Error fetching likes:', likesError)
        // Vérifier si c'est une erreur réseau
        if (likesError.message?.includes('Failed to fetch') || 
            likesError.message?.includes('NetworkError') ||
            likesError.message?.includes('network') ||
            likesError.message?.includes('ERR_')) {
          setNetworkError(true)
        }
        return
      }

      if (!likes || likes.length === 0) {
        setFavoritePosts([])
        return
      }

      // Récupérer les posts likés
      const postIds = likes.map((like: { post_id: string }) => like.post_id)
      
      // Récupérer les posts avec leurs relations
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (postsError) {
        console.error('Error fetching posts:', postsError)
        // Vérifier si c'est une erreur réseau
        if (postsError.message?.includes('Failed to fetch') || 
            postsError.message?.includes('NetworkError') ||
            postsError.message?.includes('network') ||
            postsError.message?.includes('ERR_')) {
          setNetworkError(true)
        }
        return
      }

      if (postsData && postsData.length > 0) {
        // Récupérer les relations séparément
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userIds = [...new Set(postsData.map((p: any) => p.user_id).filter(Boolean))]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const categoryIds = [...new Set(postsData.map((p: any) => p.category_id).filter(Boolean))]

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds)

        const { data: categories } = await supabase
          .from('categories')
          .select('id, name, slug')
          .in('id', categoryIds)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const categoriesMap = new Map((categories || []).map((c: any) => [c.id, c]))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const postsWithRelations = postsData.map((post: any) => ({
          ...post,
          profiles: profilesMap.get(post.user_id) || null,
          categories: categoriesMap.get(post.category_id) || null
        }))

        setFavoritePosts(mapPosts(postsWithRelations))
      } else {
        setFavoritePosts([])
      }
    } catch (error) {
      console.error('Error fetching liked posts:', error)
      // Gérer les erreurs réseau
      if (error instanceof Error && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('network') ||
           error.message.includes('ERR_'))) {
        setNetworkError(true)
      }
    }
  }, [user])

  const fetchFollowedProfiles = useCallback(async () => {
    if (!user) return

    try {
      setNetworkError(false)
      // Récupérer les profils suivis
      const { data: follows, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      if (followsError) {
        console.error('Error fetching follows:', followsError)
        // Vérifier si c'est une erreur réseau
        if (followsError.message?.includes('Failed to fetch') || 
            followsError.message?.includes('NetworkError') ||
            followsError.message?.includes('network') ||
            followsError.message?.includes('ERR_')) {
          setNetworkError(true)
        }
        return
      }

      if (!follows || follows.length === 0) {
        setFollowedProfiles([])
        return
      }

      const followingIds = follows.map((f: { following_id: string }) => f.following_id)

      // Récupérer les profils
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio')
        .in('id', followingIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return
      }

      if (profiles && profiles.length > 0) {
        // Pour chaque profil, récupérer le nombre de posts et de followers
        const profilesWithCounts = await Promise.all(
          profiles.map(async (profile: { id: string; username: string | null; full_name: string | null; avatar_url: string | null; bio: string | null }) => {
            // Compter les posts
            const { count: postsCount } = await supabase
              .from('posts')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id)
              .eq('status', 'active')

            // Compter les followers
            const { count: followersCount } = await supabase
              .from('follows')
              .select('id', { count: 'exact', head: true })
              .eq('following_id', profile.id)

            return {
              id: profile.id,
              username: profile.username,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              bio: profile.bio,
              postsCount: postsCount || 0,
              followers: followersCount || 0
            }
          })
        )

        setFollowedProfiles(profilesWithCounts)
      } else {
        setFollowedProfiles([])
      }
    } catch (error) {
      console.error('Error fetching followed profiles:', error)
      // Gérer les erreurs réseau
      if (error instanceof Error && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('network') ||
           error.message.includes('ERR_'))) {
        setNetworkError(true)
      }
    }
  }, [user])

  const loadFavorites = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchLikedPosts(),
        fetchFollowedProfiles()
      ])
    } finally {
      setLoading(false)
    }
  }, [fetchLikedPosts, fetchFollowedProfiles])

  useEffect(() => {
    if (user) {
      loadFavorites()
    } else {
      setLoading(false)
    }
  }, [user, loadFavorites])

  // Écouter les changements de likes depuis d'autres pages
  useEffect(() => {
    const handleLikeChange = () => {
      if (user) {
        fetchLikedPosts()
      }
    }

    window.addEventListener('likeChanged', handleLikeChange)
    return () => {
      window.removeEventListener('likeChanged', handleLikeChange)
    }
  }, [user, fetchLikedPosts])

  const handleUnfollow = async (profileId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId)

      if (error) {
        console.error('Error unfollowing profile:', error)
        alert('Erreur lors de la suppression du suivi')
      } else {
        setFollowedProfiles(followedProfiles.filter((profile) => profile.id !== profileId))
      }
    } catch (error) {
      console.error('Error unfollowing profile:', error)
      alert('Erreur lors de la suppression du suivi')
    }
  }

  if (!user) {
    return (
      <div className="favorites-page-container">
        <div className="favorites-header-not-connected">
          <h1 className="favorites-title-centered">Favoris</h1>
        </div>
        <div className="favorites-content-not-connected">
          <Heart className="favorites-not-connected-icon" strokeWidth={1.5} />
          <h2 className="favorites-not-connected-title">Vous n'êtes pas connecté</h2>
          <p className="favorites-not-connected-text">Connectez-vous pour accéder à vos favoris</p>
          <button 
            className="favorites-not-connected-button" 
            onClick={() => navigate('/auth/register')}
          >
            S'inscrire
          </button>
          <p className="favorites-not-connected-login-link">
            Déjà un compte ?{' '}
            <button 
              className="favorites-not-connected-link" 
              onClick={() => navigate('/auth/login')}
            >
              Se connecter
            </button>
          </p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="favorites-page">
      {/* Header */}
      <div className="favorites-header-container">
        <div className="favorites-header">
          <div className="favorites-header-content">
            <BackButton />
            <div>
              <h1 className="favorites-title">Favoris</h1>
            </div>
            <button
              className="search-button"
              onClick={() => navigate('/search')}
              aria-label="Rechercher"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="favorites-tabs">
            <button
              className={`favorites-tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              Publications {favoritePosts.length > 0 && `(${favoritePosts.length})`}
            </button>
            <button
              className={`favorites-tab ${activeTab === 'profiles' ? 'active' : ''}`}
              onClick={() => setActiveTab('profiles')}
            >
              Profils suivis {followedProfiles.length > 0 && `(${followedProfiles.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="favorites-content">
        {loading ? (
          <div className="loading-container">
            <Loader className="spinner-large" size={48} />
            <p>Chargement...</p>
          </div>
         ) : networkError ? (
           <div className="empty-state">
             <div className="empty-state-icon empty-state-icon-network">
               <WifiOff size={48} />
             </div>
             <h2>Problème de connexion</h2>
             <p>Vérifiez votre connexion Internet et réessayez.</p>
             <button 
               className="btn-primary" 
               onClick={() => {
                 setNetworkError(false)
                 setLoading(true)
                 loadFavorites()
               }}
             >
               Réessayer
             </button>
           </div>
        ) : (
          <>
            {/* Publications Tab */}
            {activeTab === 'posts' && (
              <>
                {favoritePosts.length > 0 ? (
                  <div className="posts-list">
                    {favoritePosts.map((post) => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        viewMode="list" 
                        isLiked={true} 
                        onLike={fetchLikedPosts} 
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState type="favorites" />
                )}
              </>
            )}

            {/* Profils Tab */}
            {activeTab === 'profiles' && (
              <>
                {followedProfiles.length > 0 ? (
                  <div className="profiles-list">
                    {followedProfiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="profile-card"
                        onClick={() => navigate(`/profile/${profile.id}`)}
                      >
                        <img
                          src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.username || 'User')}`}
                          alt={profile.full_name || profile.username || 'User'}
                          className="profile-avatar"
                        />
                        <div className="profile-info">
                          <h3 className="profile-name">
                            {profile.full_name || profile.username || 'Utilisateur'}
                          </h3>
                          {profile.bio && (
                            <p className="profile-bio">{profile.bio}</p>
                          )}
                          <div className="profile-stats">
                            <span className="profile-stat">
                              {profile.postsCount || 0} annonces
                            </span>
                            <span className="profile-stat">
                              {profile.followers || 0} abonnés
                            </span>
                          </div>
                        </div>
                        <button
                          className="unfollow-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUnfollow(profile.id)
                          }}
                        >
                          Suivi
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState type="profiles" />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Favorites
