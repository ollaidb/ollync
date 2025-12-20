import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Bell, Tag, Heart } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import BackButton from '../components/BackButton'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import './SwipePage.css'

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
  is_urgent?: boolean
  status: string
  user_id: string
  user?: {
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
  category?: {
    name: string
    slug: string
  } | null
  sub_category?: {
    name: string
    slug: string
  } | null
}

const SwipePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const categoryId = searchParams.get('category')
  const subCategoryId = searchParams.get('subcategory')

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const observerTarget = useRef<HTMLDivElement>(null)

  const POSTS_PER_PAGE = 20

  const fetchPosts = useCallback(async (pageNum: number) => {
    if (pageNum === 0) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const fetchedPosts = await fetchPostsWithRelations({
        categoryId: categoryId || undefined,
        subCategoryId: subCategoryId || undefined,
        status: 'active',
        limit: POSTS_PER_PAGE,
        offset: pageNum * POSTS_PER_PAGE,
        orderBy: 'created_at',
        orderDirection: 'desc'
      })

      console.log('📦 Posts récupérés:', fetchedPosts.length)
      console.log('📦 Posts récupérés (détails):', fetchedPosts)

      if (!user) {
        // Si l'utilisateur n'est pas connecté, afficher tous les posts
        console.log('👤 Utilisateur non connecté, affichage de tous les posts')
        if (pageNum === 0) {
          setPosts(fetchedPosts as Post[])
        } else {
          setPosts(prev => [...prev, ...(fetchedPosts as Post[])])
        }
        setHasMore(fetchedPosts.length === POSTS_PER_PAGE)
        return
      }

      console.log('👤 Utilisateur connecté:', user.id)

      // Si l'utilisateur est connecté, filtrer ses propres annonces et les posts déjà swipés
      // Gérer les erreurs 404 gracieusement si les tables n'existent pas encore
      let matchRequestIds: string[] = []
      let interestIds: string[] = []
      let ignoredIds: string[] = []

      try {
        const matchRequestsResult = await (supabase.from('match_requests') as any)
          .select('related_post_id')
          .eq('from_user_id', user.id)
        
        if (!matchRequestsResult.error) {
          matchRequestIds = matchRequestsResult.data?.map((mr: any) => mr.related_post_id).filter(Boolean) || []
        }
      } catch (error) {
        // Table n'existe peut-être pas encore, ignorer l'erreur
        console.warn('match_requests table may not exist:', error)
      }

      try {
        const interestsResult = await (supabase.from('interests') as any)
          .select('post_id')
          .eq('user_id', user.id)
        
        if (!interestsResult.error) {
          interestIds = interestsResult.data?.map((i: any) => i.post_id) || []
        }
      } catch (error) {
        // Table n'existe peut-être pas encore, ignorer l'erreur
        console.warn('interests table may not exist:', error)
      }

      try {
        const ignoredResult = await (supabase.from('ignored_posts') as any)
          .select('post_id')
          .eq('user_id', user.id)
        
        if (!ignoredResult.error) {
          ignoredIds = ignoredResult.data?.map((i: any) => i.post_id) || []
        }
      } catch (error) {
        // Table n'existe peut-être pas encore, ignorer l'erreur
        console.warn('ignored_posts table may not exist:', error)
      }

      const swipedPostIds = new Set([
        ...matchRequestIds,
        ...interestIds,
        ...ignoredIds
      ])

      console.log('🔍 IDs déjà swipés:', {
        matchRequests: matchRequestIds.length,
        interests: interestIds.length,
        ignored: ignoredIds.length,
        total: swipedPostIds.size
      })

      // Filtrer les posts : exclure ceux déjà swipés et ceux de l'utilisateur
      // TEMPORAIRE : Si aucun post après filtrage strict, afficher quand même les posts de l'utilisateur pour debug
      let filteredPosts = (fetchedPosts as Post[]).filter(post => 
        !swipedPostIds.has(post.id) && post.user_id !== user.id
      )
      
      // Si aucun post après filtrage strict mais qu'il y en a avant, afficher au moins ceux non swipés
      if (filteredPosts.length === 0 && fetchedPosts.length > 0) {
        console.warn('⚠️ Aucun post après filtrage strict. Affichage des posts non swipés uniquement.')
        filteredPosts = (fetchedPosts as Post[]).filter(post => 
          !swipedPostIds.has(post.id)
        )
      }

      console.log('✅ Posts après filtrage:', filteredPosts.length)
      console.log('✅ Posts filtrés (détails):', filteredPosts)
      console.log('📊 Statistiques:', {
        totalRécupérés: fetchedPosts.length,
        filtrés: filteredPosts.length,
        swipés: swipedPostIds.size,
        propresPosts: (fetchedPosts as Post[]).filter(p => p.user_id === user.id).length
      })

      // Si aucun post après filtrage mais qu'il y en a avant, afficher un message
      if (filteredPosts.length === 0 && fetchedPosts.length > 0) {
        console.warn('⚠️ Tous les posts ont été filtrés. Vérifiez le filtrage.')
      }

      if (pageNum === 0) {
        setPosts(filteredPosts)
      } else {
        setPosts(prev => [...prev, ...filteredPosts])
      }
      setHasMore(fetchedPosts.length === POSTS_PER_PAGE)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [categoryId, subCategoryId, user])

  useEffect(() => {
    // Reset when category/subcategory changes
    setPosts([])
    setPage(0)
    setHasMore(true)
    fetchPosts(0)
  }, [categoryId, subCategoryId, fetchPosts])

  // Infinite scroll avec Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchPosts(nextPage)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loadingMore, loading, page, fetchPosts])

  const handlePostClick = (post: Post) => {
    navigate(`/post/${post.id}`)
  }

  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    navigate(`/profile/public/${userId}`)
  }


  return (
    <div className="swipe-page">
      {/* Header fixe */}
      <div className="swipe-header">
        <BackButton className="swipe-back-button" />
        <button 
          className="swipe-header-search"
          onClick={() => navigate('/search')}
          aria-label="Rechercher"
        >
          <Search size={24} />
        </button>
        <div className="swipe-header-category">
          <div className="swipe-header-category-name">
            {posts[0]?.category?.name || 'Découverte'}
          </div>
          {posts[0]?.sub_category?.name && (
            <div className="swipe-header-subcategory-name">
              {posts[0].sub_category.name}
            </div>
          )}
        </div>
        <button 
          className="swipe-header-notification"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
        >
          <Bell size={24} />
        </button>
      </div>

      {/* Grille masonry Pinterest */}
      <div className="swipe-content">
        {loading && posts.length === 0 ? (
          <div className="swipe-loading">
            <p>Chargement des annonces...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="swipe-empty">
            <p>Aucune annonce disponible</p>
            {user && (
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginTop: '8px' }}>
                {categoryId || subCategoryId 
                  ? 'Aucune annonce dans cette catégorie'
                  : 'Essayez de changer de catégorie ou vérifiez vos filtres'}
              </p>
            )}
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
                  {/* Titre en haut */}
                  <div className="swipe-card-title-top">
                    <span className="swipe-card-title-text">{post.title}</span>
                  </div>
                  
                  <div className="swipe-card-image-wrapper">
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
                    
                    {/* Icône like en bas à gauche */}
                    <div className="swipe-card-like">
                      <Heart size={16} fill="currentColor" />
                    </div>
                    
                    {/* Overlay profil - en bas à droite */}
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
        
        {/* Observer pour infinite scroll */}
        {hasMore && (
          <div ref={observerTarget} className="swipe-observer-target">
            {loadingMore && <div className="swipe-loading-more">Chargement...</div>}
          </div>
        )}
      </div>
    </div>
  )
}

export default SwipePage

