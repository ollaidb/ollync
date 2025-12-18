import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Heart, X, Tag, MessageCircle, Search, Bell } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import BackButton from '../components/BackButton'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import { formatRelativeDate } from '../utils/profileHelpers'
import './SwipePage.css'

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
  is_urgent?: boolean
  status: string
  user_id: string
  user?: {
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
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

const SwipePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const categoryId = searchParams.get('category')
  const subCategoryId = searchParams.get('subcategory')

  const [posts, setPosts] = useState<Post[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [undoAvailable, setUndoAvailable] = useState(false)
  const [lastSwipeAction, setLastSwipeAction] = useState<'left' | 'right' | 'up' | null>(null)
  const [lastSwipedPost, setLastSwipedPost] = useState<Post | null>(null)

  const SWIPE_DELAY = 400 // Délai en ms avant de passer au post suivant

  useEffect(() => {
    fetchPosts()
  }, [categoryId, subCategoryId])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const fetchedPosts = await fetchPostsWithRelations({
        categoryId: categoryId || undefined,
        subCategoryId: subCategoryId || undefined,
        status: 'active',
        limit: 100,
        orderBy: 'created_at',
        orderDirection: 'desc'
      })

      if (!user) {
        // Si l'utilisateur n'est pas connecté, afficher tous les posts (sauf ceux qui sont désactivés)
        setPosts(fetchedPosts as Post[])
        setLoading(false)
        return
      }

      // Si l'utilisateur est connecté, filtrer ses propres annonces
      // Les annonces de l'utilisateur seront affichées dans son profil, pas dans Swipe

      // Récupérer les posts déjà swipés (match_requests, interests et ignored)
      // On récupère toutes les demandes envoyées (peu importe le statut) pour ne pas les re-afficher
      const [matchRequestsResult, interestsResult, ignoredResult] = await Promise.all([
        (supabase.from('match_requests') as any)
          .select('related_post_id')
          .eq('from_user_id', user.id), // Toutes les demandes envoyées par l'utilisateur
        (supabase.from('interests') as any)
          .select('post_id')
          .eq('user_id', user.id),
        (supabase.from('ignored_posts') as any)
          .select('post_id')
          .eq('user_id', user.id)
      ])

      // Créer un Set avec tous les IDs de posts déjà swipés
      const swipedPostIds = new Set([
        ...(matchRequestsResult.data?.map((mr: any) => mr.related_post_id).filter(Boolean) || []),
        ...(interestsResult.data?.map((i: any) => i.post_id) || []),
        ...(ignoredResult.data?.map((i: any) => i.post_id) || [])
      ])

      // Filtrer les posts déjà swipés et les posts de l'utilisateur
      const filteredPosts = (fetchedPosts as Post[]).filter(post => 
        !swipedPostIds.has(post.id) && post.user_id !== user.id
      )

      setPosts(filteredPosts)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentPost = posts[currentIndex]

  // Handlers pour chaque direction
  const handleSwipeRight = async () => {
    if (!currentPost || !user) {
      navigate('/auth/login')
      return
    }

    // Ne pas créer de demande si l'utilisateur swipe sur sa propre annonce
    if (currentPost.user_id === user.id) {
      return // Ne rien faire, l'annonce ne devrait pas apparaître de toute façon
    }

    try {
      // Vérifier si une demande existe déjà pour cette annonce
      const { data: existingRequest, error: checkError } = await (supabase.from('match_requests') as any)
        .select('id, status')
        .eq('from_user_id', user.id)
        .eq('related_post_id', currentPost.id)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing match request:', checkError)
      }

      // Si une demande existe déjà (même si elle a été acceptée ou refusée), ne pas en créer une nouvelle
      if (existingRequest) {
        // Afficher un message informatif selon le statut
        if (existingRequest.status === 'pending') {
          alert('Vous avez déjà envoyé une demande pour cette annonce. Elle est en attente de réponse.')
        } else if (existingRequest.status === 'accepted') {
          alert('Vous avez déjà une demande acceptée pour cette annonce. Vous pouvez démarrer une conversation depuis l\'onglet Match.')
        } else if (existingRequest.status === 'declined') {
          alert('Votre demande pour cette annonce a été refusée.')
        } else if (existingRequest.status === 'cancelled') {
          alert('Vous avez annulé votre demande pour cette annonce.')
        }
        
        // Passer au post suivant sans créer de nouvelle demande
        setLastSwipeAction('right')
        setLastSwipedPost(currentPost)
        setTimeout(() => {
          nextPost()
        }, SWIPE_DELAY)
        return
      }

      // Créer une demande de match (match_request)
      const { error: matchRequestError } = await (supabase.from('match_requests') as any)
        .insert({
          from_user_id: user.id,
          to_user_id: currentPost.user_id,
          related_post_id: currentPost.id,
          status: 'pending'
        })
        .select()
        .single()

      if (matchRequestError) {
        // Si la demande existe déjà (code 23505 = unique constraint violation)
        if (matchRequestError.code === '23505') {
          alert('Vous avez déjà envoyé une demande pour cette annonce. Vous ne pouvez pas envoyer plusieurs demandes pour la même annonce.')
          // Passer au post suivant sans créer de nouvelle demande
          setLastSwipeAction('right')
          setLastSwipedPost(currentPost)
          setTimeout(() => {
            nextPost()
          }, SWIPE_DELAY)
          return
        }
        console.error('Error creating match request:', matchRequestError)
        // Essayer quand même d'ajouter aux interests pour compatibilité
        await (supabase.from('interests') as any)
          .insert({
            user_id: user.id,
            post_id: currentPost.id
          })
          .select()
          .single()
          .catch(() => {
            // Ignorer l'erreur si l'interest existe déjà
          })
      }

      // Ajouter aussi un like (pour compatibilité avec le système existant)
      await (supabase.from('likes') as any)
        .insert({
          user_id: user.id,
          post_id: currentPost.id
        })
        .select()
        .single()
        .catch(() => {
          // Ignorer l'erreur si le like existe déjà
        })

      setLastSwipeAction('right')
      setLastSwipedPost(currentPost)
      setUndoAvailable(true)
      setTimeout(() => setUndoAvailable(false), 3000)

      // Délai avant de passer au post suivant
      setTimeout(() => {
        nextPost()
      }, SWIPE_DELAY)
    } catch (error) {
      console.error('Error in handleSwipeRight:', error)
      // En cas d'erreur, passer quand même au suivant après le délai
      setTimeout(() => {
        nextPost()
      }, SWIPE_DELAY)
    }
  }

  const handleSwipeLeft = async () => {
    if (!currentPost) return

    // Enregistrer comme ignoré si l'utilisateur est connecté
    if (user) {
      try {
        await (supabase.from('ignored_posts') as any)
          .insert({
            user_id: user.id,
            post_id: currentPost.id
          })
          .select()
          .single()
      } catch (error) {
        // Ignorer l'erreur si c'est un doublon
        console.error('Error adding ignored post:', error)
      }
    }

    setLastSwipeAction('left')
    setLastSwipedPost(currentPost)
    setUndoAvailable(true)
    setTimeout(() => setUndoAvailable(false), 3000)

    // Délai avant de passer au post suivant
    setTimeout(() => {
      nextPost()
    }, SWIPE_DELAY)
  }

  // handleSwipeUp supprimé car non utilisé

  const nextPost = () => {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      // Plus de posts, recharger ou afficher message
      fetchPosts()
      setCurrentIndex(0)
    }
  }

  const handleUndo = async () => {
    if (!lastSwipedPost || !lastSwipeAction || !user) return

    // Revenir au post précédent
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }

      // Annuler l'action si nécessaire
    try {
      if (lastSwipeAction === 'right') {
        await Promise.all([
          // Supprimer la demande de match (si elle existe et est encore en pending)
          (supabase.from('match_requests') as any)
            .delete()
            .eq('from_user_id', user.id)
            .eq('related_post_id', lastSwipedPost.id)
            .eq('status', 'pending'),
          // Supprimer l'interest (pour compatibilité)
          (supabase.from('interests') as any)
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', lastSwipedPost.id),
          // Supprimer le like
          (supabase.from('likes') as any)
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', lastSwipedPost.id)
        ])
      } else if (lastSwipeAction === 'left') {
        await (supabase.from('ignored_posts') as any)
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', lastSwipedPost.id)
      } else if (lastSwipeAction === 'up') {
        await (supabase.from('favorites') as any)
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', lastSwipedPost.id)
      }
    } catch (error) {
      console.error('Error undoing action:', error)
    }

    setUndoAvailable(false)
    setLastSwipeAction(null)
    setLastSwipedPost(null)
  }


  if (loading) {
    return (
      <div className="swipe-page">
        <div className="swipe-loading">
          <p>Chargement des annonces...</p>
        </div>
      </div>
    )
  }

  if (!currentPost) {
    return (
      <div className="swipe-page">
        <div className="swipe-empty">
          <p>Aucune annonce disponible</p>
          <button onClick={() => navigate('/home')} className="swipe-btn-primary">
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  const mainImage = currentPost.images && currentPost.images.length > 0 
    ? currentPost.images[0] 
    : null

  return (
    <div className="swipe-page">
      {/* Header avec recherche, catégorie et notification */}
      <div className="swipe-header">
        <BackButton className="swipe-back-button" />
        <button 
          className="swipe-header-search"
          onClick={() => navigate('/search')}
          aria-label="Rechercher"
        >
          <Search size={24} />
        </button>
        <div className="swipe-header-category">
          <div className="swipe-header-category-name">
            {currentPost?.category?.name || 'categorie'}
          </div>
          <div className="swipe-header-subcategory-name">
            {currentPost?.sub_category?.name || 'sous categorie'}
          </div>
        </div>
        <button 
          className="swipe-header-notification"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
        >
          <Bell size={24} />
        </button>
      </div>

      {/* Contenu principal scrollable */}
      <div className="swipe-content">
        {/* Section 2: Titre de l'annonce */}
        <div className="swipe-title-section">
          <h1 className="swipe-post-title">{currentPost.title}</h1>
        </div>

        {/* Section 3: Image avec badges et boutons */}
        <div className="swipe-image-section">
          {mainImage ? (
            <div className="swipe-main-image">
              <img src={mainImage} alt={currentPost.title} />
              {/* Badges en haut */}
              <div className="swipe-image-badges">
                {currentPost.location && (
                  <div className="swipe-image-badge swipe-badge-location">
                    {currentPost.location}
                  </div>
                )}
                <div className="swipe-image-badge swipe-badge-date">
                  {formatRelativeDate(currentPost.created_at)}
                </div>
              </div>
              {/* Boutons d'action en bas de l'image */}
              <div className="swipe-image-actions">
                <button
                  className="swipe-image-action-btn swipe-image-reject"
                  onClick={handleSwipeLeft}
                  aria-label="Pas intéressé"
                >
                  <X size={24} />
                </button>
                <button
                  className="swipe-image-action-btn swipe-image-message"
                  onClick={() => navigate(`/messages/new?post=${currentPost.id}`)}
                  aria-label="Message"
                >
                  <MessageCircle size={24} />
                </button>
                <button
                  className="swipe-image-action-btn swipe-image-like"
                  onClick={handleSwipeRight}
                  aria-label="Intéressé"
                >
                  <Heart size={24} />
                </button>
              </div>
            </div>
          ) : (
            <div className="swipe-main-image-placeholder">
              <Tag size={48} />
              {/* Badges en haut */}
              <div className="swipe-image-badges">
                {currentPost.location && (
                  <div className="swipe-image-badge swipe-badge-location">
                    {currentPost.location}
                  </div>
                )}
                <div className="swipe-image-badge swipe-badge-date">
                  {formatRelativeDate(currentPost.created_at)}
                </div>
              </div>
              {/* Boutons d'action en bas */}
              <div className="swipe-image-actions">
                <button
                  className="swipe-image-action-btn swipe-image-reject"
                  onClick={handleSwipeLeft}
                  aria-label="Pas intéressé"
                >
                  <X size={24} />
                </button>
                <button
                  className="swipe-image-action-btn swipe-image-message"
                  onClick={() => navigate(`/messages/new?post=${currentPost.id}`)}
                  aria-label="Message"
                >
                  <MessageCircle size={24} />
                </button>
                <button
                  className="swipe-image-action-btn swipe-image-like"
                  onClick={handleSwipeRight}
                  aria-label="Intéressé"
                >
                  <Heart size={24} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Description et informations scrollables */}
        <div className="swipe-description-section">
          <div className="swipe-description-content">
            <h3 className="swipe-description-label">Description</h3>
            <p className="swipe-description-text">{currentPost.description}</p>
            
            {/* Informations supplémentaires */}
            {currentPost.price && (
              <div className="swipe-info-item">
                <span className="swipe-info-label">Prix:</span>
                <span className="swipe-info-value">{currentPost.price} €</span>
              </div>
            )}
            
            {currentPost.needed_date && (
              <div className="swipe-info-item">
                <span className="swipe-info-label">Date souhaitée:</span>
                <span className="swipe-info-value">
                  {new Date(currentPost.needed_date).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            
            {currentPost.number_of_people && (
              <div className="swipe-info-item">
                <span className="swipe-info-label">Nombre de personnes:</span>
                <span className="swipe-info-value">
                  {currentPost.number_of_people} personne{currentPost.number_of_people > 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            {currentPost.delivery_available && (
              <div className="swipe-info-item">
                <span className="swipe-info-label">Livraison:</span>
                <span className="swipe-info-value">Disponible</span>
              </div>
            )}
            
            {currentPost.is_urgent && (
              <div className="swipe-info-item">
                <span className="swipe-info-label">Statut:</span>
                <span className="swipe-info-value urgent-badge">Urgent</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Profil utilisateur */}
        {currentPost.user && (
          <div 
            className="swipe-user-section"
            onClick={() => navigate(`/profile/public/${currentPost.user_id}`)}
          >
            <div className="swipe-user-avatar">
              {currentPost.user.avatar_url ? (
                <img 
                  src={currentPost.user.avatar_url} 
                  alt={currentPost.user.username || 'Utilisateur'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentPost.user?.username || 'U')
                  }}
                />
              ) : (
                <div className="swipe-user-avatar-placeholder">
                  {(currentPost.user.username?.[0] || currentPost.user.full_name?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>
            <div className="swipe-user-name">
              {currentPost.user.username || currentPost.user.full_name || 'nom utilisateur'}
            </div>
          </div>
        )}
      </div>

      {/* Bouton undo */}
      {undoAvailable && (
        <div className="swipe-undo">
          <button onClick={handleUndo} className="swipe-undo-btn">
            Annuler
          </button>
        </div>
      )}
    </div>
  )
}

export default SwipePage

