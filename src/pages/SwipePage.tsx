import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import BackButton from '../components/BackButton'
import InlineVideoPreview from '../components/InlineVideoPreview'
import CategoryPlaceholderMedia from '../components/CategoryPlaceholderMedia'
import { EmptyState } from '../components/EmptyState'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import './SwipePage.css'

interface Post {
  id: string
  title: string
  description: string
  price?: number | null
  location?: string | null
  images?: string[] | null
  video?: string | null
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

interface Category {
  id: string
  name: string
  slug: string
}

const SwipePage = () => {
  const { t } = useTranslation(['categories'])
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
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const observerTarget = useRef<HTMLDivElement>(null)

  const POSTS_PER_PAGE = 20

  // Ordre des catégories (même que dans Search.tsx)
  const categoryOrder = useMemo(() => [
    'creation-contenu',
    'casting-role',
    'emploi',
    'studio-lieu',
    'services',
    'evenements',
    'vente'
  ], [])

  // Générer les filtres dynamiquement depuis les catégories
  const filters = useMemo(() => {
    const translateCategory = (category: Category) =>
      t(`categories:titles.${category.slug}`, { defaultValue: category.name })
    return [
      { id: 'all', label: t('categories:submenus.tout') },
      ...categories
        .filter(cat => categoryOrder.includes(cat.slug))
        .sort((a, b) => {
          const indexA = categoryOrder.indexOf(a.slug)
          const indexB = categoryOrder.indexOf(b.slug)
          return indexA - indexB
        })
        .map(cat => ({
          id: cat.slug,
          label: translateCategory(cat)
        }))
    ]
  }, [categories, categoryOrder, t])

  // Récupérer les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug')
          .order('name')

        if (error) {
          console.error('Error fetching categories:', error)
        } else if (data) {
          setCategories(data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  const fetchPosts = useCallback(async (pageNum: number) => {
    if (pageNum === 0) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      // Trouver la catégorie si un filtre est sélectionné
      let activeCategoryId: string | undefined
      if (selectedCategory !== 'all') {
        const category = categories.find(c => c.slug === selectedCategory)
        if (category) {
          activeCategoryId = category.id
        }
      } else if (categoryId) {
        // Si on vient d'un lien avec categoryId, l'utiliser
        activeCategoryId = categoryId
      }

      const fetchedPosts = await fetchPostsWithRelations({
        categoryId: activeCategoryId,
        subCategoryId: subCategoryId || undefined,
        status: 'active',
        limit: POSTS_PER_PAGE,
        offset: pageNum * POSTS_PER_PAGE,
        orderBy: 'created_at',
        orderDirection: 'desc',
        excludeUserId: user?.id
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
        const matchRequestsResult = (await supabase
          .from('match_requests')
          .select('related_post_id')
          .eq('from_user_id', user.id)) as {
          data?: Array<{ related_post_id?: string | null }>
          error?: unknown
        }
        
        if (!matchRequestsResult.error) {
          matchRequestIds =
            matchRequestsResult.data
              ?.map((mr) => mr.related_post_id)
              .filter((id): id is string => Boolean(id)) || []
        }
      } catch (error) {
        // Table n'existe peut-être pas encore, ignorer l'erreur
        console.warn('match_requests table may not exist:', error)
      }

      try {
        const interestsResult = (await supabase
          .from('interests')
          .select('post_id')
          .eq('user_id', user.id)) as {
          data?: Array<{ post_id?: string | null }>
          error?: unknown
        }
        
        if (!interestsResult.error) {
          interestIds = interestsResult.data
            ?.map((item) => item.post_id)
            .filter((id): id is string => Boolean(id)) || []
        }
      } catch (error) {
        // Table n'existe peut-être pas encore, ignorer l'erreur
        console.warn('interests table may not exist:', error)
      }

      try {
        const ignoredResult = (await supabase
          .from('ignored_posts')
          .select('post_id')
          .eq('user_id', user.id)) as {
          data?: Array<{ post_id?: string | null }>
          error?: unknown
        }
        
        if (!ignoredResult.error) {
          ignoredIds = ignoredResult.data
            ?.map((item) => item.post_id)
            .filter((id): id is string => Boolean(id)) || []
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
      let filteredPosts = (fetchedPosts as Post[]).filter(post => 
        !swipedPostIds.has(post.id) && (user ? post.user_id !== user.id : true)
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
  }, [selectedCategory, categories, categoryId, subCategoryId, user])

  useEffect(() => {
    // Reset when category/subcategory changes
    setPosts([])
    setPage(0)
    setHasMore(true)
    fetchPosts(0)
  }, [selectedCategory, categoryId, subCategoryId, fetchPosts])

  // Initialiser selectedCategory depuis categoryId si présent
  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const category = categories.find(c => c.id === categoryId)
      if (category) {
        setSelectedCategory(category.slug)
      }
    }
  }, [categoryId, categories])

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
      <div className="swipe-header-fixed">
        <div className="swipe-header-content">
          <BackButton className="swipe-back-button" />
          <h1 className="swipe-title">Découverte</h1>
          <div className="swipe-header-spacer"></div>
        </div>
        
        {/* Menu de filtres */}
        <div className="swipe-filters">
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`swipe-filter-btn ${selectedCategory === filter.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(filter.id)
                setPosts([])
                setPage(0)
                setHasMore(true)
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Zone scrollable */}
      <div className="swipe-scrollable">
        {loading && posts.length === 0 ? (
          <div className="swipe-loading">
            <p>Chargement des annonces...</p>
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            type="category"
            customTitle="Un projet. Une annonce. Une rencontre."
            customSubtext="Publie en quelques minutes et trouve les bons profils."
            actionLabel="Publier une annonce"
            onAction={() => navigate('/publish')}
            marketing
            marketingTone="purple"
          />
        ) : (
          <div className="swipe-masonry">
            {posts.map((post) => {
              const mainImage = post.images && post.images.length > 0 ? post.images[0] : null
              const mainMedia = mainImage || post.video || null
              const isVideo = !!mainMedia && /\.(mp4|webm|ogg|mov|m4v)$/i.test(mainMedia.split('?')[0].split('#')[0])
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
                  
                  <div className={`swipe-card-image-wrapper ${post.is_urgent ? 'swipe-card-urgent' : ''}`}>
                    {mainMedia ? (
                      isVideo ? (
                        <InlineVideoPreview src={mainMedia} className="swipe-card-image" />
                      ) : (
                        <img 
                          src={mainMedia} 
                          alt={post.title}
                          className="swipe-card-image"
                          loading="lazy"
                        />
                      )
                    ) : (
                      <CategoryPlaceholderMedia
                        className="swipe-card-image-placeholder"
                        categorySlug={post.category?.slug}
                      />
                    )}
                    
                    {/* Catégorie en haut à gauche */}
                    {mainMedia && post.category && (
                      <div className="swipe-card-category">
                        {post.category.name}
                      </div>
                    )}
                    
                    {/* Icône like en haut à droite */}
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
