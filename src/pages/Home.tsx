import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Search, Sparkles, Plus, ArrowRight } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import PostCard from '../components/PostCard'
import { PostCardSkeleton } from '../components/PostCardSkeleton'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import { publicationTypes } from '../constants/publishData'
import { useAuth } from '../hooks/useSupabase'
import { useConsent } from '../hooks/useConsent'
import { useIsMobile } from '../hooks/useIsMobile'
import { supabase } from '../lib/supabaseClient'
import { PageMeta } from '../components/PageMeta'
import { PullToRefresh } from '../components/PullToRefresh/PullToRefresh'
import { SCROLL_HOME_TOP_EVENT } from '../utils/scrollToHomeTop'
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
  const behavioralConsent = useConsent('behavioral_data')
  const { t } = useTranslation(['categories', 'home', 'common'])
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(true)
  const labels = {
    loading: t('home:loading'),
    urgent: t('home:urgent'),
    recommendations: t('home:recommendations'),
    recent: t('home:recent')
  }
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [appNameClicked, setAppNameClicked] = useState(false)
  const [heroIndex, setHeroIndex] = useState(0)
  const heroSwipeStart = useRef<number | null>(null)

  // Sections d'annonces
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [urgentPosts, setUrgentPosts] = useState<Post[]>([])
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([])
  const [recommendedLoading, setRecommendedLoading] = useState(false)
  const [creationContenuPosts, setCreationContenuPosts] = useState<Post[]>([])
  const [castingPosts, setCastingPosts] = useState<Post[]>([])
  const [emploiPosts, setEmploiPosts] = useState<Post[]>([])
  const [studioLieuPosts, setStudioLieuPosts] = useState<Post[]>([])
  const unavailableBehaviorTablesRef = useRef<Set<string>>(new Set())
  const heroPanels = [
    {
      id: 'hero-1',
      title: 'Un projet. Une annonce. Une rencontre.',
      description: 'Publie en quelques minutes et trouve les bons profils.',
      button: 'Publier une annonce',
      route: '/publish',
      styleClass: 'home-hero-card--one'
    },
    {
      id: 'hero-2',
      title: 'Seul on crée, ensemble on construit.',
      description: 'Photo, vidéo, casting, lieux, services : collabore plus vite.',
      button: 'Découvrir les annonces',
      route: '/search',
      styleClass: 'home-hero-card--two'
    },
    {
      id: 'hero-3',
      title: 'Ta vision mérite une équipe.',
      description: 'Cherche, trouve, crée avec des personnes motivées.',
      button: 'Trouver des collaborateurs',
      route: '/users',
      styleClass: 'home-hero-card--three'
    }
  ]
  // Nombre d'annonces par section : mobile 5, web 4
  const maxPostsPerSection = isMobile ? 5 : 4

  // Défilement automatique des 3 slides du hero (12 s par slide)
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((i) => (i + 1) % 3)
    }, 12000)
    return () => clearInterval(interval)
  }, [])

  const isOnHomePage = location.pathname === '/home' || location.pathname === '/'

  const scrollHomeToTop = useCallback(() => {
    const scrollEl = document.querySelector('.home-scrollable') as HTMLElement | null
    if (scrollEl) {
      scrollEl.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    const handler = () => scrollHomeToTop()
    window.addEventListener(SCROLL_HOME_TOP_EVENT, handler)
    return () => window.removeEventListener(SCROLL_HOME_TOP_EVENT, handler)
  }, [scrollHomeToTop])

  const handleHomeLogoClick = useCallback(() => {
    setAppNameClicked(true)
    setTimeout(() => setAppNameClicked(false), 300)
    scrollHomeToTop()
  }, [scrollHomeToTop])

  const HERO_SWIPE_THRESHOLD = 50
  const handleHeroSwipeStart = (clientX: number) => {
    heroSwipeStart.current = clientX
  }
  const handleHeroSwipeEnd = (clientX: number) => {
    if (heroSwipeStart.current === null) return
    const delta = clientX - heroSwipeStart.current
    heroSwipeStart.current = null
    if (Math.abs(delta) < HERO_SWIPE_THRESHOLD) return
    if (delta < 0) setHeroIndex((i) => (i + 1) % 3)
    else setHeroIndex((i) => (i - 1 + 3) % 3)
  }

  const renderHeroPanels = () => (
    <div className="home-hero-section">
      <div
        className="home-hero-single"
        role="region"
        aria-label="Carousel hero"
        onTouchStart={(e) => handleHeroSwipeStart(e.touches[0].clientX)}
        onTouchEnd={(e) => e.changedTouches[0] && handleHeroSwipeEnd(e.changedTouches[0].clientX)}
        onMouseDown={(e) => handleHeroSwipeStart(e.clientX)}
        onMouseUp={(e) => handleHeroSwipeEnd(e.clientX)}
        onMouseLeave={() => { heroSwipeStart.current = null }}
      >
        <div className="home-hero-viewport">
          <div
            className="home-hero-track"
            style={{ transform: `translate3d(-${heroIndex * (100 / 3)}%, 0, 0)` }}
          >
            {heroPanels.map((panel, index) => (
              <article
                key={panel.id}
                role="button"
                tabIndex={index === heroIndex ? 0 : -1}
                aria-label={`${panel.title}, cliquer pour slide suivant`}
                className={`home-hero-card ${panel.styleClass}`}
                onClick={() => setHeroIndex((i) => (i + 1) % 3)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHeroIndex((i) => (i + 1) % 3); } }}
              >
                <div className="home-hero-content">
                  <div className="home-hero-text">
                    <span className="home-hero-title">{panel.title}</span>
                    <span className="home-hero-subtitle">{panel.description}</span>
                  </div>
                  <button
                    className="home-hero-cta"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate(panel.route); }}
                  >
                    {panel.button}
                    <ArrowRight size={14} />
                  </button>
                </div>
                <div className="home-hero-animation home-hero-animation-3d" aria-hidden>
                  {index === 0 && (
                    <div className="hero-illus hero-illus-camera">
                      <div className="hero-camera-flash-burst" aria-hidden />
                      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-svg-camera" aria-hidden>
                        <defs>
                          <linearGradient id="hero-skin" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fff5f0" />
                            <stop offset="100%" stopColor="#e8d4cc" />
                          </linearGradient>
                          <linearGradient id="hero-camera-body" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2d3748" />
                            <stop offset="50%" stopColor="#1a202c" />
                            <stop offset="100%" stopColor="#0d1117" />
                          </linearGradient>
                          <linearGradient id="hero-camera-lens" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4a5568" />
                            <stop offset="100%" stopColor="#1a202c" />
                          </linearGradient>
                        </defs>
                        {/* Personne couchée — silhouette très discrète */}
                        <ellipse cx="35" cy="78" rx="38" ry="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        {/* Main gauche sous l’appareil */}
                        <path d="M48 62 L56 58 L62 64 L58 72 L50 70 Z" fill="url(#hero-skin)" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinejoin="round" />
                        {/* Main droite sur le côté de l’appareil */}
                        <path d="M78 54 L88 50 L92 58 L86 66 L76 64 Z" fill="url(#hero-skin)" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinejoin="round" />
                        {/* Appareil photo — élément central, bien lisible */}
                        <rect x="54" y="44" width="38" height="28" rx="5" fill="url(#hero-camera-body)" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                        <rect x="62" y="52" width="22" height="14" rx="2" fill="url(#hero-camera-lens)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                        <circle cx="73" cy="59" r="5" fill="rgba(255,255,255,0.85)" />
                        <rect x="86" y="46" width="10" height="10" rx="2" fill="#4a5568" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                        {/* Flash — gros, bien visible */}
                        <circle cx="91" cy="46" r="10" fill="#ffffff" className="hero-camera-flash" />
                        <circle cx="91" cy="46" r="15" fill="rgba(255,255,255,0.45)" className="hero-camera-flash hero-camera-flash-glow" />
                      </svg>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      <div className="home-hero-dots" role="tablist" aria-label="Slides du hero">
        {heroPanels.map((_, index) => (
          <button
            key={heroPanels[index].id}
            type="button"
            role="tab"
            aria-selected={index === heroIndex}
            aria-label={`Slide ${index + 1}`}
            className={`home-hero-dot ${index === heroIndex ? 'active' : ''}`}
            onClick={() => setHeroIndex(index)}
          />
        ))}
      </div>
    </div>
  )

  const fetchRecentPosts = async () => {
    const posts = await fetchPostsWithRelations({
      status: 'active',
      limit: maxPostsPerSection * 2, // Charger un peu plus pour avoir assez
      orderBy: 'created_at',
      orderDirection: 'desc',
      useCache: true,
      excludeUserId: user?.id
    })

    const filtered = user ? posts.filter((post) => post.user_id !== user.id) : posts
    setRecentPosts(filtered)
    return filtered
  }

  const fetchUrgentPosts = async () => {
    // Optimiser: récupérer directement les posts urgents depuis la base de données
    // au lieu de charger 100 posts et filtrer côté client
    try {
      // Récupérer l'ID de la catégorie "urgent" si elle existe, sinon filtrer par is_urgent
      const urgentPosts = await fetchPostsWithRelations({
        status: 'active',
        limit: maxPostsPerSection * 2, // Charger un peu plus pour avoir assez après tri
        orderBy: 'created_at',
        orderDirection: 'desc',
        excludeUserId: user?.id
      })

      // Filtrer les posts urgents (is_urgent: true)
      const urgent = urgentPosts
        .filter((post) => post.is_urgent === true)
        .filter((post) => (user ? post.user_id !== user.id : true))
        .sort((a, b) => {
          if (a.needed_date && b.needed_date) {
            return new Date(a.needed_date).getTime() - new Date(b.needed_date).getTime()
          }
          return 0
        })
        .slice(0, maxPostsPerSection)

      setUrgentPosts(urgent)
      return urgent
    } catch (error) {
      console.error('Error fetching urgent posts:', error)
      setUrgentPosts([])
      return []
    }
  }

  const fetchCategoryPosts = async (categorySlug: string) => {
    try {
      // Récupérer l'ID de la catégorie depuis le slug
      const { data: categories, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .limit(1)
      if (categoryError) {
        throw categoryError
      }
      const category = categories?.[0] as { id?: string } | undefined

      if (!category?.id) {
        return []
      }

      const posts = await fetchPostsWithRelations({
        categoryId: category.id,
        status: 'active',
        limit: maxPostsPerSection,
        orderBy: 'created_at',
        orderDirection: 'desc',
        useCache: true,
        excludeUserId: user?.id
      })

      const filtered = user ? posts.filter((post) => post.user_id !== user.id) : posts
      return filtered
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
      const popular = allPosts
        .filter((post) => !excludePostIds.includes(post.id))
        .map((post) => ({
          ...post,
          engagementScore: (post.likes_count || 0) + (post.comments_count || 0) * 2 + ((post as Post & { views_count?: number }).views_count || 0) * 0.1
        }))
        .sort((a, b) => (b as Post & { engagementScore: number }).engagementScore - (a as Post & { engagementScore: number }).engagementScore)
        .slice(0, maxPostsPerSection)

      setRecommendedPosts(popular)
      return
    }

    if (behavioralConsent.hasConsented === false) {
      const allPosts = await fetchPostsWithRelations({
        status: 'active',
        limit: 100,
        orderBy: 'created_at',
        orderDirection: 'desc'
      })

      const popular = allPosts
        .filter((post) => !excludePostIds.includes(post.id))
        .map((post) => ({
          ...post,
          engagementScore: (post.likes_count || 0) + (post.comments_count || 0) * 2 + ((post as Post & { views_count?: number }).views_count || 0) * 0.1
        }))
        .sort((a, b) => (b as Post & { engagementScore: number }).engagementScore - (a as Post & { engagementScore: number }).engagementScore)
        .slice(0, maxPostsPerSection)

      setRecommendedPosts(popular)
      return
    }

    if (behavioralConsent.hasConsented === null) {
      const asked = behavioralConsent.requireConsent(() => {
        void fetchRecommendedPosts(excludePostIds)
      })
      if (asked) {
        return
      }
    }

    try {
      const isMissingTableError = (error: unknown) => {
        const err = error as { code?: string; message?: string } | null
        if (!err) return false
        return (
          err.code === '42P01' ||
          err.code === 'PGRST205' ||
          (err.message || '').toLowerCase().includes('not found') ||
          (err.message || '').toLowerCase().includes('does not exist')
        )
      }

      const safeFetchPostIds = async (tableName: 'favorites' | 'likes' | 'interests') => {
        if (unavailableBehaviorTablesRef.current.has(tableName)) {
          return [] as string[]
        }
        const result = await supabase.from(tableName).select('post_id').eq('user_id', user.id).limit(50)
        if (result.error) {
          if (isMissingTableError(result.error)) {
            unavailableBehaviorTablesRef.current.add(tableName)
            return [] as string[]
          }
          throw result.error
        }
        return ((result.data || []) as Array<{ post_id: string }>).map((row) => row.post_id)
      }

      // 1. Récupérer le profil utilisateur pour la localisation
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('location')
        .eq('id', user.id)
        .single()

      const userLocation = (userProfile as { location?: string | null } | null)?.location || null

      // 2. Récupérer les données comportementales de l'utilisateur en parallèle
      // Limiter les requêtes pour améliorer les performances
      // Gérer l'erreur saved_searches gracieusement (peut ne pas exister)
      const [favoritePostIds, likePostIds, interestPostIds] = await Promise.all([
        safeFetchPostIds('favorites'),
        safeFetchPostIds('likes'),
        safeFetchPostIds('interests')
      ])

      // Récupérer saved_searches séparément pour gérer l'erreur 404 silencieusement
      // (la table peut ne pas exister dans certaines bases de données)
      let searchesData: Array<{ search_query?: string; filters?: { category_id?: string } }> = []
      try {
        const searchesResult = await supabase
          .from('saved_searches')
          .select('search_query, filters')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(10)
        
        if (!searchesResult.error) {
          searchesData = searchesResult.data || []
        }
      } catch (error) {
        // Table saved_searches n'existe pas - ignorer silencieusement
        searchesData = []
      }

      // Gérer les erreurs gracieusement
      // 3. Vérifier si l'utilisateur a assez de données comportementales
      // Si moins de 3 interactions (likes + favoris + intérêts + recherches), utiliser des recommandations aléatoires
      const totalInteractions = favoritePostIds.length + likePostIds.length + interestPostIds.length + (searchesData?.length || 0)
      const hasEnoughData = totalInteractions >= 3

      if (!hasEnoughData) {
        // Recommandations aléatoires pour nouveaux utilisateurs ou utilisateurs avec peu de données
        const allPosts = await fetchPostsWithRelations({
          status: 'active',
          limit: 100, // Réduire de 200 à 100 pour améliorer les performances
          orderBy: 'created_at',
          orderDirection: 'desc',
          excludeUserId: user?.id
        })

        // Filtrer et mélanger aléatoirement
        const availablePosts = allPosts.filter((post) => 
          !excludePostIds.includes(post.id) && 
          post.user_id !== user.id
        )

        // Mélanger aléatoirement (algorithme Fisher-Yates)
        const shuffled = [...availablePosts].sort(() => Math.random() - 0.5)
        
        // Prendre les premiers posts mélangés
        const randomPosts = shuffled.slice(0, maxPostsPerSection)
          .map((post) => ({
            ...post,
            recommendationScore: Math.random() * 50 + 50 // Score aléatoire entre 50-100 pour l'affichage
          }))

        setRecommendedPosts(randomPosts)
        return
      }
      
      // Extraire les catégories des recherches sauvegardées
      const searchCategories = new Set<string>()
      searchesData?.forEach((search: { filters?: { category_id?: string }; search_query?: string }) => {
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
          .eq('status', 'active')

        if (interactedPosts) {
          const favoritePostIdsSet = new Set(favoritePostIds)
          const interestPostIdsSet = new Set(interestPostIds)
          
          interactedPosts.forEach((post: Post & { category_id?: string }) => {
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

      // 4. Récupérer les posts actifs (limite réduite pour améliorer les performances)
      const allPosts = await fetchPostsWithRelations({
        status: 'active',
        limit: 100, // Réduire de 200 à 100 pour améliorer les performances
        orderBy: 'created_at',
        orderDirection: 'desc',
        excludeUserId: user?.id
      })

      // 5. Exclure les posts déjà affichés et ceux déjà swipés
      const excludedIds = new Set(excludePostIds)
      const swipedIds = new Set([...interestPostIds, ...likePostIds, ...favoritePostIds])

      // 6. Calculer le score de recommandation selon l'algorithme
      // Pondérations : Localisation 30%, Catégories 25%, Intérêts 20%, Engagement 15%, Récence 10%
      const postsWithScores = allPosts
        .filter((post) => 
          !excludedIds.has(post.id) && 
          post.user_id !== user.id &&
          !swipedIds.has(post.id)
        )
        .map((post) => {
          // Score de localisation (0-100, pondération 30%)
          const locationScore = calculateLocationScore(userLocation, post.location || null)
          const normalizedLocationScore = (locationScore / 100) * 30

          // Score de catégorie (0-100, pondération 25%)
          const categoryPreference = categoryCounts.get(post.category_id ?? '') || 0
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
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, maxPostsPerSection)

      setRecommendedPosts(postsWithScores)
    } catch (error) {
      console.error('Error fetching recommended posts:', error)
      // En cas d'erreur, afficher des posts populaires
      const allPosts = await fetchPostsWithRelations({
        status: 'active',
        limit: 100,
        orderBy: 'created_at',
        orderDirection: 'desc',
        excludeUserId: user?.id
      })

      const popular = allPosts
        .filter((post) => !excludePostIds.includes(post.id))
        .map((post) => ({
          ...post,
          engagementScore: (post.likes_count || 0) + (post.comments_count || 0) * 2 + ((post as Post & { views_count?: number }).views_count || 0) * 0.1
        }))
        .sort((a, b) => (b as Post & { engagementScore: number }).engagementScore - (a as Post & { engagementScore: number }).engagementScore)
        .slice(0, maxPostsPerSection)

      setRecommendedPosts(popular)
    }
  }

  // Gérer la session OAuth après callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Vérifier si on vient d'un callback OAuth
        const hashParams = window.location.hash
        const searchParams = new URLSearchParams(window.location.search)
        
        if (hashParams.includes('access_token') || searchParams.has('code')) {
          console.log('🔐 Détection callback OAuth, récupération de la session...')
          
          // Attendre un peu pour que Supabase traite le callback
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Récupérer la session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('❌ Erreur lors de la récupération de la session:', sessionError)
          } else if (session) {
            console.log('✅ Session OAuth récupérée avec succès:', session.user.email)
            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname)
          } else {
            console.warn('⚠️ Aucune session trouvée après callback OAuth')
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du traitement du callback OAuth:', error)
      }
    }
    
    handleOAuthCallback()
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [recent, urgent] = await Promise.all([
        fetchRecentPosts(),
        fetchUrgentPosts()
      ])
      const [creationContenu, casting, emploi, studioLieu] = await Promise.all([
        fetchCategoryPosts('creation-contenu'),
        fetchCategoryPosts('casting-role'),
        fetchCategoryPosts('emploi'),
        fetchCategoryPosts('studio-lieu')
      ])
      setCreationContenuPosts(creationContenu)
      setCastingPosts(casting)
      setEmploiPosts(emploi)
      setStudioLieuPosts(studioLieu)
      const recentIds = recent.map(p => p.id)
      const urgentIds = urgent.map(p => p.id)
      const categoryIds = [...creationContenu, ...casting, ...emploi, ...studioLieu].map(p => p.id)
      const excludeIds = [...recentIds, ...urgentIds, ...categoryIds]
      if (user) {
        setRecommendedLoading(true)
        fetchRecommendedPosts(excludeIds)
          .catch(err => console.error('Error fetching recommended posts:', err))
          .finally(() => setRecommendedLoading(false))
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (!user) {
      setUnreadNotificationsCount(0)
      return
    }

    let isMounted = true

    const loadUnreadNotificationsCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        console.error('Error loading unread notifications count:', error)
        return
      }

      if (isMounted) {
        setUnreadNotificationsCount(count || 0)
      }
    }

    const channel = supabase
      .channel(`home-unread-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadUnreadNotificationsCount()
        }
      )
      .subscribe()

    loadUnreadNotificationsCount()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [user])

  const formattedUnreadNotificationsCount =
    unreadNotificationsCount > 99 ? '+99' : String(unreadNotificationsCount)



  if (loading) {
    return (
      <div className="app">
        <div className="home-page">
          {/* HEADER FIXE - Logo, Boutons, Barre de recherche */}
          <div className="home-header-fixed">
            {/* Nom app + Barre de recherche + Notifications (une seule ligne) */}
            <div className="home-header-top">
              <BackButton hideOnHome={true} className="home-back-button" />
              <h1 
                className="home-app-name"
                onClick={() => navigate('/home')}
              >
                ollync
              </h1>
              <div 
                className="home-search-container"
                role="button"
                tabIndex={0}
                onClick={() => navigate('/search')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/search'); } }}
                aria-label={t('home:searchPlaceholder')}
              >
                <span className="home-search-placeholder">{isMobile ? t('home:searchPlaceholderShort') : t('home:searchPlaceholder')}</span>
                <Search size={20} />
              </div>
              <div className="home-header-actions">
                <button
                  className="home-notification-btn"
                  onClick={() => navigate('/notifications')}
                  aria-label={t('nav.notifications')}
                >
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && (
                    <span className="home-notification-badge">{formattedUnreadNotificationsCount}</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <PullToRefresh onRefresh={loadAll} className="home-scrollable" enabled={isMobile} loading={loading}>

            {/* Catégories : Explorer en premier, puis les catégories */}
            <div className="home-categories-scroll">
              <div
                className="home-category-card"
                onClick={() => navigate('/swipe')}
              >
                <div className="home-category-icon">
                  <Sparkles size={22} />
                </div>
                <span className="home-category-name">
                  {t('home:explorer', { defaultValue: 'Explorer' })}
                </span>
              </div>
              {publicationTypes.map((category) => {
                const Icon = category.icon
                return (
                  <div
                    key={category.id}
                    className="home-category-card"
                    onClick={() => navigate(`/${category.slug}`)}
                  >
                    <div className="home-category-icon">
                      <Icon size={22} />
                    </div>
                    <span className="home-category-name">
                      {t(`categories:titles.${category.slug}`, { defaultValue: category.name })}
                    </span>
                  </div>
                )
              })}
            </div>
            {renderHeroPanels()}

            {/* Skeletons pour les sections de posts (pas de second "Chargement" : le Suspense gère déjà) */}
            <div className="home-posts-section">
              <h2 className="home-section-title">{labels.recommendations}</h2>
              <div className="home-posts-grid">
                <PostCardSkeleton viewMode="grid" count={6} />
              </div>
            </div>
          </PullToRefresh>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <>
      <PageMeta title={t('common:meta.home.title')} description={t('common:meta.home.description')} />
      <div className="app">
      <div className="home-page">
        {/* HEADER FIXE - Logo, Boutons, Barre de recherche */}
        <div className="home-header-fixed">
          {/* Nom app + Barre de recherche + Actions (une seule ligne) */}
          <div className="home-header-top">
            <BackButton hideOnHome={true} className="home-back-button" />
            <h1 
              className={`home-app-name ${appNameClicked ? 'home-app-name--clicked' : ''}`}
              onClick={() => {
                if (isOnHomePage) {
                  handleHomeLogoClick()
                } else {
                  navigate('/home')
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (isOnHomePage) handleHomeLogoClick()
                  else navigate('/home')
                }
              }}
              aria-label={t('common:nav.home') || 'Accueil'}
            >
              ollync
            </h1>
            <div 
              className="home-search-container"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/search')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/search'); } }}
              aria-label={t('home:searchPlaceholder')}
            >
              <span className="home-search-placeholder">{isMobile ? t('home:searchPlaceholderShort') : t('home:searchPlaceholder')}</span>
              <Search size={16} />
            </div>
            <div className="home-header-actions">
              <button
                className="home-publish-btn"
                onClick={() => navigate('/publish')}
              >
                <Plus size={16} />
                {t('common:actions.publishListing')}
              </button>
              <button
                className="home-notification-btn"
                onClick={() => navigate('/notifications')}
                aria-label={t('nav.notifications')}
              >
                <Bell size={20} />
                {unreadNotificationsCount > 0 && (
                  <span className="home-notification-badge">{formattedUnreadNotificationsCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CONTENU SCROLLABLE */}
        <PullToRefresh onRefresh={loadAll} className="home-scrollable" enabled={isMobile} loading={loading}>

          {/* Catégories : Explorer en premier, puis les catégories */}
          <div className="home-categories-scroll">
            <div
              className="home-category-card"
              onClick={() => navigate('/swipe')}
            >
              <div className="home-category-icon">
                <Sparkles size={22} />
              </div>
              <span className="home-category-name">
                {t('home:explorer', { defaultValue: 'Explorer' })}
              </span>
            </div>
            {publicationTypes.map((category) => {
              const Icon = category.icon
              return (
                <div
                  key={category.id}
                  className="home-category-card"
                  onClick={() => navigate(`/${category.slug}`)}
                >
                  <div className="home-category-icon">
                    <Icon size={22} />
                  </div>
                  <span className="home-category-name">
                    {t(`categories:titles.${category.slug}`, { defaultValue: category.name })}
                  </span>
                </div>
              )
            })}
          </div>
          {renderHeroPanels()}

          {/* Section Annonces urgentes - EN PREMIER */}
          {urgentPosts.length > 0 && (
            <div className="home-posts-section">
              <h2 className="home-section-title">{labels.urgent}</h2>
              <div className="home-posts-grid">
                {urgentPosts.slice(0, maxPostsPerSection).map((post) => (
                  <PostCard key={post.id} post={post} viewMode="grid" hideCategoryBadge />
                ))}
                {urgentPosts.length >= maxPostsPerSection && (
                  <button
                    className="home-show-more-btn home-plus-btn"
                    onClick={() => navigate('/urgent')}
                  >
                    <Plus size={32} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section Recommandations - JUSTE APRÈS URGENT - Seulement si connecté ET s'il y a des recommandations */}
          {user && (recommendedLoading || recommendedPosts.length > 0) && !loading && (
            <div className="home-posts-section">
              <h2 className="home-section-title">{labels.recommendations}</h2>
              <div className="home-posts-grid">
                {recommendedLoading ? (
                  <PostCardSkeleton viewMode="grid" count={maxPostsPerSection} />
                ) : (
                  <>
                    {recommendedPosts.slice(0, maxPostsPerSection).map((post) => (
                      <PostCard key={post.id} post={post} viewMode="grid" hideCategoryBadge />
                    ))}
                    {recommendedPosts.length >= maxPostsPerSection && (
                      <button
                        className="home-show-more-btn home-plus-btn"
                        onClick={() => navigate('/search?recommended=true')}
                      >
                        <Plus size={32} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Section Création de contenu */}
          {creationContenuPosts.length > 0 && (
            <div className="home-posts-section">
              <h2 className="home-section-title">{t('categories:titles.creation-contenu')}</h2>
              <div className="home-posts-grid">
                {creationContenuPosts.slice(0, maxPostsPerSection).map((post) => (
                  <PostCard key={post.id} post={post} viewMode="grid" hideCategoryBadge />
                ))}
                {creationContenuPosts.length >= maxPostsPerSection && (
                  <button
                    className="home-show-more-btn home-plus-btn"
                    onClick={() => navigate('/creation-contenu')}
                  >
                    <Plus size={32} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section Casting */}
          {castingPosts.length > 0 && (
            <div className="home-posts-section">
              <h2 className="home-section-title">{t('categories:titles.casting-role')}</h2>
              <div className="home-posts-grid">
                {castingPosts.slice(0, maxPostsPerSection).map((post) => (
                  <PostCard key={post.id} post={post} viewMode="grid" hideCategoryBadge />
                ))}
                {castingPosts.length >= maxPostsPerSection && (
                  <button
                    className="home-show-more-btn home-plus-btn"
                    onClick={() => navigate('/casting-role')}
                  >
                    <Plus size={32} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section Emploi */}
          {emploiPosts.length > 0 && (
            <div className="home-posts-section">
              <h2 className="home-section-title">{t('categories:titles.emploi')}</h2>
              <div className="home-posts-grid">
                {emploiPosts.slice(0, maxPostsPerSection).map((post) => (
                  <PostCard key={post.id} post={post} viewMode="grid" hideCategoryBadge />
                ))}
                {emploiPosts.length >= maxPostsPerSection && (
                  <button
                    className="home-show-more-btn home-plus-btn"
                    onClick={() => navigate('/emploi')}
                  >
                    <Plus size={32} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section Studio & lieu */}
          {studioLieuPosts.length > 0 && (
            <div className="home-posts-section">
              <h2 className="home-section-title">{t('categories:titles.studio-lieu')}</h2>
              <div className="home-posts-grid">
                {studioLieuPosts.slice(0, maxPostsPerSection).map((post) => (
                  <PostCard key={post.id} post={post} viewMode="grid" hideCategoryBadge />
                ))}
                {studioLieuPosts.length >= maxPostsPerSection && (
                  <button
                    className="home-show-more-btn home-plus-btn"
                    onClick={() => navigate('/studio-lieu')}
                  >
                    <Plus size={32} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section Annonces récentes - EN DERNIER - Plusieurs sections de 5 annonces */}
          {recentPosts.length > 0 && (
            <div className="home-posts-section">
              <h2 className="home-section-title">{labels.recent}</h2>
              {/* Créer plusieurs sections de 5 annonces */}
              {Array.from({ length: Math.ceil(recentPosts.length / maxPostsPerSection) }).map((_, sectionIndex) => {
                const sectionPosts = recentPosts.slice(
                  sectionIndex * maxPostsPerSection,
                  (sectionIndex + 1) * maxPostsPerSection
                )
                
                return (
                  <div key={sectionIndex} className="home-posts-grid" style={{ marginBottom: sectionIndex < Math.ceil(recentPosts.length / maxPostsPerSection) - 1 ? '20px' : '0' }}>
                    {sectionPosts.map((post) => (
                      <PostCard key={post.id} post={post} viewMode="grid" hideCategoryBadge />
                    ))}
                    {/* Bouton "+" après chaque section de 5 annonces */}
                    {sectionPosts.length === maxPostsPerSection && (
                      <button
                        className="home-show-more-btn home-plus-btn"
                        onClick={() => navigate('/recent')}
                      >
                        <Plus size={32} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </PullToRefresh>
      </div>
      <Footer />
    </div>
    </>
  )
}

export default Home
