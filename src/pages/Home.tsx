import { useState, useEffect } from 'react'
import { RefreshCw, Loader } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PostCard from '../components/PostCard'
import { useAuth } from '../hooks/useSupabase'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import { mapPosts } from '../utils/postMapper'
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
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  
  // Sections d'annonces
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [urgentPosts, setUrgentPosts] = useState<Post[]>([])
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Post[]>([])
  const [basedOnLikes, setBasedOnLikes] = useState<Post[]>([])

  const [loadingSections, setLoadingSections] = useState({
    recent: false,
    urgent: false,
    recommended: false,
    liked: false,
    basedOnLikes: false
  })

  const fetchPosts = async (_query: unknown, limit = 10) => {
    return await fetchPostsWithRelations({
      status: 'active',
      limit,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })
  }

  const fetchRecentPosts = async () => {
    setLoadingSections(prev => ({ ...prev, recent: true }))
    const posts = await fetchPosts({}, 10)
    setRecentPosts(posts)
    setLoadingSections(prev => ({ ...prev, recent: false }))
  }

  const fetchUrgentPosts = async () => {
    setLoadingSections(prev => ({ ...prev, urgent: true }))
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    
    // Récupérer tous les posts actifs
    const allPosts = await fetchPostsWithRelations({
      status: 'active',
      limit: 100,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    // Filtrer les posts urgents
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const urgent = allPosts.filter((post: any) => {
      if (post.is_urgent) return true
      if (post.needed_date) {
        const neededDate = new Date(post.needed_date)
        return neededDate <= threeDaysFromNow
      }
      return false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).sort((a: any, b: any) => {
      if (a.needed_date && b.needed_date) {
        return new Date(a.needed_date).getTime() - new Date(b.needed_date).getTime()
      }
      return 0
    }).slice(0, 10)

    setUrgentPosts(urgent)
    setLoadingSections(prev => ({ ...prev, urgent: false }))
  }

  const fetchRecommendedPosts = async () => {
    setLoadingSections(prev => ({ ...prev, recommended: true }))
    const posts = await fetchPosts({}, 20)
    setRecommendedPosts(posts)
    setLoadingSections(prev => ({ ...prev, recommended: false }))
  }

  const fetchLikedPosts = async () => {
    if (!user) {
      setLoadingSections(prev => ({ ...prev, liked: false }))
      return
    }

    setLoadingSections(prev => ({ ...prev, liked: true }))
    const { data: likes } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)
      .limit(10)

    if (likes && likes.length > 0) {
      const postIds = likes.map((l: { post_id: string }) => l.post_id)
      // Récupérer les posts likés
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (postsData && postsData.length > 0) {
        // Récupérer les relations séparément
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userIds = [...new Set(postsData.map((p: any) => p.user_id).filter(Boolean))]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const categoryIds = [...new Set(postsData.map((p: any) => p.category_id).filter(Boolean))]

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds)

        const { data: categories } = await supabase
          .from('categories')
          .select('id, name, slug')
          .in('id', categoryIds)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const categoriesMap = new Map((categories || []).map((c: any) => [c.id, c]))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const postsWithRelations = postsData.map((post: any) => ({
          ...post,
          profiles: profilesMap.get(post.user_id) || null,
          categories: categoriesMap.get(post.category_id) || null
        }))

        setLikedPosts(mapPosts(postsWithRelations))
      }
    }
    setLoadingSections(prev => ({ ...prev, liked: false }))
  }

  const fetchBasedOnLikes = async () => {
    if (!user) {
      setLoadingSections(prev => ({ ...prev, basedOnLikes: false }))
      return
    }

    setLoadingSections(prev => ({ ...prev, basedOnLikes: true }))
    
    // Récupérer les catégories des posts likés
    const { data: likes } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)
      .limit(20)

    if (likes && likes.length > 0) {
      const postIds = likes.map((l: { post_id: string }) => l.post_id)
      const { data: likedPosts } = await supabase
        .from('posts')
        .select('category_id')
        .in('id', postIds)

      if (likedPosts && likedPosts.length > 0) {
        const categoryIds = [...new Set(likedPosts.map((p: { category_id: string }) => p.category_id))]
        
        // Récupérer les posts des mêmes catégories
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .in('category_id', categoryIds)
          .eq('status', 'active')
          .not('id', 'in', `(${postIds.join(',')})`)
          .order('created_at', { ascending: false })
          .limit(10)

        if (postsData && postsData.length > 0) {
          // Récupérer les relations
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userIds = [...new Set(postsData.map((p: any) => p.user_id).filter(Boolean))]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const catIds = [...new Set(postsData.map((p: any) => p.category_id).filter(Boolean))]

          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', userIds)

          const { data: categories } = await supabase
            .from('categories')
            .select('id, name, slug')
            .in('id', catIds)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const categoriesMap = new Map((categories || []).map((c: any) => [c.id, c]))

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const postsWithRelations = postsData.map((post: any) => ({
            ...post,
            profiles: profilesMap.get(post.user_id) || null,
            categories: categoriesMap.get(post.category_id) || null
          }))

          setBasedOnLikes(mapPosts(postsWithRelations))
        }
      }
    }
    setLoadingSections(prev => ({ ...prev, basedOnLikes: false }))
  }

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([
        fetchRecentPosts(),
        fetchUrgentPosts(),
        fetchRecommendedPosts(),
        fetchLikedPosts(),
        fetchBasedOnLikes()
      ])
      setLoading(false)
    }
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const Section = ({ 
    title, 
    posts, 
    loading: sectionLoading, 
    onRefresh 
  }: { 
    title: string
    posts: Post[]
    loading: boolean
    onRefresh: () => void
  }) => {
    if (sectionLoading) {
      return (
        <section className="home-section">
          <div className="section-header">
            <h2 className="section-title">{title}</h2>
            <Loader className="spinner" size={20} />
          </div>
        </section>
      )
    }

    if (posts.length === 0) {
      return null
    }

    return (
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          <div className="section-actions">
            <button className="section-refresh" onClick={onRefresh}>
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
            <div className="posts-container grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} viewMode="grid" />
              ))}
            </div>
      </section>
    )
  }

  if (loading) {
    return (
      <div className="app">
        <Header />
        <main className="main-content with-header">
          <div className="loading-container">
            <Loader className="spinner-large" size={48} />
            <p>Chargement...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content with-header">
        <div className="home-page">
          <Section
            title="Annonces récentes"
            posts={recentPosts}
            loading={loadingSections.recent}
            onRefresh={fetchRecentPosts}
          />

          {urgentPosts.length > 0 && (
            <Section
              title="Annonces urgentes"
              posts={urgentPosts}
              loading={loadingSections.urgent}
              onRefresh={fetchUrgentPosts}
            />
          )}

          {user && likedPosts.length > 0 && (
            <Section
              title="Annonces que vous avez likées"
              posts={likedPosts}
              loading={loadingSections.liked}
              onRefresh={fetchLikedPosts}
            />
          )}

          {user && basedOnLikes.length > 0 && (
            <Section
              title="Basées sur vos recherches"
              posts={basedOnLikes}
              loading={loadingSections.basedOnLikes}
              onRefresh={fetchBasedOnLikes}
            />
          )}

          <Section
            title="Pour vous"
            posts={recommendedPosts}
            loading={loadingSections.recommended}
            onRefresh={fetchRecommendedPosts}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Home
