import { useState, useEffect } from 'react'
import { Search, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { fetchPostsWithRelations } from '../../utils/fetchPostsWithRelations'
import './PostSelector.css'

interface Post {
  id: string
  title: string
  description: string
  images?: string[] | null
  category?: {
    name: string
  } | null
  user?: {
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

interface PostSelectorProps {
  onPostSelect: (postId: string) => void
  onClose: () => void
}

const PostSelector = ({ onPostSelect, onClose }: PostSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchPosts(searchQuery.trim())
      } else {
        loadPosts()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const fetchedPosts = await fetchPostsWithRelations({
        status: 'active',
        limit: 20,
        orderBy: 'created_at',
        orderDirection: 'desc'
      })
      setPosts(fetchedPosts as Post[])
    } catch (error) {
      console.error('Error loading posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const searchPosts = async (query: string) => {
    setLoading(true)
    try {
      let postsQuery = supabase
        .from('posts')
        .select('*')
        .eq('status', 'active')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(20)
        .order('created_at', { ascending: false })

      const { data, error } = await postsQuery

      if (error) throw error

      if (data) {
        // Mapper les posts avec leurs relations
        const postsWithRelations = await Promise.all(
          (data as any[]).map(async (post) => {
            // Récupérer la catégorie
            let category = null
            if (post.category_id) {
              const { data: catData } = await supabase
                .from('categories')
                .select('id, name, slug')
                .eq('id', post.category_id)
                .single()
              category = catData
            }

            // Récupérer le profil
            let user = null
            if (post.user_id) {
              const { data: userData } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .eq('id', post.user_id)
                .single()
              user = userData
            }

            return {
              ...post,
              category,
              user
            } as Post
          })
        )
        setPosts(postsWithRelations)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error('Error searching posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = () => {
    if (selectedPostId) {
      onPostSelect(selectedPostId)
    }
  }

  return (
    <div className="post-selector-overlay" onClick={onClose}>
      <div className="post-selector-content" onClick={(e) => e.stopPropagation()}>
        <div className="post-selector-header">
          <h3>Choisir une annonce</h3>
          <button className="post-selector-close" onClick={onClose}>✕</button>
        </div>

        <div className="post-selector-search">
          <Search size={20} className="post-selector-search-icon" />
          <input
            type="text"
            placeholder="Rechercher une annonce..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="post-selector-search-input"
          />
        </div>

        <div className="post-selector-list">
          {loading ? (
            <div className="post-selector-loading">
              <Loader className="spinner" size={24} />
              <span>Chargement...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="post-selector-empty">
              <p>Aucune annonce trouvée</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className={`post-selector-item ${selectedPostId === post.id ? 'selected' : ''}`}
                onClick={() => setSelectedPostId(post.id)}
              >
                {post.images && post.images.length > 0 && (
                  <img
                    src={post.images[0]}
                    alt={post.title}
                    className="post-selector-item-image"
                  />
                )}
                <div className="post-selector-item-info">
                  <h4 className="post-selector-item-title">{post.title}</h4>
                  {post.category && (
                    <span className="post-selector-item-category">{post.category.name}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="post-selector-actions">
          <button
            className="post-selector-btn post-selector-btn-cancel"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            className="post-selector-btn post-selector-btn-select"
            onClick={handleSelect}
            disabled={!selectedPostId}
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostSelector
