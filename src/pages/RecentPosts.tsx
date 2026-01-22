import { useState, useEffect, useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import Footer from '../components/Footer'
import PostCard from '../components/PostCard'
import BackButton from '../components/BackButton'
import { EmptyState } from '../components/EmptyState'
import { PostCardSkeleton } from '../components/PostCardSkeleton'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import '../components/CategoryPage.css'

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

const RecentPosts = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Grouper les posts par sections de 3 maximum
  const postsSections = useMemo(() => {
    const sections: Post[][] = []
    const POSTS_PER_SECTION = 3
    
    // Créer des sections de 3 posts maximum
    for (let i = 0; i < posts.length; i += POSTS_PER_SECTION) {
      sections.push(posts.slice(i, i + POSTS_PER_SECTION))
    }
    
    return sections
  }, [posts])

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const fetchedPosts = await fetchPostsWithRelations({
        status: 'active',
        limit: 100,
        orderBy: 'created_at',
        orderDirection: 'desc',
        useCache: true
      })

      setPosts(fetchedPosts)
      setError(null)
    } catch (err) {
      console.error('Error fetching recent posts:', err)
      setError('Erreur lors du chargement des annonces récentes')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    fetchPosts()
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  return (
    <div className="category-page-new">
      {/* Header */}
      <div className="category-header-new">
        <div className="category-search-container">
          <BackButton className="category-back-button" />
          <div className="category-header-actions"></div>
        </div>
      </div>

      {/* Titre */}
      <div className="category-title-section">
        <h1 className="category-title-new">Annonces récentes</h1>
      </div>

      {/* Liste des annonces par section avec scroll horizontal (3 par section) */}
      <div className="category-content-section">
        {loading ? (
          <div className="category-posts-section">
            <div className="category-posts-grid">
              <PostCardSkeleton viewMode="grid" count={3} />
            </div>
          </div>
        ) : postsSections.length === 0 ? (
          <EmptyState type="category" customTitle="Aucune annonce récente disponible" />
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '16px' }}>{error}</p>
            <button onClick={handleRetry} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
              <RefreshCw size={16} style={{ marginRight: '8px', display: 'inline' }} />
              Réessayer
            </button>
          </div>
        ) : (
          postsSections.map((sectionPosts, index) => (
            <div key={index} className="category-posts-section">
              <div className="category-posts-grid">
                {sectionPosts.map((post) => (
                  <PostCard key={post.id} post={post} viewMode="grid" />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <Footer />
    </div>
  )
}

export default RecentPosts


