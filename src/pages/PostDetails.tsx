import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, Share, MessageCircle, MapPin, Check, X, Navigation, ImageOff } from 'lucide-react'
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
  payment_type?: string | null
  media_type?: string | null
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
  const [matchRequest, setMatchRequest] = useState<{
    id: string
    status: string
  } | null>(null)
  const [showSendRequestModal, setShowSendRequestModal] = useState(false)
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false)
  const [loadingRequest, setLoadingRequest] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
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
      if (user) {
        checkMatchRequest()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post])

  // Réinitialiser l'index quand les images changent
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [post?.images])

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

  const checkMatchRequest = async () => {
    if (!user || !id || !post) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('match_requests') as any)
        .select('id, status')
        .eq('from_user_id', user.id)
        .eq('related_post_id', id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking match request:', error)
        return
      }

      if (data) {
        setMatchRequest({ id: data.id, status: data.status })
      } else {
        setMatchRequest(null)
      }
    } catch (error) {
      console.error('Error checking match request:', error)
    }
  }

  const handleApply = () => {
    if (!user) {
      navigate('/auth/login')
      return
    }

    // Si la demande est acceptée, ne rien faire
    if (matchRequest && matchRequest.status === 'accepted') {
      return
    }

    // Si une demande est déjà envoyée, afficher la modal d'annulation
    if (matchRequest && matchRequest.status === 'pending') {
      setShowCancelRequestModal(true)
      return
    }

    // Sinon, afficher la modal d'envoi de demande
    setShowSendRequestModal(true)
  }

  const handleSendRequest = async () => {
    if (!user || !id || !post) return

    setLoadingRequest(true)
    try {
      const { data, error } = await (supabase.from('match_requests') as any)
        .insert({
          from_user_id: user.id,
          to_user_id: post.user_id,
          related_post_id: id,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending match request:', error)
        alert(`Erreur lors de l'envoi de la demande: ${error.message}`)
        setLoadingRequest(false)
        return
      }

      if (data) {
        setMatchRequest({ id: data.id, status: data.status })
        setShowSendRequestModal(false)
      }
    } catch (error) {
      console.error('Error sending match request:', error)
      alert('Erreur lors de l\'envoi de la demande')
    } finally {
      setLoadingRequest(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!matchRequest || !user || !matchRequest.id) return

    setLoadingRequest(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('match_requests') as any)
        .update({ status: 'cancelled' })
        .eq('id', matchRequest.id)
        .eq('from_user_id', user.id)

      if (error) {
        console.error('Error cancelling match request:', error)
        alert(`Erreur lors de l'annulation: ${error.message}`)
        setLoadingRequest(false)
        return
      }

      setMatchRequest(null)
      setShowCancelRequestModal(false)
    } catch (error) {
      console.error('Error cancelling match request:', error)
      alert('Erreur lors de l\'annulation de la demande')
    } finally {
      setLoadingRequest(false)
    }
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

  const hasAddress = post.location_address || (post.location_lat && post.location_lng)

  // Fonctions pour le swipe des images
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }
    if (isRightSwipe && images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

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
                <Share size={20} />
              </button>
              <button className="post-header-action-btn post-header-like-btn" onClick={handleLike}>
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>

        {/* Carrousel d'images avec swipe */}
        <div 
          className="post-hero-image"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {images.length > 0 ? (
            <>
              <div 
                className="post-hero-image-carousel"
                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
              >
                {images.map((image, index) => (
                  <div key={index} className="post-hero-image-slide">
                    <img src={image} alt={`${post.title} - Image ${index + 1}`} />
                  </div>
                ))}
              </div>
              {/* Compteur d'images */}
              {images.length > 1 && (
                <div className="post-hero-image-counter">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
              {/* Indicateurs de pagination */}
              {images.length > 1 && (
                <div className="post-hero-image-indicators">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`post-hero-image-indicator ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`Aller à l'image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="post-hero-image-placeholder">
              <ImageOff size={64} />
            </div>
          )}
          {/* Badge catégorie en haut à gauche */}
          {post.category && (
            <div className="post-hero-category-badge">{post.category.name}</div>
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
            </div>

            {/* Informations sous le titre */}
            <div className="post-title-meta">
              {post.location && (
                <span className="post-title-meta-item">
                  <MapPin size={16} /> {post.location}
                </span>
              )}
              {post.payment_type && (
                <span className="post-title-meta-item">
                  {post.payment_type === 'benevole' ? 'Bénévole' : 
                   post.payment_type === 'prix' ? 'Payant' : 
                   post.payment_type === 'echange' ? 'Échange' : 
                   post.payment_type === 'pourcentage' ? 'Pourcentage' : 
                   post.payment_type}
                </span>
              )}
              <span className="post-title-meta-item">
                Publié {formatRelativeDate(post.created_at)}
              </span>
              {post.needed_date && (
                <span className="post-title-meta-item">
                  Pour le {new Date(post.needed_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              )}
            </div>

            {/* Prix en grand */}
            {post.price && (
              <div className="post-price-main">{post.price} €</div>
            )}

            {/* Informations secondaires */}
            <div className="post-meta-info">
              <span className="post-meta-item">
                {formatRelativeDate(post.created_at)}
              </span>
            </div>

            {/* Bouton d'action - Faire une demande */}
            {!isOwner && (
              <div className="post-action-buttons-section">
                <button 
                  className={`post-action-button post-action-button-apply ${matchRequest?.status === 'pending' ? 'post-action-button-sent' : matchRequest?.status === 'accepted' ? 'post-action-button-accepted' : ''}`}
                  onClick={handleApply}
                  disabled={loadingRequest || matchRequest?.status === 'accepted'}
                >
                  {matchRequest?.status === 'pending' ? (
                    'Demande envoyée'
                  ) : matchRequest?.status === 'accepted' ? (
                    'Demande acceptée'
                  ) : (
                    'Faire une demande'
                  )}
                </button>
              </div>
            )}

            {/* Profil de l'auteur */}
            {post.user && (
              <div className="author-section">
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

            {/* Description */}
            <div className="post-description-section">
              <h3 className="post-description-title">Description</h3>
              <p className="post-description-text">{post.description}</p>
            </div>

            {/* Toutes les autres informations */}
            <div className="post-additional-info-section">
              {/* Catégorie et sous-catégorie */}
              {(post.category || post.sub_category) && (
                <div className="post-info-item">
                  <span className="post-info-label">Catégorie :</span>
                  <span className="post-info-value">
                    {post.category?.name}
                    {post.sub_category && ` > ${post.sub_category.name}`}
                  </span>
                </div>
              )}

              {/* Réseau social */}
              {post.media_type && (
                <div className="post-info-item">
                  <span className="post-info-label">Réseau :</span>
                  <span className="post-info-value">{post.media_type}</span>
                </div>
              )}

              {/* Moyen de paiement */}
              {post.payment_type && (
                <div className="post-info-item">
                  <span className="post-info-label">Moyen de paiement :</span>
                  <span className="post-info-value">
                    {post.payment_type === 'benevole' ? 'Bénévole' : 
                     post.payment_type === 'prix' ? 'Payant' : 
                     post.payment_type === 'echange' ? 'Échange' : 
                     post.payment_type === 'pourcentage' ? 'Pourcentage' : 
                     post.payment_type}
                  </span>
                </div>
              )}

              {/* Localisation */}
              {post.location && (
                <div className="post-info-item">
                  <span className="post-info-label">Localisation :</span>
                  <span className="post-info-value">
                    <MapPin size={16} /> {post.location}
                  </span>
                </div>
              )}

              {/* Adresse complète */}
              {hasAddress && (
                <div className="post-info-item">
                  <span className="post-info-label">Adresse :</span>
                  <div className="post-info-value">
                    {post.location_address && (
                      <div className="post-address-text">
                        <MapPin size={16} />
                        <span>{post.location_address}</span>
                      </div>
                    )}
                    {post.location_lat && post.location_lng && (
                      <div className="post-address-coords">
                        {post.location_lat.toFixed(6)}, {post.location_lng.toFixed(6)}
                      </div>
                    )}
                    {post.location_lat && post.location_lng && (
                      <button className="post-address-nav-btn-small" onClick={handleOpenNavigation}>
                        <Navigation size={18} />
                        Itinéraire
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Date nécessaire */}
              {post.needed_date && (
                <div className="post-info-item">
                  <span className="post-info-label">Date nécessaire :</span>
                  <span className="post-info-value">
                    {new Date(post.needed_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}

              {/* Nombre de personnes */}
              {post.number_of_people && (
                <div className="post-info-item">
                  <span className="post-info-label">Nombre de personnes :</span>
                  <span className="post-info-value">{post.number_of_people} personne{post.number_of_people > 1 ? 's' : ''}</span>
                </div>
              )}

              {/* Livraison disponible */}
              {post.delivery_available && (
                <div className="post-info-item">
                  <span className="post-info-label">Livraison :</span>
                  <span className="post-info-value">Disponible</span>
                </div>
              )}
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

        {/* Modal de confirmation d'envoi de demande */}
        {showSendRequestModal && (
          <div className="modal-overlay" onClick={() => setShowSendRequestModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Envoyer une demande de match ?</h3>
              <p>
                Vous allez envoyer une demande de match à l'auteur de cette annonce. 
                Si votre demande est acceptée, vous pourrez commencer à échanger avec cette personne.
              </p>
              <div className="modal-actions">
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowSendRequestModal(false)}
                  disabled={loadingRequest}
                >
                  Annuler
                </button>
                <button 
                  className="btn-confirm" 
                  onClick={handleSendRequest}
                  disabled={loadingRequest}
                >
                  {loadingRequest ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation d'annulation de demande */}
        {showCancelRequestModal && (
          <div className="modal-overlay" onClick={() => setShowCancelRequestModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Annuler cette demande ?</h3>
              <p>
                Vous allez annuler la demande de match que vous avez envoyée. 
                Vous pourrez toujours renvoyer une nouvelle demande plus tard.
              </p>
              <div className="modal-actions">
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowCancelRequestModal(false)}
                  disabled={loadingRequest}
                >
                  Non, garder la demande
                </button>
                <button 
                  className="btn-confirm" 
                  onClick={handleCancelRequest}
                  disabled={loadingRequest}
                >
                  {loadingRequest ? 'Annulation...' : 'Oui, annuler'}
                </button>
              </div>
            </div>
          </div>
        )}

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

