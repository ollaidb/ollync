import { useState, useRef } from 'react'
import { Send, Image, Video, File, Calendar, Share2, Loader, Film, X, Megaphone } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useConsent } from '../../hooks/useConsent'
import ConsentModal from '../ConsentModal'
import CalendarPicker from './CalendarPicker'
import PostSelector from './PostSelector'
import './MessageInput.css'

interface MessageInputProps {
  conversationId: string
  senderId: string
  onMessageSent: () => void
  disabled?: boolean
}

type MessageType = 'text' | 'photo' | 'video' | 'document' | 'location' | 'price' | 'rate' | 'calendar_request' | 'post_share'

const MessageInput = ({ conversationId, senderId, onMessageSent, disabled = false }: MessageInputProps) => {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showMediaSubmenu, setShowMediaSubmenu] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showPostSelector, setShowPostSelector] = useState(false)
  const [appointmentDate, setAppointmentDate] = useState<string | null>(null)
  const [appointmentTime, setAppointmentTime] = useState('')
  const [appointmentTitle, setAppointmentTitle] = useState('')
  const [calendarStep, setCalendarStep] = useState<'date' | 'time'>('date')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  // Hooks de consentement
  const mediaConsent = useConsent('media')

  const sendMessage = async (type: MessageType = 'text', extraData?: Record<string, unknown>) => {
    if (!message.trim() && type === 'text') return
    if (disabled || sending) return

    setSending(true)
    try {
      const messageData: Record<string, unknown> = {
        conversation_id: conversationId,
        sender_id: senderId,
        message_type: type,
        ...extraData
      }

      if (type === 'text') {
        messageData.content = message.trim()
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: messageError, data: messageResult } = await (supabase.from('messages') as any).insert(messageData).select()

      if (messageError) throw messageError

      // Si c'est un rendez-vous, créer l'entrée dans la table appointments
      if (type === 'calendar_request' && extraData?.calendar_request_data) {
        const calendarData = extraData.calendar_request_data as { appointment_datetime?: string; title?: string }
        if (calendarData.appointment_datetime && messageResult?.[0]?.id) {
          // Récupérer l'autre participant de la conversation
          const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('user1_id, user2_id')
            .eq('id', conversationId)
            .single()

          if (!convError && conversation) {
            const conv = conversation as { user1_id: string; user2_id: string }
            const recipientId = conv.user1_id === senderId ? conv.user2_id : conv.user1_id
            
            // Créer l'appointment (table peut ne pas exister encore, donc on ignore l'erreur)
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { error: appointmentError } = await (supabase.from('appointments') as any).insert({
                message_id: messageResult[0].id,
                conversation_id: conversationId,
                sender_id: senderId,
                recipient_id: recipientId,
                appointment_datetime: calendarData.appointment_datetime,
                title: calendarData.title || 'Rendez-vous',
                status: 'pending'
              })

              if (appointmentError) {
                console.error('Error creating appointment:', appointmentError)
                // Ne pas bloquer l'envoi du message si l'appointment échoue
              }
            } catch (err) {
              console.error('Error creating appointment (table may not exist):', err)
              // Ne pas bloquer l'envoi du message si la table n'existe pas encore
            }
          }
        }
      }

      setMessage('')
      setShowOptions(false)
      setShowCalendarModal(false)
      setAppointmentDate(null)
      setAppointmentTime('')
      setAppointmentTitle('')
      onMessageSent()
    } catch (error) {
      console.error('Error sending message:', error)
      alert(`Erreur lors de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSending(false)
    }
  }

  const performFileUpload = async (file: File, type: 'photo' | 'video' | 'document') => {
    if (disabled || sending) return

    setSending(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${senderId}/${Date.now()}.${fileExt}`
      const bucket = type === 'photo' ? 'posts' : type === 'video' ? 'videos' : 'documents'

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        // Si le bucket n'existe pas, essayer avec 'posts'
        const { error: fallbackError } = await supabase.storage
          .from('posts')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (fallbackError) throw fallbackError

        const { data } = supabase.storage.from('posts').getPublicUrl(fileName)
        await sendMessage(type, {
          file_url: data.publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        })
      } else {
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
        await sendMessage(type, {
          file_url: data.publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        })
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert(`Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      setSending(false)
    }
  }

  const handleFileUpload = (file: File, type: 'photo' | 'video' | 'document') => {
    // Pour les photos et vidéos, on demande le consentement médias
    // Pour les documents, pas de consentement nécessaire selon les spécifications
    if (type === 'photo' || type === 'video') {
      mediaConsent.requireConsent(() => {
        performFileUpload(file, type)
      })
    } else {
      performFileUpload(file, type)
    }
  }

  const checkVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      const url = URL.createObjectURL(file)
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        const duration = video.duration
        resolve(duration <= 10) // 10 secondes maximum
      }
      
      video.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(false)
      }
      
      video.src = url
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video' | 'document') => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === 'photo' && !file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image')
        return
      }
      if (type === 'video' && !file.type.startsWith('video/')) {
        alert('Veuillez sélectionner une vidéo')
        return
      }
      // Vérifier la durée des vidéos
      if (type === 'video') {
        const isValidDuration = await checkVideoDuration(file)
        if (!isValidDuration) {
          alert('La vidéo ne doit pas dépasser 10 secondes')
          return
        }
      }
      handleFileUpload(file, type)
      // Réinitialiser l'input pour permettre de sélectionner le même fichier
      e.target.value = ''
    }
  }

  const handlePostSelect = async (postId: string) => {
    if (disabled || sending) return
    setShowPostSelector(false)
    try {
      await sendMessage('post_share', {
        shared_post_id: postId
      })
    } catch (error) {
      console.error('Error sending post share:', error)
      setShowPostSelector(true) // Rouvrir le sélecteur en cas d'erreur
    }
  }

  const handleDateSelect = (date: string) => {
    setAppointmentDate(date)
    setCalendarStep('time')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage('text')
    }
  }

  const handleCalendarSubmit = async () => {
    if (!appointmentDate || !appointmentTime || !appointmentTitle.trim()) {
      alert('Veuillez remplir tous les champs (titre, date et heure)')
      return
    }

    if (disabled || sending) return

    // Combiner date et heure en ISO string
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`).toISOString()
    
    // Vérifier que la date n'est pas dans le passé
    if (new Date(appointmentDateTime) < new Date()) {
      alert('La date et l\'heure du rendez-vous ne peuvent pas être dans le passé')
      return
    }

    await     await sendMessage('calendar_request', {
      calendar_request_data: {
        title: appointmentTitle.trim(),
        appointment_datetime: appointmentDateTime,
        event_name: appointmentTitle.trim()
      }
    })
    
    // Réinitialiser le formulaire (sera fait dans sendMessage après succès)
    setAppointmentDate(null)
    setAppointmentTime('')
    setAppointmentTitle('')
    setCalendarStep('date')
  }

  const handleCalendarClose = () => {
    setShowCalendarModal(false)
    setAppointmentDate(null)
    setAppointmentTime('')
    setAppointmentTitle('')
    setCalendarStep('date')
  }

  return (
    <>
      {/* Overlay transparent avec bloc de rendez-vous au centre */}
      {showCalendarModal && (
        <div className="appointment-overlay">
          <div className="appointment-inline-panel">
          <div className="appointment-inline-header">
            <h4>Créer un rendez-vous</h4>
            <button 
              className="appointment-inline-close"
              onClick={handleCalendarClose}
            >
              <X size={18} />
            </button>
          </div>
          <div className="appointment-inline-body">
            {calendarStep === 'date' ? (
              <>
                <div className="appointment-inline-form-group">
                  <label>Titre *</label>
                  <input
                    type="text"
                    value={appointmentTitle}
                    onChange={(e) => setAppointmentTitle(e.target.value)}
                    placeholder="Ex: Rendez-vous le 10 janvier"
                    className="appointment-inline-input"
                  />
                </div>
                <div className="appointment-inline-calendar-wrapper">
                  <CalendarPicker
                    selectedDate={appointmentDate}
                    onDateSelect={handleDateSelect}
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {appointmentDate && (
                  <button
                    className="appointment-inline-next"
                    onClick={() => setCalendarStep('time')}
                  >
                    Choisir l'heure →
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="appointment-inline-selected-date">
                  <span className="appointment-inline-date-label">Date :</span>
                  <span className="appointment-inline-date-value">
                    {appointmentDate && new Date(appointmentDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="appointment-inline-form-group">
                  <label>Heure *</label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="appointment-inline-input"
                  />
                </div>
                <div className="appointment-inline-actions">
                  <button
                    className="appointment-inline-back"
                    onClick={() => setCalendarStep('date')}
                  >
                    ← Retour
                  </button>
                  <button
                    className="appointment-inline-submit"
                    onClick={handleCalendarSubmit}
                    disabled={sending || !appointmentTime}
                  >
                    {sending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      )}

      {showOptions && (
        <div className="message-options-panel">
          <div className="message-option-wrapper">
            <button
              className="message-option-btn"
              onClick={() => setShowMediaSubmenu(!showMediaSubmenu)}
              title="Médias"
            >
              <Film size={22} />
              <span>Médias</span>
            </button>
            {showMediaSubmenu && (
              <div className="message-media-submenu">
                <button
                  className="message-media-submenu-btn"
                  onClick={() => {
                    fileInputRef.current?.click()
                    setShowMediaSubmenu(false)
                  }}
                  title="Photo"
                >
                  <Image size={18} />
                  <span>Photo</span>
                </button>
                <button
                  className="message-media-submenu-btn"
                  onClick={() => {
                    videoInputRef.current?.click()
                    setShowMediaSubmenu(false)
                  }}
                  title="Vidéo"
                >
                  <Video size={18} />
                  <span>Vidéo</span>
                </button>
                <button
                  className="message-media-submenu-btn"
                  onClick={() => {
                    docInputRef.current?.click()
                    setShowMediaSubmenu(false)
                  }}
                  title="Document"
                >
                  <File size={18} />
                  <span>Document</span>
                </button>
              </div>
            )}
          </div>
          <button
            className="message-option-btn"
            onClick={() => setShowPostSelector(true)}
            title="Annonce"
          >
            <Megaphone size={22} />
            <span>Annonce</span>
          </button>
          <button
            className="message-option-btn"
            onClick={() => {
              setShowCalendarModal(true)
              setShowOptions(false)
            }}
            title="Rendez-vous"
          >
            <Calendar size={22} />
            <span>Rendez-vous</span>
          </button>
        </div>
      )}

      <div className="message-input-wrapper">
        <button
          className="message-options-toggle"
          onClick={() => {
            setShowOptions(!showOptions)
            setShowMediaSubmenu(false)
          }}
          title="Options"
        >
          <Share2 size={20} />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Message..."
          disabled={disabled || sending}
          className="message-input-field"
        />
        <button
          onClick={() => sendMessage('text')}
          disabled={!message.trim() || disabled || sending}
          className="message-send-btn"
        >
          {sending ? (
            <Loader className="spinner" size={16} />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'photo')}
        style={{ display: 'none' }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFileSelect(e, 'video')}
        style={{ display: 'none' }}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => handleFileSelect(e, 'document')}
        style={{ display: 'none' }}
      />

      {/* Modals de consentement */}
      <ConsentModal
        visible={mediaConsent.showModal}
        title={mediaConsent.messages.title}
        message={mediaConsent.messages.message}
        onAccept={mediaConsent.handleAccept}
        onReject={mediaConsent.handleReject}
        learnMoreLink={mediaConsent.learnMoreLink}
      />



      {/* Modal pour sélectionner une annonce */}
      {showPostSelector && (
        <PostSelector
          onPostSelect={handlePostSelect}
          onClose={() => setShowPostSelector(false)}
        />
      )}
    </>
  )
}

export default MessageInput

