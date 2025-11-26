import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, Share2, MessageCircle, MapPin, Calendar, Users, Edit, Trash2, Archive, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import HeaderSimple from '../components/HeaderSimple'
import Footer from '../components/Footer'
import PostCard from '../components/PostCard'
import { useAuth } from '../hooks/useSupabase'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import './PostDetails.css'

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
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

  const handleRespond = () => {
    if (!user) {
      navigate('/auth/login')
      return
    }
    // Créer une conversation et rediriger vers les messages
    navigate(`/messages/new?post=${id}`)
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

  const handleEdit = () => {
    navigate(`/publier-annonce?edit=${id}`)
  }

  const handleArchive = async () => {
    if (!id || !user || post?.user_id !== user.id) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('posts') as any)
        .update({ status: 'archived' })
        .eq('id', id)

      if (error) throw error
      navigate('/home')
    } catch (error) {
      console.error('Error archiving post:', error)
      alert('Erreur lors de l\'archivage')
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
  const hasMultipleImages = images.length > 1

  if (loading) {
    return (
      <div className="app">
        <HeaderSimple title="Détails" />
        <main className="main-content without-header">
          <div className="loading-container">
            <p>Chargement...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="app">
        <HeaderSimple title="Détails" />
        <main className="main-content without-header">
          <div className="empty-state">
            <p>Annonce introuvable</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="app">
      <HeaderSimple title="Détails de l'annonce" />
      <main className="main-content without-header">
        <div className="post-details">
          {/* Carrousel d'images */}
          {images.length > 0 && (
            <div className="post-images">
              <div className="image-container">
                <img src={images[currentImageIndex]} alt={post.title} />
                {hasMultipleImages && (
                  <>
                    <button
                      className="image-nav prev"
                      onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      className="image-nav next"
                      onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    >
                      <ChevronRight size={24} />
                    </button>
                    <div className="image-indicators">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="post-content">
            <div className="post-header">
              <h1 className="post-title">{post.title}</h1>
              {post.price && (
                <div className="post-price">{post.price} €</div>
              )}
            </div>

            <div className="post-info">
              {post.category && (
                <span className="post-category">{post.category.name}</span>
              )}
              {post.sub_category && (
                <span className="post-subcategory">{post.sub_category.name}</span>
              )}
              {post.location && (
                <span className="post-location">
                  <MapPin size={16} /> {post.location}
                </span>
              )}
              {post.needed_date && (
                <span className="post-date">
                  <Calendar size={16} /> {new Date(post.needed_date).toLocaleDateString('fr-FR')}
                </span>
              )}
              {post.number_of_people && (
                <span className="post-people">
                  <Users size={16} /> {post.number_of_people} personne{post.number_of_people > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="post-description">
              <h3>Description</h3>
              <p>{post.description}</p>
            </div>

            {post.delivery_available && (
              <div className="post-badge">Livraison possible</div>
            )}

            <div className="post-actions">
              <button
                className={`action-btn like ${liked ? 'active' : ''}`}
                onClick={handleLike}
              >
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                <span>{post.likes_count}</span>
              </button>
              <button className="action-btn" onClick={handleShare}>
                <Share2 size={20} />
                Partager
              </button>
              <button className="action-btn" onClick={handleRespond}>
                <MessageCircle size={20} />
                Répondre
              </button>
              {isOwner && (
                <>
                  <button className="action-btn" onClick={handleEdit}>
                    <Edit size={20} />
                    Éditer
                  </button>
                  <button className="action-btn" onClick={handleArchive}>
                    <Archive size={20} />
                    Archiver
                  </button>
                  <button
                    className="action-btn danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={20} />
                    Supprimer
                  </button>
                </>
              )}
            </div>

            {/* Section candidatures pour les matchs */}
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
                <Link to={`/profile/${post.user.id}`} className="author-card">
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
      </main>
      <Footer />
    </div>
  )
}

export default PostDetails

