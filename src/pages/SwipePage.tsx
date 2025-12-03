import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Heart, X, Star, ChevronDown, MapPin, Clock, Tag, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import { formatRelativeDate } from '../utils/profileHelpers'
import BackButton from '../components/BackButton'
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

interface SwipeState {
  x: number
  y: number
  startX: number
  startY: number
  isDragging: boolean
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
  const [swipeState, setSwipeState] = useState<SwipeState>({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    isDragging: false
  })
  const [showDetails, setShowDetails] = useState(false)
  const [undoAvailable, setUndoAvailable] = useState(false)
  const [lastSwipeAction, setLastSwipeAction] = useState<'left' | 'right' | 'up' | null>(null)
  const [lastSwipedPost, setLastSwipedPost] = useState<Post | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const SWIPE_THRESHOLD = 100
  const ROTATION_FACTOR = 0.1

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
        setPosts(fetchedPosts as Post[])
        setLoading(false)
        return
      }

      // Récupérer les posts déjà swipés (interests et ignored)
      const [interestsResult, ignoredResult] = await Promise.all([
        supabase
          .from('interests')
          .select('post_id')
          .eq('user_id', user.id),
        supabase
          .from('ignored_posts')
          .select('post_id')
          .eq('user_id', user.id)
      ])

      const swipedPostIds = new Set([
        ...(interestsResult.data?.map(i => i.post_id) || []),
        ...(ignoredResult.data?.map(i => i.post_id) || [])
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

  // Gestion des événements tactiles et souris
  const handleStart = (clientX: number, clientY: number) => {
    setSwipeState({
      x: 0,
      y: 0,
      startX: clientX,
      startY: clientY,
      isDragging: true
    })
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!swipeState.isDragging) return

    const deltaX = clientX - swipeState.startX
    const deltaY = clientY - swipeState.startY

    setSwipeState(prev => ({
      ...prev,
      x: deltaX,
      y: deltaY
    }))
  }

  const handleEnd = () => {
    if (!swipeState.isDragging) return

    const { x, y } = swipeState
    const absX = Math.abs(x)
    const absY = Math.abs(y)

    // Déterminer la direction du swipe
    if (absX > absY && absX > SWIPE_THRESHOLD) {
      // Swipe horizontal
      if (x > 0) {
        handleSwipeRight()
      } else {
        handleSwipeLeft()
      }
    } else if (absY > absX && absY > SWIPE_THRESHOLD) {
      // Swipe vertical
      if (y < 0) {
        handleSwipeUp()
      } else {
        handleSwipeDown()
      }
    } else {
      // Pas assez de mouvement, réinitialiser
      resetSwipe()
    }
  }

  const resetSwipe = () => {
    setSwipeState({
      x: 0,
      y: 0,
      startX: 0,
      startY: 0,
      isDragging: false
    })
  }

  // Handlers pour chaque direction
  const handleSwipeRight = async () => {
    if (!currentPost || !user) {
      navigate('/auth/login')
      return
    }

    try {
      // Ajouter aux interests
      const { error: interestError } = await supabase
        .from('interests')
        .insert({
          user_id: user.id,
          post_id: currentPost.id
        })
        .select()
        .single()

      if (interestError && interestError.code !== '23505') {
        console.error('Error adding interest:', interestError)
      }

      // Ajouter aussi un like (pour compatibilité)
      await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          post_id: currentPost.id
        })
        .select()
        .single()

      setLastSwipeAction('right')
      setLastSwipedPost(currentPost)
      setUndoAvailable(true)
      setTimeout(() => setUndoAvailable(false), 3000)

      nextPost()
    } catch (error) {
      console.error('Error in handleSwipeRight:', error)
    }
  }

  const handleSwipeLeft = async () => {
    if (!currentPost) return

    // Enregistrer comme ignoré si l'utilisateur est connecté
    if (user) {
      try {
        await supabase
          .from('ignored_posts')
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

    nextPost()
  }

  const handleSwipeUp = async () => {
    if (!currentPost || !user) {
      navigate('/auth/login')
      return
    }

    try {
      // Ajouter aux favoris
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          post_id: currentPost.id
        })
        .select()
        .single()

      if (error && error.code !== '23505') {
        console.error('Error adding favorite:', error)
      }

      setLastSwipeAction('up')
      setLastSwipedPost(currentPost)
      setUndoAvailable(true)
      setTimeout(() => setUndoAvailable(false), 3000)

      nextPost()
    } catch (error) {
      console.error('Error in handleSwipeUp:', error)
    }
  }

  const handleSwipeDown = () => {
    if (!currentPost) return
    setShowDetails(true)
    resetSwipe()
  }

  const nextPost = () => {
    resetSwipe()
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
          supabase
            .from('interests')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', lastSwipedPost.id),
          supabase
            .from('likes')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', lastSwipedPost.id)
        ])
      } else if (lastSwipeAction === 'left') {
        await supabase
          .from('ignored_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', lastSwipedPost.id)
      } else if (lastSwipeAction === 'up') {
        await supabase
          .from('favorites')
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

  // Handlers pour souris/tactile
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (swipeState.isDragging) {
      handleMove(e.clientX, e.clientY)
    }
  }

  const onMouseUp = () => {
    if (swipeState.isDragging) {
      handleEnd()
    }
  }

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (swipeState.isDragging) {
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }
  }

  const onTouchEnd = () => {
    if (swipeState.isDragging) {
      handleEnd()
    }
  }

  // Calcul de la transformation CSS
  const getCardStyle = () => {
    const rotation = swipeState.x * ROTATION_FACTOR
    return {
      transform: `translate(${swipeState.x}px, ${swipeState.y}px) rotate(${rotation}deg)`,
      opacity: swipeState.isDragging ? 0.95 : 1
    }
  }

  // Indicateurs visuels selon la direction
  const getSwipeIndicator = () => {
    if (!swipeState.isDragging) return null
    
    const { x, y } = swipeState
    const absX = Math.abs(x)
    const absY = Math.abs(y)

    if (absX > absY && absX > 50) {
      return x > 0 ? 'right' : 'left'
    }
    if (absY > absX && absY > 50) {
      return y < 0 ? 'up' : 'down'
    }
    return null
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

  const swipeIndicator = getSwipeIndicator()

  return (
    <div className="swipe-page">
      {/* Header minimal */}
      <div className="swipe-header">
        <BackButton />
        <div className="swipe-header-info">
          <span className="swipe-counter">
            {currentIndex + 1} / {posts.length}
          </span>
        </div>
      </div>

      {/* Zone de swipe */}
      <div className="swipe-container">
        {/* Indicateurs de direction */}
        {swipeIndicator === 'right' && (
          <div className="swipe-indicator swipe-indicator-right active">
            <Heart size={60} />
            <span>Intéressé</span>
          </div>
        )}
        {swipeIndicator === 'left' && (
          <div className="swipe-indicator swipe-indicator-left active">
            <X size={60} />
            <span>Pas intéressé</span>
          </div>
        )}
        {swipeIndicator === 'up' && (
          <div className="swipe-indicator swipe-indicator-up active">
            <Star size={60} />
            <span>Sauvegarder</span>
          </div>
        )}
        {swipeIndicator === 'down' && (
          <div className="swipe-indicator swipe-indicator-down active">
            <ChevronDown size={60} />
            <span>Voir détails</span>
          </div>
        )}

        {/* Carte principale */}
        <div
          ref={cardRef}
          className="swipe-card"
          style={getCardStyle()}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Image principale */}
          {mainImage ? (
            <div className="swipe-card-image">
              <img src={mainImage} alt={currentPost.title} />
              {currentPost.is_urgent && (
                <div className="swipe-card-urgent">URGENT</div>
              )}
            </div>
          ) : (
            <div className="swipe-card-image-placeholder">
              <Tag size={48} />
            </div>
          )}

          {/* Contenu de la carte */}
          <div className="swipe-card-content">
            <div className="swipe-card-header">
              <h2 className="swipe-card-title">{currentPost.title}</h2>
              {currentPost.category && (
                <span className="swipe-card-category">{currentPost.category.name}</span>
              )}
            </div>

            {/* Informations rapides */}
            <div className="swipe-card-meta">
              {currentPost.location && (
                <div className="swipe-card-meta-item">
                  <MapPin size={16} />
                  <span>{currentPost.location}</span>
                </div>
              )}
              <div className="swipe-card-meta-item">
                <Clock size={16} />
                <span>{formatRelativeDate(currentPost.created_at)}</span>
              </div>
              {currentPost.price && (
                <div className="swipe-card-price">
                  {currentPost.price} €
                </div>
              )}
            </div>

            {/* Description courte */}
            <p className="swipe-card-description">
              {currentPost.description.length > 150
                ? `${currentPost.description.substring(0, 150)}...`
                : currentPost.description}
            </p>

            {/* Tags / Badges */}
            <div className="swipe-card-tags">
              {currentPost.is_urgent && (
                <span className="swipe-tag urgent">Urgent</span>
              )}
              {currentPost.delivery_available && (
                <span className="swipe-tag delivery">Livraison</span>
              )}
              {currentPost.number_of_people && (
                <span className="swipe-tag people">
                  {currentPost.number_of_people} personne{currentPost.number_of_people > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mini description en bas (mode swipe) */}
        {!showDetails && (
          <div className="swipe-mini-description">
            <h3>{currentPost.title}</h3>
            <p>{currentPost.description.substring(0, 100)}...</p>
            <button
              className="swipe-view-details-btn"
              onClick={() => navigate(`/post/${currentPost.id}`)}
            >
              Voir les détails
            </button>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="swipe-actions">
        <button
          className="swipe-action-btn swipe-action-reject"
          onClick={handleSwipeLeft}
          aria-label="Pas intéressé"
        >
          <X size={24} />
        </button>
        <button
          className="swipe-action-btn swipe-action-favorite"
          onClick={handleSwipeUp}
          aria-label="Sauvegarder"
        >
          <Star size={24} />
        </button>
        <button
          className="swipe-action-btn swipe-action-like"
          onClick={handleSwipeRight}
          aria-label="Intéressé"
        >
          <Heart size={24} />
        </button>
        <button
          className="swipe-action-btn swipe-action-message"
          onClick={() => navigate(`/messages/new?post=${currentPost.id}`)}
          aria-label="Message"
        >
          <MessageCircle size={24} />
        </button>
      </div>

      {/* Bouton undo */}
      {undoAvailable && (
        <div className="swipe-undo">
          <button onClick={handleUndo} className="swipe-undo-btn">
            Annuler
          </button>
        </div>
      )}

      {/* Modal détails complets */}
      {showDetails && (
        <div className="swipe-details-modal" onClick={() => setShowDetails(false)}>
          <div className="swipe-details-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="swipe-details-close"
              onClick={() => setShowDetails(false)}
            >
              <X size={24} />
            </button>
            <div className="swipe-details-body">
              <h2>{currentPost.title}</h2>
              <p>{currentPost.description}</p>
              <button
                className="swipe-btn-primary"
                onClick={() => navigate(`/post/${currentPost.id}`)}
              >
                Voir la page complète
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SwipePage

