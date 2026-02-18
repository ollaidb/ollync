import { useState, useEffect, useRef } from 'react'
import { Bell, Search, Sparkles, Plus } from 'lucide-react'
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
  const [swipeModeActive, setSwipeModeActive] = useState(location.pathname === '/swipe')
  
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


  // Nombre d'annonces par section : mobile 5, web 4
  const maxPostsPerSection = isMobile ? 5 : 4

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const urgent = urgentPosts
        .filter((post: any) => post.is_urgent === true)
        .filter((post: any) => (user ? post.user_id !== user.id : true))
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

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      try {
        // Charger les posts récents et urgents en parallèle
        const [recent, urgent] = await Promise.all([
          fetchRecentPosts(),
          fetchUrgentPosts()
        ])
        
        // Charger les posts par catégorie en parallèle
        const [creationContenu, casting, emploi, studioLieu] = await Promise.all([
          fetchCategoryPosts('creation-contenu'),
          fetchCategoryPosts('casting-role'),
          fetchCategoryPosts('emploi'), // Emploi utilise le slug 'emploi'
          fetchCategoryPosts('studio-lieu')
        ])
        
        setCreationContenuPosts(creationContenu)
        setCastingPosts(casting)
        setEmploiPosts(emploi)
        setStudioLieuPosts(studioLieu)
        
        // Une fois les posts récents et urgents chargés, charger les recommandations
        // en excluant les IDs déjà affichés
        const recentIds = recent.map(p => p.id)
        const urgentIds = urgent.map(p => p.id)
        const categoryIds = [...creationContenu, ...casting, ...emploi, ...studioLieu].map(p => p.id)
        const excludeIds = [...recentIds, ...urgentIds, ...categoryIds]
        
      // Charger les recommandations de manière asynchrone sans bloquer
      if (user) {
        setRecommendedLoading(true)
        fetchRecommendedPosts(excludeIds)
          .catch(err => {
            console.error('Error fetching recommended posts:', err)
          })
          .finally(() => {
            setRecommendedLoading(false)
          })
      }
      } catch (error) {
        console.error('Error loading posts:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])



  if (loading) {
    return (
      <div className="app">
        <div className="home-page">
          {/* HEADER FIXE - Logo, Boutons, Barre de recherche */}
          <div className="home-header-fixed">
            {/* Logo + Icônes swipe et notification */}
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
                  aria-label={t('common:actions.swipeMode')}
                >
                  <Sparkles size={20} />
                </button>
                <button
                  className="home-notification-btn"
                  onClick={() => navigate('/notifications')}
                  aria-label={t('nav.notifications')}
                >
                  <Bell size={20} />
                  <span className="home-notification-badge"></span>
                </button>
              </div>
            </div>

            {/* Barre de recherche au milieu */}
            <div className="home-search-container">
              <div 
                className="home-search-bar"
                onClick={() => navigate('/search')}
              >
                <span className="home-search-placeholder">{t('home:searchPlaceholder')}</span>
                <Search size={20} />
              </div>
            </div>
          </div>

          <div className="home-scrollable">

            {/* Catégories scrollables - Directement sur la page */}
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
                    <span className="home-category-name">
                      {t(`categories:titles.${category.slug}`, { defaultValue: category.name })}
                    </span>
                  </div>
                )
              })}
            </div>
            {/* Section Hero */}
            <div className="home-hero-section">
              <div className="home-hero-block">
                <div className="home-hero-text">
                  <span className="home-hero-title">{t('home:welcome')}</span>
                  <span className="home-hero-subtitle">{t('home:welcomeSuffix')}</span>
                </div>
              </div>
            </div>

            {/* Skeletons pour les sections de posts */}
            <div className="home-posts-section">
              <h2 className="home-section-title">{labels.loading}</h2>
              <div className="home-posts-grid">
                <PostCardSkeleton viewMode="grid" count={6} />
              </div>
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
        {/* HEADER FIXE - Logo, Boutons, Barre de recherche */}
        <div className="home-header-fixed">
          {/* Logo + Icônes swipe et notification */}
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
                className="home-publish-btn"
                onClick={() => navigate('/publish')}
              >
                <Plus size={16} />
                {t('common:actions.publishListing')}
              </button>
              <button
                className={`home-swipe-btn ${swipeModeActive ? 'active' : ''}`}
                onClick={() => {
                  setSwipeModeActive(!swipeModeActive)
                  navigate('/swipe')
                }}
                aria-label={t('common:actions.swipeMode')}
              >
                <Sparkles size={20} />
              </button>
              <button
                className="home-notification-btn"
                onClick={() => navigate('/notifications')}
                aria-label={t('nav.notifications')}
              >
                <Bell size={20} />
                <span className="home-notification-badge"></span>
              </button>
            </div>
          </div>

          {/* Barre de recherche au milieu */}
          <div className="home-search-container">
            <div 
              className="home-search-bar"
              onClick={() => navigate('/search')}
            >
              <span className="home-search-placeholder">{t('home:searchPlaceholder')}</span>
              <Search size={20} />
            </div>
          </div>
        </div>

        {/* CONTENU SCROLLABLE */}
        <div className="home-scrollable">

          {/* Catégories scrollables - Directement sur la page */}
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
                  <span className="home-category-name">
                    {t(`categories:titles.${category.slug}`, { defaultValue: category.name })}
                  </span>
                </div>
              )
            })}
          </div>
          {/* Section Hero */}
          <div className="home-hero-section">
            <div className="home-hero-block">
              <div className="home-hero-text">
                <span className="home-hero-title">{t('home:welcome')}</span>
                <span className="home-hero-subtitle">{t('home:welcomeSuffix')}</span>
              </div>
            </div>
          </div>

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
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Home
