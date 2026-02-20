import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Heart, Tag } from 'lucide-react'
import BackButton from '../components/BackButton'
import InlineVideoPreview from '../components/InlineVideoPreview'
import { useAuth } from '../hooks/useSupabase'
import { supabase } from '../lib/supabaseClient'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import type { MappedPost } from '../utils/postMapper'
import './SwipePage.css'
import './PostRecommendations.css'

type Post = MappedPost

interface SourcePostMeta {
  id: string
  category_id: string | null
  sub_category_id: string | null
}

const PostRecommendations = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [sourcePost, setSourcePost] = useState<SourcePostMeta | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const navState = (location.state || {}) as { originPath?: string; sourcePostPath?: string }
  const originPath = navState.originPath || '/home'
  const sourcePostPath = navState.sourcePostPath || `/post/${id}`

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!id) return
      setLoading(true)
      try {
        const { data: source, error: sourceError } = await supabase
          .from('posts')
          .select('id, category_id, sub_category_id')
          .eq('id', id)
          .single()

        if (sourceError || !source) {
          setPosts([])
          return
        }

        const meta = source as SourcePostMeta
        setSourcePost(meta)

        const baseOptions = {
          status: 'active',
          limit: 50,
          orderBy: 'created_at',
          orderDirection: 'desc' as const,
          excludeUserId: user?.id,
          useCache: false
        }

        const sameSubCategory = meta.sub_category_id
          ? await fetchPostsWithRelations({
              ...baseOptions,
              categoryId: meta.category_id || undefined,
              subCategoryId: meta.sub_category_id
            })
          : []

        const sameCategory = await fetchPostsWithRelations({
          ...baseOptions,
          categoryId: meta.category_id || undefined
        })

        const merged = [...sameSubCategory, ...sameCategory]
        const uniqueById = new Map<string, Post>()
        merged.forEach((post) => {
          if (post.id !== id) uniqueById.set(post.id, post)
        })

        setPosts(Array.from(uniqueById.values()))
      } catch (error) {
        console.error('Error loading post recommendations:', error)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [id, user?.id])

  const title = useMemo(
    () => (sourcePost ? 'Annonces similaires' : 'Annonces similaires'),
    [sourcePost]
  )

  return (
    <div className="swipe-page post-recommendations-page">
      <div className="swipe-header-fixed">
        <div className="swipe-header-content">
          <BackButton
            className="swipe-back-button"
            onClick={() =>
              navigate(sourcePostPath, {
                replace: true,
                state: { originPath }
              })
            }
          />
          <h1 className="swipe-title">{title}</h1>
          <div className="swipe-header-spacer"></div>
        </div>
      </div>

      <div className="swipe-scrollable">
        {loading ? (
          <div className="swipe-loading">
            <p>Chargement des annonces...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="swipe-empty">
            <p>Aucune annonce recommandée pour le moment.</p>
            <button onClick={() => navigate('/home')} className="swipe-btn-primary">
              Retour à l'accueil
            </button>
          </div>
        ) : (
          <div className="swipe-masonry">
            {posts.map((post) => {
              const mainImage = post.images && post.images.length > 0 ? post.images[0] : null
              const mainMedia = mainImage || post.video || null
              const isVideo =
                !!mainMedia &&
                /\.(mp4|webm|ogg|mov|m4v)$/i.test(mainMedia.split('?')[0].split('#')[0])
              const displayName = post.user?.username || post.user?.full_name || 'Utilisateur'

              return (
                <div
                  key={post.id}
                  className="swipe-card"
                  onClick={() => navigate(`/post/${post.id}`, { state: { originPath } })}
                >
                  <div className="swipe-card-title-top">
                    <span className="swipe-card-title-text">{post.title}</span>
                  </div>

                  <div className={`swipe-card-image-wrapper ${post.is_urgent ? 'swipe-card-urgent' : ''}`}>
                    {mainMedia ? (
                      isVideo ? (
                        <InlineVideoPreview src={mainMedia} className="swipe-card-image" />
                      ) : (
                        <img src={mainMedia} alt={post.title} className="swipe-card-image" loading="lazy" />
                      )
                    ) : (
                      <div className="swipe-card-image-placeholder">
                        <Tag size={32} />
                      </div>
                    )}

                    {post.category && <div className="swipe-card-category">{post.category.name}</div>}
                    <div className="swipe-card-like">
                      <Heart size={16} fill="currentColor" />
                    </div>

                    <div className="swipe-card-overlay">
                      <div
                        className="swipe-card-profile"
                        onClick={(event) => {
                          event.stopPropagation()
                          if (post.user_id) navigate(`/profile/public/${post.user_id}`)
                        }}
                      >
                        <div className="swipe-card-avatar">
                          {post.user?.avatar_url ? (
                            <img
                              src={post.user.avatar_url}
                              alt={displayName}
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src =
                                  'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName)
                              }}
                            />
                          ) : (
                            <div className="swipe-card-avatar-placeholder">
                              {(displayName[0] || 'U').toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="swipe-card-profile-name">{displayName}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default PostRecommendations
