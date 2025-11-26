import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, Share2, MessageCircle, MapPin, Calendar, Users, Euro, Edit, Trash2, Archive, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import HeaderSimple from '../components/HeaderSimple'
import Footer from '../components/Footer'
import PostCard from '../components/PostCard'
import { useAuth } from '../hooks/useSupabase'
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

  useEffect(() => {
    if (id) {
      fetchPost()
      if (user) {
        checkLiked()
        fetchApplications()
      }
    }
  }, [id, user])

  const fetchPost = async () => {
    if (!id) return

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, bio),
        category:categories!posts_category_id_fkey(name, slug),
        sub_category:sub_categories!posts_sub_category_id_fkey(name, slug)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching post:', error)
      setLoading(false)
      return
    }

    if (data) {
      setPost(data)
      // Incrémenter les vues
      await supabase.rpc('increment', { row_id: id, table_name: 'posts', column_name: 'views_count' })
        .catch(() => {
          // Fallback si la fonction n'existe pas
          supabase.from('posts').update({ views_count: (data.views_count || 0) + 1 }).eq('id', id)
        })
    }
    setLoading(false)
  }

  const checkLiked = async () => {
    if (!user || !id) return

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', id)
      .single()

    setLiked(!!data)
  }

  const handleLike = async () => {
    if (!user || !id) {
      navigate('/auth/login')
      return
    }

    try {
      if (liked) {
        await supabase.from('likes').delete().match({ user_id: user.id, post_id: id })
        setLiked(false)
        if (post) setPost({ ...post, likes_count: Math.max(0, post.likes_count - 1) })
      } else {
        await supabase.from('likes').insert({ user_id: user.id, post_id: id })
        setLiked(true)
        if (post) setPost({ ...post, likes_count: post.likes_count + 1 })
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
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Lien copié dans le presse-papier')
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
      const { error } = await supabase
        .from('posts')
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
      const { error } = await supabase
        .from('applications')
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
      const { error } = await supabase
        .from('applications')
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
            <div className="other-posts-section">
              <h3>Autres annonces</h3>
              <div className="other-posts-grid">
                {/* Les autres annonces seront chargées ici */}
              </div>
            </div>
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

