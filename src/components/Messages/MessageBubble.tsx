import { useState, useEffect } from 'react'
import { File, MapPin, DollarSign, Calendar, Share2, X, Trash2, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { jsPDF } from 'jspdf'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import CalendarPicker from './CalendarPicker'
import Logo from '../Logo'
import './MessageBubble.css'

type SharedContractDetails = {
  id: string
  contract_title?: string | null
  post_title?: string | null
  status?: string | null
  contract_content?: string | null
}
type ContractShareSnapshot = {
  kind?: string
  contract_title?: string | null
  contract_content?: string | null
  status?: string | null
}
type ContractEditorNotice = {
  title: string
  message: string
}

const appointmentIdByMessageCache = new Map<string, string | null>()
const sharedContractCache = new Map<string, SharedContractDetails>()

const extractContractNameFromContent = (content?: string | null) => {
  const raw = String(content || '')
  const match = raw.match(/Nom du contrat\s*:\s*(.+)/i)
  return match?.[1]?.trim() || null
}

const normalizeContractMessageLabel = (content?: string | null) => {
  const raw = String(content || '').trim()
  if (!raw) return ''
  return raw.replace(/^Contrat partagé\s*[•:-]\s*/i, '').trim() || raw
}
const truncateCardLabel = (value?: string | null, max = 25) => {
  const text = String(value || '').trim()
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

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
    shared_contract_id?: string | null
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
  const [showContractModal, setShowContractModal] = useState(false)
  const [showContractDocumentPreview, setShowContractDocumentPreview] = useState(false)
  const [contractEditorNotice, setContractEditorNotice] = useState<ContractEditorNotice | null>(null)
  const [showContractSharePrompt, setShowContractSharePrompt] = useState(false)
  const [loadingSharedContract, setLoadingSharedContract] = useState(false)
  const [sharedPost, setSharedPost] = useState<{
    title?: string
    user?: {
      id: string
      username?: string | null
      full_name?: string | null
      avatar_url?: string | null
    } | null
  } | null>(null)
  const [sharedContract, setSharedContract] = useState<SharedContractDetails | null>(null)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [editingAppointment, setEditingAppointment] = useState(false)
  const [newAppointmentDate, setNewAppointmentDate] = useState<string | null>(null)
  const [newAppointmentTime, setNewAppointmentTime] = useState('')
  const [updatingAppointment, setUpdatingAppointment] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  const contractSnapshot =
    message.message_type === 'contract_share'
      ? (message.calendar_request_data as ContractShareSnapshot | null)
      : null
  const contractDisplayLabel =
    normalizeContractMessageLabel(message.content)
    || (contractSnapshot?.kind === 'contract_share_snapshot' ? (contractSnapshot.contract_title || '') : '')
    || sharedContract?.contract_title
    || sharedContract?.post_title
    || 'Contrat partagé'
  const contractDisplayTitle =
    normalizeContractMessageLabel(message.content)
    || (contractSnapshot?.kind === 'contract_share_snapshot' ? (contractSnapshot.contract_title || '') : '')
    || sharedContract?.contract_title
    || sharedContract?.post_title
    || 'Contrat'
  const contractCardNameRaw =
    (contractSnapshot?.kind === 'contract_share_snapshot' ? (contractSnapshot.contract_title || '') : '')
    || sharedContract?.contract_title
    || normalizeContractMessageLabel(message.content)
    || ''
  const contractCardName = truncateCardLabel(contractCardNameRaw, 25)

  const formatDurationMinutes = (minutes?: number | null) => {
    const total = Math.max(0, Number(minutes || 0))
    const h = Math.floor(total / 60)
    const m = total % 60
    if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, '0')}`
    if (h > 0) return `${h}h`
    if (m > 0) return `${m} min`
    return ''
  }

  const fetchSharedContractDetails = async (contractId: string, options?: { force?: boolean }) => {
    const force = Boolean(options?.force)
    const cached = sharedContractCache.get(contractId)
    if (cached && (!force || Boolean(cached.contract_content))) {
      setSharedContract(cached)
      return cached
    }

    try {
      setLoadingSharedContract(true)
      const { data, error } = await supabase
        .from('contracts')
        .select('id, status, contract_content, post:posts(title)')
        .eq('id', contractId)
        .maybeSingle()

      if (error) throw error

      if (!data) return null

      const row = data as {
        id: string
        status?: string | null
        contract_content?: string | null
        post?: { title?: string | null } | null
      }

      const next = {
        id: row.id,
        status: row.status || null,
        contract_title: extractContractNameFromContent(row.contract_content || null),
        post_title: row.post?.title || null,
        contract_content: row.contract_content || null
      }
      sharedContractCache.set(contractId, next)
      setSharedContract(next)
      return next
    } catch (error) {
      console.error('Error fetching shared contract:', error)
      return null
    } finally {
      setLoadingSharedContract(false)
    }
  }

  // Charger l'appointment_id si c'est un rendez-vous
  useEffect(() => {
    if (message.message_type === 'calendar_request' && message.id) {
      const fetchAppointment = async () => {
        const cachedAppointmentId = appointmentIdByMessageCache.get(message.id)
        if (cachedAppointmentId !== undefined) {
          setAppointmentId(cachedAppointmentId)
          return
        }

        try {
          const { data, error } = await supabase
            .from('appointments')
            .select('id')
            .eq('message_id', message.id)
            .maybeSingle()

          if (error) throw error
          
          if (data) {
            const nextId = (data as { id: string }).id
            appointmentIdByMessageCache.set(message.id, nextId)
            setAppointmentId(nextId)
          } else {
            appointmentIdByMessageCache.set(message.id, null)
            setAppointmentId(null)
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

  useEffect(() => {
    if (message.message_type !== 'contract_share' || !message.shared_contract_id) return

    const fetchContract = async () => {
      const contractId = String(message.shared_contract_id)
      await fetchSharedContractDetails(contractId)
    }

    void fetchContract()
  }, [message.message_type, message.shared_contract_id])

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
    // Détecte les liens Markdown [texte](url) et les URLs brutes (http:// ou https://)
    const combinedRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }
      if (match[1] && match[2]) {
        // Lien Markdown [label](url)
        parts.push({ label: match[1], url: match[2] })
      } else if (match[3]) {
        // URL brute - retirer la ponctuation finale (.,;:!?) pour l'href
        const rawUrl = match[3].replace(/[.,;:!?)]+$/, '')
        parts.push({ label: rawUrl, url: rawUrl })
      }
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
          rel="noopener noreferrer"
        >
          {part.label}
        </a>
      )
    })
  }

  const handleDownloadSharedContract = async () => {
    const contractTitle = contractDisplayTitle || 'Contrat'
    let content =
      sharedContract?.contract_content
      || (contractSnapshot?.kind === 'contract_share_snapshot' ? (contractSnapshot.contract_content || null) : null)
    if (!content && message.shared_contract_id) {
      const refreshed = await fetchSharedContractDetails(String(message.shared_contract_id), { force: true })
      content = refreshed?.contract_content || null
    }
    if (!content) {
      alert('Impossible de charger le contenu complet du contrat pour le téléchargement.')
      return
    }
    try {
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      })

      const marginX = 14
      const marginTop = 16
      const lineHeight = 6
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const maxTextWidth = pageWidth - marginX * 2
      const maxY = pageHeight - 16

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(13)
      const safeTitle = contractTitle.trim() || 'Contrat'
      pdf.text(safeTitle, marginX, marginTop)

      let cursorY = marginTop + 8
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)

      const paragraphs = content.split('\n')
      for (const paragraph of paragraphs) {
        const lines = pdf.splitTextToSize(paragraph || ' ', maxTextWidth) as string[]
        for (const line of lines) {
          if (cursorY > maxY) {
            pdf.addPage()
            cursorY = marginTop
          }
          pdf.text(line, marginX, cursorY)
          cursorY += lineHeight
        }
      }

      const fileName = safeTitle
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
      pdf.save(`${fileName || 'contrat'}.pdf`)
    } catch (error) {
      console.error('Error generating contract PDF from message:', error)
      alert('Impossible de générer le PDF pour ce contrat.')
    }
  }

  const navigateToContractEditor = ({
    contractId,
    fallbackTitle,
    acceptSharedContract
  }: {
    contractId: string
    fallbackTitle: string
    acceptSharedContract: boolean
  }) => {
    const params = new URLSearchParams()
    if (contractId) params.set('contract', contractId)
    if (fallbackTitle) params.set('draftName', fallbackTitle)
    if (acceptSharedContract && contractId) params.set('acceptContract', '1')

    setShowContractModal(false)
    setShowContractDocumentPreview(false)
    setShowContractSharePrompt(false)
    navigate(`/profile/contracts?${params.toString()}`)
  }

  const handleOpenContractEditor = async () => {
    const fallbackTitle =
      (contractSnapshot?.kind === 'contract_share_snapshot' ? (contractSnapshot.contract_title || '') : '')
      || normalizeContractMessageLabel(message.content)
    const contractId = message.shared_contract_id ? String(message.shared_contract_id) : ''

    if (!contractId && !fallbackTitle) {
      setContractEditorNotice({
        title: 'Contrat supprimé',
        message: 'Ce contrat n’existe plus. Il a peut-être été supprimé définitivement.'
      })
      return
    }

    if (!isOwn && contractId) {
      setShowContractSharePrompt(true)
      return
    }

    navigateToContractEditor({
      contractId,
      fallbackTitle,
      acceptSharedContract: false
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
      case 'calendar_request': {
        const calendarData = message.calendar_request_data as { 
          title?: string
          event_name?: string
          appointment_datetime?: string
          start_date?: string
          duration_minutes?: number
        } | null
        const appointmentDateTime = calendarData?.appointment_datetime || calendarData?.start_date
        const appointmentTitle = calendarData?.title || calendarData?.event_name || 'Rendez-vous'
        const appointmentDurationLabel = formatDurationMinutes(calendarData?.duration_minutes)
        const appointmentCardSubtitle = appointmentDateTime
          ? truncateCardLabel(
              [
                new Date(appointmentDateTime).toLocaleDateString('fr-FR'),
                new Date(appointmentDateTime).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                appointmentDurationLabel || ''
              ]
                .filter(Boolean)
                .join(' • '),
              25
            )
          : truncateCardLabel(appointmentTitle, 25)
        
        return (
          <>
            <div 
              className={`message-calendar ${isOwn ? 'own' : 'other'}`}
              onClick={() => setShowAppointmentModal(true)}
              style={{ cursor: 'pointer' }}
            >
              <Calendar size={24} />
              <div className="message-calendar-info">
                <span className="message-calendar-title">Rendez-vous</span>
                <span className="message-calendar-subtitle">
                  {appointmentCardSubtitle || (appointmentDateTime
                    ? new Date(appointmentDateTime).toLocaleDateString('fr-FR')
                    : 'Rendez-vous')}
                </span>
              </div>
            </div>
            {showAppointmentModal && canUsePortal && createPortal((
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
                            {appointmentDurationLabel && (
                              <div className="appointment-inline-selected-date">
                                <span className="appointment-inline-date-label">Durée :</span>
                                <span className="appointment-inline-date-value">{appointmentDurationLabel}</span>
                              </div>
                            )}
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
            ), document.body)}
          </>
        )
      }
      case 'post_share': {
        const postCardLabel = truncateCardLabel(sharedPost?.title || message.content || 'Annonce', 25)
        return (
          <div 
            className="message-post-share"
            onClick={() => message.shared_post_id && navigate(`/post/${message.shared_post_id}`)}
          >
            <div className="message-post-share-icon" aria-hidden="true">
              {sharedPost?.user?.avatar_url ? (
                <img 
                  src={sharedPost.user.avatar_url} 
                  alt=""
                  className="message-post-share-avatar"
                />
              ) : (
                <Share2 size={16} />
              )}
            </div>
            <div className="message-post-share-content">
              <h4 className="message-post-share-title">Annonce</h4>
              <span className="message-post-share-subtitle">{postCardLabel}</span>
            </div>
          </div>
        )
      }
      case 'contract_share':
        return (
          <div
            className="message-contract-share"
            onClick={() => {
              setShowContractDocumentPreview(true)
              setShowContractModal(true)
              if (message.shared_contract_id && !sharedContract?.contract_content) {
                void fetchSharedContractDetails(String(message.shared_contract_id))
              }
            }}
          >
            <div className="message-contract-share-icon">
              <File size={18} />
            </div>
            <div className="message-contract-share-content">
              <h4 className="message-contract-share-title">Contrat</h4>
              <p className="message-contract-share-subtitle">
                {contractCardName || contractDisplayLabel}
              </p>
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
  const canUsePortal = typeof document !== 'undefined'

  return (
    <div className={`message-bubble-wrapper ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && !isStandaloneMedia && (
        showAvatar ? (
          (message.sender?.email || '').toLowerCase() === (systemSenderEmail || '').toLowerCase() ? (
            <div className="message-avatar message-avatar-system">
              <Logo className="message-avatar-logo" width={32} height={16} />
            </div>
          ) : message.sender?.avatar_url ? (
            <img
              src={message.sender.avatar_url}
              alt={message.sender.full_name || message.sender.username || ''}
              className="message-avatar"
            />
          ) : (
            <div className="message-avatar message-avatar-fallback" aria-hidden="true">
              <User size={16} className="message-avatar-fallback-icon" />
            </div>
          )
        ) : (
          <div className="message-avatar-spacer" aria-hidden="true"></div>
        )
      )}
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
      {showImageModal && message.file_url && message.message_type === 'photo' && canUsePortal && createPortal((
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
      ), document.body)}

      {showContractModal && message.message_type === 'contract_share' && canUsePortal && createPortal((
        <div
          className="appointment-overlay"
          onClick={() => {
            setShowContractModal(false)
            setShowContractDocumentPreview(false)
          }}
        >
          <div className="contract-inline-panel" onClick={(e) => e.stopPropagation()}>
            <div className="appointment-inline-header">
              <h4>{contractDisplayTitle}</h4>
              <button
                className="appointment-inline-close"
                onClick={() => {
                  setShowContractModal(false)
                  setShowContractDocumentPreview(false)
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="contract-inline-body">
              <div className="contract-inline-document-card">
                <File size={18} />
                <div className="contract-inline-document-meta">
                  <strong>{contractDisplayLabel}</strong>
                  <span>{sharedContract?.status || (contractSnapshot?.status || 'generated')}</span>
                </div>
              </div>

              {showContractDocumentPreview && (
                <div className="contract-inline-preview">
                  {loadingSharedContract
                    ? 'Chargement du document...'
                    : (
                      sharedContract?.contract_content
                      || (contractSnapshot?.kind === 'contract_share_snapshot' ? (contractSnapshot.contract_content || null) : null)
                      || 'Le document sera visible après chargement du contrat.'
                    )}
                </div>
              )}

              <div className="contract-inline-actions">
                <button
                  type="button"
                  className="contract-inline-btn"
                  onClick={() => void handleDownloadSharedContract()}
                >
                  Télécharger le document
                </button>
                <button
                  type="button"
                  className="contract-inline-btn"
                  onClick={() => setShowContractDocumentPreview((prev) => !prev)}
                >
                  {showContractDocumentPreview ? 'Fermer le document' : 'Ouvrir le document'}
                </button>
                <button
                  type="button"
                  className="contract-inline-btn contract-inline-btn-primary"
                  onClick={() => void handleOpenContractEditor()}
                >
                  Modifier le contrat
                </button>
                <button
                  type="button"
                  className="contract-inline-btn"
                  onClick={() => {
                    setShowContractModal(false)
                    setShowContractDocumentPreview(false)
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}

      {contractEditorNotice && canUsePortal && createPortal((
        <div className="appointment-overlay" onClick={() => setContractEditorNotice(null)}>
          <div className="contract-status-notice-panel" onClick={(e) => e.stopPropagation()}>
            <div className="appointment-inline-header">
              <h4>{contractEditorNotice.title}</h4>
              <button
                className="appointment-inline-close"
                onClick={() => setContractEditorNotice(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="contract-status-notice-body">
              <p>{contractEditorNotice.message}</p>
              <button
                type="button"
                className="contract-inline-btn contract-inline-btn-primary"
                onClick={() => setContractEditorNotice(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {showContractSharePrompt && canUsePortal && createPortal((
        <div className="appointment-overlay" onClick={() => setShowContractSharePrompt(false)}>
          <div className="contract-status-notice-panel" onClick={(e) => e.stopPropagation()}>
            <div className="appointment-inline-header">
              <h4>Partager ce contrat ?</h4>
              <button
                className="appointment-inline-close"
                onClick={() => setShowContractSharePrompt(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="contract-status-notice-body">
              <p>
                Voulez-vous rejoindre ce contrat et le partager avec l’autre partie ? Si vous acceptez,
                le même contrat s’ouvrira avec vos informations de votre côté.
              </p>
              <button
                type="button"
                className="contract-inline-btn contract-inline-btn-primary"
                onClick={() =>
                  navigateToContractEditor({
                    contractId: message.shared_contract_id ? String(message.shared_contract_id) : '',
                    fallbackTitle:
                      (contractSnapshot?.kind === 'contract_share_snapshot'
                        ? (contractSnapshot.contract_title || '')
                        : '') || normalizeContractMessageLabel(message.content),
                    acceptSharedContract: true
                  })
                }
              >
                Oui, partager le contrat
              </button>
              <button
                type="button"
                className="contract-inline-btn"
                onClick={() => setShowContractSharePrompt(false)}
              >
                Non
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  )
}

export default MessageBubble
