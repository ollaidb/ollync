import { useState, useEffect } from 'react'
import { Bell, Search, TrendingUp, Clock, Star, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import PostCard from '../components/PostCard'
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
  const [loading, setLoading] = useState(true)
  
  // Sections d'annonces
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [urgentPosts, setUrgentPosts] = useState<Post[]>([])
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([])

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

  const fetchRecommendedPosts = async () => {
    const posts = await fetchPosts({}, 5)
    setRecommendedPosts(posts)
  }


  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([
        fetchRecentPosts(),
        fetchUrgentPosts(),
        fetchRecommendedPosts()
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
          {/* 1. TÊTE DE PAGE (Fixe) */}
          <div className="home-header-top-fixed">
            <div className="home-header-top-content">
              <div className="home-header-branding">
                <h1 className="home-title">Ollync</h1>
              </div>
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

          {/* 2. BARRE DE RECHERCHE (Fixe) */}
          <div className="home-search-bar-fixed">
            <div className="home-search-bar-content">
              <div 
                className="home-search-bar"
                onClick={() => navigate('/search')}
              >
                <Search size={20} />
                <span className="home-search-placeholder">Rechercher une annonce...</span>
              </div>
            </div>
          </div>

          {/* 3. MENU CATÉGORIES (Fixe) */}
          <div className="home-menu-fixed">
            <div className="home-menu-content">
              <div className="home-categories-scroll">
                {publicationTypes.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      className="home-category-card"
                      onClick={() => navigate(`/${category.slug}`)}
                    >
                      <Icon size={24} />
                      <span className="home-category-name">{category.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 4. HERO BANNIÈRE (Fixe) */}
          <div className="home-hero-fixed">
            <div className="home-hero-content">
              <div className="home-welcome-banner">
                <div className="home-welcome-content">
                  <h3 className="home-welcome-title">Bienvenue sur Ollync ! 👋</h3>
                  <p className="home-welcome-subtitle">Découvrez des opportunités uniques et connectez-vous avec votre communauté.</p>
                </div>
              </div>
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
        {/* 1. TÊTE DE PAGE (Fixe) */}
        <div className="home-header-top-fixed">
          <div className="home-header-top-content">
            <div className="home-header-branding">
              <h1 className="home-title">Ollync</h1>
            </div>
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

        {/* 2. BARRE DE RECHERCHE (Fixe) */}
        <div className="home-search-bar-fixed">
          <div className="home-search-bar-content">
            <div 
              className="home-search-bar"
              onClick={() => navigate('/search')}
            >
              <Search size={20} />
              <span className="home-search-placeholder">Rechercher une annonce...</span>
            </div>
          </div>
        </div>

          {/* 3. MENU CATÉGORIES (Fixe) */}
          <div className="home-menu-fixed">
            <div className="home-menu-content">
              <div className="home-categories-scroll">
                {publicationTypes.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      className="home-category-card"
                      onClick={() => navigate(`/${category.slug}`)}
                    >
                      <Icon size={24} />
                      <span className="home-category-name">{category.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 4. HERO BANNIÈRE (Fixe) */}
          <div className="home-hero-fixed">
            <div className="home-hero-content">
              <div className="home-welcome-banner">
                <div className="home-welcome-content">
                  <h3 className="home-welcome-title">Bienvenue sur Ollync ! 👋</h3>
                  <p className="home-welcome-subtitle">Découvrez des opportunités uniques et connectez-vous avec votre communauté.</p>
                </div>
              </div>
            </div>
          </div>

        {/* ZONE SCROLLABLE */}
        <div className="home-scrollable">

          {/* Section Annonces urgentes */}
          {urgentPosts.length > 0 && (
            <div className="home-posts-section">
              <div className="home-section-header">
                <TrendingUp size={20} color="#EF4444" />
                <h2 className="home-section-title">Annonces urgentes</h2>
              </div>
              <div className="home-posts-list">
                {urgentPosts.slice(0, 5).map((post) => (
                  <PostCard key={post.id} post={post} viewMode="list" />
                ))}
              </div>
            </div>
          )}

          {/* Section Récemment publiées */}
          <div className="home-posts-section">
            <div className="home-section-header">
              <Clock size={20} color="#6366F1" />
              <h2 className="home-section-title">Récemment publiées</h2>
            </div>
            <div className="home-posts-list">
              {recentPosts.slice(0, 5).map((post) => (
                <PostCard key={post.id} post={post} viewMode="list" />
              ))}
            </div>
          </div>

          {/* Section Recommandées pour vous */}
          <div className="home-posts-section">
            <div className="home-section-header">
              <Star size={20} color="#F59E0B" />
              <h2 className="home-section-title">Recommandées pour vous</h2>
            </div>
            <div className="home-posts-list">
              {recommendedPosts.slice(0, 5).map((post) => (
                <PostCard key={post.id} post={post} viewMode="list" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Home
