import { useState, useEffect, useRef, useCallback } from 'react'
import { Grid, List, Filter, Loader, RefreshCw } from 'lucide-react'
import Footer from '../components/Footer'
import PostCard from '../components/PostCard'
import BackButton from '../components/BackButton'
import { EmptyState } from '../components/EmptyState'
import { PostCardSkeleton } from '../components/PostCardSkeleton'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import { useAuth } from '../hooks/useSupabase'
import { PullToRefresh } from '../components/PullToRefresh/PullToRefresh'
import './Feed.css'

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

const Feed = () => {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null)

  const POSTS_PER_PAGE = 15 // Chargement progressif : première page légère pour affichage rapide

  const fetchPosts = useCallback(async (pageNum: number, isInitial = false) => {
    if (isInitial) {
      setLoading(true)
      setError(null)
    } else {
      setLoadingMore(true)
    }
    try {
      const fetchedPosts = await fetchPostsWithRelations({
        status: 'active',
        limit: POSTS_PER_PAGE,
        offset: pageNum * POSTS_PER_PAGE,
        orderBy: 'created_at',
        orderDirection: 'desc',
        useCache: pageNum === 0,
        excludeUserId: user?.id
      })
      const visiblePosts = user ? fetchedPosts.filter((post) => post.user_id !== user.id) : fetchedPosts
      if (pageNum === 0) {
        setPosts(visiblePosts)
      } else {
        setPosts(prev => [...prev, ...visiblePosts])
      }
      setHasMore(visiblePosts.length === POSTS_PER_PAGE)
      setError(null)
    } catch (err) {
      console.error('Error fetching posts:', err)
      setError('Erreur lors du chargement des annonces')
      if (pageNum === 0) setPosts([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [user])

  const handleRetry = () => {
    fetchPosts(0, true)
  }

  useEffect(() => {
    fetchPosts(0, true)
  }, [fetchPosts])

  const loadMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchPosts(nextPage, false)
    }
  }, [loadingMore, loading, hasMore, page, fetchPosts])

  // Chargement progressif : charger plus quand l'utilisateur scroll vers le bas
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current
    if (!sentinel || !hasMore || loading || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) loadMore()
      },
      { rootMargin: '200px', threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, loadMore])

  return (
    <div className="app">
      <div className="feed-page">
        {/* Header fixe */}
        <div className="feed-header-fixed">
          <div className="feed-header-content">
            <BackButton />
            <div className="feed-header-branding">
              <h1 className="feed-title">Toutes les annonces</h1>
            </div>
            <div className="feed-header-spacer"></div>
          </div>
        </div>

        {/* Contrôles fixes */}
        <div className="feed-controls-fixed">
          <div className="feed-controls-content">
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={20} />
                Grille
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={20} />
                Liste
              </button>
            </div>
            <button className="filter-btn">
              <Filter size={20} />
              Filtres
            </button>
          </div>
        </div>

        {/* Zone scrollable */}
        <PullToRefresh onRefresh={() => fetchPosts(0, true)} className="feed-scrollable" enabled={true} loading={loading || loadingMore}>
          {/* État de chargement initial - afficher des skeletons */}
          {loading && posts.length === 0 ? (
            <div className={`posts-container ${viewMode}`}>
              <PostCardSkeleton viewMode={viewMode} count={6} />
            </div>
          ) : error ? (
            /* État d'erreur */
            <div className="feed-error-container">
              <p className="feed-error-message">{error}</p>
              <button className="feed-retry-btn" onClick={handleRetry}>
                <RefreshCw size={16} />
                Réessayer
              </button>
            </div>
          ) : posts.length === 0 ? (
            /* État vide */
            <EmptyState type="category" customTitle="Aucune annonce disponible" />
          ) : (
            <>
              <div className={`posts-container ${viewMode}`}>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} viewMode={viewMode} />
                ))}
              </div>

              {hasMore && (
                <>
                  <div ref={loadMoreSentinelRef} className="load-more-sentinel" aria-hidden />
                  <div className="load-more-container">
                    <button 
                      className="load-more-btn" 
                      onClick={loadMore} 
                      disabled={loadingMore || loading}
                    >
                      {loadingMore ? (
                        <>
                          <Loader className="spinner" size={20} />
                          Chargement...
                        </>
                      ) : (
                        'Charger plus'
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </PullToRefresh>
      </div>
      <Footer />
    </div>
  )
}

export default Feed
