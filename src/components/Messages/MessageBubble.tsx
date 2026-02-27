import { useState, useEffect, memo } from 'react'
import { File, MapPin, DollarSign, Share2, X, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { jsPDF } from 'jspdf'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import Logo from '../Logo'
import type { MentionableMember } from './MessageInput'
import { AppointmentBlock } from './AppointmentBlock'
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
    sender_id?: string | null
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
    conversation_id?: string | null
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
  groupParticipants?: MentionableMember[]
  onMentionClick?: (participant: MentionableMember) => void
  /** En groupe : seuls le créateur du rendez-vous et les admins peuvent modifier/annuler. En 1-to-1 : les deux peuvent. */
  isGroupConversation?: boolean
  /** Rôle de l'utilisateur dans la conversation (groupe) : 'moderator' = admin, 'member' = membre. */
  currentUserGroupRole?: string | null
  /** Si fourni, appelé au clic sur une annonce partagée (permet de préserver le scroll de la conversation) */
  onPostClick?: (postId: string) => void
  /** Message auquel on répond (affiché au-dessus du contenu avec trait, cliquable pour scroll) */
  replyTo?: { id: string; content?: string | null; message_type?: string; sender_id?: string | null } | null
  /** Appelé au clic sur le bandeau "message répondu" pour scroller vers le message d'origine */
  onReplyClick?: (messageId: string) => void
  /** ID de l'utilisateur connecté (pour afficher "Mes rendez-vous" vs "Ses rendez-vous") */
  currentUserId?: string | null
}

const getMemberDisplayName = (m: MentionableMember) =>
  (m.profile?.full_name || m.profile?.username || 'Utilisateur').trim() || 'Utilisateur'

const REPLY_PREVIEW_MAX_LEN = 15

function getReplyPreviewLabel(
  msg: { message_type?: string; sender_id?: string | null; content?: string | null },
  currentUserId?: string | null
): string {
  const type = msg.message_type || 'text'
  if (type === 'calendar_request') {
    return currentUserId && msg.sender_id === currentUserId ? 'Mes rendez-vous' : 'Ses rendez-vous'
  }
  if (type === 'post_share') return 'Annonce'
  if (type === 'photo' || type === 'video') return 'Image'
  if (type === 'document') return 'Document'
  const raw = String(msg.content || '').trim()
  if (!raw) return 'Message'
  return raw.length <= REPLY_PREVIEW_MAX_LEN ? raw : `${raw.slice(0, REPLY_PREVIEW_MAX_LEN)}…`
}

const MessageBubbleInner = ({ message, isOwn, showAvatar = false, systemSenderEmail, groupParticipants = [], onMentionClick, isGroupConversation = false, currentUserGroupRole = null, onPostClick, replyTo, onReplyClick, currentUserId }: MessageBubbleProps) => {
  const [showImageModal, setShowImageModal] = useState(false)
  const [showContractModal, setShowContractModal] = useState(false)
  const [showContractDocumentPreview, setShowContractDocumentPreview] = useState(false)
  const [contractEditorNotice, setContractEditorNotice] = useState<ContractEditorNotice | null>(null)
  const [showContractSharePrompt, setShowContractSharePrompt] = useState(false)
  const [loadingSharedContract, setLoadingSharedContract] = useState(false)
  const [sharedPost, setSharedPost] = useState<{
    title?: string
    removed?: boolean
    user?: {
      id: string
      username?: string | null
      full_name?: string | null
      avatar_url?: string | null
    } | null
  } | null>(null)
  const [sharedContract, setSharedContract] = useState<SharedContractDetails | null>(null)
  const navigate = useNavigate()
  useAuth()
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

  // Charger les infos du post partagé (et si supprimé/archivé, afficher "Annonce supprimée" non cliquable)
  useEffect(() => {
    if (message.message_type === 'post_share' && message.shared_post_id) {
      const fetchPost = async () => {
        try {
          const postId = message.shared_post_id
          if (!postId) return
          
          const { data: postData } = await supabase
            .from('posts')
            .select('title, user_id, status')
            .eq('id', postId)
            .maybeSingle()

          if (postData) {
            const post = postData as { title: string; user_id: string; status?: string }
            const isRemoved = post.status !== 'active'
            if (isRemoved) {
              setSharedPost({ title: 'Annonce supprimée', removed: true })
              return
            }
            const { data: userData } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .eq('id', post.user_id)
              .single()

            setSharedPost({
              title: post.title,
              removed: false,
              user: userData as {
                id: string
                username?: string | null
                full_name?: string | null
                avatar_url?: string | null
              } | null
            })
          } else {
            setSharedPost({ title: 'Annonce supprimée', removed: true })
          }
        } catch (error) {
          console.error('Error fetching shared post:', error)
          setSharedPost({ title: 'Annonce supprimée', removed: true })
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

  type ContentSegment = { type: 'text'; value: string } | { type: 'mention'; participant: MentionableMember; displayName: string }

  const parseContentWithMentions = (content: string): ContentSegment[] => {
    if (!content || !groupParticipants.length) return [{ type: 'text', value: content }]
    const segments: ContentSegment[] = []
    const sortedParticipants = [...groupParticipants].sort(
      (a, b) => getMemberDisplayName(b).length - getMemberDisplayName(a).length
    )
    let remaining = content
    while (remaining.length > 0) {
      const atIndex = remaining.indexOf('@')
      if (atIndex === -1) {
        segments.push({ type: 'text', value: remaining })
        break
      }
      if (atIndex > 0) {
        segments.push({ type: 'text', value: remaining.slice(0, atIndex) })
      }
      const afterAt = remaining.slice(atIndex + 1)
      let matched: { participant: MentionableMember; displayName: string } | null = null
      for (const p of sortedParticipants) {
        const name = getMemberDisplayName(p)
        const nameLower = name.toLowerCase()
        const afterLower = afterAt.toLowerCase()
        if (
          afterLower === nameLower ||
          afterLower.startsWith(nameLower + ' ') ||
          afterAt === name ||
          afterAt.startsWith(name + ' ')
        ) {
          matched = { participant: p, displayName: name }
          break
        }
      }
      if (matched) {
        segments.push({ type: 'mention', participant: matched.participant, displayName: matched.displayName })
        let nextStart = atIndex + 1 + matched.displayName.length
        if (afterAt.startsWith(matched.displayName + ' ')) nextStart += 1
        remaining = remaining.slice(nextStart)
      } else {
        segments.push({ type: 'text', value: '@' })
        remaining = afterAt
      }
    }
    return segments
  }

  const renderContentWithMentions = (content: string) => {
    const segments = parseContentWithMentions(content)
    return segments.map((seg, index) => {
      if (seg.type === 'text') {
        return <span key={`seg-${index}`}>{renderTextWithLinks(seg.value)}</span>
      }
      return (
        <button
          key={`seg-${index}`}
          type="button"
          className="message-mention"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onMentionClick?.(seg.participant)
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onMentionClick?.(seg.participant)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          @{seg.displayName}
        </button>
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
        if (!message.sender_id) return null
        return (
          <AppointmentBlock
            message={{
              id: message.id,
              sender_id: message.sender_id,
              conversation_id: message.conversation_id,
              calendar_request_data: message.calendar_request_data,
            }}
            isOwn={isOwn}
            isGroupConversation={isGroupConversation}
            currentUserGroupRole={currentUserGroupRole}
          />
        )
      }
      case 'post_share': {
        const isSharedPostRemoved = sharedPost?.removed === true
        const postCardLabel = isSharedPostRemoved
          ? 'Cette annonce a été supprimée.'
          : truncateCardLabel(sharedPost?.title || message.content || 'Annonce', 25)
        return (
          <div
            className={`message-post-share ${isSharedPostRemoved ? 'message-post-share--removed' : ''}`}
            onClick={() => {
              if (!isSharedPostRemoved && message.shared_post_id) {
                if (onPostClick) onPostClick(message.shared_post_id)
                else navigate(`/post/${message.shared_post_id}`)
              }
            }}
            role={isSharedPostRemoved ? undefined : 'button'}
          >
            <div className="message-post-share-icon" aria-hidden="true">
              {!isSharedPostRemoved && sharedPost?.user?.avatar_url ? (
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
              <h4 className="message-post-share-title">{isSharedPostRemoved ? 'Annonce supprimée' : 'Annonce'}</h4>
              <span className="message-post-share-subtitle">{postCardLabel}</span>
              {isSharedPostRemoved && (
                <span className="message-post-share-removed-hint">Cette annonce a été supprimée.</span>
              )}
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
        return (
          <p>
            {message.content
              ? groupParticipants.length > 0 && onMentionClick
                ? renderContentWithMentions(message.content)
                : renderTextWithLinks(message.content)
              : ''}
          </p>
        )
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
              alt={message.sender?.full_name || message.sender?.username || 'Compte supprimé'}
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
          <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${['calendar_request', 'post_share', 'contract_share'].includes(message.message_type || '') ? 'calendar-message' : ''}`}>
            {replyTo && (
              <button
                type="button"
                className="message-reply-quote"
                onClick={(e) => {
                  e.stopPropagation()
                  onReplyClick?.(replyTo.id)
                }}
              >
                <span className="message-reply-quote-line" aria-hidden="true" />
                <span className="message-reply-quote-text">
                  {getReplyPreviewLabel(replyTo, currentUserId)}
                </span>
              </button>
            )}
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

const MessageBubble = memo(MessageBubbleInner)
export default MessageBubble
