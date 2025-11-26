import { useState, useEffect } from 'react'
import { Grid, List, Filter, Loader } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import HeaderSimple from '../components/HeaderSimple'
import Footer from '../components/Footer'
import PostCard from '../components/PostCard'
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const POSTS_PER_PAGE = 20

  const fetchPosts = async (pageNum: number) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles!posts_user_id_fkey(username, full_name, avatar_url),
        category:categories!posts_category_id_fkey(name, slug)
      `)
      .match({ status: 'active' })
      .order('created_at', { ascending: false })
      .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1)

    if (error) {
      console.error('Error fetching posts:', error)
      setLoading(false)
      return
    }

    if (data) {
      if (pageNum === 0) {
        setPosts(data)
      } else {
        setPosts(prev => [...prev, ...data])
      }
      setHasMore(data.length === POSTS_PER_PAGE)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts(0)
  }, [])

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchPosts(nextPage)
    }
  }

  return (
    <div className="app">
      <HeaderSimple title="Toutes les annonces" />
      <main className="main-content without-header">
        <div className="feed-page">
          <div className="feed-controls">
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

          {loading && posts.length === 0 ? (
            <div className="loading-container">
              <Loader className="spinner-large" size={48} />
              <p>Chargement...</p>
            </div>
          ) : (
            <>
              <div className={`posts-container ${viewMode}`}>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} viewMode={viewMode} />
                ))}
              </div>

              {hasMore && (
                <div className="load-more-container">
                  <button className="load-more-btn" onClick={loadMore} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader className="spinner" size={20} />
                        Chargement...
                      </>
                    ) : (
                      'Charger plus'
                    )}
                  </button>
                </div>
              )}

              {posts.length === 0 && !loading && (
                <div className="empty-state">
                  <p>Aucune annonce disponible</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Feed

