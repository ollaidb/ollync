import { Image, Video, File, MapPin, DollarSign, Calendar, Share2, Heart, Trash2, Flag, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import './MessageBubble.css'

interface MessageBubbleProps {
  message: {
    id: string
    content?: string | null
    sender_id: string
    created_at: string
    message_type?: string
    file_url?: string | null
    file_name?: string | null
    file_type?: string | null
    location_data?: Record<string, unknown> | null
    price_data?: Record<string, unknown> | null
    rate_data?: Record<string, unknown> | null
    calendar_request_data?: Record<string, unknown> | null
    shared_post_id?: string | null
    shared_profile_id?: string | null
    sender?: {
      username?: string | null
      full_name?: string | null
      avatar_url?: string | null
    } | null
  }
  isOwn: boolean
  onDelete?: () => void
  onLike?: () => void
  onReport?: () => void
}

const MessageBubble = ({ message, isOwn, onDelete, onLike, onReport }: MessageBubbleProps) => {
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'photo':
        return (
          <div className="message-media">
            {message.file_url && (
              <img src={message.file_url} alt={message.file_name || 'Photo'} className="message-image" />
            )}
            {message.content && <p className="message-caption">{message.content}</p>}
          </div>
        )
      case 'video':
        return (
          <div className="message-media">
            {message.file_url && (
              <video src={message.file_url} controls className="message-video">
                Votre navigateur ne supporte pas la vidéo.
              </video>
            )}
            {message.content && <p className="message-caption">{message.content}</p>}
          </div>
        )
      case 'document':
        return (
          <div className="message-document">
            <File size={24} />
            <div className="message-document-info">
              <span className="message-document-name">{message.file_name || 'Document'}</span>
              {message.file_type && <span className="message-document-type">{message.file_type}</span>}
            </div>
            {message.file_url && (
              <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="message-document-download">
                Télécharger
              </a>
            )}
          </div>
        )
      case 'location':
        return (
          <div className="message-location">
            <MapPin size={24} />
            <div className="message-location-info">
              <span>Localisation partagée</span>
              {message.location_data && (
                <a
                  href={`https://www.google.com/maps?q=${(message.location_data as { lat?: number }).lat},${(message.location_data as { lng?: number }).lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="message-location-link"
                >
                  Voir sur la carte
                </a>
              )}
            </div>
          </div>
        )
      case 'price':
        return (
          <div className="message-price">
            <DollarSign size={24} />
            <div className="message-price-info">
              <span className="message-price-label">Prix proposé</span>
              <span className="message-price-amount">
                {message.price_data && (message.price_data as { amount?: number }).amount} €
              </span>
            </div>
          </div>
        )
      case 'rate':
        return (
          <div className="message-rate">
            <DollarSign size={24} />
            <div className="message-rate-info">
              <span className="message-rate-label">Tarif</span>
              <span className="message-rate-amount">
                {message.rate_data && (message.rate_data as { amount?: number }).amount} €
                {message.rate_data && (message.rate_data as { period?: string }).period === 'hour' && '/heure'}
              </span>
            </div>
          </div>
        )
      case 'calendar_request':
        return (
          <div className="message-calendar">
            <Calendar size={24} />
            <div className="message-calendar-info">
              <span className="message-calendar-title">
                {message.calendar_request_data && (message.calendar_request_data as { event_name?: string }).event_name}
              </span>
              {message.calendar_request_data && (message.calendar_request_data as { start_date?: string }).start_date && (
                <span className="message-calendar-date">
                  {new Date((message.calendar_request_data as { start_date?: string }).start_date || '').toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
        )
      case 'post_share':
        return (
          <div className="message-share">
            <Share2 size={24} />
            <span>Annonce partagée</span>
            {message.shared_post_id && (
              <a href={`/post/${message.shared_post_id}`} className="message-share-link">
                Voir l'annonce
              </a>
            )}
          </div>
        )
      case 'profile_share':
        return (
          <div className="message-share">
            <Share2 size={24} />
            <span>Profil partagé</span>
            {message.shared_profile_id && (
              <a href={`/profile/public/${message.shared_profile_id}`} className="message-share-link">
                Voir le profil
              </a>
            )}
          </div>
        )
      default:
        return <p>{message.content || ''}</p>
    }
  }

  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && message.sender?.avatar_url && (
        <img src={message.sender.avatar_url} alt={message.sender.full_name || ''} className="message-avatar" />
      )}
      <div className="message-content-wrapper">
        {!isOwn && message.sender && (
          <div className="message-sender-name">
            {message.sender.full_name || message.sender.username || 'Utilisateur'}
          </div>
        )}
        <div className="message-content">
          {renderMessageContent()}
          <div className="message-footer">
            <span className="message-time">
              {new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {user && (
              <div className="message-actions">
                {onLike && (
                  <button className="message-action-btn" onClick={onLike} title="Liker">
                    <Heart size={16} />
                  </button>
                )}
                {isOwn && onDelete && (
                  <button className="message-action-btn" onClick={onDelete} title="Supprimer">
                    <Trash2 size={16} />
                  </button>
                )}
                {!isOwn && onReport && (
                  <button className="message-action-btn" onClick={onReport} title="Signaler">
                    <Flag size={16} />
                  </button>
                )}
                <button
                  className="message-action-btn"
                  onClick={() => setShowMenu(!showMenu)}
                  title="Plus d'options"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble

