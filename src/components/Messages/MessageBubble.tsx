import { useState } from 'react'
import { File, MapPin, DollarSign, Calendar, Share2, X } from 'lucide-react'
import CalendarPicker from './CalendarPicker'
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
  showAvatar?: boolean
  onDelete?: () => void
  onLike?: () => void
  onReport?: () => void
}

const MessageBubble = ({ message, isOwn, showAvatar = false }: MessageBubbleProps) => {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)

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
        const calendarData = message.calendar_request_data as { 
          title?: string
          event_name?: string
          appointment_datetime?: string
          start_date?: string
        } | null
        const appointmentDateTime = calendarData?.appointment_datetime || calendarData?.start_date
        const appointmentTitle = calendarData?.title || calendarData?.event_name || 'Rendez-vous'
        
        return (
          <>
            <div 
              className="message-calendar"
              onClick={() => setShowAppointmentModal(true)}
              style={{ cursor: 'pointer' }}
            >
              <Calendar size={24} />
              <div className="message-calendar-info">
                <span className="message-calendar-title">{appointmentTitle}</span>
                {appointmentDateTime && (
                  <div className="message-calendar-datetime">
                    <span className="message-calendar-date">
                      {new Date(appointmentDateTime).toLocaleDateString('fr-FR', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="message-calendar-time">
                      à {new Date(appointmentDateTime).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {showAppointmentModal && (
              <div className="appointment-overlay" onClick={() => setShowAppointmentModal(false)}>
                <div className="appointment-inline-panel" onClick={(e) => e.stopPropagation()}>
                  <div className="appointment-inline-header">
                    <h4>{appointmentTitle}</h4>
                    <button 
                      className="appointment-inline-close"
                      onClick={() => setShowAppointmentModal(false)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="appointment-inline-body">
                    {appointmentDateTime && (
                      <>
                        <div className="appointment-inline-selected-date">
                          <span className="appointment-inline-date-label">Date :</span>
                          <span className="appointment-inline-date-value">
                            {new Date(appointmentDateTime).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="appointment-inline-selected-date">
                          <span className="appointment-inline-date-label">Heure :</span>
                          <span className="appointment-inline-date-value">
                            {new Date(appointmentDateTime).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="appointment-inline-calendar-wrapper">
                          <CalendarPicker
                            selectedDate={new Date(appointmentDateTime).toISOString().split('T')[0]}
                            onDateSelect={() => {}}
                            minDate={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
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
    <div className={`message-bubble-wrapper ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && showAvatar && message.sender?.avatar_url && (
        <img 
          src={message.sender.avatar_url} 
          alt={message.sender.full_name || message.sender.username || ''} 
          className="message-avatar" 
        />
      )}
      {!isOwn && !showAvatar && <div className="message-avatar-spacer"></div>}
      <div className="message-bubble-content">
        <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
          {renderMessageContent()}
          <span className="message-time">
            {new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble

