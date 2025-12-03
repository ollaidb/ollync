import { useState, useRef } from 'react'
import { Send, Image, Video, File, MapPin, DollarSign, Calendar, Share2, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import './MessageInput.css'

interface MessageInputProps {
  conversationId: string
  senderId: string
  onMessageSent: () => void
  disabled?: boolean
}

type MessageType = 'text' | 'photo' | 'video' | 'document' | 'location' | 'price' | 'rate' | 'calendar_request'

const MessageInput = ({ conversationId, senderId, onMessageSent, disabled = false }: MessageInputProps) => {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

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
      const { error } = await (supabase.from('messages') as any).insert(messageData)

      if (error) throw error

      setMessage('')
      setShowOptions(false)
      onMessageSent()
    } catch (error) {
      console.error('Error sending message:', error)
      alert(`Erreur lors de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (file: File, type: 'photo' | 'video' | 'document') => {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video' | 'document') => {
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
      handleFileUpload(file, type)
    }
  }

  const handleLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          await sendMessage('location', { location_data: locationData })
        },
        () => {
          alert('Impossible d\'obtenir votre localisation')
        }
      )
    } else {
      alert('La géolocalisation n\'est pas supportée par votre navigateur')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage('text')
    }
  }

  return (
    <div className="message-input-container">
      {showOptions && (
        <div className="message-options-panel">
          <button
            className="message-option-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Photo"
          >
            <Image size={20} />
            <span>Photo</span>
          </button>
          <button
            className="message-option-btn"
            onClick={() => videoInputRef.current?.click()}
            title="Vidéo"
          >
            <Video size={20} />
            <span>Vidéo</span>
          </button>
          <button
            className="message-option-btn"
            onClick={() => docInputRef.current?.click()}
            title="Document"
          >
            <File size={20} />
            <span>Document</span>
          </button>
          <button
            className="message-option-btn"
            onClick={handleLocation}
            title="Localisation"
          >
            <MapPin size={20} />
            <span>Localisation</span>
          </button>
          <button
            className="message-option-btn"
            onClick={() => {
              const price = prompt('Montant:')
              if (price) {
                sendMessage('price', {
                  price_data: {
                    amount: parseFloat(price),
                    currency: 'EUR',
                    type: 'offer'
                  }
                })
              }
            }}
            title="Prix"
          >
            <DollarSign size={20} />
            <span>Prix</span>
          </button>
          <button
            className="message-option-btn"
            onClick={() => {
              const rate = prompt('Tarif (par heure):')
              if (rate) {
                sendMessage('rate', {
                  rate_data: {
                    amount: parseFloat(rate),
                    currency: 'EUR',
                    period: 'hour'
                  }
                })
              }
            }}
            title="Tarif"
          >
            <DollarSign size={20} />
            <span>Tarif</span>
          </button>
          <button
            className="message-option-btn"
            onClick={() => {
              const eventName = prompt('Nom de l\'événement:')
              if (eventName) {
                sendMessage('calendar_request', {
                  calendar_request_data: {
                    event_name: eventName,
                    start_date: new Date().toISOString()
                  }
                })
              }
            }}
            title="Calendrier"
          >
            <Calendar size={20} />
            <span>Calendrier</span>
          </button>
        </div>
      )}

      <div className="message-input-wrapper">
        <button
          className="message-options-toggle"
          onClick={() => setShowOptions(!showOptions)}
          title="Options"
        >
          <Share2 size={20} />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Tapez votre message..."
          disabled={disabled || sending}
          className="message-input-field"
        />
        <button
          onClick={() => sendMessage('text')}
          disabled={!message.trim() || disabled || sending}
          className="message-send-btn"
        >
          {sending ? (
            <Loader className="spinner" size={20} />
          ) : (
            <Send size={20} />
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
    </div>
  )
}

export default MessageInput

