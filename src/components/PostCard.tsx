import { Heart, MapPin, Calendar, Users } from 'lucide-react'
import { useState, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useToastContext } from '../contexts/ToastContext'
import InlineVideoPreview from './InlineVideoPreview'
import CategoryPlaceholderMedia from './CategoryPlaceholderMedia'
import './PostCard.css'

interface PostCardProps {
  post: {
    id: string
    title: string
    description: string
    price?: number | null
    payment_type?: string | null
    location?: string | null
    images?: string[] | null
    video?: string | null
    likes_count: number
    comments_count: number
    created_at: string
    needed_date?: string | null
    number_of_people?: number | null
    delivery_available: boolean
    is_urgent?: boolean
    user_id?: string
    user?: {
      id?: string
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
  hideProfile?: boolean
  hideCategoryBadge?: boolean
  actionMenu?: React.ReactNode
  // onShare?: () => void
}

const PostCard = ({
  post,
  viewMode = 'grid',
  isLiked = false,
  onLike,
  hideProfile = false,
  hideCategoryBadge = false,
  actionMenu
}: PostCardProps) => {
  const { t } = useTranslation(['categories'])
  const navigate = useNavigate()
  const { showSuccess } = useToastContext()
  const [liked, setLiked] = useState(isLiked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [checkingLike, setCheckingLike] = useState(true)

  // Vérifier si le post est liké par l'utilisateur actuel au chargement
  // Utiliser une vérification optimisée avec cache
  useEffect(() => {
    const checkLiked = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setCheckingLike(false)
          return
        }

        // Vérifier d'abord dans le cache local (sessionStorage)
        const cacheKey = `like_${user.id}_${post.id}`
        const cached = sessionStorage.getItem(cacheKey)
        if (cached !== null) {
          setLiked(cached === 'true')
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
        const isLiked = !error && !!data
        setLiked(isLiked)
        // Mettre en cache
        sessionStorage.setItem(cacheKey, String(isLiked))
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
        
        // Mettre à jour le cache
        const cacheKey = `like_${user.id}_${post.id}`
        sessionStorage.setItem(cacheKey, 'false')
        
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
          
          // Mettre à jour le cache
          const cacheKey = `like_${user.id}_${post.id}`
          sessionStorage.setItem(cacheKey, 'true')
          
          // Mettre à jour le compteur dans la base de données
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('posts') as any).update({ likes_count: likesCount + 1 }).eq('id', post.id)
          
          // Afficher le toast de confirmation
          showSuccess('Liké')
          
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

  // const handleShare = async (e: React.MouseEvent) => {
  //   e.preventDefault()
  //   e.stopPropagation()
  //   
  //   if (navigator.share) {
  //     try {
  //       await navigator.share({
  //         title: post.title,
  //         text: post.description,
  //         url: `${window.location.origin}/post/${post.id}`
  //       })
  //     } catch (error) {
  //       // L'utilisateur a peut-être annulé, ce n'est pas une erreur
  //       if ((error as Error).name !== 'AbortError') {
  //         console.error('Error sharing:', error)
  //       }
  //     }
  //   } else {
  //     try {
  //       await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
  //       alert('Lien copié dans le presse-papier')
  //     } catch (error) {
  //       console.error('Error copying to clipboard:', error)
  //       alert('Impossible de copier le lien')
  //     }
  //   }
  //   onShare?.()
  // }

  const truncateTitleToTwoSentences = (title: string): string => {
    // Détecter les phrases (séparées par . ! ?)
    const sentenceEndings = /([.!?]+)\s*/g
    const sentences: string[] = []
    let lastIndex = 0
    let match

    while ((match = sentenceEndings.exec(title)) !== null) {
      const sentence = title.substring(lastIndex, match.index + match[1].length).trim()
      if (sentence) {
        sentences.push(sentence)
      }
      lastIndex = match.index + match[0].length
    }

    // Ajouter la dernière partie si elle existe et ne se termine pas par un signe de ponctuation
    if (lastIndex < title.length) {
      const remaining = title.substring(lastIndex).trim()
      if (remaining) {
        sentences.push(remaining)
      }
    }

    // Si aucune phrase n'a été détectée (pas de ponctuation), retourner le titre tel quel
    if (sentences.length === 0) {
      return title
    }

    // Prendre les deux premières phrases
    if (sentences.length <= 2) {
      return sentences.join(' ')
    }

    // Retourner les deux premières phrases avec "..."
    return sentences.slice(0, 2).join(' ') + '...'
  }

  const isValidMediaUrl = (value?: string | null) => {
    if (!value) return false
    const lower = value.toLowerCase()
    if (!/^https?:\/\//i.test(value)) return false
    if (lower.includes('ton-projet.supabase.co')) return false
    if (lower.includes('ton user id')) return false
    if (lower.includes('votre_')) return false
    return true
  }

  const mainImage = post.images && post.images.length > 0 && isValidMediaUrl(post.images[0]) ? post.images[0] : null
  const mainMedia = mainImage || (isValidMediaUrl(post.video) ? post.video : null)
  const isVideo = !!mainMedia && /\.(mp4|webm|ogg|mov|m4v)$/i.test(mainMedia.split('?')[0].split('#')[0])

  const getPaymentDisplay = () => {
    const paymentType = post.payment_type || ''
    const hasPrice = post.price !== null && post.price !== undefined

    if ((paymentType === 'prix' || paymentType === 'co-creation' || paymentType === 'remuneration') && hasPrice) {
      return `${post.price} €`
    }

    switch (paymentType) {
      case 'echange':
        return 'Échange de service'
      case 'visibilite-contre-service':
        return 'Visibilité contre service'
      case 'co-creation':
        return hasPrice ? `${post.price} €` : 'Co-création'
      case 'participation':
        return 'Participation'
      case 'association':
        return 'Association'
      case 'partage-revenus':
        return 'Partage de revenus'
      case 'remuneration':
        return hasPrice ? `${post.price} €` : 'Rémunération'
      case 'prix':
        return hasPrice ? `${post.price} €` : 'Prix'
      case 'benevole':
        return 'Bénévole'
      case 'pourcentage':
        return 'Pourcentage'
      default:
        return hasPrice ? `${post.price} €` : null
    }
  }

  const handleCardClick = (e: React.SyntheticEvent<HTMLElement>) => {
    // Ne pas naviguer si on clique sur un bouton d'action ou dans la zone d'actions
    const target = e.target as HTMLElement
    if (target.closest('.post-card-actions') || 
        target.closest('button') || 
        target.tagName === 'BUTTON' ||
        target.closest('.post-card-action') ||
        target.closest('.inline-video-preview') ||
        target.closest('svg') ||
        target.closest('path') ||
        target.closest('.post-card-profile')) {
      return
    }
    navigate(`/post/${post.id}`)
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const userId = post.user_id || post.user?.id
    if (userId) {
      navigate(`/profile/public/${userId}`)
    }
  }

  const displayName = post.user?.username || post.user?.full_name || 'Utilisateur'
  const categoryLabel = post.category
    ? t(`categories:titles.${post.category.slug}`, { defaultValue: post.category.name })
    : null

  if (viewMode === 'list') {
    return (
      <div className={`post-card post-card-list ${post.is_urgent ? 'post-card-urgent-border' : ''}`} onClick={handleCardClick}>
      <div className="post-card-image">
        {mainMedia ? (
          isVideo ? (
            <InlineVideoPreview src={mainMedia} className="post-card-media" />
          ) : (
            <img 
              src={mainMedia} 
              alt={post.title}
              loading="lazy"
              decoding="async"
            />
          )
        ) : (
          <CategoryPlaceholderMedia
            className="post-card-image-placeholder"
            categorySlug={post.category?.slug}
          />
        )}
          <button
            type="button"
            className={`post-card-like-btn ${liked ? 'liked' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              handleLike(e)
            }}
            disabled={checkingLike}
            aria-label={liked ? 'Retirer le like' : 'Ajouter un like'}
          >
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
          </button>
          {mainMedia && categoryLabel && !hideCategoryBadge && (
            <div className="post-card-category-badge">{categoryLabel}</div>
          )}
        </div>
        <div className="post-card-content">
          <div className="post-card-header">
            <h3 className="post-card-title">{truncateTitleToTwoSentences(post.title)}</h3>
            {actionMenu && (
              <div className="post-card-action-menu" onClick={(e) => e.stopPropagation()}>
                {actionMenu}
              </div>
            )}
          </div>
          <p className="post-card-description">{post.description.substring(0, 100)}...</p>
          <div className={`post-card-footer ${hideProfile || !post.user ? 'post-card-footer-right-only' : ''}`}>
            {!hideProfile && post.user && (
              <div className="post-card-profile" onClick={handleProfileClick}>
                <div className="post-card-avatar">
                  {post.user.avatar_url ? (
                    <img 
                      src={post.user.avatar_url} 
                      alt={displayName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName)
                      }}
                    />
                  ) : (
                    <div className="post-card-avatar-placeholder">
                      {(displayName[0] || 'U').toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="post-card-profile-name">{displayName}</div>
              </div>
            )}
            {getPaymentDisplay() && (
              <div className="post-card-payment-display">{getPaymentDisplay()}</div>
            )}
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
          handleCardClick(e as React.SyntheticEvent<HTMLElement>)
        }
      }}
    >
      <div className="post-card-image">
        {mainMedia ? (
          isVideo ? (
            <InlineVideoPreview src={mainMedia} className="post-card-media" />
          ) : (
            <img 
              src={mainMedia} 
              alt={post.title}
              loading="lazy"
              decoding="async"
            />
          )
        ) : (
          <CategoryPlaceholderMedia
            className="post-card-image-placeholder"
            categorySlug={post.category?.slug}
          />
        )}
        <button
          type="button"
          className={`post-card-like-btn ${liked ? 'liked' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            handleLike(e)
          }}
          disabled={checkingLike}
          aria-label={liked ? 'Retirer le like' : 'Ajouter un like'}
        >
          <Heart size={22} fill={liked ? 'currentColor' : 'none'} />
        </button>
        {getPaymentDisplay() && (
          <div className="post-card-payment-badge">{getPaymentDisplay()}</div>
        )}
        {mainMedia && categoryLabel && !hideCategoryBadge && (
          <div className="post-card-category-badge">{categoryLabel}</div>
        )}
        {post.is_urgent && (
          <div className="post-card-urgent-badge">URGENT</div>
        )}
        {post.delivery_available && (
          <span className="post-card-badge">Livraison possible</span>
        )}
      </div>
      <div className="post-card-content">
        <h3 className="post-card-title">{truncateTitleToTwoSentences(post.title)}</h3>
        <div className="post-card-info">
          {(post.location || post.number_of_people || post.needed_date) && (
            <div className="post-card-info-row">
          {post.location && (
            <span className="post-card-location">
                  <MapPin size={12} /> {post.location}
            </span>
          )}
          {post.number_of_people && (
            <span className="post-card-people">
                  <Users size={12} /> {post.number_of_people}
                </span>
              )}
                {post.needed_date && (
                  <span className="post-card-date">
                    <Calendar size={10} /> {new Date(post.needed_date).toLocaleDateString('fr-FR')}
            </span>
                )}
            </div>
          )}
          {post.user && (
            <div className="post-card-profile" onClick={handleProfileClick}>
              <div className="post-card-avatar">
                {post.user.avatar_url ? (
                  <img 
                    src={post.user.avatar_url} 
                    alt={displayName}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName)
                    }}
                  />
                ) : (
                  <div className="post-card-avatar-placeholder">
                    {(displayName[0] || 'U').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="post-card-profile-name">{displayName}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(PostCard)
