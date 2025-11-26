import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Share2, MapPin, Calendar, Users, Euro } from 'lucide-react'
import { useState } from 'react'
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
  const [liked, setLiked] = useState(isLiked)
  const [likesCount, setLikesCount] = useState(post.likes_count)

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (liked) {
        await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id })
        setLikesCount(prev => Math.max(0, prev - 1))
      } else {
        await supabase.from('likes').insert({ user_id: user.id, post_id: post.id })
        setLikesCount(prev => prev + 1)
      }
      setLiked(!liked)
      onLike?.()
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: `${window.location.origin}/post/${post.id}`
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
      alert('Lien copié dans le presse-papier')
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

  if (viewMode === 'list') {
    return (
      <Link to={`/post/${post.id}`} className="post-card post-card-list">
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
          <div className="post-card-actions">
            <button
              className={`post-card-action ${liked ? 'liked' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                handleLike()
              }}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              <span>{likesCount}</span>
            </button>
            <button
              className="post-card-action"
              onClick={(e) => {
                e.preventDefault()
                handleShare()
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
      </Link>
    )
  }

  return (
    <Link to={`/post/${post.id}`} className="post-card post-card-grid">
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
        <div className="post-card-actions">
          <button
            className={`post-card-action ${liked ? 'liked' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              handleLike()
            }}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>{likesCount}</span>
          </button>
          <button
            className="post-card-action"
            onClick={(e) => {
              e.preventDefault()
              handleShare()
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
    </Link>
  )
}

export default PostCard

