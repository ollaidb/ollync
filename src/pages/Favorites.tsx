import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Heart, WifiOff, Trash2, UserMinus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import { useIsMobile } from '../hooks/useIsMobile'
import { AuthBackground } from '../components/Auth/AuthBackground'
import { PullToRefresh } from '../components/PullToRefresh/PullToRefresh'
import PostCard from '../components/PostCard'
import { PostCardSkeleton } from '../components/PostCardSkeleton'
import { SwipeableListItem } from '../components/SwipeableListItem'
import { hapticWarning, hapticSuccess } from '../utils/haptic'
import BackButton from '../components/BackButton'
import Footer from '../components/Footer'
import { EmptyState } from '../components/EmptyState'
import { PageMeta } from '../components/PageMeta'
import { mapPosts } from '../utils/postMapper'
import './Auth.css'
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
  status?: string
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
  /** Si présent, le profil est considéré comme supprimé (ex. compte désactivé) */
  deleted_at?: string | null
}

const Favorites = () => {
  const { t } = useTranslation(['favorites', 'common'])
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [searchParams, setSearchParams] = useSearchParams()
  const getTabFromParams = () =>
    searchParams.get('tab') === 'profiles' ? 'profiles' : 'posts'
  const [activeTab, setActiveTab] = useState<'posts' | 'profiles'>(getTabFromParams)
  const [favoritePosts, setFavoritePosts] = useState<Post[]>([])
  const [followedProfiles, setFollowedProfiles] = useState<FollowedProfile[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [networkError, setNetworkError] = useState(false)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const fetchLikedPosts = useCallback(async () => {
    if (!user) return

    try {
      setLoadingPosts(true)
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
      
      // Toujours charger depuis la table posts (tous statuts) pour afficher "Annonce supprimée" pour les annonces retirées
      const { data: fallbackPosts, error: fallbackError } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds)
        .order('created_at', { ascending: false })

      if (fallbackError) {
        console.error('Error fetching liked posts:', fallbackError)
        if (fallbackError.message?.includes('Failed to fetch') || 
            fallbackError.message?.includes('NetworkError') ||
            fallbackError.message?.includes('network') ||
            fallbackError.message?.includes('ERR_')) {
          setNetworkError(true)
        }
        return
      }

      if (fallbackPosts && fallbackPosts.length > 0) {
        // Récupérer les relations séparément
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userIds = [...new Set(fallbackPosts.map((p: any) => p.user_id).filter(Boolean))]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const categoryIds = [...new Set(fallbackPosts.map((p: any) => p.category_id).filter(Boolean))]

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
        const postsWithRelations = fallbackPosts.map((post: any) => ({
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
    } finally {
      setLoadingPosts(false)
    }
  }, [user])

  const fetchFollowedProfiles = useCallback(async () => {
    if (!user) return

    try {
      setLoadingProfiles(true)
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

      // Récupérer les profils (deleted_at optionnel : si présent, swipe activé uniquement pour profils supprimés)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio')
        .in('id', followingIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return
      }

      if (profiles && profiles.length > 0) {
        const [postsResult, followersResult] = await Promise.all([
          supabase
            .from('posts')
            .select('user_id')
            .in('user_id', followingIds)
            .eq('status', 'active'),
          supabase
            .from('follows')
            .select('following_id')
            .in('following_id', followingIds)
        ])

        if (postsResult.error) {
          console.error('Error fetching posts counts:', postsResult.error)
        }
        if (followersResult.error) {
          console.error('Error fetching followers counts:', followersResult.error)
        }

        const postsCountMap = new Map<string, number>()
        const followersCountMap = new Map<string, number>()

        for (const row of postsResult.data || []) {
          const userId = (row as { user_id?: string }).user_id
          if (!userId) continue
          postsCountMap.set(userId, (postsCountMap.get(userId) || 0) + 1)
        }

        for (const row of followersResult.data || []) {
          const userId = (row as { following_id?: string }).following_id
          if (!userId) continue
          followersCountMap.set(userId, (followersCountMap.get(userId) || 0) + 1)
        }

        const profilesWithCounts = profiles.map((profile: { id: string; username: string | null; full_name: string | null; avatar_url: string | null; bio: string | null }) => ({
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          postsCount: postsCountMap.get(profile.id) || 0,
          followers: followersCountMap.get(profile.id) || 0,
          deleted_at: null as string | null
        }))

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
    } finally {
      setLoadingProfiles(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      if (activeTab === 'posts') {
        fetchLikedPosts()
      } else {
        fetchFollowedProfiles()
      }
    } else {
      setLoadingPosts(false)
      setLoadingProfiles(false)
    }
  }, [user, activeTab, fetchLikedPosts, fetchFollowedProfiles])

  useEffect(() => {
    if (!headerRef.current || !containerRef.current) return
    const updateOffset = () => {
      const height = headerRef.current?.offsetHeight || 0
      containerRef.current?.style.setProperty('--favorites-header-offset', `${height}px`)
    }
    updateOffset()
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateOffset) : null
    observer?.observe(headerRef.current)
    window.addEventListener('resize', updateOffset)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', updateOffset)
    }
  }, [])
  
  useEffect(() => {
    const nextTab = getTabFromParams()
    if (nextTab !== activeTab) {
      setActiveTab(nextTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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
    hapticWarning()
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
        hapticSuccess()
        setFollowedProfiles(followedProfiles.filter((profile) => profile.id !== profileId))
      }
    } catch (error) {
      console.error('Error unfollowing profile:', error)
      alert('Erreur lors de la suppression du suivi')
    }
  }

  const removeFromFavorites = useCallback(async (postId: string) => {
    if (!user) return
    hapticWarning()
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)
      if (error) {
        console.error('Error removing like:', error)
        return
      }
      hapticSuccess()
      setFavoritePosts((prev) => prev.filter((p) => p.id !== postId))
      window.dispatchEvent(new CustomEvent('likeChanged', { detail: { postId, liked: false } }))
    } catch (err) {
      console.error('Error removing from favorites:', err)
    }
  }, [user])

  const loading = activeTab === 'posts' ? loadingPosts : loadingProfiles

  if (!user) {
    return (
      <>
        <PageMeta title={t('common:meta.favorites.title')} description={t('common:meta.favorites.description')} />
        <div className="auth-page-wrap">
        <AuthBackground />
        <div className="auth-page">
          <div className="favorites-page-container">
            <div className="favorites-header-not-connected">
              <BackButton />
              <h1 className="favorites-title-centered">{t('favorites:title')}</h1>
              <div className="favorites-header-spacer" aria-hidden="true" />
            </div>
            <div className="favorites-content-not-connected">
              <Heart className="favorites-not-connected-icon" strokeWidth={1.5} />
              <h2 className="favorites-not-connected-title">{t('favorites:notConnectedTitle')}</h2>
              <p className="favorites-not-connected-text">{t('favorites:notConnectedText')}</p>
              <button
                className="favorites-not-connected-button"
                onClick={() => navigate('/auth/register')}
              >
                {t('favorites:register')}
              </button>
              <p className="favorites-not-connected-login-link">
                {t('favorites:alreadyAccount')}{' '}
                <button
                  className="favorites-not-connected-link"
                  onClick={() => navigate('/auth/login')}
                >
                  {t('favorites:signIn')}
                </button>
              </p>
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </>
    )
  }

  return (
    <>
      <PageMeta title={t('common:meta.favorites.title')} description={t('common:meta.favorites.description')} />
      <div className="favorites-page" ref={containerRef}>
      {/* Header */}
      <div className="favorites-header-container">
        <div className="favorites-header" ref={headerRef}>
          <div className="favorites-header-content">
            <BackButton />
            <div>
              <h1 className="favorites-title">{t('favorites:title')}</h1>
            </div>
            <div className="favorites-header-spacer" aria-hidden="true" />
          </div>

          {/* Tabs */}
          <div className="favorites-tabs">
            <button
              className={`favorites-tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('posts')
                setSearchParams((prev) => {
                  const params = new URLSearchParams(prev)
                  params.delete('tab')
                  return params
                }, { replace: true })
              }}
            >
              {t('favorites:tabPosts')} {favoritePosts.length > 0 && `(${favoritePosts.length})`}
            </button>
            <button
              className={`favorites-tab ${activeTab === 'profiles' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('profiles')
                setSearchParams((prev) => {
                  const params = new URLSearchParams(prev)
                  params.set('tab', 'profiles')
                  return params
                }, { replace: true })
              }}
            >
              {t('favorites:tabProfiles')} {followedProfiles.length > 0 && `(${followedProfiles.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <PullToRefresh
        onRefresh={() => activeTab === 'posts' ? fetchLikedPosts() : fetchFollowedProfiles()}
        className="favorites-content"
        enabled={isMobile}
        loading={loading}
      >
        {loading ? (
          activeTab === 'posts' ? (
            <div className="posts-list" aria-busy="true">
              <PostCardSkeleton viewMode="list" count={4} />
            </div>
          ) : (
            <div className="profiles-list favorites-profiles-skeleton" aria-busy="true">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="favorites-profile-skeleton">
                  <div className="favorites-profile-skeleton-avatar" />
                  <div className="favorites-profile-skeleton-info">
                    <div className="favorites-profile-skeleton-line" />
                    <div className="favorites-profile-skeleton-line short" />
                  </div>
                </div>
              ))}
            </div>
          )
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
                 if (activeTab === 'posts') {
                   setLoadingPosts(true)
                   fetchLikedPosts()
                 } else {
                   setLoadingProfiles(true)
                   fetchFollowedProfiles()
                 }
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
                    {favoritePosts.map((post) => {
                      const isPostRemoved = post.status !== 'active'
                      const swipeEnabled = isMobile && isPostRemoved
                      return (
                      <SwipeableListItem
                        key={post.id}
                        enabled={swipeEnabled}
                        actions={swipeEnabled ? [
                          {
                            id: 'delete',
                            label: 'Supprimer',
                            icon: <Trash2 size={20} />,
                            destructive: true,
                            onClick: () => removeFromFavorites(post.id)
                          }
                        ] : []}
                      >
                        <PostCard 
                          post={post} 
                          viewMode="list" 
                          isLiked={true} 
                          onLike={fetchLikedPosts}
                          isRemoved={isPostRemoved}
                        />
                      </SwipeableListItem>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState
                    type="favorites"
                    customTitle="Repère les opportunités qui comptent."
                    customSubtext="Ajoute tes annonces préférées pour les retrouver rapidement."
                    actionLabel="Voir le Swipe"
                    onAction={() => navigate('/swipe')}
                    marketing
                    marketingTone="teal"
                  />
                )}
              </>
            )}

            {/* Profils Tab */}
            {activeTab === 'profiles' && (
              <>
                {followedProfiles.length > 0 ? (
                  <div className="profiles-list">
                    {followedProfiles.map((profile) => {
                      const isProfileRemoved = !!(profile.deleted_at)
                      const swipeEnabled = isMobile && isProfileRemoved
                      return (
                      <SwipeableListItem
                        key={profile.id}
                        enabled={swipeEnabled}
                        actions={swipeEnabled ? [
                          {
                            id: 'delete',
                            label: 'Supprimer',
                            icon: <UserMinus size={20} />,
                            destructive: true,
                            onClick: () => handleUnfollow(profile.id)
                          }
                        ] : []}
                      >
                        <div
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
                      </SwipeableListItem>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState
                    type="profiles"
                    customTitle="Repère les opportunités qui comptent."
                    customSubtext="Suis des profils et retrouve-les facilement."
                    actionLabel="Voir le Swipe"
                    onAction={() => navigate('/swipe')}
                    marketing
                    marketingTone="teal"
                  />
                )}
              </>
            )}
          </>
        )}
      </PullToRefresh>
    </div>
    </>
  )
}

export default Favorites
