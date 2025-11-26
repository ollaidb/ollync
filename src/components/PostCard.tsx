import { Heart, MessageCircle, Share2, MapPin, Calendar, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './PostCard.css'

interface PostCardProps {
  post: {
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
  viewMode?: 'list' | 'grid'
  isLiked?: boolean
  onLike?: () => void
  onShare?: () => void
}

const PostCard = ({ post, viewMode = 'grid', isLiked = false, onLike, onShare }: PostCardProps) => {
  const navigate = useNavigate()
  const [liked, setLiked] = useState(isLiked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [checkingLike, setCheckingLike] = useState(true)

  // Vérifier si le post est liké par l'utilisateur actuel au chargement
  useEffect(() => {
    const checkLiked = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setCheckingLike(false)
          return
        }

        // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs 406
        const { data, error } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', post.id)
          .maybeSingle()

        // Si erreur ou pas de données, le post n'est pas liké
        if (error || !data) {
          setLiked(false)
        } else {
          setLiked(true)
        }
        setCheckingLike(false)
      } catch (error) {
        console.error('Error checking like:', error)
        setLiked(false)
        setCheckingLike(false)
      }
    }

    checkLiked()
  }, [post.id])

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Rediriger vers la page de connexion
        navigate('/auth/login')
        return
      }

      // Vérifier que l'utilisateur a un profil dans la base de données
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('Profil utilisateur introuvable:', profileError)
        alert('Votre profil n\'existe pas dans la base de données. Veuillez vous reconnecter.')
        return
      }

      if (liked) {
        // Supprimer le like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id)

        if (error) {
          console.error('Error removing like:', error)
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          return
        }

        setLiked(false)
        setLikesCount(prev => Math.max(0, prev - 1))
        
        // Mettre à jour le compteur dans la base de données
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('posts') as any).update({ likes_count: Math.max(0, likesCount - 1) }).eq('id', post.id)
        
        // Déclencher un événement personnalisé pour notifier les autres composants
        window.dispatchEvent(new CustomEvent('likeChanged', { 
          detail: { postId: post.id, liked: false } 
        }))
        
        onLike?.()
      } else {
        // Ajouter le like
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('likes') as any)
          .insert({ user_id: user.id, post_id: post.id })
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
          return
        }

        if (data) {
          setLiked(true)
          setLikesCount(prev => prev + 1)
          
          // Mettre à jour le compteur dans la base de données
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('posts') as any).update({ likes_count: likesCount + 1 }).eq('id', post.id)
          
          // Déclencher un événement personnalisé pour notifier les autres composants
          window.dispatchEvent(new CustomEvent('likeChanged', { 
            detail: { postId: post.id, liked: true } 
          }))
          
          onLike?.()
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: `${window.location.origin}/post/${post.id}`
        })
      } catch (error) {
        // L'utilisateur a peut-être annulé, ce n'est pas une erreur
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
        alert('Lien copié dans le presse-papier')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        alert('Impossible de copier le lien')
      }
    }
    onShare?.()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return "Aujourd'hui"
    if (days === 1) return "Hier"
    if (days < 7) return `Il y a ${days} jours`
    return date.toLocaleDateString('fr-FR')
  }

  const mainImage = post.images && post.images.length > 0 ? post.images[0] : null

  const handleCardClick = (e: React.MouseEvent) => {
    // Ne pas naviguer si on clique sur un bouton d'action ou dans la zone d'actions
    const target = e.target as HTMLElement
    if (target.closest('.post-card-actions') || 
        target.closest('button') || 
        target.tagName === 'BUTTON' ||
        target.closest('.post-card-action') ||
        target.closest('svg') ||
        target.closest('path')) {
      return
    }
    navigate(`/post/${post.id}`)
  }

  if (viewMode === 'list') {
    return (
      <div className="post-card post-card-list" onClick={handleCardClick}>
        {mainImage && (
          <div className="post-card-image">
            <img src={mainImage} alt={post.title} />
          </div>
        )}
        <div className="post-card-content">
          <div className="post-card-header">
            <h3 className="post-card-title">{post.title}</h3>
            {post.price && (
              <span className="post-card-price">{post.price} €</span>
            )}
          </div>
          <p className="post-card-description">{post.description.substring(0, 100)}...</p>
          <div className="post-card-info">
            {post.location && (
              <span className="post-card-location">
                <MapPin size={14} /> {post.location}
              </span>
            )}
            <span className="post-card-date">{formatDate(post.created_at)}</span>
          </div>
          <div className="post-card-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={`post-card-action ${liked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={checkingLike}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              <span>{likesCount}</span>
            </button>
            <button
              type="button"
              className="post-card-action"
              onClick={handleShare}
            >
              <Share2 size={18} />
            </button>
            <span className="post-card-comments">
              <MessageCircle size={18} />
              {post.comments_count}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="post-card post-card-grid" 
      onClick={handleCardClick} 
      role="button" 
      tabIndex={0} 
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick(e as any)
        }
      }}
    >
      {mainImage && (
        <div className="post-card-image">
          <img src={mainImage} alt={post.title} />
          {post.delivery_available && (
            <span className="post-card-badge">Livraison possible</span>
          )}
        </div>
      )}
      <div className="post-card-content">
        <h3 className="post-card-title">{post.title}</h3>
        {post.price && (
          <div className="post-card-price">{post.price} €</div>
        )}
        <div className="post-card-info">
          {post.location && (
            <span className="post-card-location">
              <MapPin size={14} /> {post.location}
            </span>
          )}
          {post.needed_date && (
            <span className="post-card-date">
              <Calendar size={14} /> {new Date(post.needed_date).toLocaleDateString('fr-FR')}
            </span>
          )}
          {post.number_of_people && (
            <span className="post-card-people">
              <Users size={14} /> {post.number_of_people} personne{post.number_of_people > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="post-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={`post-card-action ${liked ? 'liked' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              handleLike(e)
            }}
            disabled={checkingLike}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>{likesCount}</span>
          </button>
          <button
            type="button"
            className="post-card-action"
            onClick={(e) => {
              e.stopPropagation()
              handleShare(e)
            }}
          >
            <Share2 size={18} />
          </button>
          <span className="post-card-comments">
            <MessageCircle size={18} />
            {post.comments_count}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PostCard

