import { useState, useEffect } from 'react'
import { File, MapPin, DollarSign, Calendar, Share2, X, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import CalendarPicker from './CalendarPicker'
import Logo from '../Logo'
import './MessageBubble.css'

interface MessageBubbleProps {
  message: {
    id: string
    content?: string | null
    sender_id: string
    created_at: string
    edited_at?: string | null
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
      email?: string | null
    } | null
  }
  isOwn: boolean
  showAvatar?: boolean
  systemSenderEmail?: string
  onDelete?: () => void
  onLike?: () => void
  onReport?: () => void
}

const MessageBubble = ({ message, isOwn, showAvatar = false, systemSenderEmail }: MessageBubbleProps) => {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [sharedPost, setSharedPost] = useState<{
    title?: string
    user?: {
      id: string
      username?: string | null
      full_name?: string | null
      avatar_url?: string | null
    } | null
  } | null>(null)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [editingAppointment, setEditingAppointment] = useState(false)
  const [newAppointmentDate, setNewAppointmentDate] = useState<string | null>(null)
  const [newAppointmentTime, setNewAppointmentTime] = useState('')
  const [updatingAppointment, setUpdatingAppointment] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Charger l'appointment_id si c'est un rendez-vous
  useEffect(() => {
    if (message.message_type === 'calendar_request' && message.id) {
      const fetchAppointment = async () => {
        try {
          const { data } = await supabase
            .from('appointments')
            .select('id')
            .eq('message_id', message.id)
            .single()
          
          if (data) {
            setAppointmentId((data as { id: string }).id)
          }
        } catch (error) {
          console.error('Error fetching appointment:', error)
        }
      }
      fetchAppointment()
    }
  }, [message.message_type, message.id])

  // Charger les infos du post partagé
  useEffect(() => {
    if (message.message_type === 'post_share' && message.shared_post_id) {
      const fetchPost = async () => {
        try {
          const postId = message.shared_post_id
          if (!postId) return
          
          const { data: postData } = await supabase
            .from('posts')
            .select('title, user_id')
            .eq('id', postId)
            .single()

          if (postData) {
            const post = postData as { title: string; user_id: string }
            
            // Récupérer le profil de l'utilisateur
            const { data: userData } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .eq('id', post.user_id)
              .single()

            setSharedPost({
              title: post.title,
              user: userData as {
                id: string
                username?: string | null
                full_name?: string | null
                avatar_url?: string | null
              } | null
            })
          }
        } catch (error) {
          console.error('Error fetching shared post:', error)
        }
      }
      fetchPost()
    }
  }, [message.message_type, message.shared_post_id])

  const handleUpdateAppointment = async () => {
    if (!newAppointmentDate || !newAppointmentTime || !appointmentId || !user) return

    setUpdatingAppointment(true)
    try {
      // Combiner date et heure
      const [hours, minutes] = newAppointmentTime.split(':')
      const newDateTime = new Date(newAppointmentDate)
      newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      // Mettre à jour l'appointment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: appointmentError } = await (supabase.from('appointments') as any).update({
        appointment_datetime: newDateTime.toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', appointmentId)

      if (appointmentError) throw appointmentError

      // Mettre à jour le message avec les nouvelles données
      const calendarData = message.calendar_request_data as Record<string, unknown> || {}
      calendarData.appointment_datetime = newDateTime.toISOString()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: messageError } = await (supabase.from('messages') as any).update({
        calendar_request_data: calendarData
      }).eq('id', message.id)

      if (messageError) throw messageError

      setEditingAppointment(false)
      setShowAppointmentModal(false)
      setNewAppointmentDate(null)
      setNewAppointmentTime('')
      
      // Recharger la page pour voir les changements
      window.location.reload()
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Erreur lors de la modification du rendez-vous')
    } finally {
      setUpdatingAppointment(false)
    }
  }

  const handleCancelAppointment = async () => {
    if (!appointmentId || !user) return
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return

    setUpdatingAppointment(true)
    try {
      // Mettre à jour le statut de l'appointment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: appointmentError } = await (supabase.from('appointments') as any).update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      }).eq('id', appointmentId)

      if (appointmentError) throw appointmentError

      setShowAppointmentModal(false)
      setEditingAppointment(false)
      
      // Recharger la page pour voir les changements
      window.location.reload()
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      alert('Erreur lors de l\'annulation du rendez-vous')
    } finally {
      setUpdatingAppointment(false)
    }
  }

  const renderTextWithLinks = (text: string) => {
    const parts: Array<string | { label: string; url: string }> = []
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }
      parts.push({ label: match[1], url: match[2] })
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts.map((part, index) => {
      if (typeof part === 'string') return <span key={`txt-${index}`}>{part}</span>
      return (
        <a
          key={`lnk-${index}`}
          href={part.url}
          className="message-link"
          target="_blank"
          rel="noreferrer"
        >
          {part.label}
        </a>
      )
    })
  }

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'photo':
        return (
          message.file_url && (
            <img 
              src={message.file_url} 
              alt={message.file_name || 'Photo'} 
              className="message-image-standalone"
              onClick={() => setShowImageModal(true)}
              style={{ cursor: 'pointer' }}
            />
          )
        )
      case 'video':
        return (
          message.file_url && (
            <video src={message.file_url} controls className="message-video-standalone">
              Votre navigateur ne supporte pas la vidéo.
            </video>
          )
        )
      case 'document':
        return (
          message.file_url ? (
            <a 
              href={message.file_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="message-document-standalone"
            >
              <File size={20} />
              <span>{message.file_name || 'Document'}</span>
            </a>
          ) : null
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
              className={`message-calendar ${isOwn ? 'own' : 'other'}`}
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
              <div className="appointment-overlay" onClick={() => {
                setShowAppointmentModal(false)
                setEditingAppointment(false)
                setNewAppointmentDate(null)
                setNewAppointmentTime('')
              }}>
                <div className="appointment-inline-panel" onClick={(e) => e.stopPropagation()}>
                  <div className="appointment-inline-header">
                    <h4>{appointmentTitle}</h4>
                    <button 
                      className="appointment-inline-close"
                      onClick={() => {
                        setShowAppointmentModal(false)
                        setEditingAppointment(false)
                        setNewAppointmentDate(null)
                        setNewAppointmentTime('')
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="appointment-inline-body">
                    {appointmentDateTime && (
                      <>
                        {!editingAppointment ? (
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
                            <div className="appointment-inline-actions">
                              <button
                                className="appointment-inline-edit-btn"
                                onClick={() => {
                                  setEditingAppointment(true)
                                  setNewAppointmentDate(new Date(appointmentDateTime).toISOString().split('T')[0])
                                  const timeStr = new Date(appointmentDateTime).toTimeString().slice(0, 5)
                                  setNewAppointmentTime(timeStr)
                                }}
                              >
                                Modifier
                              </button>
                              <button
                                className="appointment-inline-cancel-btn"
                                onClick={handleCancelAppointment}
                                disabled={updatingAppointment}
                              >
                                <Trash2 size={16} />
                                Annuler le rendez-vous
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="appointment-inline-form-group">
                              <label>Date *</label>
                              <CalendarPicker
                                selectedDate={newAppointmentDate}
                                onDateSelect={setNewAppointmentDate}
                                minDate={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                            <div className="appointment-inline-form-group">
                              <label>Heure *</label>
                              <input
                                type="time"
                                value={newAppointmentTime}
                                onChange={(e) => setNewAppointmentTime(e.target.value)}
                                className="appointment-inline-input"
                              />
                            </div>
                            <div className="appointment-inline-actions">
                              <button
                                className="appointment-inline-back-btn"
                                onClick={() => {
                                  setEditingAppointment(false)
                                  setNewAppointmentDate(null)
                                  setNewAppointmentTime('')
                                }}
                              >
                                Annuler
                              </button>
                              <button
                                className="appointment-inline-save-btn"
                                onClick={handleUpdateAppointment}
                                disabled={updatingAppointment || !newAppointmentDate || !newAppointmentTime}
                              >
                                {updatingAppointment ? 'Enregistrement...' : 'Enregistrer'}
                              </button>
                            </div>
                          </>
                        )}
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
          <div 
            className="message-post-share"
            onClick={() => message.shared_post_id && navigate(`/post/${message.shared_post_id}`)}
          >
            {sharedPost?.user?.avatar_url && (
              <img 
                src={sharedPost.user.avatar_url} 
                alt={sharedPost.user.full_name || sharedPost.user.username || ''}
                className="message-post-share-avatar"
              />
            )}
            <div className="message-post-share-content">
              <h4 className="message-post-share-title">
                {sharedPost?.title || 'Annonce'}
              </h4>
              <span className="message-post-share-link">Voir l'annonce →</span>
            </div>
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
        return <p>{message.content ? renderTextWithLinks(message.content) : ''}</p>
    }
  }

  // Pour les images, vidéos et documents, pas de bulle de message
  const isStandaloneMedia = message.message_type === 'photo' || message.message_type === 'video' || message.message_type === 'document'

  return (
    <div className={`message-bubble-wrapper ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && showAvatar && !isStandaloneMedia && (
        (message.sender?.email || '').toLowerCase() === (systemSenderEmail || '').toLowerCase() ? (
          <div className="message-avatar message-avatar-system">
            <Logo className="message-avatar-logo" width={32} height={16} />
          </div>
        ) : (
          message.sender?.avatar_url && (
            <img 
              src={message.sender.avatar_url} 
              alt={message.sender.full_name || message.sender.username || ''} 
              className="message-avatar" 
            />
          )
        )
      )}
      {!isOwn && !showAvatar && !isStandaloneMedia && <div className="message-avatar-spacer"></div>}
      <div className={`message-bubble-content ${isStandaloneMedia ? 'standalone' : ''}`}>
        {isStandaloneMedia ? (
          <>
            {renderMessageContent()}
            <span className="message-time-standalone">
              {new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {message.edited_at && <span className="message-edited-label"> • modifié</span>}
            </span>
          </>
        ) : (
          <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${message.message_type === 'calendar_request' ? 'calendar-message' : ''}`}>
            {renderMessageContent()}
            <span className="message-time">
              {new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {message.edited_at && <span className="message-edited-label"> • modifié</span>}
            </span>
          </div>
        )}
      </div>
      
      {/* Modal pour afficher l'image en grand */}
      {showImageModal && message.file_url && message.message_type === 'photo' && (
        <div className="image-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="image-modal-close"
              onClick={() => setShowImageModal(false)}
            >
              <X size={24} />
            </button>
            <img 
              src={message.file_url} 
              alt={message.file_name || 'Photo'} 
              className="image-modal-image"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageBubble

