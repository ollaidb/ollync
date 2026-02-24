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
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const navState = (location.state || {}) as { originPath?: string; sourcePostPath?: string }
  const originPath = navState.originPath || '/home'
  const sourcePostPath = navState.sourcePostPath || `/post/${id}`
  const recommendationsPath = `${location.pathname}${location.search}`

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

  useEffect(() => {
    const fetchLikedPostIds = async () => {
      if (!user?.id || posts.length === 0) {
        setLikedPostIds(new Set())
        return
      }

      try {
        const postIds = posts.map((post) => post.id)
        const { data, error } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds)

        if (error) {
          console.error('Error fetching likes for recommendations:', error)
          setLikedPostIds(new Set())
          return
        }

        const likeRows = (data || []) as Array<{ post_id: string | null }>
        setLikedPostIds(new Set(likeRows.map((row) => row.post_id).filter((id): id is string => Boolean(id))))
      } catch (error) {
        console.error('Error fetching likes for recommendations:', error)
        setLikedPostIds(new Set())
      }
    }

    fetchLikedPostIds()
  }, [user?.id, posts])

  useEffect(() => {
    const handleLikeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ postId?: string; liked?: boolean }>).detail
      const postId = detail?.postId
      if (!postId) return

      setLikedPostIds((prev) => {
        const next = new Set(prev)
        if (detail.liked) {
          next.add(postId)
        } else {
          next.delete(postId)
        }
        return next
      })
    }

    window.addEventListener('likeChanged', handleLikeChange)
    return () => window.removeEventListener('likeChanged', handleLikeChange)
  }, [])

  const title = useMemo(
    () => (sourcePost ? 'Annonces similaires' : 'Annonces similaires'),
    [sourcePost]
  )

  const handleLikeClick = async (event: React.MouseEvent, postId: string) => {
    event.stopPropagation()

    if (!user?.id) {
      navigate('/auth/login')
      return
    }

    const currentlyLiked = likedPostIds.has(postId)

    setLikedPostIds((prev) => {
      const next = new Set(prev)
      if (currentlyLiked) {
        next.delete(postId)
      } else {
        next.add(postId)
      }
      return next
    })

    try {
      if (currentlyLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId)
        if (error) throw error
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('likes') as any)
          .insert({ user_id: user.id, post_id: postId })
        if (error) throw error
      }

      window.dispatchEvent(
        new CustomEvent('likeChanged', {
          detail: { postId, liked: !currentlyLiked }
        })
      )
    } catch (error) {
      console.error('Error toggling like in recommendations:', error)
      setLikedPostIds((prev) => {
        const next = new Set(prev)
        if (currentlyLiked) {
          next.add(postId)
        } else {
          next.delete(postId)
        }
        return next
      })
    }
  }

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
                  onClick={() =>
                    navigate(`/post/${post.id}`, {
                      state: { originPath: recommendationsPath }
                    })
                  }
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
                    <div
                      className={`swipe-card-like ${likedPostIds.has(post.id) ? 'liked' : ''}`}
                      onClick={(event) => handleLikeClick(event, post.id)}
                      role="button"
                      aria-label={likedPostIds.has(post.id) ? 'Retirer le like' : 'Ajouter un like'}
                      tabIndex={0}
                    >
                      <Heart size={16} fill={likedPostIds.has(post.id) ? 'currentColor' : 'none'} />
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
                                (e.target as HTMLImageElement).src =
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
