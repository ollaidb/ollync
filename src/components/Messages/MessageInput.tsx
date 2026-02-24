import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Send, Calendar, Plus, Loader, Film, X, Megaphone, FileText, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useConsent } from '../../hooks/useConsent'
import { checkModerationTextFromDb } from '../../utils/moderation'
import ConsentModal from '../ConsentModal'
import CalendarPicker from './CalendarPicker'
import PostSelector from './PostSelector'
import './MessageInput.css'

export interface MentionableMember {
  user_id: string
  profile?: { full_name?: string | null; username?: string | null } | null
}

interface MessageInputProps {
  conversationId: string
  senderId: string
  onMessageSent: () => void
  disabled?: boolean
  openCalendarOnMount?: boolean
  counterpartyId?: string | null
  groupMembers?: MentionableMember[]
}

type MessageType = 'text' | 'photo' | 'video' | 'document' | 'location' | 'price' | 'rate' | 'calendar_request' | 'post_share' | 'contract_share'

interface SelectableContract {
  id: string
  item_type: 'contract' | 'draft'
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  creator_id?: string | null
  counterparty_id?: string | null
  contract_type?: string | null
  payment_type?: string | null
  contract_content?: string | null
  display_name?: string | null
  draft_name?: string | null
  post?: {
    title?: string | null
  } | null
}

const TERMINAL_CONTRACT_STATUSES = new Set(['cancelled', 'canceled', 'completed', 'archived', 'deleted', 'rejected', 'expired'])
const CONTRACT_KIND_LABELS: Record<string, string> = {
  collaboration: 'Collaboration',
  prestation: 'Prestation',
  service: 'Service',
  vente: 'Vente',
  location: 'Location',
  licence: 'Licence',
  licensing: 'Licence',
  partenariat: 'Partenariat',
  sponsorship: 'Sponsoring',
  sponsoring: 'Sponsoring'
}

const extractContractNameFromContent = (content?: string | null) => {
  const raw = String(content || '')
  const match = raw.match(/Nom du contrat\s*:\s*(.+)/i)
  return match?.[1]?.trim() || null
}

const buildAutomaticContractName = (contractType?: string | null, paymentType?: string | null) => {
  const key = String(contractType || paymentType || '').trim().toLowerCase()
  if (!key) return 'Contrat'
  return `Contrat ${CONTRACT_KIND_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1)}`
}

const getContractListLabel = (contract: SelectableContract) => {
  if (contract.item_type === 'draft') {
    return contract.draft_name || 'Brouillon de contrat'
  }
  return (
    contract.display_name
    || extractContractNameFromContent(contract.contract_content)
    || buildAutomaticContractName(contract.contract_type, contract.payment_type)
  )
}

