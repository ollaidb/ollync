import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, Share2, MessageCircle, MapPin, Check, X, Navigation, ImageOff } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import Footer from '../components/Footer'
import PostCard from '../components/PostCard'
import BackButton from '../components/BackButton'
import { useAuth } from '../hooks/useSupabase'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import { formatRelativeDate } from '../utils/profileHelpers'
import './PostDetails.css'

interface Post {
  id: string
  title: string
  description: string
  price?: number | null
  location?: string | null
  location_lat?: number | null
  location_lng?: number | null
  location_address?: string | null
  images?: string[] | null
  likes_count: number
  comments_count: number
  created_at: string
  needed_date?: string | null
  number_of_people?: number | null
  delivery_available: boolean
  is_urgent?: boolean
  status: string
  user_id: string
  user?: {
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
    bio?: string | null
  } | null
  category?: {
    name: string
    slug: string
  } | null
  sub_category?: {
    name: string
    slug: string
  } | null
}

interface Application {
  id: string
  applicant_id: string
  status: string
  message?: string | null
  created_at: string
  applicant?: {
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

const PostDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [relatedPosts, setRelatedPosts] = useState<Array<{
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
  }>>([])

  useEffect(() => {
    if (id) {
      fetchPost()
      if (user) {
        checkLiked()
        fetchApplications()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user])

  useEffect(() => {
    if (post) {
      fetchRelatedPosts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post])

  const fetchPost = async () => {
    if (!id) return

    try {
      // 1. Récupérer le post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

      if (postError) {
        console.error('Error fetching post:', postError)
        setLoading(false)
        return
      }

      if (!postData) {
        setLoading(false)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const post = postData as any

      // 2. Récupérer le profil de l'utilisateur
      let userProfile = null
      if (post.user_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio')
          .eq('id', post.user_id)
          .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (profileData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const profile = profileData as any
          userProfile = {
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio
          }
        }
      }

      // 3. Récupérer la catégorie
      let categoryData = null
      if (post.category_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: catData } = await supabase
          .from('categories')
          .select('id, name, slug')
          .eq('id', post.category_id)
          .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (catData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const category = catData as any
          categoryData = {
            name: category.name,
            slug: category.slug
          }
        }
      }

      // 4. Récupérer la sous-catégorie
      let subCategoryData = null
      if (post.sub_category_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: subCatData } = await supabase
          .from('sub_categories')
          .select('id, name, slug')
          .eq('id', post.sub_category_id)
          .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (subCatData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subCategory = subCatData as any
          subCategoryData = {
            name: subCategory.name,
            slug: subCategory.slug
          }
        }
      }

      // 5. Combiner les données
      setPost({
        ...post,
        user: userProfile,
        category: categoryData,
        sub_category: subCategoryData
      } as Post)

      // 6. Incrémenter les vues
      const currentViews = post.views_count || 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('posts') as any).update({ views_count: currentViews + 1 }).eq('id', id)
    } catch (error) {
      console.error('Error in fetchPost:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkLiked = async () => {
    if (!user || !id) {
      setLiked(false)
      return
    }

    try {
      // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs 406
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', id)
        .maybeSingle()

      // Si erreur ou pas de données, le post n'est pas liké
      if (error || !data) {
        setLiked(false)
      } else {
        setLiked(true)
      }
    } catch (error) {
      // Si aucune donnée n'est trouvée, le post n'est pas liké
      console.error('Error checking like:', error)
      setLiked(false)
    }
  }

  const handleLike = async () => {
    if (!user || !id) {
      navigate('/auth/login')
      return
    }

    // Vérifier que l'utilisateur a un profil dans la base de données
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('Profil utilisateur introuvable:', profileError)
        alert('Votre profil n\'existe pas dans la base de données. Veuillez vous reconnecter ou contacter le support.')
        return
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du profil:', error)
      alert('Erreur lors de la vérification de votre profil. Veuillez réessayer.')
      return
    }

    try {
      if (liked) {
        // Supprimer le like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', id)

        if (error) {
          console.error('Error removing like:', error)
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          alert(`Erreur lors de la suppression du like: ${error.message}`)
          return
        }

        setLiked(false)
        if (post) {
          const newLikesCount = Math.max(0, post.likes_count - 1)
          setPost({ ...post, likes_count: newLikesCount })
          
          // Mettre à jour le compteur dans la base de données
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('posts') as any).update({ likes_count: newLikesCount }).eq('id', id)
        }
        
        // Déclencher un événement personnalisé pour notifier les autres composants
        window.dispatchEvent(new CustomEvent('likeChanged', { 
          detail: { postId: id, liked: false } 
        }))
      } else {
        // Ajouter le like
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('likes') as any)
          .insert({ user_id: user.id, post_id: id })
          .select()
          .single()

        if (error) {
          console.error('Error adding like:', error)
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          alert(`Erreur lors de l'ajout du like: ${error.message}`)
          return
        }

        if (data) {
          setLiked(true)
          if (post) {
            const newLikesCount = post.likes_count + 1
            setPost({ ...post, likes_count: newLikesCount })
            
            // Mettre à jour le compteur dans la base de données
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('posts') as any).update({ likes_count: newLikesCount }).eq('id', id)
          }
          
          // Déclencher un événement personnalisé pour notifier les autres composants
          window.dispatchEvent(new CustomEvent('likeChanged', { 
            detail: { postId: id, liked: true } 
          }))
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.description,
          url: window.location.href
        })
      } catch (error) {
        // L'utilisateur a peut-être annulé, ce n'est pas une erreur
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Lien copié dans le presse-papier')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        alert('Impossible de copier le lien')
      }
    }
  }

  const handleMessage = () => {
    if (!user) {
      navigate('/auth/login')
      return
    }
    navigate(`/messages/new?post=${id}`)
  }

  const handleApply = () => {
    if (!user) {
      navigate('/auth/login')
      return
    }
    // Action principale pour candidater/répondre
    navigate(`/messages/new?post=${id}`)
  }

  const handleOpenNavigation = () => {
    if (post?.location_lat && post?.location_lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${post.location_lat},${post.location_lng}`
      window.open(url, '_blank')
    }
  }

  const handleDelete = async () => {
    if (!id || !user || post?.user_id !== user.id) return

    try {
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) throw error
      navigate('/home')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Erreur lors de la suppression')
    }
  }


  const handleAcceptApplication = async (applicationId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('applications') as any)
        .update({ status: 'accepted' })
        .eq('id', applicationId)

      if (error) throw error
      fetchApplications()
    } catch (error) {
      console.error('Error accepting application:', error)
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('applications') as any)
        .update({ status: 'rejected' })
        .eq('id', applicationId)

      if (error) throw error
      fetchApplications()
    } catch (error) {
      console.error('Error rejecting application:', error)
    }
  }

  const fetchApplications = async () => {
    if (!id || !user || !post || post.user_id !== user.id) return

    const { data } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:profiles!applications_applicant_id_fkey(username, full_name, avatar_url)
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: false })

    if (data) setApplications(data)
  }

  const fetchRelatedPosts = async () => {
    if (!post) return

    try {
      // Récupérer des annonces de la même catégorie, excluant l'annonce actuelle
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const postCategoryId = (post as any).category_id
      
      if (postCategoryId) {
        const related = await fetchPostsWithRelations({
          categoryId: postCategoryId,
          status: 'active',
          limit: 7,
          orderBy: 'created_at',
          orderDirection: 'desc'
        })
        // Filtrer pour exclure le post actuel
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filtered = related.filter((p: any) => p.id !== post.id)
        setRelatedPosts(filtered.slice(0, 6))
      } else {
        // Si pas de catégorie, récupérer les dernières annonces
        const related = await fetchPostsWithRelations({
          status: 'active',
          limit: 7,
          orderBy: 'created_at',
          orderDirection: 'desc'
        })
        // Filtrer pour exclure le post actuel
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filtered = related.filter((p: any) => p.id !== post.id)
        setRelatedPosts(filtered.slice(0, 6))
      }
    } catch (error) {
      console.error('Error fetching related posts:', error)
    }
  }

  const isOwner = user && post && post.user_id === user.id
  const images = post?.images || []

  if (loading) {
    return (
      <div className="app">
        <div className="post-details-page">
          <div className="post-details-scrollable">
            <div className="loading-container">
              <p>Chargement...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="app">
        <div className="post-details-page">
          <div className="post-details-scrollable">
            <div className="empty-state">
              <p>Annonce introuvable</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const mainImage = images.length > 0 ? images[0] : null
  const hasAddress = post.location_address || (post.location_lat && post.location_lng)

  return (
    <div className="app">
      <div className="post-details-page has-hero-image">
        {/* Header fixe */}
        <div className="post-details-header-fixed">
          <div className="post-details-header-content">
            <BackButton />
            <div className="post-details-header-spacer"></div>
            <div className="post-details-header-actions">
              <button className="post-header-action-btn" onClick={handleShare}>
                <Share2 size={20} />
              </button>
              <button className="post-header-action-btn" onClick={handleLike}>
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>

        {/* Image principale (toujours affichée, avec placeholder si pas d'image) */}
        <div className="post-hero-image">
          {mainImage ? (
            <img src={mainImage} alt={post.title} />
          ) : (
            <div className="post-hero-image-placeholder">
              <ImageOff size={64} />
            </div>
          )}
          {/* Badge URGENT en bas à gauche */}
          {post.is_urgent && (
            <div className="post-urgent-badge">URGENT</div>
          )}
        </div>

        {/* Zone scrollable */}
        <div className="post-details-scrollable">
          <div className="post-details-content">
            {/* Titre */}
            <div className="post-title-section">
              <h1 className="post-title-main">{post.title}</h1>
              {post.is_urgent && !mainImage && (
                <div className="post-urgent-badge-inline">URGENT</div>
              )}
            </div>

            {/* Prix en grand */}
            {post.price && (
              <div className="post-price-main">{post.price} €</div>
            )}

            {/* Informations secondaires */}
            <div className="post-meta-info">
              {post.location && (
                <span className="post-meta-item">
                  <MapPin size={16} /> {post.location}
                </span>
              )}
              <span className="post-meta-item">
                {formatRelativeDate(post.created_at)}
              </span>
            </div>

            {/* Carte d'information avec adresse et GPS */}
            {hasAddress && (
              <div className="post-address-card">
                <div className="post-address-content">
                  {post.location_address && (
                    <div className="post-address-text">
                      <MapPin size={18} />
                      <span>{post.location_address}</span>
                    </div>
                  )}
                  {post.location_lat && post.location_lng && (
                    <div className="post-address-coords">
                      {post.location_lat.toFixed(6)}, {post.location_lng.toFixed(6)}
                    </div>
                  )}
                </div>
                {post.location_lat && post.location_lng && (
                  <button className="post-address-nav-btn" onClick={handleOpenNavigation}>
                    <Navigation size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Description */}
            <div className="post-description-section">
              <h3 className="post-description-title">Description</h3>
              <p className="post-description-text">{post.description}</p>
            </div>

            {/* Section candidatures pour les matchs (propriétaire uniquement) */}
            {isOwner && applications.length > 0 && (
              <div className="applications-section">
                <h3>Candidatures ({applications.length})</h3>
                {applications.map((app) => (
                  <div key={app.id} className="application-card">
                    <div className="application-header">
                      <div className="application-user">
                        {app.applicant?.avatar_url && (
                          <img src={app.applicant.avatar_url} alt={app.applicant.full_name || ''} />
                        )}
                        <div>
                          <div className="application-name">
                            {app.applicant?.full_name || app.applicant?.username || 'Utilisateur'}
                          </div>
                          <div className="application-date">
                            {new Date(app.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <div className="application-status">{app.status}</div>
                    </div>
                    {app.message && <p className="application-message">{app.message}</p>}
                    {app.status === 'pending' && (
                      <div className="application-actions">
                        <button
                          className="btn-accept"
                          onClick={() => handleAcceptApplication(app.id)}
                        >
                          <Check size={18} />
                          Accepter
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleRejectApplication(app.id)}
                        >
                          <X size={18} />
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Profil de l'auteur */}
            {post.user && (
              <div className="author-section">
                <h3>À propos de l'auteur</h3>
                <Link to={`/profile/public/${post.user.id}`} className="author-card">
                  {post.user.avatar_url && (
                    <img src={post.user.avatar_url} alt={post.user.full_name || ''} />
                  )}
                  <div>
                    <div className="author-name">
                      {post.user.full_name || post.user.username || 'Utilisateur'}
                    </div>
                    {post.user.bio && (
                      <div className="author-bio">{post.user.bio}</div>
                    )}
                  </div>
                </Link>
              </div>
            )}

            {/* Autres annonces */}
            {relatedPosts.length > 0 && (
              <div className="other-posts-section">
                <h3>Autres annonces</h3>
                <div className="other-posts-grid">
                  {relatedPosts.map((relatedPost) => (
                    <PostCard key={relatedPost.id} post={relatedPost} viewMode="grid" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barre d'action fixe en bas */}
        <div className="post-action-bar">
          <button className="post-action-btn post-action-btn-message" onClick={handleMessage}>
            <MessageCircle size={20} />
            Message
          </button>
          <button className="post-action-btn post-action-btn-primary" onClick={handleApply}>
            Candidater
          </button>
        </div>

        {/* Modal de confirmation de suppression */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Supprimer l'annonce ?</h3>
              <p>Cette action est irréversible.</p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                  Annuler
                </button>
                <button className="btn-confirm" onClick={handleDelete}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default PostDetails

