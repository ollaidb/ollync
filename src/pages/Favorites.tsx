import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Loader } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import PageHeader from '../components/PageHeader'
import Footer from '../components/Footer'
import PostCard from '../components/PostCard'
import { mapPosts } from '../utils/postMapper'
import './Page.css'
import './Favorites.css'

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

const Favorites = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLikedPosts = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      // Récupérer les IDs des posts likés
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (likesError) {
        console.error('Error fetching likes:', likesError)
        setLoading(false)
        return
      }

      if (!likes || likes.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }

      // Récupérer les posts likés
      const postIds = likes.map((like: { post_id: string }) => like.post_id)
      
      // Récupérer les posts avec leurs relations
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (postsError) {
        console.error('Error fetching posts:', postsError)
        setLoading(false)
        return
      }

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

        setPosts(mapPosts(postsWithRelations))
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error('Error fetching liked posts:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchLikedPosts()
    } else {
      setLoading(false)
    }
  }, [user, fetchLikedPosts])

  // Écouter les changements de likes depuis d'autres pages
  useEffect(() => {
    const handleLikeChange = () => {
      if (user) {
        fetchLikedPosts()
      }
    }

    window.addEventListener('likeChanged', handleLikeChange)
    return () => {
      window.removeEventListener('likeChanged', handleLikeChange)
    }
  }, [user, fetchLikedPosts])

  if (!user) {
    return (
      <div className="page">
        <PageHeader title="Mes Favoris" />
        <div className="page-content">
          <div className="page-body">
            <div className="empty-state">
              <Heart size={48} />
              <h2>Vous n'êtes pas connecté</h2>
              <p>Connectez-vous pour voir vos annonces likées</p>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/auth/login')}
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="Mes Favoris" />
      <div className="page-content">
        <div className="page-body favorites-page">
          {loading ? (
            <div className="loading-container">
              <Loader className="spinner-large" size={48} />
              <p>Chargement de vos favoris...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <Heart size={48} />
              <h2>Aucun favori</h2>
              <p>Vous n'avez pas encore liké d'annonces.</p>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/home')}
              >
                Découvrir des annonces
              </button>
            </div>
          ) : (
            <>
              <div className="favorites-header">
                <h2>{posts.length} annonce{posts.length > 1 ? 's' : ''} likée{posts.length > 1 ? 's' : ''}</h2>
              </div>
              <div className="posts-grid">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} viewMode="grid" isLiked={true} onLike={fetchLikedPosts} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Favorites

