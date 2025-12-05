import { useState, useEffect } from 'react'
import { Bell, Search, Loader, Sparkles } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import { publicationTypes } from '../constants/publishData'
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
  const [loading, setLoading] = useState(true)
  const [swipeModeActive, setSwipeModeActive] = useState(location.pathname === '/swipe')
  
  // Sections d'annonces
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [urgentPosts, setUrgentPosts] = useState<Post[]>([])

  const fetchPosts = async (_query: unknown, limit = 10) => {
    return await fetchPostsWithRelations({
      status: 'active',
      limit,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })
  }

  const fetchRecentPosts = async () => {
    const posts = await fetchPosts({}, 5)
    setRecentPosts(posts)
  }

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
      .slice(0, 5)

    setUrgentPosts(urgent)
  }

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([
        fetchRecentPosts(),
        fetchUrgentPosts()
      ])
      setLoading(false)
    }
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  if (loading) {
    return (
      <div className="app">
        <div className="home-page">
          {/* BLOC BLEU CLAIR FIXE - Header, Recherche, Catégories */}
          <div className="home-header-blue-block">
            {/* Section 1: Logo + Icônes swipe et notification */}
            <div className="home-header-top">
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

          {/* Section Annonces récentes */}
          <div className="home-posts-section">
            <h2 className="home-section-title">annonce recente</h2>
            <div className="home-posts-grid">
              {recentPosts.slice(0, 2).map((post) => (
                <div key={post.id} className="home-post-block" onClick={() => navigate(`/post/${post.id}`)}>
                  {post.images && post.images.length > 0 ? (
                    <img src={post.images[0]} alt={post.title} />
                  ) : (
                    <div className="home-post-block-placeholder">
                      <span>{post.title}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section Annonces urgentes */}
          {urgentPosts.length > 0 && (
            <div className="home-posts-section">
              <h2 className="home-section-title">urgent</h2>
              <div className="home-posts-grid">
                {urgentPosts.slice(0, 2).map((post) => (
                  <div key={post.id} className="home-post-block" onClick={() => navigate(`/post/${post.id}`)}>
                    {post.images && post.images.length > 0 ? (
                      <img src={post.images[0]} alt={post.title} />
                    ) : (
                      <div className="home-post-block-placeholder">
                        <span>{post.title}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Home