const dedupeSelectableContracts = (items: SelectableContract[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.item_type}:${item.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const makeSelectorLabelsUnique = (items: SelectableContract[]) => {
  const baseCounts = new Map<string, number>()
  const baseLabels = items.map((item) => {
    const base = getContractListLabel(item).trim() || (item.item_type === 'draft' ? 'Brouillon de contrat' : 'Contrat')
    baseCounts.set(base, (baseCounts.get(base) || 0) + 1)
    return base
  })

  return items.map((item, index) => {
    const base = baseLabels[index]
    if ((baseCounts.get(base) || 0) <= 1) {
      if (item.item_type === 'contract') return { ...item, display_name: base }
      if (item.item_type === 'draft') return { ...item, draft_name: base }
      return item
    }

    const dateLabel = (item.updated_at || item.created_at)
      ? new Date(item.updated_at || item.created_at || '').toLocaleDateString('fr-FR')
      : ''
    const suffix = dateLabel || String(item.id).slice(0, 6)
    const uniqueLabel = `${base} • ${suffix}`

    if (item.item_type === 'contract') return { ...item, display_name: uniqueLabel }
    if (item.item_type === 'draft') return { ...item, draft_name: uniqueLabel }
    return item
  })
}

const getMemberDisplayName = (m: MentionableMember) =>
  (m.profile?.full_name || m.profile?.username || 'Utilisateur').trim() || 'Utilisateur'

const MessageInput = ({ conversationId, senderId, onMessageSent, disabled = false, openCalendarOnMount = false, counterpartyId, groupMembers = [] }: MessageInputProps) => {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showPostSelector, setShowPostSelector] = useState(false)
  const [showContractSelector, setShowContractSelector] = useState(false)
  const [contractsLoading, setContractsLoading] = useState(false)
  const [deletingContractItemId, setDeletingContractItemId] = useState<string | null>(null)
  const [pendingDeleteContractItem, setPendingDeleteContractItem] = useState<SelectableContract | null>(null)
  const [contractItems, setContractItems] = useState<SelectableContract[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [appointmentDate, setAppointmentDate] = useState<string | null>(null)
  const [appointmentTime, setAppointmentTime] = useState('')
  const [appointmentDurationText, setAppointmentDurationText] = useState('01:00')
  const [appointmentTitle, setAppointmentTitle] = useState('')
  const [calendarStep, setCalendarStep] = useState<'date' | 'time'>('date')
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStartIndex, setMentionStartIndex] = useState(0)
  const [mentionHighlightIndex, setMentionHighlightIndex] = useState(0)

  // Hooks de consentement
  const mediaConsent = useConsent('media')
  const messagingConsent = useConsent('messaging')

  useEffect(() => {
    if (openCalendarOnMount) {
      setShowCalendarModal(true)
      setShowOptions(false)
      setCalendarStep('date')
    }
  }, [openCalendarOnMount])

  const sendMessage = async (type: MessageType | 'contract_share' = 'text', extraData?: Record<string, unknown>) => {
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
        const modResult = await checkModerationTextFromDb(message.trim())
        if (modResult.flagged) {
          messageData.moderation_status = 'flagged'
          messageData.moderation_reason = modResult.reasons.length ? modResult.reasons.join(',') : null
        }
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
            .from('public_conversations_with_users')
            .select('user1_id, user2_id')
            .eq('id', conversationId)
            .single()

          if (!convError && conversation) {
            const conv = conversation as { user1_id: string; user2_id: string }
            const recipientId = conv.user1_id === senderId ? conv.user2_id : conv.user1_id
            
            // Créer l'appointment (table peut ne pas exister encore, donc on ignore l'erreur)
            try {
              const appointmentTitle = calendarData.title || 'Rendez-vous'
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: appointmentRows, error: appointmentError } = await (supabase.from('appointments') as any)
                .insert({
                  message_id: messageResult[0].id,
                  conversation_id: conversationId,
                  sender_id: senderId,
                  recipient_id: recipientId,
                  appointment_datetime: calendarData.appointment_datetime,
                  title: appointmentTitle,
                  status: 'pending'
                })
                .select('id')

              if (appointmentError) {
                console.error('Error creating appointment:', appointmentError)
                // Ne pas bloquer l'envoi du message si l'appointment échoue
              } else if (appointmentRows?.[0]?.id) {
                const appointmentId = (appointmentRows[0] as { id: string }).id
                const appointmentDateLabel = new Date(calendarData.appointment_datetime).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
                const { data: senderProfile } = await supabase
                  .from('profiles')
                  .select('full_name, username')
                  .eq('id', senderId)
                  .single()
                const senderName = (senderProfile as { full_name?: string | null; username?: string | null } | null)?.full_name
                  || (senderProfile as { full_name?: string | null; username?: string | null } | null)?.username
                  || 'Quelqu\'un'

                // Notifications immédiates pour le créateur et le destinataire
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase.from('notifications') as any).insert([
                  {
                    user_id: senderId,
                    type: 'appointment',
                    title: 'Vous avez créé un rendez-vous',
                    content: `Rendez-vous : "${appointmentTitle}" le ${appointmentDateLabel}`,
                    related_id: appointmentId,
                    metadata: { conversation_id: conversationId, appointment_id: appointmentId }
                  },
                  {
                    user_id: recipientId,
                    type: 'appointment',
                    title: `${senderName} a créé un rendez-vous avec vous`,
                    content: `Rendez-vous : "${appointmentTitle}" le ${appointmentDateLabel}`,
                    related_id: appointmentId,
                    metadata: { conversation_id: conversationId, appointment_id: appointmentId }
                  }
                ])
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
      setAppointmentDurationText('01:00')
      setAppointmentTitle('')
      onMessageSent()
    } catch (error) {
      console.error('Error sending message:', error)
      alert(`Erreur lors de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSending(false)
    }
  }

  const sendMessageWithConsent = (type: MessageType = 'text', extraData?: Record<string, unknown>) => {
    messagingConsent.requireConsent(() => {
      void sendMessage(type, extraData)
    })
  }

  const loadContractsForConversation = async () => {
    if (!counterpartyId || !senderId) return
    setContractsLoading(true)
    try {
      const [{ data: contractsData, error }, { data: draftsData, error: draftsError }] = await Promise.all([
        supabase
        .from('contracts')
        .select('id, status, created_at, updated_at, creator_id, counterparty_id, contract_type, payment_type, contract_content, post:posts(title)')
        .or(
          `and(creator_id.eq.${senderId},counterparty_id.eq.${counterpartyId}),and(creator_id.eq.${counterpartyId},counterparty_id.eq.${senderId})`
        )
        .order('created_at', { ascending: false })
        .limit(30),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('contract_drafts') as any)
          .select('id, draft, updated_at')
          .eq('user_id', senderId)
          .order('updated_at', { ascending: false })
          .limit(20)
      ])

      if (error) throw error
      if (draftsError) {
        console.error('Error loading contract drafts for selector:', draftsError)
      }

      const contractRows = ((contractsData || []) as Array<Omit<SelectableContract, 'item_type'>>)
        .filter((item) => !TERMINAL_CONTRACT_STATUSES.has(String(item.status || '').toLowerCase()))
        .map((item) => ({
          ...item,
          display_name:
            extractContractNameFromContent((item as SelectableContract).contract_content)
            || buildAutomaticContractName((item as SelectableContract).contract_type, (item as SelectableContract).payment_type),
          item_type: 'contract' as const
        }))

      const draftRows = (((draftsData || []) as Array<{ id: string; updated_at?: string | null; draft?: Record<string, unknown> | null }>))
        .map((row) => {
          const snapshot = (row.draft || {}) as Record<string, unknown>
          const selectedOption = String(snapshot.selected_option || '')
          const contextLabel = selectedOption ? selectedOption.replace(':', ' ') : null
          const contractName = String(snapshot.contract_name || '').trim()
          return {
            id: row.id,
            item_type: 'draft' as const,
            status: 'draft',
            created_at: null,
            updated_at: row.updated_at || null,
            draft_name: contractName || (contextLabel ? `Brouillon • ${contextLabel}` : 'Brouillon de contrat'),
            post: null
          } satisfies SelectableContract
        })

      const allItems = makeSelectorLabelsUnique(dedupeSelectableContracts([...contractRows, ...draftRows]).sort((a, b) => {
        const aTs = +(new Date(a.updated_at || a.created_at || 0))
        const bTs = +(new Date(b.updated_at || b.created_at || 0))
        return bTs - aTs
      }))

      setContractItems(allItems)
      const firstContract = allItems.find((item) => item.item_type === 'contract')
      setSelectedContractId(firstContract?.id || allItems[0]?.id || null)
    } catch (error) {
      console.error('Error loading contracts for selector:', error)
      setContractItems([])
    } finally {
      setContractsLoading(false)
    }
  }

  const handleOpenContractSelector = async () => {
    if (!counterpartyId) {
      alert('Impossible de partager un contrat dans cette conversation.')
      return
    }
    setShowOptions(false)
    setContractItems([])
    setSelectedContractId(null)
    setShowContractSelector(true)
    await loadContractsForConversation()
  }

  const handleSendContractShare = async () => {
    if (!selectedContractId || disabled || sending) return
    const selected = contractItems.find((item) => item.id === selectedContractId)
    if (!selected) return

    if (selected.item_type === 'draft') {
      setShowContractSelector(false)
      alert('Ce brouillon doit être finalisé dans la page Contrats avant envoi.')
      navigate(counterpartyId ? `/profile/contracts?counterparty=${counterpartyId}` : '/profile/contracts')
      return
    }

    try {
      const contractLabel = getContractListLabel(selected)
      const contractSnapshot = selected.item_type === 'contract'
        ? {
            kind: 'contract_share_snapshot',
            contract_title: contractLabel,
            contract_content: selected.contract_content || null,
            status: selected.status || null
          }
        : null
      sendMessageWithConsent('contract_share', {
          shared_contract_id: selectedContractId,
          content: contractLabel ? `Contrat partagé • ${contractLabel}` : 'Contrat partagé',
          calendar_request_data: contractSnapshot
        })
      setShowContractSelector(false)
    } catch (error) {
      console.error('Error sending contract share:', error)
    }
  }

  const handleDeleteContractItem = async (item: SelectableContract) => {
    if (!senderId || deletingContractItemId) return

    setDeletingContractItemId(`${item.item_type}:${item.id}`)
    try {
      if (item.item_type === 'draft') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('contract_drafts') as any)
          .delete()
          .eq('id', item.id)
          .eq('user_id', senderId)
        if (error) throw error
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('contracts') as any)
          .delete()
          .eq('id', item.id)
          .or(`creator_id.eq.${senderId},counterparty_id.eq.${senderId}`)
        if (error) throw error
      }

      setContractItems((prev) => {
        const next = prev.filter((row) => !(row.item_type === item.item_type && row.id === item.id))
        if (selectedContractId === item.id) {
          const firstContract = next.find((row) => row.item_type === 'contract')
          setSelectedContractId(firstContract?.id || next[0]?.id || null)
        }
        return next
      })
    } catch (error) {
      console.error('Error deleting contract item from selector:', error)
      alert('Impossible de supprimer cet élément pour le moment.')
    } finally {
      setDeletingContractItemId(null)
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
        await sendMessageWithConsent(type, {
          file_url: data.publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        })
      } else {
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
        await sendMessageWithConsent(type, {
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

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Détecter automatiquement le type de fichier
    let fileType: 'photo' | 'video' | 'document' | null = null

    if (file.type.startsWith('image/')) {
      fileType = 'photo'
    } else if (file.type.startsWith('video/')) {
      fileType = 'video'
      // Vérifier la durée des vidéos
      const isValidDuration = await checkVideoDuration(file)
      if (!isValidDuration) {
        alert('La vidéo ne doit pas dépasser 10 secondes')
        e.target.value = ''
        return
      }
    } else if (
      file.type === 'application/pdf' ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'text/plain'
    ) {
      fileType = 'document'
    } else {
      alert('Type de fichier non supporté. Veuillez sélectionner une image, une vidéo ou un document.')
      e.target.value = ''
      return
    }

    if (fileType) {
      handleFileUpload(file, fileType)
    }

    // Réinitialiser l'input pour permettre de sélectionner le même fichier
    e.target.value = ''
  }

  const handlePostSelect = async (postId: string) => {
    if (disabled || sending) return
    setShowPostSelector(false)
    try {
      await sendMessageWithConsent('post_share', {
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

  const normalizeTime = (value: string) => {
    const cleaned = value.replace(/[^\d:]/g, '')
    const parts = cleaned.split(':')
    if (parts.length === 1) {
      const raw = parts[0]
      if (raw.length <= 2) return raw
      return `${raw.slice(0, 2)}:${raw.slice(2, 4)}`
    }
    const [h, m] = parts
    return `${h.slice(0, 2)}:${m.slice(0, 2)}`
  }

  const formatTime = (value: string) => {
    const [hRaw, mRaw] = value.split(':')
    const h = Math.min(Math.max(parseInt(hRaw || '0', 10), 0), 23)
    const m = Math.min(Math.max(parseInt(mRaw || '0', 10), 0), 59)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const minutesToTime = (minutes: number) => {
    const safe = Math.max(30, Number.isFinite(minutes) ? Math.floor(minutes) : 60)
    const h = Math.floor(safe / 60)
    const m = safe % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const durationTextToMinutes = (value: string) => {
    const formatted = formatTime(value || '01:00')
    const [hRaw, mRaw] = formatted.split(':')
    const h = parseInt(hRaw || '0', 10)
    const m = parseInt(mRaw || '0', 10)
    return Math.max(30, h * 60 + m)
  }

  const stepAppointmentTime = (deltaMinutes: number) => {
    const base = appointmentTime && appointmentTime.trim().length > 0 ? appointmentTime : '01:00'
    const [hRaw, mRaw] = formatTime(base).split(':')
    const h = parseInt(hRaw, 10)
    const m = parseInt(mRaw, 10)
    const total = h * 60 + m + deltaMinutes
    const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60)
    const nextH = Math.floor(normalized / 60)
    const nextM = normalized % 60
    setAppointmentTime(`${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`)
  }

  const stepAppointmentDuration = (deltaMinutes: number) => {
    const next = Math.max(30, durationTextToMinutes(appointmentDurationText || '01:00') + deltaMinutes)
    setAppointmentDurationText(minutesToTime(next))
  }

  const mentionableMembers = groupMembers.filter((m) => m.user_id !== senderId)
  const filteredMentionMembers = mentionableMembers.filter((m) => {
    const name = getMemberDisplayName(m).toLowerCase()
    return name.includes(mentionQuery.toLowerCase())
  })

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cursor = e.target.selectionStart ?? value.length
    setMessage(value)
    if (mentionableMembers.length === 0) return
    const textBeforeCursor = value.slice(0, cursor)
    const lastAt = textBeforeCursor.lastIndexOf('@')
    if (lastAt === -1) {
      setMentionOpen(false)
      return
    }
    const afterAt = textBeforeCursor.slice(lastAt + 1)
    if (afterAt.includes(' ')) {
      setMentionOpen(false)
      return
    }
    setMentionStartIndex(lastAt)
    setMentionQuery(afterAt)
    setMentionOpen(true)
    setMentionHighlightIndex(0)
  }

  const insertMention = (member: MentionableMember) => {
    const displayName = getMemberDisplayName(member)
    const before = message.slice(0, mentionStartIndex)
    const after = message.slice(messageInputRef.current?.selectionStart ?? message.length)
    const nextMessage = `${before}@${displayName} ${after}`
    setMessage(nextMessage)
    setMentionOpen(false)
    setMentionQuery('')
    const newCursor = before.length + displayName.length + 2
    requestAnimationFrame(() => {
      messageInputRef.current?.focus()
      messageInputRef.current?.setSelectionRange(newCursor, newCursor)
    })
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionOpen && filteredMentionMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionHighlightIndex((i) => (i + 1) % filteredMentionMembers.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionHighlightIndex((i) => (i - 1 + filteredMentionMembers.length) % filteredMentionMembers.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        insertMention(filteredMentionMembers[mentionHighlightIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMentionOpen(false)
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessageWithConsent('text')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!mentionOpen) void sendMessageWithConsent('text')
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

    const durationMinutes = durationTextToMinutes(appointmentDurationText || '01:00')

    await sendMessageWithConsent('calendar_request', {
      calendar_request_data: {
        title: appointmentTitle.trim(),
        appointment_datetime: appointmentDateTime,
        event_name: appointmentTitle.trim(),
        duration_minutes: durationMinutes
      }
    })
    
    // Réinitialiser le formulaire (sera fait dans sendMessage après succès)
    setAppointmentDate(null)
    setAppointmentTime('')
    setAppointmentDurationText('01:00')
    setAppointmentTitle('')
    setCalendarStep('date')
  }

  const handleCalendarClose = () => {
    setShowCalendarModal(false)
    setAppointmentDate(null)
    setAppointmentTime('')
    setAppointmentDurationText('01:00')
    setAppointmentTitle('')
    setCalendarStep('date')
  }

  return (
    <>
      {/* Overlay transparent avec bloc de rendez-vous au centre */}
      {showCalendarModal && (
        <div className="appointment-overlay" onClick={handleCalendarClose}>
          <div className="appointment-inline-panel" onClick={(event) => event.stopPropagation()}>
          <div className="appointment-inline-sheet-handle" aria-hidden="true" />
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
                  <div className="appointment-inline-time-row">
                    <input
                      type="text"
                      value={appointmentTime || '01:00'}
                      onChange={(e) => setAppointmentTime(normalizeTime(e.target.value))}
                      onBlur={() => setAppointmentTime(formatTime(appointmentTime || '01:00'))}
                      placeholder="HH:MM"
                      inputMode="numeric"
                      aria-label="Heure du rendez-vous"
                      className="appointment-inline-input appointment-inline-time-input"
                    />
                    <div className="appointment-inline-time-stepper">
                      <button
                        type="button"
                        className="appointment-inline-time-stepper-btn"
                        onClick={() => stepAppointmentTime(30)}
                        aria-label="Augmenter de 30 minutes"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="appointment-inline-time-stepper-btn"
                        onClick={() => stepAppointmentTime(-30)}
                        aria-label="Diminuer de 30 minutes"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="appointment-inline-form-group">
                  <label>Durée</label>
                  <div className="appointment-inline-time-row">
                    <input
                      type="text"
                      value={appointmentDurationText || '01:00'}
                      onChange={(e) => setAppointmentDurationText(normalizeTime(e.target.value))}
                      onBlur={() => setAppointmentDurationText(minutesToTime(durationTextToMinutes(appointmentDurationText || '01:00')))}
                      placeholder="HH:MM"
                      inputMode="numeric"
                      aria-label="Durée du rendez-vous"
                      className="appointment-inline-input appointment-inline-time-input"
                    />
                    <div className="appointment-inline-time-stepper">
                      <button
                        type="button"
                        className="appointment-inline-time-stepper-btn"
                        onClick={() => stepAppointmentDuration(30)}
                        aria-label="Augmenter de 30 minutes"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="appointment-inline-time-stepper-btn"
                        onClick={() => stepAppointmentDuration(-30)}
                        aria-label="Diminuer de 30 minutes"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>
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
          <button
            type="button"
            className="message-options-close"
            onClick={() => setShowOptions(false)}
            aria-label="Fermer"
          >
            ×
          </button>
          <button
            className="message-option-btn"
            onClick={() => {
              mediaInputRef.current?.click()
              setShowOptions(false)
            }}
            title="Médias"
          >
            <Film size={22} />
            <span>Médias</span>
          </button>
          <button
            className="message-option-btn"
            onClick={() => {
              setShowPostSelector(true)
              setShowOptions(false)
            }}
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
          <button
            className="message-option-btn"
            onClick={() => {
              void handleOpenContractSelector()
            }}
            title="Contrat"
          >
            <FileText size={22} />
            <span>Contrat</span>
          </button>
        </div>
      )}

      <div className="message-input-wrapper">
        <button
          type="button"
          className="message-options-toggle"
          onClick={() => setShowOptions(!showOptions)}
          title="Options"
          aria-label="Ouvrir les options d'envoi (photo, vidéo, document, etc.)"
        >
          <Plus size={20} aria-hidden />
        </button>
        <div className="message-input-field-wrapper">
          <input
            ref={messageInputRef}
            type="text"
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleInputKeyDown}
            onKeyPress={handleKeyPress}
            placeholder="Message..."
            disabled={disabled || sending}
            className="message-input-field"
          />
          {mentionOpen && mentionableMembers.length > 0 && (
            <div className="message-mention-dropdown" role="listbox">
              {filteredMentionMembers.length === 0 ? (
                <div className="message-mention-dropdown-empty">Aucun membre</div>
              ) : (
                filteredMentionMembers.map((member, index) => (
                  <button
                    key={member.user_id}
                    type="button"
                    role="option"
                    aria-selected={index === mentionHighlightIndex}
                    className={`message-mention-dropdown-item ${index === mentionHighlightIndex ? 'highlighted' : ''}`}
                    onClick={() => insertMention(member)}
                  >
                    {getMemberDisplayName(member)}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => void sendMessageWithConsent('text')}
          disabled={!message.trim() || disabled || sending}
          className="message-send-btn"
          aria-label={sending ? 'Envoi en cours' : 'Envoyer le message'}
        >
          {sending ? (
            <Loader className="spinner" size={16} aria-hidden />
          ) : (
            <Send size={16} aria-hidden />
          )}
        </button>
      </div>

      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        onChange={handleMediaSelect}
        style={{ display: 'none' }}
      />

      {/* Modals de consentement */}
      <ConsentModal
        visible={mediaConsent.showModal}
        title={mediaConsent.messages.title}
        message={mediaConsent.messages.message}
        onAccept={mediaConsent.handleAccept}
        onReject={mediaConsent.handleReject}
        onLearnMore={mediaConsent.dismissModal}
        learnMoreHref="/profile/legal/politique-confidentialite"
        askAgainChecked={mediaConsent.askAgainNextTime}
        onAskAgainChange={mediaConsent.setAskAgainNextTime}
      />

      <ConsentModal
        visible={messagingConsent.showModal}
        title={messagingConsent.messages.title}
        message={messagingConsent.messages.message}
        onAccept={messagingConsent.handleAccept}
        onReject={messagingConsent.handleReject}
        onLearnMore={messagingConsent.dismissModal}
        learnMoreHref="/profile/legal/politique-confidentialite"
        askAgainChecked={messagingConsent.askAgainNextTime}
        onAskAgainChange={messagingConsent.setAskAgainNextTime}
      />



      {/* Modal pour sélectionner une annonce */}
      {showPostSelector && (
        <PostSelector
          onPostSelect={handlePostSelect}
          onClose={() => setShowPostSelector(false)}
        />
      )}

      {showContractSelector && typeof document !== 'undefined' && createPortal(
        <>
          <div className="message-contract-selector-backdrop" onClick={() => setShowContractSelector(false)} />
          <div className="message-contract-selector-panel" onClick={(e) => e.stopPropagation()}>
            <div className="message-contract-selector-content">
              <div className="message-contract-selector-handle" aria-hidden="true" />
              <div className="message-contract-selector-header">
                <h3>Choisir un contrat</h3>
                <button type="button" className="message-contract-selector-close" onClick={() => setShowContractSelector(false)} aria-label="Fermer">
                  ✕
                </button>
              </div>
              <p className="message-contract-selector-hint">
                Sélectionne un contrat existant pour l’envoyer dans cette conversation.
              </p>
              <div className="message-contract-selector-list">
                {contractsLoading ? (
                  <div className="message-contract-selector-empty">
                    <Loader className="spinner" size={20} />
                    <span>Chargement...</span>
                  </div>
                ) : contractItems.length === 0 ? (
                  <div className="message-contract-selector-empty">
                    <p>Aucun brouillon ni contrat en cours disponible.</p>
                    <button
                      type="button"
                      className="message-contract-selector-link-btn"
                      onClick={() => {
                        setShowContractSelector(false)
                        navigate(counterpartyId ? `/profile/contracts?counterparty=${counterpartyId}` : '/profile/contracts')
                      }}
                    >
                      Créer / continuer un contrat
                    </button>
                  </div>
                ) : (
                  contractItems.map((contract) => {
                    const rowKey = `${contract.item_type}:${contract.id}`
                    const isDeleting = deletingContractItemId === rowKey
                    return (
                      <div
                        key={rowKey}
                        className={`message-contract-selector-row ${selectedContractId === contract.id ? 'selected' : ''}`}
                      >
                        <button
                          type="button"
                          className={`message-contract-selector-item ${selectedContractId === contract.id ? 'selected' : ''}`}
                          onClick={() => setSelectedContractId(contract.id)}
                        >
                          <div className="message-contract-selector-item-title">
                            {getContractListLabel(contract)}
                          </div>
                          <div className="message-contract-selector-item-meta">
                            <span>{contract.item_type === 'draft' ? 'brouillon' : (contract.status || 'generated')}</span>
                            <span>
                              {(contract.updated_at || contract.created_at)
                                ? new Date(contract.updated_at || contract.created_at || '').toLocaleDateString('fr-FR')
                                : ''}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="message-contract-selector-delete"
                          aria-label={contract.item_type === 'draft' ? 'Supprimer le brouillon' : 'Supprimer le contrat'}
                          title={contract.item_type === 'draft' ? 'Supprimer le brouillon' : 'Supprimer le contrat'}
                          disabled={isDeleting}
                          onClick={(event) => {
                            event.stopPropagation()
                            setPendingDeleteContractItem(contract)
                          }}
                        >
                          {isDeleting ? <Loader className="spinner" size={12} /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
              <div className="message-contract-selector-actions">
                <button
                  type="button"
                  className="message-contract-selector-btn secondary"
                  onClick={() => {
                    setShowContractSelector(false)
                    navigate(counterpartyId ? `/profile/contracts?counterparty=${counterpartyId}` : '/profile/contracts')
                  }}
                >
                  Ouvrir Contrats
                </button>
              <button
                type="button"
                className="message-contract-selector-btn primary"
                onClick={() => void handleSendContractShare()}
                disabled={!selectedContractId || contractsLoading || sending}
              >
                {sending
                  ? 'Envoi...'
                  : (contractItems.find((item) => item.id === selectedContractId)?.item_type === 'draft'
                      ? 'Ouvrir le brouillon'
                      : 'Envoyer')}
              </button>
              </div>
            </div>
          </div>
          {pendingDeleteContractItem && (
            <div
              className="message-contract-delete-confirm-overlay"
              onClick={() => setPendingDeleteContractItem(null)}
            >
              <div
                className="message-contract-delete-confirm"
                onClick={(e) => e.stopPropagation()}
              >
                <h4>
                  {pendingDeleteContractItem.item_type === 'draft'
                    ? 'Supprimer le brouillon'
                    : 'Supprimer le contrat'}
                </h4>
                <p>{getContractListLabel(pendingDeleteContractItem)}</p>
                <span>
                  Cette suppression est définitive.
                </span>
                <div className="message-contract-delete-confirm-actions">
                  <button
                    type="button"
                    className="message-contract-delete-confirm-btn secondary"
                    onClick={() => setPendingDeleteContractItem(null)}
                    disabled={Boolean(deletingContractItemId)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="message-contract-delete-confirm-btn danger"
                    onClick={() => {
                      const item = pendingDeleteContractItem
                      setPendingDeleteContractItem(null)
                      void handleDeleteContractItem(item)
                    }}
                    disabled={Boolean(deletingContractItemId)}
                  >
                    {deletingContractItemId ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </>
  )
}

export default MessageInput
