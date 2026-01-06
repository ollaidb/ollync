import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Search, Loader, Sparkles, ChevronRight } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import PostCard from '../components/PostCard'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import { publicationTypes } from '../constants/publishData'
import { useAuth } from '../hooks/useSupabase'
import { supabase } from '../lib/supabaseClient'
import './Home.css'

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
  is_urgent: boolean
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

const Home = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [swipeModeActive, setSwipeModeActive] = useState(location.pathname === '/swipe')
  
  // Sections d'annonces
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [urgentPosts, setUrgentPosts] = useState<Post[]>([])
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([])
  const [creationContenuPosts, setCreationContenuPosts] = useState<Post[]>([])
  const [castingPosts, setCastingPosts] = useState<Post[]>([])
  const [emploiPosts, setEmploiPosts] = useState<Post[]>([])

  // Scroll infini pour annonces récentes
  const [recentPostsPage, setRecentPostsPage] = useState(1)
  const [recentPostsLoading, setRecentPostsLoading] = useState(false)
  const [hasMoreRecentPosts, setHasMoreRecentPosts] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Nombre d'annonces par section : maximum 6 avec bouton "Afficher plus"
  const maxPostsPerSection = 6

  const fetchRecentPosts = async (page = 1, limit = 20) => {
    const offset = (page - 1) * limit
    const posts = await fetchPostsWithRelations({
      status: 'active',
      limit,
      offset,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })
    
    if (page === 1) {
      setRecentPosts(posts)
    } else {
      setRecentPosts(prev => [...prev, ...posts])
    }
    
    setHasMoreRecentPosts(posts.length === limit)
    return posts
  }

  const loadMoreRecentPosts = useCallback(async () => {
    if (recentPostsLoading || !hasMoreRecentPosts) return
    
    setRecentPostsLoading(true)
    const nextPage = recentPostsPage + 1
    await fetchRecentPosts(nextPage)
    setRecentPostsPage(nextPage)
    setRecentPostsLoading(false)
  }, [recentPostsPage, recentPostsLoading, hasMoreRecentPosts])

  const fetchUrgentPosts = async () => {
    // Récupérer tous les posts actifs
    const allPosts = await fetchPostsWithRelations({
      status: 'active',
      limit: 100,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    // Filtrer les posts urgents (is_urgent: true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const urgent = allPosts.filter((post: any) => post.is_urgent === true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => {
        if (a.needed_date && b.needed_date) {
          return new Date(a.needed_date).getTime() - new Date(b.needed_date).getTime()
        }
        return 0
      })
      .slice(0, maxPostsPerSection)

    setUrgentPosts(urgent)
    return urgent
  }

  const fetchCategoryPosts = async (categorySlug: string) => {
    try {
      // Récupérer l'ID de la catégorie depuis le slug
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()

      if (!category || !(category as { id: string }).id) {
        return []
      }

      const posts = await fetchPostsWithRelations({
        categoryId: (category as { id: string }).id,
        status: 'active',
        limit: maxPostsPerSection,
        orderBy: 'created_at',
        orderDirection: 'desc'
      })

      return posts
    } catch (error) {
      console.error(`Error fetching posts for category ${categorySlug}:`, error)
      return []
    }
  }

  // Fonction pour calculer la distance entre deux localisations (simplifiée)
  const calculateLocationScore = (userLocation: string | null, postLocation: string | null): number => {
    if (!userLocation || !postLocation) return 0
    
    // Si les localisations sont identiques, score maximum
    if (userLocation.toLowerCase().trim() === postLocation.toLowerCase().trim()) {
      return 100
    }
    
    // Vérifier si les villes sont les mêmes (extraction simple)
    const userCity = userLocation.split(',')[0]?.toLowerCase().trim()
    const postCity = postLocation.split(',')[0]?.toLowerCase().trim()
    
    if (userCity && postCity && userCity === postCity) {
      return 80
    }
    
    // Vérifier si le département/région est le même
    const userParts = userLocation.split(',').map(p => p.toLowerCase().trim())
    const postParts = postLocation.split(',').map(p => p.toLowerCase().trim())
    
    // Si au moins une partie correspond, score partiel
    const hasCommonPart = userParts.some(part => postParts.includes(part))
    if (hasCommonPart) {
      return 40
    }
    
    return 0
  }

  const fetchRecommendedPosts = async (excludePostIds: string[] = []) => {
    if (!user) {
      // Si l'utilisateur n'est pas connecté, afficher des posts populaires
      const allPosts = await fetchPostsWithRelations({
        status: 'active',
        limit: 100,
        orderBy: 'created_at',
        orderDirection: 'desc'
      })

      // Trier par engagement (likes + comments + views)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const popular = allPosts
        .filter((post: any) => !excludePostIds.includes(post.id))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((post: any) => ({
          ...post,
          engagementScore: (post.likes_count || 0) + (post.comments_count || 0) * 2 + (post.views_count || 0) * 0.1
        }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => b.engagementScore - a.engagementScore)
        .slice(0, maxPostsPerSection)

      setRecommendedPosts(popular)
      return
    }

    try {
      // 1. Récupérer le profil utilisateur pour la localisation
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('location')
        .eq('id', user.id)
        .single()

      const userLocation = (userProfile as { location?: string | null } | null)?.location || null

      // 2. Récupérer les données comportementales de l'utilisateur
      const [favoritesResult, likesResult, interestsResult, searchesResult] = await Promise.all([
        supabase.from('favorites').select('post_id').eq('user_id', user.id),
        supabase.from('likes').select('post_id').eq('user_id', user.id),
        supabase.from('interests').select('post_id').eq('user_id', user.id),
        supabase.from('saved_searches').select('search_query, filters').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(10)
      ])

      const favoritePostIds = favoritesResult.data?.map((f: any) => f.post_id) || []
      const likePostIds = likesResult.data?.map((l: any) => l.post_id) || []
      const interestPostIds = interestsResult.data?.map((i: any) => i.post_id) || []
      
      // 3. Vérifier si l'utilisateur a assez de données comportementales
      // Si moins de 3 interactions (likes + favoris + intérêts + recherches), utiliser des recommandations aléatoires
      const totalInteractions = favoritePostIds.length + likePostIds.length + interestPostIds.length + (searchesResult.data?.length || 0)
      const hasEnoughData = totalInteractions >= 3

      if (!hasEnoughData) {
        // Recommandations aléatoires pour nouveaux utilisateurs ou utilisateurs avec peu de données
        const allPosts = await fetchPostsWithRelations({
          status: 'active',
          limit: 200,
          orderBy: 'created_at',
          orderDirection: 'desc'
        })

        // Filtrer et mélanger aléatoirement
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const availablePosts = allPosts.filter((post: any) => 
          !excludePostIds.includes(post.id) && 
          post.user_id !== user.id
        )

        // Mélanger aléatoirement (algorithme Fisher-Yates)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shuffled = [...availablePosts].sort(() => Math.random() - 0.5)
        
        // Prendre les premiers posts mélangés
        const randomPosts = shuffled.slice(0, maxPostsPerSection)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((post: any) => ({
            ...post,
            recommendationScore: Math.random() * 50 + 50 // Score aléatoire entre 50-100 pour l'affichage
          }))

        setRecommendedPosts(randomPosts)
        return
      }
      
      // Extraire les catégories des recherches sauvegardées
      const searchCategories = new Set<string>()
      searchesResult.data?.forEach((search: any) => {
        if (search.filters?.category_id) {
          searchCategories.add(search.filters.category_id)
        }
        // Analyser aussi la requête de recherche pour détecter des mots-clés de catégories
        if (search.search_query) {
          const query = search.search_query.toLowerCase()
          // Correspondance simple avec les slugs de catégories
          publicationTypes.forEach(cat => {
            if (query.includes(cat.slug) || query.includes(cat.name.toLowerCase())) {
              // Trouver l'ID de la catégorie depuis la base
              // Pour l'instant, on stocke le slug et on le matchera plus tard
            }
          })
        }
      })

      // 3. Récupérer les posts associés pour analyser les catégories préférées
      const allInteractedPostIds = [...new Set([...favoritePostIds, ...likePostIds, ...interestPostIds])]
      const categoryCounts = new Map<string, number>()
      
      if (allInteractedPostIds.length > 0) {
        const { data: interactedPosts } = await supabase
          .from('posts')
          .select('id, category_id')
          .in('id', allInteractedPostIds)

        if (interactedPosts) {
          const favoritePostIdsSet = new Set(favoritePostIds)
          const interestPostIdsSet = new Set(interestPostIds)
          
          interactedPosts.forEach((post: any) => {
            const categoryId = post.category_id
            if (categoryId) {
              let weight = 1
              if (favoritePostIdsSet.has(post.id)) weight = 3 // Favoris = poids 3
              else if (interestPostIdsSet.has(post.id)) weight = 2 // Intérêts = poids 2
              // Likes = poids 1 (défaut)
              
              categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + weight)
            }
          })
        }
      }

      // Ajouter les catégories des recherches
      searchCategories.forEach(catId => {
        categoryCounts.set(catId, (categoryCounts.get(catId) || 0) + 1.5)
      })

      // 4. Récupérer tous les posts actifs
      const allPosts = await fetchPostsWithRelations({
        status: 'active',
        limit: 200,
        orderBy: 'created_at',
        orderDirection: 'desc'
      })

      // 5. Exclure les posts déjà affichés et ceux déjà swipés
      const excludedIds = new Set(excludePostIds)
      const swipedIds = new Set([...interestPostIds, ...likePostIds, ...favoritePostIds])

      // 6. Calculer le score de recommandation selon l'algorithme
      // Pondérations : Localisation 30%, Catégories 25%, Intérêts 20%, Engagement 15%, Récence 10%
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const postsWithScores = allPosts
        .filter((post: any) => 
          !excludedIds.has(post.id) && 
          post.user_id !== user.id &&
          !swipedIds.has(post.id)
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((post: any) => {
          // Score de localisation (0-100, pondération 30%)
          const locationScore = calculateLocationScore(userLocation, post.location || null)
          const normalizedLocationScore = (locationScore / 100) * 30

          // Score de catégorie (0-100, pondération 25%)
          const categoryPreference = categoryCounts.get(post.category_id) || 0
          const maxCategoryCount = Math.max(...Array.from(categoryCounts.values()), 1)
          const normalizedCategoryScore = (categoryPreference / maxCategoryCount) * 100
          const weightedCategoryScore = (normalizedCategoryScore / 100) * 25

          // Score d'intérêt (basé sur les intérêts exprimés - déjà pris en compte dans catégories)
          // Mais on peut ajouter un bonus si le post correspond à un intérêt direct
          const interestScore = interestPostIds.includes(post.id) ? 20 : 0

          // Score d'engagement (0-100, pondération 15%)
          const maxEngagement = 100 // Normalisation approximative
          const engagementValue = Math.min(
            (post.likes_count || 0) * 2 + 
            (post.comments_count || 0) * 3 + 
            (post.views_count || 0) * 0.1,
            maxEngagement
          )
          const normalizedEngagementScore = (engagementValue / maxEngagement) * 100
          const weightedEngagementScore = (normalizedEngagementScore / 100) * 15

          // Score de récence (0-100, pondération 10%)
          const daysSinceCreation = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24)
          const recencyScore = daysSinceCreation < 7 
            ? 100 - (daysSinceCreation / 7) * 50 // 100% si < 1 jour, décroît jusqu'à 50% à 7 jours
            : Math.max(0, 50 - ((daysSinceCreation - 7) / 30) * 50) // Décroît jusqu'à 0% après 30 jours
          const weightedRecencyScore = (recencyScore / 100) * 10

          // Score total (0-100)
          const totalScore = normalizedLocationScore + weightedCategoryScore + interestScore + weightedEngagementScore + weightedRecencyScore

          return { 
            ...post, 
            recommendationScore: totalScore,
            locationScore: normalizedLocationScore,
            categoryScore: weightedCategoryScore,
            engagementScore: weightedEngagementScore,
            recencyScore: weightedRecencyScore
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => b.recommendationScore - a.recommendationScore)
        .slice(0, maxPostsPerSection)

      setRecommendedPosts(postsWithScores)
    } catch (error) {
      console.error('Error fetching recommended posts:', error)
      // En cas d'erreur, afficher des posts populaires
      const allPosts = await fetchPostsWithRelations({
        status: 'active',
        limit: 100,
        orderBy: 'created_at',
        orderDirection: 'desc'
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const popular = allPosts
        .filter((post: any) => !excludePostIds.includes(post.id))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((post: any) => ({
          ...post,
          engagementScore: (post.likes_count || 0) + (post.comments_count || 0) * 2 + (post.views_count || 0) * 0.1
        }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => b.engagementScore - a.engagementScore)
        .slice(0, maxPostsPerSection)

      setRecommendedPosts(popular)
    }
  }

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      const [recent, urgent] = await Promise.all([
        fetchRecentPosts(1),
        fetchUrgentPosts()
      ])
      
      // Charger les posts par catégorie
      const [creationContenu, casting, emploi] = await Promise.all([
        fetchCategoryPosts('creation-contenu'),
        fetchCategoryPosts('casting-role'),
        fetchCategoryPosts('montage') // Emploi utilise le slug 'montage'
      ])
      
      setCreationContenuPosts(creationContenu)
      setCastingPosts(casting)
      setEmploiPosts(emploi)
      
      // Une fois les posts récents et urgents chargés, charger les recommandations
      // en excluant les IDs déjà affichés
      const recentIds = recent.map(p => p.id)
      const urgentIds = urgent.map(p => p.id)
      const categoryIds = [...creationContenu, ...casting, ...emploi].map(p => p.id)
      const excludeIds = [...recentIds, ...urgentIds, ...categoryIds]
      
      await fetchRecommendedPosts(excludeIds)
      setLoading(false)
    }
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Observer pour le scroll infini des annonces récentes
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    if (!hasMoreRecentPosts || recentPostsLoading) {
      return
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRecentPosts && !recentPostsLoading) {
          loadMoreRecentPosts()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMoreRecentPosts, recentPostsLoading, loadMoreRecentPosts])


  if (loading) {
    return (
      <div className="app">
        <div className="home-page">
          {/* BLOC BLEU CLAIR FIXE - Header, Recherche, Catégories */}
          <div className="home-header-blue-block">
            {/* Section 1: Logo + Icônes swipe et notification */}
            <div className="home-header-top">
              <BackButton hideOnHome={true} className="home-back-button" />
              <h1 
                className="home-app-name"
                onClick={() => navigate('/home')}
              >
                ollync
              </h1>
              <div className="home-header-actions">
                <button
                  className={`home-swipe-btn ${swipeModeActive ? 'active' : ''}`}
                  onClick={() => {
                    setSwipeModeActive(!swipeModeActive)
                    navigate('/swipe')
                  }}
                  aria-label="Mode Swipe"
                >
                  <Sparkles size={20} />
                </button>
                <button
                  className="home-notification-btn"
                  onClick={() => navigate('/notifications')}
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  <span className="home-notification-badge"></span>
                </button>
              </div>
            </div>

            {/* Section 2: Barre de recherche */}
            <div className="home-search-container">
              <div 
                className="home-search-bar"
                onClick={() => navigate('/search')}
              >
                <span className="home-search-placeholder">Rechercher une annonce...</span>
                <Search size={20} />
              </div>
            </div>

            {/* Section 3: Catégories scrollables - Premier niveau */}
            <div className="home-categories-scroll">
              {publicationTypes.map((category) => {
                const Icon = category.icon
                return (
                  <div
                    key={category.id}
                    className="home-category-card"
                    onClick={() => navigate(`/${category.slug}`)}
                  >
                    <div className="home-category-icon">
                      <Icon size={24} />
                    </div>
                    <span className="home-category-name">{category.name}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="home-scrollable">
            <div className="loading-container">
              <Loader className="spinner-large" size={48} />
              <p>Chargement...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="home-page">
        {/* BLOC BLEU CLAIR FIXE - Header, Recherche, Catégories */}
        <div className="home-header-blue-block">
          {/* Section 1: Logo + Icônes swipe et notification */}
          <div className="home-header-top">
            <BackButton hideOnHome={true} className="home-back-button" />
            <h1 
              className="home-app-name"
              onClick={() => navigate('/home')}
            >
              ollync
            </h1>
            <div className="home-header-actions">
              <button
                className={`home-swipe-btn ${swipeModeActive ? 'active' : ''}`}
                onClick={() => {
                  setSwipeModeActive(!swipeModeActive)
                  navigate('/swipe')
                }}
                aria-label="Mode Swipe"
              >
                <Sparkles size={20} />
              </button>
              <button
                className="home-notification-btn"
                onClick={() => navigate('/notifications')}
                aria-label="Notifications"
              >
                <Bell size={20} />
                <span className="home-notification-badge"></span>
              </button>
            </div>
          </div>

          {/* Section 2: Barre de recherche */}
          <div className="home-search-container">
            <div 
              className="home-search-bar"
              onClick={() => navigate('/search')}
            >
              <span className="home-search-placeholder">Rechercher une annonce...</span>
              <Search size={20} />
            </div>
          </div>

          {/* Section 3: Catégories scrollables - Premier niveau */}
          <div className="home-categories-scroll">
            {publicationTypes.map((category) => {
              const Icon = category.icon
              return (
                <div
                  key={category.id}
                  className="home-category-card"
                  onClick={() => navigate(`/${category.slug}`)}
                >
                  <div className="home-category-icon">
                    <Icon size={24} />
                  </div>
                  <span className="home-category-name">{category.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* CONTENU SCROLLABLE */}
        <div className="home-scrollable">
          {/* Section Hero */}
          <div className="home-hero-section">
            <div className="home-hero-block">
              <span className="home-hero-text">hero</span>
            </div>
          </div>

          {/* Section Annonces urgentes - EN PREMIER */}
          {urgentPosts.length > 0 && (
            <div className="home-posts-section">
              <h2 className="home-section-title">urgent</h2>
              <div className="home-posts-grid">
                {urgentPosts.slice(0, maxPostsPerSection).map((post) => (
                  <PostCard key={post.id} post={post} viewMode="grid" />
                ))}
                {urgentPosts.length >= maxPostsPerSection && (
                  <button
                    className="home-show-more-btn"
                    onClick={() => navigate('/search?urgent=true')}
                  >
                    <span>Afficher plus d'annonces</span>
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section Recommandations - JUSTE APRÈS URGENT - Seulement si connecté */}
          {user && (
            <div className="home-posts-section">
              <h2 className="home-section-title">recommandations</h2>
              <div className="home-posts-grid">
                {recommendedPosts.length > 0 ? (
                  <>
                    {recommendedPosts.slice(0, maxPostsPerSection).map((post) => (
                      <PostCard key={post.id} post={post} viewMode="grid" />
                    ))}
                    {recommendedPosts.length >= maxPostsPerSection && (
                      <button
                        className="home-show-more-btn"
                        onClick={() => navigate('/search?recommended=true')}
                      >
                        <span>Afficher plus d'annonces</span>
                        <ChevronRight size={20} />
                      </button>
                    )}
                  </>
                ) : (
                  !loading && (
                    <div className="home-empty-section">
                      <p>Aucune recommandation pour le moment</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Section Création de contenu */}
          {creationContenuPosts.length > 0 && (
            <div className="home-posts-section">
              <h2 className="home-section-title">création de contenu</h2>
              <div className="home-posts-grid">
                {creationContenuPosts.slice(0, maxPostsPerSection).map((post) => (
                  <PostCard key={post.id} post={post} viewMode="grid" />
                ))}
                {creationContenuPosts.length >= maxPostsPerSection && (
                  <button
                    className="home-show-more-btn"
                    onClick={() => navigate('/creation-contenu')}
                  >
                    <span>Afficher plus d'annonces</span>
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section Casting */}
          {castingPosts.length > 0 && (
            <div className="home-posts-section">
              <h2 className="home-section-title">casting</h2>
              <div className="home-posts-grid">
                {castingPosts.slice(0, maxPostsPerSection).map((post) => (
                  <PostCard key={post.id} post={post} viewMode="grid" />
                ))}
                {castingPosts.length >= maxPostsPerSection && (
                  <button
                    className="home-show-more-btn"
                    onClick={() => navigate('/casting-role')}
                  >
                    <span>Afficher plus d'annonces</span>
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section Emploi */}
          {emploiPosts.length > 0 && (
            <div className="home-posts-section">
              <h2 className="home-section-title">emploi</h2>
              <div className="home-posts-grid">
                {emploiPosts.slice(0, maxPostsPerSection).map((post) => (
                  <PostCard key={post.id} post={post} viewMode="grid" />
                ))}
                {emploiPosts.length >= maxPostsPerSection && (
                  <button
                    className="home-show-more-btn"
                    onClick={() => navigate('/montage')}
                  >
                    <span>Afficher plus d'annonces</span>
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section Annonces récentes - EN DERNIER avec scroll infini */}
          <div className="home-posts-section">
            <h2 className="home-section-title">annonce recente</h2>
            <div className="home-posts-grid">
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} viewMode="grid" />
              ))}
              {recentPostsLoading && (
                <div className="home-loading-more">
                  <Loader size={24} />
                </div>
              )}
            </div>
            {/* Point d'observation pour le scroll infini */}
            <div ref={loadMoreRef} className="home-infinite-scroll-trigger" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Home
