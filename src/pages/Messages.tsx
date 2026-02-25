import { useState, useEffect, useCallback, useRef, useMemo, useDeferredValue } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom'
import { MailOpen, Loader, Search, Users, Archive, Plus, Calendar, Pin, Trash2, Copy, Send, Camera, Film, ChevronRight, Download, Share2, Check, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import { useUnreadCommunicationCounts } from '../hooks/useUnreadCommunicationCounts'
import { AuthBackground } from '../components/Auth/AuthBackground'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import Logo from '../components/Logo'
import CreateGroupModal from '../components/Messages/CreateGroupModal'
import CreateMessageActionModal from '../components/Messages/CreateMessageActionModal'
import SelectUsersModal from '../components/Messages/SelectUsersModal'
import MessageInput from '../components/Messages/MessageInput'
import MessageBubble from '../components/Messages/MessageBubble'
import { EmptyState } from '../components/EmptyState'
import MatchRequestDetail from '../components/Messages/MatchRequestDetail'
import ConfirmationModal from '../components/ConfirmationModal'
import { PageMeta } from '../components/PageMeta'
import './Auth.css'
import './Messages.css'

type FilterType = 'all' | 'posts' | 'matches' | 'match_requests' | 'groups' | 'appointments' | 'archived'

const SYSTEM_SENDER_EMAIL = 'binta22116@gmail.com'
const SYSTEM_SENDER_NAME = 'Ollync'
const isSystemUserEmail = (email?: string | null) =>
  (email || '').trim().toLowerCase() === SYSTEM_SENDER_EMAIL

interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at?: string | null
  post_id?: string | null
  group_name?: string | null
  group_photo_url?: string | null
  group_description?: string | null
  group_creator_id?: string | null
  name?: string | null
  last_message_at?: string | null
  lastMessage?: {
    content: string
    created_at: string
    sender_id?: string | null
    message_type?: string | null
  } | null
  other_user?: {
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
    email?: string | null
    last_activity_at?: string | null
    is_online?: boolean | null
  } | null
  postTitle?: string | null
  unread?: number
  is_group?: boolean
  has_messages?: boolean
  is_archived?: boolean
  archived_at?: string | null
  is_pinned?: boolean
  pinned_at?: string | null
  deleted_at?: string | null
  type?: string | null
}

interface MatchRequest {
  id: string
  from_user_id: string
  to_user_id: string
  related_post_id?: string | null
  request_message?: string | null
  request_role?: string | null
  request_document_url?: string | null
  request_document_name?: string | null
  request_cover_letter_url?: string | null
  request_cover_letter_name?: string | null
  request_intent?: 'request' | 'apply' | 'buy' | 'reserve' | 'ticket' | null
  reservation_date?: string | null
  reservation_time?: string | null
  reservation_duration_minutes?: number | null
  related_service_name?: string | null
  related_service_description?: string | null
  related_service_payment_type?: 'price' | 'exchange' | null
  related_service_value?: string | null
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  created_at: string
  updated_at?: string | null
  accepted_at?: string | null
  conversation_id?: string | null
  opened_by_sender_at?: string | null
  opened_by_recipient_at?: string | null
  other_user?: {
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
  related_post?: {
    id: string
    title: string
    status?: string
  } | null
  request_type?: 'sent' | 'received' // 'sent' si from_user_id = current_user, 'received' si to_user_id = current_user
}

interface Appointment {
  id: string
  conversation_id: string
  sender_id: string
  recipient_id: string
  title: string
  appointment_datetime: string
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  other_user?: {
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

interface SelectableUser {
  id: string
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
  email?: string | null
}

interface ConversationParticipant {
  user_id: string
  is_active?: boolean | null
  role?: string | null
  profile?: {
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

interface Message {
  id: string
  content?: string | null
  sender_id: string
  created_at: string
  read_at?: string | null
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
  is_deleted?: boolean | null
  deleted_for_user_id?: string | null
  is_deleted_for_all?: boolean | null
  deleted_for_all_at?: string | null
  sender?: {
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
    email?: string | null
  } | null
}

const Messages = () => {
  const { t } = useTranslation(['messages', 'common'])
  const navigate = useNavigate()
  const location = useLocation()
  const { id: conversationId } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const postId = searchParams.get('post')
  const openAppointment = searchParams.get('openAppointment') === '1'
  const { user } = useAuth()
  const { counts: unreadCommunicationCounts, markTypesAsRead, pendingRequestsCount } = useUnreadCommunicationCounts()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([])
  const [selectedMatchRequest, setSelectedMatchRequest] = useState<MatchRequest | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointmentPreview, setSelectedAppointmentPreview] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateActionModal, setShowCreateActionModal] = useState(false)
  const [showSelectGroupUsers, setShowSelectGroupUsers] = useState(false)
  const [showSelectAppointmentUser, setShowSelectAppointmentUser] = useState(false)
  const [selectableUsers, setSelectableUsers] = useState<SelectableUser[]>([])
  const [selectableUsersLoading, setSelectableUsersLoading] = useState(false)
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<SelectableUser[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showLeaveGroupConfirm, setShowLeaveGroupConfirm] = useState(false)
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([])
  const [showScamPrevention, setShowScamPrevention] = useState(false)
  const [listActionConversation, setListActionConversation] = useState<Conversation | null>(null)
  const [showListConversationActions, setShowListConversationActions] = useState(false)
  const [activeMessage, setActiveMessage] = useState<Message | null>(null)
  const [showMessageActions, setShowMessageActions] = useState(false)
  const [showDeleteMessageConfirm, setShowDeleteMessageConfirm] = useState(false)
  const [showForwardMessage, setShowForwardMessage] = useState(false)
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null)
  const [messageReactions, setMessageReactions] = useState<Record<string, Array<{ emoji: string; count: number }>>>({})
  const [groupCreator, setGroupCreator] = useState<{ id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null } | null>(null)
  const [conversationAliases, setConversationAliases] = useState<Record<string, string>>({})
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoParticipants, setInfoParticipants] = useState<ConversationParticipant[]>([])
  const [groupNameDraft, setGroupNameDraft] = useState('')
  const [groupDescriptionDraft, setGroupDescriptionDraft] = useState('')
  const [groupPhotoDraft, setGroupPhotoDraft] = useState<string | null>(null)
  const [groupPhotoFile, setGroupPhotoFile] = useState<File | null>(null)
  const [savingGroup, setSavingGroup] = useState(false)
  const [aliasDraft, setAliasDraft] = useState('')
  const [aliasSaveFeedback, setAliasSaveFeedback] = useState<'idle' | 'saved'>('idle')
  const [mediaTab, setMediaTab] = useState<'media' | 'links' | 'documents'>('media')
  const [showAddParticipants, setShowAddParticipants] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<ConversationParticipant | null>(null)
  const [showMemberBottomSheet, setShowMemberBottomSheet] = useState(false)
  const [showLinkPostSheet, setShowLinkPostSheet] = useState(false)
  const [selectablePostsForLink, setSelectablePostsForLink] = useState<Array<{ id: string; title: string }>>([])
  const [linkPostLoading, setLinkPostLoading] = useState(false)
  const [inviteLinkToken, setInviteLinkToken] = useState<string | null>(null)
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false)
  const [showMediaActions, setShowMediaActions] = useState(false)
  const [selectedMediaMessage, setSelectedMediaMessage] = useState<Message | null>(null)
  const [missingNotice, setMissingNotice] = useState<string | null>(null)
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false)
  const [participantToRemove, setParticipantToRemove] = useState<ConversationParticipant | null>(null)
  const [showDissociateConfirm, setShowDissociateConfirm] = useState(false)
  const [groupActionFeedback, setGroupActionFeedback] = useState<string | null>(null)

  const conversationTouchRef = useRef<{ id?: string; startX: number; startY: number } | null>(null)
  const messageTouchRef = useRef<{ id?: string; startX: number; startY: number } | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const messagesListRef = useRef<HTMLDivElement | null>(null)
  const inputContainerRef = useRef<HTMLDivElement | null>(null)
  const shouldScrollToBottomRef = useRef(false)
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null)
  const lastMessageRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const groupPhotoInputRef = useRef<HTMLInputElement | null>(null)
  const aliasSaveFeedbackTimerRef = useRef<number | null>(null)
  const groupActionFeedbackTimerRef = useRef<number | null>(null)
  const loadMessagesRequestIdRef = useRef(0)
  const loadConversationsRequestIdRef = useRef(0)
  const isInfoView = location.pathname.endsWith('/info')
  const isMediaView = location.pathname.endsWith('/media')
  const isAppointmentsView = location.pathname.endsWith('/appointments')
  const isContractsView = location.pathname.endsWith('/contracts')
  const isPostsView = location.pathname.endsWith('/posts')
  const isConversationView = Boolean(conversationId || selectedConversation)

  // Lire le paramètre filter depuis l'URL pour activer automatiquement le bon filtre
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam && ['all', 'posts', 'matches', 'match_requests', 'groups', 'appointments', 'archived'].includes(filterParam)) {
      setActiveFilter(filterParam as FilterType)
    }
  }, [searchParams])

  useEffect(() => {
    if (!user) return

    if (activeFilter === 'all') {
      markTypesAsRead(['message'])
      return
    }

    if (activeFilter === 'matches') {
      markTypesAsRead(['match'])
      return
    }

    if (activeFilter === 'match_requests') {
      markTypesAsRead(['request'])
      return
    }

    if (activeFilter === 'appointments') {
      markTypesAsRead(['appointment'])
    }
  }, [activeFilter, markTypesAsRead, user])

  useEffect(() => {
    if (!headerRef.current || !containerRef.current) return
    const updateOffset = () => {
      const height = headerRef.current?.offsetHeight || 0
      containerRef.current?.style.setProperty('--messages-header-offset', `${height}px`)
    }
    updateOffset()
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateOffset) : null
    observer?.observe(headerRef.current)
    window.addEventListener('resize', updateOffset)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', updateOffset)
    }
  }, [])

  useEffect(() => {
    if (user) {
      if (postId) {
        handlePostMessage(postId)
      } else if (conversationId) {
        loadConversation(conversationId)
      }
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, postId, conversationId])

  useEffect(() => {
    const state = location.state as { missingNotice?: string } | null
    if (state?.missingNotice) {
      setMissingNotice(state.missingNotice)
    }
  }, [location.state])

  const inviteToken = searchParams.get('invite')
  useEffect(() => {
    if (!user || !inviteToken) return
    let cancelled = false
    const run = async () => {
      try {
        const { data, error } = await supabase
          .from('group_invite_tokens')
          .select('conversation_id')
          .eq('token', inviteToken)
          .gt('expires_at', new Date().toISOString())
          .single()
        if (cancelled || error || !data) return
        const convId = (data as { conversation_id: string }).conversation_id
        const { error: insertErr } = await (supabase.from('conversation_participants') as any).insert({
          conversation_id: convId,
          user_id: user.id,
          is_active: true
        }).select()
        if (insertErr && insertErr.code !== '23505') return
        if (!cancelled) {
          navigate(`/messages/${convId}`, { replace: true })
          loadConversations()
        }
      } catch {
        // ignore
      }
    }
    run()
    return () => { cancelled = true }
  }, [user, inviteToken, navigate])

  useEffect(() => {
    if (conversationId) {
      shouldScrollToBottomRef.current = true
    }
  }, [conversationId])

  useEffect(() => {
    if (selectedConversation?.id) {
      shouldScrollToBottomRef.current = true
    }
  }, [selectedConversation?.id])


  const scrollToBottom = (align: ScrollLogicalPosition = 'end') => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ block: align })
    } else if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ block: 'end' })
    } else if (messagesListRef.current) {
      messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight
    }
    shouldScrollToBottomRef.current = false
  }

  const scheduleScrollToBottom = (align: ScrollLogicalPosition = 'end') => {
    requestAnimationFrame(() => scrollToBottom(align))
    window.setTimeout(() => scrollToBottom(align), 160)
    window.setTimeout(() => scrollToBottom(align), 360)
  }

  useEffect(() => {
    if (!shouldScrollToBottomRef.current) return
    scheduleScrollToBottom('end')
  }, [messages])

  useEffect(() => {
    if (!inputContainerRef.current) return
    const updateOffset = () => {
      if (!inputContainerRef.current || !messagesListRef.current) return
      const baseHeight = inputContainerRef.current.getBoundingClientRect().height + 12
      let keyboardGap = 0
      if (window.visualViewport) {
        const viewportBottom = window.visualViewport.height + window.visualViewport.offsetTop
        keyboardGap = Math.max(0, window.innerHeight - viewportBottom)
      }
      const height = baseHeight + keyboardGap
      messagesListRef.current.style.setProperty('--messages-input-offset', `${height}px`)
      if (shouldScrollToBottomRef.current) {
        scheduleScrollToBottom('end')
      }
    }
    updateOffset()
    const observer = new ResizeObserver(updateOffset)
    observer.observe(inputContainerRef.current)
    const viewport = window.visualViewport
    if (viewport) {
      viewport.addEventListener('resize', updateOffset)
      viewport.addEventListener('scroll', updateOffset)
    }
    return () => {
      observer.disconnect()
      const viewport = window.visualViewport
      if (viewport) {
        viewport.removeEventListener('resize', updateOffset)
        viewport.removeEventListener('scroll', updateOffset)
      }
    }
  }, [])

  useEffect(() => {
    if (openAppointment && (selectedConversation || conversationId)) {
      const currentId = selectedConversation?.id || conversationId
      if (currentId) {
        navigate(`/messages/${currentId}`, { replace: true })
      }
    }
  }, [openAppointment, selectedConversation, conversationId, navigate])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('messages_aliases')
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>
        setConversationAliases(parsed || {})
      }
    } catch (error) {
      console.error('Error reading message aliases:', error)
    }
  }, [])

  const formatTime = (dateString: string | null | undefined): string => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInDays === 1) {
      return 'Hier'
    } else if (diffInDays < 7) {
      return `${diffInDays}j`
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }
  }

  const getConversationPreview = (conv: Conversation, matchReqs?: MatchRequest[]) => {
    const lastMessage = conv.lastMessage
    const isSentByUser = lastMessage ? lastMessage.sender_id === user?.id : false
    const directionLabelFem = isSentByUser ? 'envoyée' : 'reçue'
    const directionLabelMasc = isSentByUser ? 'envoyé' : 'reçu'

    // Si pas de message mais qu'un match a été accepté pour cette conversation → Annonce acceptée
    if (!lastMessage) {
      const acceptedMatch = matchReqs?.find(
        (r) => r.conversation_id === conv.id && r.status === 'accepted'
      )
      return acceptedMatch ? 'Annonce acceptée' : ''
    }

    switch (lastMessage.message_type) {
      case 'photo':
        return `Image ${directionLabelFem}`
      case 'video':
        return `Vidéo ${directionLabelFem}`
      case 'document':
        return `Document ${directionLabelMasc}`
      case 'location':
        return `Localisation ${directionLabelFem}`
      case 'price':
        return `Prix proposé ${directionLabelMasc}`
      case 'rate':
        return `Tarif ${directionLabelMasc}`
      case 'calendar_request':
        return `Rendez-vous ${directionLabelMasc}`
      case 'post_share':
        return `Annonce ${directionLabelFem}`
      case 'contract_share': {
        const text = (lastMessage.content || '').trim()
        return text || `Contrat ${directionLabelMasc}`
      }
      case 'link':
        return `Lien ${directionLabelMasc}`
      case 'match_accepted':
        return 'Annonce acceptée'
      default: {
        // Vérifier si le match accepté est l'événement le plus récent
        const acceptedMatch = matchReqs?.find(
          (r) => r.conversation_id === conv.id && r.status === 'accepted'
        )
        const matchAcceptedAt = acceptedMatch?.accepted_at || acceptedMatch?.created_at
        const lastMsgAt = lastMessage.created_at
        if (matchAcceptedAt && lastMsgAt && new Date(matchAcceptedAt) > new Date(lastMsgAt)) {
          return 'Annonce acceptée'
        }
        const text = (lastMessage.content || '').trim()
        if (!text || text === '0') return ''
        // Si le contenu est principalement un lien, afficher "Lien envoyé/reçu"
        if (hasLinkContent(text)) return `Lien ${directionLabelMasc}`
        return text
      }
    }
  }

  const formatAppointmentDate = (dateString: string): string => {
    const date = new Date(dateString)
    const datePart = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    const timePart = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return `${datePart} • ${timePart}`
  }

  const getContractMessageLabel = (message: Message): string => {
    const raw = (message.content || '').trim()
    if (!raw) return 'Contrat partagé'
    return raw.replace(/^Contrat partagé\s*[•:-]\s*/i, '').trim() || raw
  }

  const getSharedPostLabel = (message: Message): string => {
    const raw = (message.content || '').trim()
    if (!raw) return 'Annonce partagée'
    return raw.replace(/^Annonce partagée\s*[•:-]\s*/i, '').trim() || raw
  }

  const formatLastSeen = (dateString?: string | null): string => {
    if (!dateString) return 'Dernière activité : inconnue'

    const date = new Date(dateString)
    const now = new Date()
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffInMs = todayOnly.getTime() - dateOnly.getTime()
    const diffInDays = Math.max(0, Math.floor(diffInMs / (1000 * 60 * 60 * 24)))

    if (diffInDays === 0) {
      const timePart = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      return `Dernière activité : ${timePart}`
    }

    if (diffInDays === 1) {
      return 'Dernière activité : hier'
    }

    const dayLabel = diffInDays > 1 ? 'jours' : 'jour'
    return `Dernière activité : il y a ${diffInDays} ${dayLabel}`
  }

  const hasLinkContent = (text?: string | null) => {
    if (!text) return false
    return /https?:\/\/\S+/i.test(text)
  }

  const extractFirstLink = (text?: string | null) => {
    if (!text) return ''
    const match = text.match(/https?:\/\/\S+/i)
    return match ? match[0] : ''
  }

  const openPublicProfile = (profileId?: string | null) => {
    if (!profileId) return
    navigate(`/profile/public/${profileId}`)
  }

  const openContractDetails = (message: Message) => {
    const params = new URLSearchParams()
    if (message.shared_contract_id) params.set('contract', String(message.shared_contract_id))
    if (!selectedConversation?.is_group && selectedConversation?.other_user?.id) {
      params.set('counterparty', selectedConversation.other_user.id)
    }
    const query = params.toString()
    navigate(query ? `/profile/contracts?${query}` : '/profile/contracts')
  }

  const openAppointmentDetailsFromMessage = (message: Message) => {
    const currentId = selectedConversation?.id || conversationId
    const data = (message.calendar_request_data || {}) as {
      title?: string
      appointment_datetime?: string
    }

    const matchedAppointment = appointments.find((appointment) => {
      if (currentId && appointment.conversation_id !== currentId) return false
      const sameDate = data.appointment_datetime
        ? appointment.appointment_datetime === data.appointment_datetime
        : true
      const sameTitle = data.title
        ? (appointment.title || '').trim() === (data.title || '').trim()
        : true
      return sameDate && sameTitle
    })

    if (matchedAppointment) {
      setSelectedAppointmentPreview(matchedAppointment)
      return
    }

    if (currentId) {
      navigate(`/messages/${currentId}?openAppointment=1`)
    }
  }

  const handleSaveMedia = async (msg: Message) => {
    if (!msg.file_url) return
    try {
      const response = await fetch(msg.file_url)
      if (!response.ok) throw new Error('download_failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = msg.file_name || 'media'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      // Fallback: ouvrir si le téléchargement est bloqué par CORS
      window.open(msg.file_url, '_blank', 'noopener,noreferrer')
    }
  }

  useEffect(() => {
    return () => {
      if (aliasSaveFeedbackTimerRef.current) {
        window.clearTimeout(aliasSaveFeedbackTimerRef.current)
      }
      if (groupActionFeedbackTimerRef.current) {
        window.clearTimeout(groupActionFeedbackTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setAliasSaveFeedback('idle')
  }, [selectedConversation?.id])

  const showGroupActionFeedback = useCallback((message: string) => {
    setGroupActionFeedback(message)
    if (groupActionFeedbackTimerRef.current) {
      window.clearTimeout(groupActionFeedbackTimerRef.current)
    }
    groupActionFeedbackTimerRef.current = window.setTimeout(() => {
      setGroupActionFeedback(null)
      groupActionFeedbackTimerRef.current = null
    }, 3500)
  }, [])

  const handleShareMedia = async (msg: Message, type: 'link' | 'media') => {
    try {
      if (type === 'link') {
        const link = extractFirstLink(msg.content)
        if (!link) return
        if (navigator.share) {
          await navigator.share({ url: link })
        } else {
          window.open(link, '_blank', 'noopener,noreferrer')
        }
        return
      }

      if (!msg.file_url) return
      if (navigator.share) {
        await navigator.share({ url: msg.file_url })
      } else {
        window.open(msg.file_url, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error('Error sharing media:', error)
    }
  }

  const fetchWithFallback = async (
    runView: () => PromiseLike<{ data: any; error: { code?: string } | null; count?: number | null }>,
    runTable: () => PromiseLike<{ data: any; error: { code?: string } | null; count?: number | null }>
  ): Promise<{ data: any; error: { code?: string } | null; count?: number | null }> => {
    const viewResult = await runView()
    if (!viewResult.error) {
      return viewResult
    }
    return runTable()
  }

  const loadConversationSummaries = useCallback(async (conversationIds: string[]) => {
    if (!user || conversationIds.length === 0) {
      return {
        lastMessageMap: new Map<string, { content?: string | null; created_at: string; sender_id?: string | null; message_type?: string | null }>(),
        unreadCountMap: new Map<string, number>()
      }
    }

    try {
      const { data: summaryRows, error: summaryError } = await (supabase as any).rpc('get_conversation_summaries', {
        conversation_ids: conversationIds,
        viewer_id: user.id
      })

      if (!summaryError && Array.isArray(summaryRows)) {
        const lastMessageMap = new Map<string, { content?: string | null; created_at: string; sender_id?: string | null; message_type?: string | null }>()
        const unreadCountMap = new Map<string, number>()

        for (const row of summaryRows as Array<{
          conversation_id: string
          last_message_content?: string | null
          last_message_created_at?: string | null
          last_message_sender_id?: string | null
          last_message_type?: string | null
          unread_count?: number | null
        }>) {
          if (!row?.conversation_id) continue
          if (row.last_message_created_at) {
            lastMessageMap.set(row.conversation_id, {
              content: row.last_message_content || '',
              created_at: row.last_message_created_at,
              sender_id: row.last_message_sender_id || null,
              message_type: row.last_message_type || null
            })
          }
          if (typeof row.unread_count === 'number') {
            unreadCountMap.set(row.conversation_id, row.unread_count)
          }
        }

        return { lastMessageMap, unreadCountMap }
      }
    } catch (error) {
      console.error('Error loading conversation summaries:', error)
    }

    return null
  }, [user])

  // Fonction utilitaire pour trouver ou créer une conversation unique entre deux utilisateurs
  const findOrCreateConversation = async (otherUserId: string, postId?: string | null) => {
    if (!user) return null

    try {
      // Chercher une conversation existante entre ces deux utilisateurs (pas un groupe, pas supprimée)
      const { data: existingConvs, error: searchError } = await fetchWithFallback(
        () =>
          supabase
            .from('public_conversations_with_users' as any)
            .select('*')
            .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
            .is('deleted_at', null),
        () =>
          supabase
            .from('conversations')
            .select('*')
            .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
            .is('deleted_at', null)
      )

      if (searchError) {
        console.error('Error searching for conversation:', searchError)
      }

      // Filtrer pour exclure les groupes et les conversations supprimées
      const existingConv = (existingConvs as Array<any> | null)?.find((conv: any) => {
        const convData = conv as { is_group?: boolean; deleted_at?: string | null }
        return !convData.is_group && !convData.deleted_at
      })

      if (existingConv && (existingConv as { id: string }).id) {
        return existingConv
      }

      // Créer une nouvelle conversation si elle n'existe pas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newConv, error: insertError } = await (supabase.from('conversations') as any).insert({
        user1_id: user.id,
        user2_id: otherUserId,
        post_id: postId || null,
        type: 'direct',
        is_group: false
      }).select().single()

      if (insertError) {
        console.error('Error creating conversation:', insertError)
        // Si l'erreur est due à une contrainte unique, essayer de récupérer la conversation existante
        if (insertError.code === '23505') {
          // Réessayer de trouver la conversation
          const { data: retryConvs } = await fetchWithFallback(
            () =>
              supabase
                .from('public_conversations_with_users' as any)
                .select('*')
                .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
                .is('deleted_at', null)
                .limit(1),
            () =>
              supabase
                .from('conversations')
                .select('*')
                .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
                .is('deleted_at', null)
                .limit(1)
          )
          
          const retryList = (retryConvs as Array<any> | null) || []
          if (retryList.length > 0) {
            return retryList[0]
          }
        }
        return null
      }

      return newConv
    } catch (error) {
      console.error('Error in findOrCreateConversation:', error)
      return null
    }
  }


  const handlePostMessage = async (postIdParam: string) => {
    if (!user) return

    setLoading(true)
    try {
      const { data: postData } = await supabase
        .from('posts')
        .select('user_id, title')
        .eq('id', postIdParam)
        .single()

      if (!postData || (postData as { user_id: string }).user_id === user.id) {
        alert('Vous ne pouvez pas vous envoyer un message à vous-même')
        navigate('/messages')
        return
      }

      const otherUserId = (postData as { user_id: string }).user_id

      // Utiliser la fonction utilitaire pour trouver ou créer une conversation unique
      const conversation = await findOrCreateConversation(otherUserId, postIdParam)

      if (conversation && (conversation as { id: string }).id) {
        navigate(`/messages/${(conversation as { id: string }).id}`)
      } else {
        alert('Erreur lors de la création de la conversation')
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      alert('Erreur lors de la création de la conversation')
    } finally {
      setLoading(false)
    }
  }

  const loadConversation = async (convId: string) => {
    if (!user) return

    setLoading(true)
    setSelectedConversation(null)
    setMessages([])
    try {
      const { data: blocksData, error: blocksError } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id)

      if (blocksError) {
        console.error('Error loading user blocks:', blocksError)
      }

      const blockedIds = (blocksData || []).map((block) => (block as { blocked_id: string }).blocked_id)
      setBlockedUserIds(blockedIds)

      const { data: conv } = await fetchWithFallback(
        () =>
          supabase
            .from('public_conversations_with_users' as any)
            .select('*')
            .eq('id', convId)
            .single(),
        () =>
          supabase
            .from('conversations')
            .select('*')
            .eq('id', convId)
            .single()
      )

      if (!conv || !(conv as { id: string }).id) {
        const notice = 'Cette conversation a été supprimée ou n\'existe plus.'
        setMissingNotice(notice)
        navigate('/messages', { replace: true, state: { missingNotice: notice } })
        return
      }

      const convData = conv as {
        id: string
        user1_id: string
        user2_id: string
        created_at?: string | null
        post_id?: string | null
        is_group?: boolean
        group_name?: string | null
        group_photo_url?: string | null
        group_description?: string | null
        group_creator_id?: string | null
        name?: string | null
      }
      const isGroupConversation = !!convData.is_group
      const otherUserId = convData.user1_id === user.id ? convData.user2_id : convData.user1_id
      const blockedIdsSet = new Set(blockedIds)

      if (!isGroupConversation && blockedIdsSet.has(otherUserId)) {
        setLoading(false)
        navigate('/messages')
        return
      }

      // Récupérer les informations de l'utilisateur
      const { data: otherUser } = !isGroupConversation && otherUserId ? await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, email, last_activity_at, is_online')
        .eq('id', otherUserId)
        .single() : { data: null }

      const { data: creatorUser } = isGroupConversation && convData.group_creator_id ? await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', convData.group_creator_id)
        .single() : { data: null }

      // Récupérer le titre du post si post_id existe
      let postTitle: string | null = null
      if (convData.post_id) {
        const { data: post } = await supabase
          .from('posts')
          .select('title')
          .eq('id', convData.post_id)
          .single()
        
        if (post) {
          postTitle = (post as { title: string }).title
        }
      }

      setGroupCreator(creatorUser ? (creatorUser as { id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null }) : null)
      setSelectedConversation({
        ...convData,
        other_user: otherUser ? {
          ...(otherUser as {
            id: string
            username?: string | null
            full_name?: string | null
            avatar_url?: string | null
            last_activity_at?: string | null
            is_online?: boolean | null
          })
        } : null,
        postTitle
      } as Conversation)

      setMissingNotice(null)

      if (isGroupConversation) {
        try {
          const { data: rows, error } = await supabase
            .from('conversation_participants')
            .select('user_id, is_active, role')
            .eq('conversation_id', convId)
            .order('joined_at', { ascending: true })
          if (!error && rows?.length) {
            type ParticipantRow = { user_id: string; is_active?: boolean | null; role?: string | null }
            const activeRows = (rows as ParticipantRow[]).filter((row) => row.is_active !== false)
            const userIds = activeRows.map((r) => r.user_id)
            if (userIds.length > 0) {
              const { data: profileRows } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .in('id', userIds)
              type ProfileRow = { id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null }
              const profileMap = new Map<string, ProfileRow>(
                ((profileRows || []) as ProfileRow[]).map((p) => [p.id, p])
              )
              const normalized = activeRows.map((row) => ({
                user_id: row.user_id,
                is_active: row.is_active ?? true,
                role: (row as ParticipantRow & { role?: string | null }).role ?? null,
                profile: profileMap.get(row.user_id) ?? null
              }))
              setInfoParticipants(normalized)
            } else {
              setInfoParticipants([])
            }
          } else {
            setInfoParticipants([])
          }
        } catch {
          setInfoParticipants([])
        }
      } else {
        setInfoParticipants([])
      }

      // Recharger les match_requests pour afficher le bloc "Annonce acceptée"
      // (y compris pour figurant : request_intent='request')
      const requests = await loadMatchRequests()
      setMatchRequests(requests)
      await loadMessages(convId)
    } catch (error) {
      console.error('Error loading conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (convId: string) => {
    if (!user) return

    const requestId = ++loadMessagesRequestIdRef.current
    setMessagesLoading(true)
    // Utiliser select('*') pour éviter les problèmes de colonnes manquantes
    try {
      const { data: messagesData, error } = await fetchWithFallback(
        () =>
          supabase
            .from('public_messages_with_sender' as any)
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true }),
        () =>
          supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true })
      )

      if (error) {
        if (requestId !== loadMessagesRequestIdRef.current) return
        console.error('Error loading messages:', error)
        setMessages([])
        return
      }

      if (messagesData && messagesData.length > 0) {
        // Filtrer les messages supprimés côté client (soft delete)
        // Un message est visible si :
        // - is_deleted est null/false OU
        // - deleted_for_user_id n'est pas égal à l'utilisateur actuel
        const visibleMessages = (messagesData as Array<Message & { 
          is_deleted?: boolean | null
          deleted_for_user_id?: string | null
          is_deleted_for_all?: boolean | null
        }>).filter((msg) => {
          if (msg.is_deleted_for_all === true) {
            return false
          }
          if (msg.deleted_for_user_id === user.id) {
            return false
          }
          // Si le message est marqué comme supprimé pour cet utilisateur, l'exclure
          if (msg.is_deleted === true && msg.deleted_for_user_id === user.id) {
            return false
          }
          return true
        })

        const senderIdsNeedingFetch = [
          ...new Set(
            visibleMessages
              .filter((msg) => !msg.sender)
              .map((msg) => msg.sender_id)
              .filter(Boolean)
          )
        ]
        
        const { data: senders, error: sendersError } = senderIdsNeedingFetch.length > 0 ? await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, email')
          .in('id', senderIdsNeedingFetch) : { data: [], error: null }

        if (sendersError) {
          console.error('Error loading senders:', sendersError)
        }

        const sendersMap = new Map((senders as Array<{ id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null; email?: string | null }> || []).map((s) => [s.id, s]))

        const formattedMessages: Message[] = visibleMessages.map((msg) => ({
          ...msg,
          sender: msg.sender || sendersMap.get(msg.sender_id) || null
        }))

        if (requestId !== loadMessagesRequestIdRef.current) return
        shouldScrollToBottomRef.current = true
        setMessages(formattedMessages)

        // Marquer les messages non lus comme lus
        const unreadMessages = formattedMessages.filter(
          (msg) => msg.sender_id !== user.id && !msg.read_at
        )

        if (unreadMessages.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: readError } = await (supabase as any)
            .rpc('mark_conversation_messages_read', { p_conversation_id: convId })

          if (readError) {
            console.error('Error marking messages as read:', readError)
          } else {
            if (requestId !== loadMessagesRequestIdRef.current) return
            const nowIso = new Date().toISOString()
            setMessages((prev) =>
              prev.map((msg) =>
                msg.sender_id !== user.id && !msg.read_at
                  ? { ...msg, read_at: nowIso }
                  : msg
              )
            )
          }

          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === convId ? { ...conv, unread: 0 } : conv
            )
          )
        }
      } else {
        if (requestId !== loadMessagesRequestIdRef.current) return
        setMessages([])
      }
    } finally {
      if (requestId === loadMessagesRequestIdRef.current) {
        setMessagesLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!isInfoView || !selectedConversation || !user) return

    const isGroupConversation = !!selectedConversation.is_group
    const groupDisplayName = (selectedConversation.group_name || selectedConversation.name || '').trim()

    if (isGroupConversation) {
      setGroupNameDraft(groupDisplayName)
      setGroupDescriptionDraft(selectedConversation.group_description || '')
      setGroupPhotoDraft(selectedConversation.group_photo_url || null)
      const loadInviteToken = async () => {
        const { data } = await supabase
          .from('group_invite_tokens')
          .select('token')
          .eq('conversation_id', selectedConversation.id)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (data && (data as { token?: string }).token) {
          setInviteLinkToken((data as { token: string }).token)
        } else {
          setInviteLinkToken(null)
        }
      }
      loadInviteToken().catch(() => setInviteLinkToken(null))
    } else {
      setAliasDraft(selectedConversation.id ? (conversationAliases[selectedConversation.id] || '') : '')
    }

    const loadParticipants = async () => {
      if (!isGroupConversation) {
        setInfoParticipants([])
        return
      }

      setInfoLoading(true)
      try {
        const { data: rows, error } = await supabase
          .from('conversation_participants')
          .select('user_id, is_active, role')
          .eq('conversation_id', selectedConversation.id)
          .order('joined_at', { ascending: true })

        if (error) throw error

        type ParticipantRow = { user_id: string; is_active?: boolean | null; role?: string | null }
        const activeRows = (rows || []) as ParticipantRow[]
        const filteredRows = activeRows.filter((row) => row.is_active !== false)
        const userIds = filteredRows.map((r) => r.user_id)
        if (userIds.length === 0) {
          setInfoParticipants([])
          return
        }

        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds)

        type ProfileRow = { id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null }
        const profileMap = new Map<string, ProfileRow>(
          ((profileRows || []) as ProfileRow[]).map((p) => [p.id, p])
        )

        const normalized = filteredRows.map((row) => ({
          user_id: row.user_id,
          is_active: row.is_active ?? true,
          role: (row as ParticipantRow & { role?: string | null }).role ?? null,
          profile: profileMap.get(row.user_id) ?? null
        }))

        setInfoParticipants(normalized)
      } catch (error) {
        console.error('Error loading participants:', error)
        setInfoParticipants([])
      } finally {
        setInfoLoading(false)
      }
    }

    loadParticipants()
  }, [isInfoView, selectedConversation, user, conversationAliases])

  // Charger les match_requests (demandes envoyées et reçues pour l'affichage dans Messages)
  // 
  // LOGIQUE DE RÉPARTITION DES MATCH_REQUESTS :
  // - Messages > "Demandes" : Affiche les demandes ENVOYÉES/REÇUES en attente (status='pending')
  // - Messages > "Matchs" : Affiche les matchs ACCEPTÉS (status='accepted') pour envoyées et reçues
  // - Notifications : Affiche les notifications pour :
  //   * match_request_received : Quand on RECOIT une demande (to_user_id = current_user)
  //   * match_request_accepted : Quand quelqu'un ACCEPTE notre demande (from_user_id = current_user ET status='accepted')
  //   Les demandes reçues peuvent être acceptées/refusées depuis les Notifications
  const loadMatchRequests = useCallback(async () => {
    if (!user) return []

    try {
      // Charger les demandes ENVOYÉES et REÇUES par l'utilisateur
      const { data: requestsData, error } = await supabase
        .from('match_requests')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .in('status', ['pending', 'accepted', 'declined', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading match requests:', error)
        return []
      }

      if (!requestsData || requestsData.length === 0) {
        return []
      }

      // Récupérer les IDs des autres utilisateurs et des posts
      const otherUserIds: string[] = []
      const postIds: string[] = []

      requestsData.forEach((req: { from_user_id: string; to_user_id: string; related_post_id?: string | null }) => {
        if (req.from_user_id === user.id) {
          otherUserIds.push(req.to_user_id)
        } else {
          otherUserIds.push(req.from_user_id)
        }
        if (req.related_post_id) {
          postIds.push(req.related_post_id)
        }
      })

      // Charger les profils des autres utilisateurs
      const { data: users } = otherUserIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, email')
        .in('id', [...new Set(otherUserIds)]) : { data: [] }

      // Charger les posts liés (tous statuts : pour afficher "Annonce supprimée" si retirée)
      const { data: posts } = postIds.length > 0 ? await supabase
        .from('posts')
        .select('id, title, status')
        .in('id', [...new Set(postIds)]) : { data: [] }

      const usersMap = new Map((users || []).map((u: { id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null }) => [u.id, u]))
      const postsMap = new Map((posts || []).map((p: { id: string; title: string; status?: string }) => [p.id, p]))

      // Formater les demandes avec les informations complémentaires
      const requestsWithData = requestsData.map((req: { 
        id: string
        from_user_id: string
        to_user_id: string
        related_post_id?: string | null
        request_message?: string | null
        request_role?: string | null
        request_document_url?: string | null
        request_document_name?: string | null
        request_cover_letter_url?: string | null
        request_cover_letter_name?: string | null
        request_intent?: 'request' | 'apply' | 'buy' | 'reserve' | 'ticket' | null
        reservation_date?: string | null
        reservation_time?: string | null
        reservation_duration_minutes?: number | null
        related_service_name?: string | null
        related_service_description?: string | null
        related_service_payment_type?: 'price' | 'exchange' | null
        related_service_value?: string | null
        status: string
        created_at: string
        updated_at?: string | null
        accepted_at?: string | null
        conversation_id?: string | null
        opened_by_sender_at?: string | null
        opened_by_recipient_at?: string | null
      }) => {
        const otherUserId = req.from_user_id === user.id ? req.to_user_id : req.from_user_id
        const otherUser = usersMap.get(otherUserId) || null
        const relatedPost = req.related_post_id ? postsMap.get(req.related_post_id) || null : null
        const requestType: 'sent' | 'received' = req.from_user_id === user.id ? 'sent' : 'received'

        return {
          id: req.id,
          from_user_id: req.from_user_id,
          to_user_id: req.to_user_id,
          related_post_id: req.related_post_id,
          request_message: req.request_message || null,
          request_role: req.request_role || null,
          request_document_url: req.request_document_url || null,
          request_document_name: req.request_document_name || null,
          request_cover_letter_url: req.request_cover_letter_url || null,
          request_cover_letter_name: req.request_cover_letter_name || null,
          request_intent: req.request_intent || null,
          reservation_date: req.reservation_date || null,
          reservation_time: req.reservation_time || null,
          reservation_duration_minutes: req.reservation_duration_minutes || null,
          related_service_name: req.related_service_name || null,
          related_service_description: req.related_service_description || null,
          related_service_payment_type: req.related_service_payment_type || null,
          related_service_value: req.related_service_value || null,
          status: req.status as 'pending' | 'accepted' | 'declined' | 'cancelled',
          created_at: req.created_at,
          updated_at: req.updated_at,
          accepted_at: req.accepted_at,
          conversation_id: req.conversation_id,
          opened_by_sender_at: req.opened_by_sender_at || null,
          opened_by_recipient_at: req.opened_by_recipient_at || null,
          other_user: otherUser,
          related_post: relatedPost,
          request_type: requestType
        }
      })

      // Dédupliquer : ne garder qu'une seule demande par annonce
      // Si plusieurs demandes existent pour la même annonce, garder la plus récente
      const uniqueRequests = new Map<string, MatchRequest>()
      
      requestsWithData.forEach((request) => {
        if (request.status === 'accepted') {
          uniqueRequests.set(`accepted_${request.id}`, request)
          return
        }

        // Clé unique : annonce + utilisateur (pour les demandes envoyées) ou annonce + destinataire (pour les demandes reçues)
        const otherUserKey = request.from_user_id === user.id ? request.to_user_id : request.from_user_id
        const key = request.related_post_id
          ? `post_${request.related_post_id}_${otherUserKey}`
          : request.related_service_name
            ? `service_${request.related_service_name}_${otherUserKey}`
            : request.request_intent === 'reserve'
              ? `reserve_${request.id}`
              : `user_${otherUserKey}_${request.id}`
        
        const existing = uniqueRequests.get(key)
        
        if (!existing) {
          uniqueRequests.set(key, request)
        } else {
          // Si une demande existe déjà pour cette annonce, garder la plus récente
          const existingDate = new Date(existing.created_at).getTime()
          const currentDate = new Date(request.created_at).getTime()
          
          if (currentDate > existingDate) {
            uniqueRequests.set(key, request)
          }
        }
      })

      return Array.from(uniqueRequests.values())
    } catch (error) {
      console.error('Error loading match requests:', error)
      return []
    }
  }, [user])

  // Charger match_requests dès l'entrée sur la page Messages (indépendant du filtre actif)
  // pour que les badges Matchs et Demandes s'affichent immédiatement à côté des noms des menus
  useEffect(() => {
    if (!user) return
    loadMatchRequests().then((requests) => {
      setMatchRequests(requests)
    })
  }, [user, loadMatchRequests])

  // Recharger match_requests quand on affiche la liste (filtres visibles) pour garantir
  // que le badge Demandes s'affiche avant tout clic, comme pour Matchs
  useEffect(() => {
    if (!user || postId || conversationId || selectedConversation) return
    loadMatchRequests().then((requests) => {
      setMatchRequests(requests)
    })
  }, [user, postId, conversationId, selectedConversation, loadMatchRequests])

  const loadAppointments = useCallback(async () => {
    if (!user) return []

    try {
      const buildAppointmentsFromMessages = async () => {
        const { data: convs, error: convError } = await fetchWithFallback(
          () =>
            supabase
              .from('public_conversations_with_users' as any)
              .select('id, user1_id, user2_id, is_group')
              .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
              .is('deleted_at', null)
              .eq('is_group', false),
          () =>
            supabase
              .from('conversations')
              .select('id, user1_id, user2_id, is_group')
              .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
              .is('deleted_at', null)
              .eq('is_group', false)
        )

        const convList = (convs as Array<any> | null) || []
        if (convError || convList.length === 0) {
          if (convError) {
            console.error('Error loading conversations for appointments fallback:', convError)
          }
          return []
        }

        const convIds = (convList as Array<{ id: string }>).map((conv) => conv.id)
        const convOtherUserMap = new Map<string, string>()

        ;(convList as Array<{ id: string; user1_id: string; user2_id: string }>).forEach((conv) => {
          const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
          convOtherUserMap.set(conv.id, otherUserId)
        })

        const { data: messagesData, error: messagesError } = await fetchWithFallback(
          () =>
            supabase
              .from('public_messages_with_sender' as any)
              .select('id, conversation_id, sender_id, created_at, calendar_request_data')
              .in('conversation_id', convIds)
              .eq('message_type', 'calendar_request')
              .order('created_at', { ascending: false }),
          () =>
            supabase
              .from('messages')
              .select('id, conversation_id, sender_id, created_at, calendar_request_data')
              .in('conversation_id', convIds)
              .eq('message_type', 'calendar_request')
              .order('created_at', { ascending: false })
        )

        const messagesList = (messagesData as Array<any> | null) || []
        if (messagesError || messagesList.length === 0) {
          if (messagesError) {
            console.error('Error loading appointment messages:', messagesError)
          }
          return []
        }

        const otherUserIds = Array.from(
          new Set(
            (messagesList as Array<{ conversation_id: string }>).map((msg) => convOtherUserMap.get(msg.conversation_id)).filter(Boolean) as string[]
          )
        )

        const usersResponse = otherUserIds.length > 0 ? await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, email')
          .in('id', otherUserIds) : { data: [] as Array<{ id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null }> }

        const usersMap = new Map((usersResponse.data || []).map((u) => [u.id, u]))

        return (messagesList as Array<{
          id: string
          conversation_id: string
          sender_id: string
          created_at: string
          calendar_request_data?: Record<string, unknown> | null
        }>).map((msg) => {
          const calendarData = (msg.calendar_request_data || {}) as { appointment_datetime?: string; title?: string }
          const appointmentDatetime = calendarData.appointment_datetime || msg.created_at
          const otherUserId = convOtherUserMap.get(msg.conversation_id) || ''

          return {
            id: msg.id,
            conversation_id: msg.conversation_id,
            sender_id: msg.sender_id,
            recipient_id: otherUserId,
            title: calendarData.title || 'Rendez-vous',
            appointment_datetime: appointmentDatetime,
            status: null,
            other_user: otherUserId ? usersMap.get(otherUserId) || null : null
          }
        }).filter((appointment) => Boolean(appointment.appointment_datetime))
      }

      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('appointment_datetime', { ascending: true })

      if (!error && appointmentsData && appointmentsData.length > 0) {
        const otherUserIds = (appointmentsData as Array<{ sender_id: string; recipient_id: string }>).map((appointment) =>
          appointment.sender_id === user.id ? appointment.recipient_id : appointment.sender_id
        )

        const { data: users, error: usersError } = otherUserIds.length > 0 ? await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, email')
          .in('id', [...new Set(otherUserIds)]) : { data: [], error: null }

        if (usersError) {
          console.error('Error loading appointment users:', usersError)
        }

        const usersMap = new Map((users as Array<{ id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null }> || []).map((u) => [u.id, u]))

        return (appointmentsData as Appointment[]).map((appointment) => {
          const otherUserId = appointment.sender_id === user.id ? appointment.recipient_id : appointment.sender_id
          return {
            ...appointment,
            other_user: usersMap.get(otherUserId) || null
          }
        })
      }

      if (error) {
        console.error('Error loading appointments:', error)
      }

      const fallbackAppointments = await buildAppointmentsFromMessages()
      return fallbackAppointments.sort((a, b) => {
        const dateA = new Date(a.appointment_datetime).getTime()
        const dateB = new Date(b.appointment_datetime).getTime()
        return dateA - dateB
      })
    } catch (error) {
      console.error('Error loading appointments:', error)
      return []
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    loadAppointments().then((items) => {
      setAppointments(items)
    })
  }, [user, loadAppointments])

  const loadSelectableUsers = useCallback(async () => {
    if (!user) return []

    setSelectableUsersLoading(true)
    try {
      const { data: convs, error } = await fetchWithFallback(
        () =>
          supabase
            .from('public_conversations_with_users' as any)
            .select('user1_id, user2_id, is_group')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .is('deleted_at', null)
            .eq('is_group', false),
        () =>
          supabase
            .from('conversations')
            .select('user1_id, user2_id, is_group')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .is('deleted_at', null)
            .eq('is_group', false)
      )

      if (error) {
        console.error('Error loading users from conversations:', error)
        setSelectableUsers([])
        return []
      }

      const otherUserIds = (convs as Array<{ user1_id: string; user2_id: string }> || [])
        .map((conv) => (conv.user1_id === user.id ? conv.user2_id : conv.user1_id))
        .filter(Boolean)

      if (otherUserIds.length === 0) {
        setSelectableUsers([])
        return []
      }

      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, email')
        .in('id', [...new Set(otherUserIds)])

      if (usersError) {
        console.error('Error loading selectable users:', usersError)
        setSelectableUsers([])
        return []
      }

      const normalizedUsers = (users as SelectableUser[] || [])
        .filter((selectableUser) => !isSystemUserEmail(selectableUser.email))
        .sort((a, b) => {
          const nameA = (a.full_name || a.username || '').toLowerCase()
          const nameB = (b.full_name || b.username || '').toLowerCase()
          return nameA.localeCompare(nameB)
        })

      setSelectableUsers(normalizedUsers)
      return normalizedUsers
    } catch (error) {
      console.error('Error loading selectable users:', error)
      setSelectableUsers([])
      return []
    } finally {
      setSelectableUsersLoading(false)
    }
  }, [user])

  const loadConversations = useCallback(async () => {
    if (!user) return

    const requestId = ++loadConversationsRequestIdRef.current
    if (!isConversationView) {
      setLoading(true)
    }
    try {
      const { data: participantRows, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (participantsError) {
        console.error('Error loading conversation participants:', participantsError)
      }

      const participantIds = (participantRows || [])
        .map((row) => (row as { conversation_id: string }).conversation_id)
        .filter(Boolean)

      const participantFilter = participantIds.length > 0
        ? `,id.in.(${participantIds.join(',')})`
        : ''

      const { data: blocksData, error: blocksError } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id)

      if (blocksError) {
        console.error('Error loading user blocks:', blocksError)
      }

      const blockedIdsArray = (blocksData || []).map((block) => (block as { blocked_id: string }).blocked_id)
      setBlockedUserIds(blockedIdsArray)
      const blockedIds = new Set(blockedIdsArray)

      // Charger les match_requests dès l'entrée sur la page pour afficher
      // les badges Matchs et Demandes immédiatement (comme les matchs)
      const requestsData = await loadMatchRequests()
      setMatchRequests(requestsData)

      if (activeFilter === 'appointments') {
        const appointmentsData = await loadAppointments()
        setAppointments(appointmentsData)
      }

      // Pour l'onglet "Tout" : toutes les conversations (même sans messages)
      // Exclure uniquement les conversations supprimées (soft delete)
      let query = supabase
        .from('public_conversations_with_users' as any)
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id},group_creator_id.eq.${user.id}${participantFilter}`)
        .is('deleted_at', null)

      const fallbackQuery = supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id},group_creator_id.eq.${user.id}${participantFilter}`)
        .is('deleted_at', null)

      // Appliquer les filtres selon le type (l'archivage est géré par utilisateur)
      if (activeFilter === 'posts') {
        query = query.not('post_id', 'is', null)
      } else if (activeFilter === 'groups') {
        query = query.eq('is_group', true)
      }

      // Trier par last_message_at si disponible, sinon par created_at
      // Utiliser nulls last pour mettre les conversations sans messages en fin de liste
      let { data: convs, error } = await query
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        const fallbackResult = await fallbackQuery
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(50)
        convs = fallbackResult.data
        error = fallbackResult.error
      }

      if (error) {
        console.error('Error loading conversations:', error)
        if (requestId === loadConversationsRequestIdRef.current) {
          setLoading(false)
        }
        return
      }

      if (convs && convs.length > 0) {
        const userIds = (convs as Array<{ user1_id: string; user2_id: string }>).map((conv) => 
          conv.user1_id === user.id ? conv.user2_id : conv.user1_id
        )

        const postIds = (convs as Array<{ post_id?: string | null }>)
          .map((conv) => conv.post_id)
          .filter((id): id is string => id !== null && id !== undefined)

        // Filtrer les userIds vides
        const validUserIds = userIds.filter(id => id && id !== user.id)
        
        const { data: users, error: usersError } = validUserIds.length > 0 ? await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, email')
          .in('id', validUserIds) : { data: [], error: null }

        if (usersError) {
          console.error('Error loading users:', usersError)
        }

        const { data: posts } = postIds.length > 0 ? await supabase
          .from('posts')
          .select('id, title')
          .in('id', postIds) : { data: null }

        const usersMap = new Map((users as Array<{ id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null }> || []).map((u) => [u.id, u]))
        const postsMap = new Map((posts as Array<{ id: string; title: string }> || []).map((p) => [p.id, p.title]))

        const visibleConvs = (convs as Array<{ id: string; user1_id: string; user2_id: string; post_id?: string | null; last_message_at?: string | null; is_group?: boolean }>).filter((conv) => {
          const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
          return !blockedIds.has(otherUserId)
        })

        const conversationIds = visibleConvs.map((conv) => conv.id)
        const { data: stateRows } = conversationIds.length > 0 ? await supabase
          .from('conversation_user_states')
          .select('conversation_id, is_archived, archived_at, is_pinned, pinned_at, deleted_at')
          .eq('user_id', user.id)
          .in('conversation_id', conversationIds) : { data: [] }

        const stateMap = new Map(
          (stateRows || []).map((row: {
            conversation_id: string
            is_archived?: boolean | null
            archived_at?: string | null
            is_pinned?: boolean | null
            pinned_at?: string | null
            deleted_at?: string | null
          }) => [row.conversation_id, row])
        )

        const activeConvs = visibleConvs.filter((conv) => {
          const state = stateMap.get(conv.id)
          return !state?.deleted_at
        })

        const activeConversationIds = activeConvs.map((conv) => conv.id)
        const summaries = await loadConversationSummaries(activeConversationIds)
        const useSummaries = summaries !== null

        // Pour chaque conversation, récupérer le dernier message et compter les non-lus
        const convsWithData = await Promise.all(
          activeConvs.map(async (conv) => {
            const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
            const otherUser = usersMap.get(otherUserId) || null
            const postTitleRaw = conv.post_id ? postsMap.get(conv.post_id) || null : null
            const postTitleTrimmed = postTitleRaw?.trim() || ''
            const postTitle = postTitleTrimmed && postTitleTrimmed !== '0' ? postTitleTrimmed : null

            let lastMsgRow: {
              content?: string | null
              created_at: string
              sender_id?: string | null
              message_type?: string | null
            } | null = null

            let unreadCount = 0

            if (useSummaries && summaries) {
              const summary = summaries.lastMessageMap.get(conv.id) || null
              lastMsgRow = summary
              unreadCount = summaries.unreadCountMap.get(conv.id) || 0
            } else {
              // Fallback: requêtes par conversation si la fonction SQL n'est pas disponible
              const { data: lastMsgData, error: lastMsgError } = await fetchWithFallback(
                () =>
                  supabase
                    .from('public_messages_with_sender' as any)
                    .select('content, created_at, sender_id, message_type')
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: false })
                    .limit(1),
                () =>
                  supabase
                    .from('messages')
                    .select('content, created_at, sender_id, message_type')
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
              )

              lastMsgRow = !lastMsgError
                ? (lastMsgData as Array<{
                    content?: string | null
                    created_at: string
                    sender_id?: string | null
                    message_type?: string | null
                  }> | null)?.[0] ?? null
                : null

              if (otherUserId && lastMsgRow) {
                const { count, error: countError } = await fetchWithFallback(
                  () =>
                    supabase
                      .from('public_messages_with_sender' as any)
                      .select('*', { count: 'exact', head: true })
                      .eq('conversation_id', conv.id)
                      .eq('sender_id', otherUserId)
                      .is('read_at', null),
                  () =>
                    supabase
                      .from('messages')
                      .select('*', { count: 'exact', head: true })
                      .eq('conversation_id', conv.id)
                      .eq('sender_id', otherUserId)
                      .is('read_at', null)
                )
                
                if (!countError) {
                  unreadCount = count || 0
                }
              }
            }

            const hasMessages = !!lastMsgRow
            const rawContent = lastMsgRow?.content || ''
            const sanitizedContent = rawContent.trim() === '0' ? '' : rawContent

            const state = stateMap.get(conv.id)
            return {
              ...conv,
              other_user: otherUser,
              postTitle,
              lastMessage: lastMsgRow ? {
                content: sanitizedContent,
                created_at: lastMsgRow.created_at,
                sender_id: lastMsgRow.sender_id || null,
                message_type: lastMsgRow.message_type || null
              } : null,
              is_archived: state?.is_archived ?? (conv as { is_archived?: boolean }).is_archived ?? false,
              archived_at: state?.archived_at ?? null,
              is_pinned: state?.is_pinned ?? false,
              pinned_at: state?.pinned_at ?? null,
              unread: unreadCount || 0,
              has_messages: hasMessages
            }
          })
        )

        // Dédupliquer les conversations individuelles : ne garder qu'une seule conversation par paire d'utilisateurs
        // (garder la plus récente basée sur last_message_at)
        const userPairToConv = new Map<string, Conversation>()
        const finalConversations: Conversation[] = []
        
        for (const conv of convsWithData) {
          const isGroup = (conv as { is_group?: boolean }).is_group
          
          // Pour les groupes, on garde toutes les conversations directement
          if (isGroup) {
            finalConversations.push(conv)
            continue
          }

          // Pour les conversations individuelles, créer une clé unique basée sur les deux utilisateurs
          const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
          if (!otherUserId) continue // Ignorer si pas d'autre utilisateur
          
          const conversationKey = [user.id, otherUserId].sort().join('_')

          const existing = userPairToConv.get(conversationKey)
          
          if (!existing) {
            // Première conversation avec cet utilisateur
            userPairToConv.set(conversationKey, conv)
          } else {
            // Comparer les dates pour garder la plus récente
            const existingDate = existing.last_message_at || existing.lastMessage?.created_at || ''
            const currentDate = conv.last_message_at || conv.lastMessage?.created_at || ''
            
            if (currentDate && (!existingDate || new Date(currentDate) > new Date(existingDate))) {
              userPairToConv.set(conversationKey, conv)
            }
          }
        }

        // Ajouter les conversations individuelles dédupliquées
        finalConversations.push(...Array.from(userPairToConv.values()))
        
        // Afficher toutes les conversations (sauf celles archivées ou supprimées)
        // Les conversations doivent être affichées jusqu'à ce que l'utilisateur décide de les archiver ou supprimer
        const filteredConvs = finalConversations.filter(conv => {
          // Exclure les conversations archivées (sauf si on est dans l'onglet "Archivés")
          if (activeFilter !== 'archived' && (conv as { is_archived?: boolean }).is_archived) {
            return false
          }
          // Pour l'onglet "Archivés", n'afficher que les conversations archivées
          if (activeFilter === 'archived' && !(conv as { is_archived?: boolean }).is_archived) {
            return false
          }
          return true
        })
        
        // Trier : conversations épinglées d'abord, puis date du dernier message
        filteredConvs.sort((a, b) => {
          const pinnedA = (a as { is_pinned?: boolean }).is_pinned ? 1 : 0
          const pinnedB = (b as { is_pinned?: boolean }).is_pinned ? 1 : 0
          if (pinnedA !== pinnedB) return pinnedB - pinnedA
          const dateA = a.last_message_at || a.lastMessage?.created_at || ''
          const dateB = b.last_message_at || b.lastMessage?.created_at || ''
          if (!dateA && !dateB) return 0
          if (!dateA) return 1
          if (!dateB) return -1
          return new Date(dateB).getTime() - new Date(dateA).getTime()
        })

        if (requestId === loadConversationsRequestIdRef.current) {
          setConversations(filteredConvs)
        }
      } else {
        if (requestId === loadConversationsRequestIdRef.current) {
          setConversations([])
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      if (!isConversationView && requestId === loadConversationsRequestIdRef.current) {
        setLoading(false)
      }
    }
  }, [user, activeFilter, loadMatchRequests, loadAppointments, isConversationView, loadConversationSummaries])

  const handleReportSubmit = async () => {
    if (!user || !selectedConversation || !reportReason) {
      alert('Veuillez sélectionner une raison.')
      return
    }
    const isGroup = !!selectedConversation.is_group
    const reportedUserId = isGroup
      ? selectedConversation.group_creator_id
      : selectedConversation.other_user?.id
    if (!reportedUserId) {
      alert(isGroup ? 'Impossible de signaler ce groupe.' : 'Veuillez sélectionner une raison.')
      return
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('reports') as any)
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          reported_post_id: null,
          report_type: 'profile',
          report_reason: reportReason,
          report_category: isGroup ? 'group' : 'behavior',
          description: isGroup ? `Signalement du groupe (conversation: ${selectedConversation.id})` : null
        })

      if (error) {
        console.error('Error submitting report:', error)
        alert('Erreur lors de l\'envoi du signalement')
      } else {
        alert('Signalement envoyé avec succès. Merci de votre contribution.')
        setShowReportModal(false)
        setReportReason('')
      }
    } catch (error) {
      console.error('Error in handleReportSubmit:', error)
      alert('Erreur lors de l\'envoi du signalement')
    }
  }

  const handleBlockUser = async () => {
    if (!user || !selectedConversation?.other_user?.id) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('user_blocks') as any)
        .upsert({
          blocker_id: user.id,
          blocked_id: selectedConversation.other_user.id
        }, { onConflict: 'blocker_id,blocked_id' })

      if (error) {
        console.error('Error blocking user:', error)
        alert('Erreur lors du blocage')
        return
      }

      setBlockedUserIds((prev) => [...new Set([...prev, selectedConversation.other_user?.id || ''])].filter(Boolean))
      setSelectedConversation(null)
      navigate('/messages')
    } catch (error) {
      console.error('Error blocking user:', error)
      alert('Erreur lors du blocage')
    }
  }

  const upsertConversationState = async (conversationId: string, updates: Record<string, unknown>) => {
    if (!user) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('conversation_user_states') as any)
      .upsert({
        user_id: user.id,
        conversation_id: conversationId,
        ...updates
      }, { onConflict: 'user_id,conversation_id' })
  }

  const handleArchiveConversation = async (conv: Conversation, shouldArchive: boolean) => {
    if (!conv.id) return
    await upsertConversationState(conv.id, {
      is_archived: shouldArchive,
      archived_at: shouldArchive ? new Date().toISOString() : null,
      ...(shouldArchive ? { is_pinned: false, pinned_at: null } : {})
    })
    loadConversations()
  }

  const handlePinConversation = async (conv: Conversation) => {
    if (!user || !conv.id) return

    if (conv.is_pinned) {
      await upsertConversationState(conv.id, { is_pinned: false, pinned_at: null })
      loadConversations()
      return
    }

    // Désépingler les autres conversations de l'utilisateur
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('conversation_user_states') as any)
      .update({ is_pinned: false, pinned_at: null })
      .eq('user_id', user.id)
      .eq('is_pinned', true)

    await upsertConversationState(conv.id, { is_pinned: true, pinned_at: new Date().toISOString() })
    loadConversations()
  }

  const handleDeleteConversationForUser = async (conversationIdToDelete: string) => {
    if (!conversationIdToDelete) return
    await upsertConversationState(conversationIdToDelete, { deleted_at: new Date().toISOString() })
    setSelectedConversation(null)
    navigate('/messages')
    loadConversations()
  }

  const handleCopyMessage = async (msg?: Message | null) => {
    if (!msg?.content) return
    try {
      await navigator.clipboard.writeText(msg.content)
    } catch (error) {
      console.error('Error copying message:', error)
    }
  }

  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

  const handleAddReaction = async (msg: Message, emoji: string) => {
    if (!user) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('message_likes') as any)
        .insert({ message_id: msg.id, user_id: user.id, emoji })
      setMessageReactions((prev) => {
        const current = prev[msg.id] || []
        const next = current.map((item) => item.emoji === emoji ? { ...item, count: item.count + 1 } : item)
        const exists = current.some((item) => item.emoji === emoji)
        return { ...prev, [msg.id]: exists ? next : [...current, { emoji, count: 1 }] }
      })
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  const handleDeleteMessage = async (msg: Message, deleteForAll: boolean) => {
    if (!user) return

    if (deleteForAll) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('messages') as any)
        .update({
          is_deleted_for_all: true,
          deleted_for_all_at: new Date().toISOString()
        })
        .eq('id', msg.id)
        .eq('sender_id', user.id)

      if (error) {
        console.error('Error deleting message for all:', error)
        alert('Erreur lors de la suppression')
        return
      }
    } else {
      // Suppression pour soi uniquement
      const { error: rpcError } = await (supabase as any).rpc('delete_message_for_user', { p_message_id: msg.id })
      if (rpcError) {
        const maybeMissingFn =
          (rpcError as { message?: string }).message?.includes('delete_message_for_user') ||
          (rpcError as { code?: string }).code === 'PGRST202'
        if (maybeMissingFn) {
          // Fallback: suppression directe (fonctionnera seulement pour l'expéditeur si la RLS l'autorise)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase.from('messages') as any)
            .update({ is_deleted: true, deleted_for_user_id: user.id })
            .eq('id', msg.id)

          if (error) {
            console.error('Error deleting message for me:', error)
            alert('Erreur lors de la suppression')
            return
          }
        } else {
          console.error('Error deleting message for me (RPC):', rpcError)
          alert('Erreur lors de la suppression')
          return
        }
      }
    }

    setMessages((prev) => prev.filter((item) => item.id !== msg.id))
    setMessageReactions((prev) => {
      if (!prev[msg.id]) return prev
      const next = { ...prev }
      delete next[msg.id]
      return next
    })
    if (activeMessage?.id === msg.id) {
      setActiveMessage(null)
    }
    if (selectedMediaMessage?.id === msg.id) {
      setSelectedMediaMessage(null)
    }
    setShowDeleteMessageConfirm(false)
    setShowMessageActions(false)
    loadMessages(selectedConversation?.id || conversationId || '')
  }

  const handleForwardMessage = async (targetUser: SelectableUser, msg: Message) => {
    if (!user || !targetUser?.id) return
    if (isSystemUserEmail(targetUser.email)) {
      alert('Vous ne pouvez pas transférer de message vers le compte Ollync.')
      return
    }
    const conversation = await findOrCreateConversation(targetUser.id)
    if (!conversation || !(conversation as { id: string }).id) {
      alert('Erreur lors de l\'ouverture de la conversation')
      return
    }

    const convId = (conversation as { id: string }).id
    const forwardPayload: Record<string, unknown> = {
      conversation_id: convId,
      sender_id: user.id,
      message_type: msg.message_type || 'text'
    }

    if (msg.message_type === 'text' || !msg.message_type) {
      forwardPayload.content = msg.content || ''
    } else {
      forwardPayload.content = msg.content || null
      forwardPayload.file_url = msg.file_url || null
      forwardPayload.file_name = msg.file_name || null
      forwardPayload.file_type = msg.file_type || null
      forwardPayload.location_data = msg.location_data || null
      forwardPayload.price_data = msg.price_data || null
      forwardPayload.rate_data = msg.rate_data || null
      forwardPayload.calendar_request_data = msg.calendar_request_data || null
      forwardPayload.shared_post_id = msg.shared_post_id || null
      forwardPayload.shared_contract_id = msg.shared_contract_id || null
      forwardPayload.shared_profile_id = msg.shared_profile_id || null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('messages') as any).insert(forwardPayload)
    if (error) {
      console.error('Error forwarding message:', error)
      alert('Erreur lors du transfert')
      return
    }

    setShowForwardMessage(false)
  }

  useEffect(() => {
    if (user && !postId && !conversationId && !selectedConversation) {
      loadConversations()
    }
  }, [user, postId, conversationId, selectedConversation, activeFilter, loadConversations])

  const deferredSearchQuery = useDeferredValue(searchQuery)

  // Filtrer les match_requests selon l'onglet actif
  // Dans Messages, l'onglet "Demandes" affiche uniquement les demandes en attente
  const filteredMatchRequests = useMemo(() => matchRequests.filter((request) => {
    if (blockedUserIds.includes(request.other_user?.id || '')) {
      return false
    }
    if (activeFilter === 'match_requests') {
      // Demandes : afficher les demandes ENVOYÉES/REÇUES en attente
      return request.status === 'pending'
    }
    return false
  }), [matchRequests, blockedUserIds, activeFilter])

  // Filtrer les matches selon l'onglet actif
  // L'onglet "Match" affiche uniquement les matchs ACCEPTÉS (envoyés ou reçus)
  // Les conversations créées à partir de ces matches apparaîtront aussi dans "Tout" si elles ont des messages
  const filteredMatches = useMemo(() => matchRequests.filter((request) => {
    if (blockedUserIds.includes(request.other_user?.id || '')) {
      return false
    }
    if (activeFilter === 'matches') {
      // Match : afficher uniquement les match_requests ACCEPTÉES
      return request.status === 'accepted'
    }
    return false
  }), [matchRequests, blockedUserIds, activeFilter])

  const filteredConversations = useMemo(() => conversations.filter((conv) => {
    if (blockedUserIds.includes(conv.other_user?.id || '')) {
      return false
    }
    // Filtre par recherche textuelle
    if (deferredSearchQuery.trim()) {
      const query = deferredSearchQuery.toLowerCase()
      const alias = (conversationAliases[conv.id] || '').toLowerCase()
      const groupName = (conv.group_name || conv.name || '').toLowerCase()
      const name = conv.is_group
        ? (groupName || '')
        : (alias || (conv.other_user?.full_name || conv.other_user?.username || '').toLowerCase())
      const postTitle = (conv.postTitle || '').toLowerCase()
      const lastMessage = (conv.lastMessage?.content || '').toLowerCase()
      if (!name.includes(query) && !postTitle.includes(query) && !lastMessage.includes(query)) {
        return false
      }
    }

    // Filtre par type
    if (activeFilter === 'all') {
      // "Tout" : uniquement les conversations avec des messages (déjà filtré dans loadConversations)
      return true
    } else if (activeFilter === 'posts') {
      return !!conv.post_id
    } else if (activeFilter === 'groups') {
      return !!(conv as { is_group?: boolean }).is_group
    } else if (activeFilter === 'archived') {
      return !!(conv as { is_archived?: boolean }).is_archived
    } else if (activeFilter === 'appointments') {
      return false
    } else if (activeFilter === 'matches' || activeFilter === 'match_requests') {
      // Les matches sont gérés séparément via filteredMatches
      return false
    }

    return true
  }), [conversations, blockedUserIds, deferredSearchQuery, conversationAliases, activeFilter])

  const filteredAppointments = useMemo(() => appointments.filter((appointment) => {
    if (blockedUserIds.includes(appointment.other_user?.id || '')) {
      return false
    }
    if (deferredSearchQuery.trim()) {
      const query = deferredSearchQuery.toLowerCase()
      const title = appointment.title?.toLowerCase() || ''
      const name = (appointment.other_user?.full_name || appointment.other_user?.username || '').toLowerCase()
      if (!title.includes(query) && !name.includes(query)) {
        return false
      }
    }
    return true
  }), [appointments, blockedUserIds, deferredSearchQuery])

  const sortedAppointments = useMemo(() => {
    const now = Date.now()
    return [...filteredAppointments].sort((a, b) => {
      const timeA = new Date(a.appointment_datetime).getTime()
      const timeB = new Date(b.appointment_datetime).getTime()
      const aPast = timeA < now
      const bPast = timeB < now

      if (aPast !== bPast) return aPast ? 1 : -1
      if (!aPast) return timeA - timeB
      return timeB - timeA
    })
  }, [filteredAppointments])

  const unseenAcceptedRequestsCount = matchRequests.reduce((count, request) => {
    if (request.status !== 'accepted') return count
    const seenByCurrentUser =
      request.request_type === 'sent' ? Boolean(request.opened_by_sender_at) : Boolean(request.opened_by_recipient_at)
    return count + (seenByCurrentUser ? 0 : 1)
  }, 0)

  // Badge Matchs : combiner match_requests et notifications pour affichage immédiat dès l'entrée sur la page
  const matchsBadgeCount = Math.max(unseenAcceptedRequestsCount, unreadCommunicationCounts.match)

  // Badge Demandes : même logique que Matchs - combiner toutes les sources pour affichage immédiat
  // (notifications + match_requests détaillés + count léger du hook, chargé dès l'icône Messages)
  const demandesBadgeCount = useMemo(() => {
    const pendingFromMatchRequests = matchRequests.filter((request) => {
      if (blockedUserIds.includes(request.other_user?.id || '')) return false
      return request.status === 'pending'
    }).length
    return Math.max(
      pendingFromMatchRequests,
      unreadCommunicationCounts.request,
      pendingRequestsCount ?? 0
    )
  }, [matchRequests, blockedUserIds, unreadCommunicationCounts.request, pendingRequestsCount])

  const markRequestAsOpenedByCurrentUser = useCallback(async (request: MatchRequest) => {
    if (!user) return null

    const isSender = request.from_user_id === user.id
    const field = isSender ? 'opened_by_sender_at' : 'opened_by_recipient_at'
    const alreadyOpened = isSender ? request.opened_by_sender_at : request.opened_by_recipient_at
    if (alreadyOpened) return alreadyOpened

    const openedAt = new Date().toISOString()
    const { error } = await supabase
      .from('match_requests')
      .update({ [field]: openedAt } as never)
      .eq('id', request.id)

    if (error) {
      console.error('Error marking match request as opened:', error)
      return null
    }

    setMatchRequests((prev) =>
      prev.map((item) =>
        item.id === request.id
          ? {
              ...item,
              [field]: openedAt
            }
          : item
      )
    )

    return openedAt
  }, [user])

  if (!user) {
    return (
      <>
        <PageMeta title={t('common:meta.messages.title')} description={t('common:meta.messages.description')} />
        <div className="auth-page-wrap">
        <AuthBackground />
        <div className="auth-page">
          <div className="messages-page-container">
            <div className="messages-header-not-connected">
              <h1 className="messages-title-centered">Messages</h1>
            </div>
            <div className="messages-content-not-connected">
              <MailOpen className="messages-not-connected-icon" strokeWidth={1.5} />
              <h2 className="messages-not-connected-title">Vous n'êtes pas connecté</h2>
              <p className="messages-not-connected-text">Connectez-vous pour accéder à vos messages</p>
              <button 
                className="messages-not-connected-button" 
                onClick={() => navigate('/auth/register')}
              >
                S'inscrire
              </button>
              <p className="messages-not-connected-login-link">
                Déjà un compte ?{' '}
                <button 
                  className="messages-not-connected-link" 
                  onClick={() => navigate('/auth/login')}
                >
                  Se connecter
                </button>
              </p>
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </>
    )
  }

  // Fonction pour formater la date pour les séparateurs
  const formatDateSeparator = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Réinitialiser les heures pour comparer uniquement les dates
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Aujourd\'hui'
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Hier'
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    }
  }

  // Fonction pour grouper les messages par date
  const groupMessagesByDate = (messagesList: Message[]) => {
    const grouped: Array<{ date: string; messages: Message[] }> = []
    let currentDate = ''
    let currentGroup: Message[] = []

    messagesList.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toDateString()
      if (msgDate !== currentDate) {
        if (currentGroup.length > 0) {
          grouped.push({ date: currentDate, messages: currentGroup })
        }
        currentDate = msgDate
        currentGroup = [msg]
      } else {
        currentGroup.push(msg)
      }
    })

    if (currentGroup.length > 0) {
      grouped.push({ date: currentDate, messages: currentGroup })
    }

    return grouped
  }

  // Si une conversation est sélectionnée, afficher la vue de conversation
  if (conversationId && !selectedConversation) {
    return (
      <div className="messages-page-container conversation-page">
        <div className="conversation-header">
          <BackButton className="conversation-back-button" />
          <div className="conversation-header-center">
            <h1 className="conversation-header-name">Conversation</h1>
          </div>
        </div>
        <div className="conversation-messages-container">
          <div className="loading-container">
            <Loader className="spinner-large" size={48} />
            <p>Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  if (selectedConversation || conversationId) {
    const isGroupConversation = !!selectedConversation?.is_group
    const groupDisplayName = (selectedConversation?.group_name || selectedConversation?.name || '').trim()
    const currentAlias = selectedConversation?.id ? conversationAliases[selectedConversation.id] : ''
    const otherUserName = selectedConversation?.other_user?.full_name || selectedConversation?.other_user?.username || 'Utilisateur'
    const otherUserUsername = selectedConversation?.other_user?.username
    const displayName = isGroupConversation
      ? (groupDisplayName || 'Groupe')
      : ((currentAlias || '').trim()
        ? (currentAlias || '').trim()
        : (otherUserName !== 'Utilisateur' ? otherUserName : (otherUserUsername ? `@${otherUserUsername}` : 'Utilisateur')))
    const otherUserId = selectedConversation?.other_user?.id
    const isSystemConversation = (selectedConversation?.other_user?.email || '').toLowerCase() === SYSTEM_SENDER_EMAIL
    const headerName = isSystemConversation ? SYSTEM_SENDER_NAME : displayName
    const groupCreatorName = groupCreator?.full_name || groupCreator?.username || 'le créateur'
    const groupCreatedAtLabel = selectedConversation?.created_at
      ? new Date(selectedConversation.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      : 'date inconnue'
    const canCopyMessage = !!activeMessage?.content
    const currentConversationId = selectedConversation?.id || conversationId
    const acceptedMatchesForConversation = matchRequests
      .filter((request) => {
        if (request.status !== 'accepted') return false
        if (request.conversation_id && currentConversationId) {
          return request.conversation_id === currentConversationId
        }
        if (!selectedConversation?.post_id || !request.related_post_id) return false
        if (request.related_post_id !== selectedConversation.post_id) return false
        if (!user || !otherUserId) return false
        return (
          (request.from_user_id === user.id && request.to_user_id === otherUserId) ||
          (request.to_user_id === user.id && request.from_user_id === otherUserId)
        )
      })
      .sort((a, b) => {
        const aTime = new Date(a.accepted_at || a.created_at).getTime()
        const bTime = new Date(b.accepted_at || b.created_at).getTime()
        return aTime - bTime
      })
    const messagesForDisplay = [...messages]

    acceptedMatchesForConversation.forEach((acceptedMatchForConversation) => {
      if (!acceptedMatchForConversation.related_post_id) return

      const systemMessageId = `match-accepted-${acceptedMatchForConversation.id}`
      const alreadyExists = messagesForDisplay.some((msg) => msg.id === systemMessageId)

      if (!alreadyExists) {
        const acceptedTimestamp = new Date(
          acceptedMatchForConversation.accepted_at || acceptedMatchForConversation.created_at
        ).getTime()

        const acceptedSystemMessage: Message = {
          id: systemMessageId,
          sender_id: 'system',
          created_at: acceptedMatchForConversation.accepted_at || acceptedMatchForConversation.created_at,
          message_type: 'match_accepted',
          content: acceptedMatchForConversation.related_post?.title || 'Voir l\'annonce'
        }

        const insertAt = messagesForDisplay.findIndex((msg) => {
          return new Date(msg.created_at).getTime() > acceptedTimestamp
        })

        if (insertAt === -1) {
          messagesForDisplay.push(acceptedSystemMessage)
        } else {
          messagesForDisplay.splice(insertAt, 0, acceptedSystemMessage)
        }
      }
    })

    const groupedMessages = groupMessagesByDate(messagesForDisplay)
    const lastDisplayMessageId = messagesForDisplay[messagesForDisplay.length - 1]?.id

    if (isInfoView) {
      const isGroupCreator = !!user && selectedConversation?.group_creator_id === user.id
      const currentUserParticipant = infoParticipants.find((p) => p.user_id === user?.id)
      const isGroupAdmin = currentUserParticipant?.role === 'moderator'
      const canEditGroup = isGroupCreator || isGroupAdmin
      const canManageMembers = isGroupCreator
      const groupPhoto = groupPhotoDraft || selectedConversation?.group_photo_url || ''
      const groupName = groupNameDraft || groupDisplayName || 'Groupe'
      const appointmentMessages = messages.filter((msg) =>
        msg.message_type === 'calendar_request' && msg.calendar_request_data
      )
      const contractMessages = messages.filter((msg) => msg.message_type === 'contract_share')
      const sharedPostMessages = messages.filter((msg) => msg.message_type === 'post_share')

      return (
        <div className="messages-page-container conversation-page conversation-info-page">
          <div className="conversation-header">
            <BackButton
              className="conversation-back-button"
              onClick={() => {
                const currentId = selectedConversation?.id || conversationId
                if (currentId) {
                  navigate(`/messages/${currentId}`)
                } else {
                  navigate('/messages')
                }
              }}
            />
            <div className="conversation-header-center">
              <h1 className="conversation-header-name">
                {isGroupConversation ? 'Infos du groupe' : 'Infos du contact'}
              </h1>
            </div>
          </div>
          <div className="conversation-info-content">
            <div className="conversation-info-card">
              {isGroupConversation && (
                <h2 className="conversation-info-card-title">{groupName}</h2>
              )}
              <div className="conversation-info-avatar">
                <img
                  src={
                    isGroupConversation
                      ? (groupPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}`)
                      : (selectedConversation?.other_user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`)
                  }
                  alt={isGroupConversation ? groupName : displayName}
                  onError={(e) => {
                    const fallback = isGroupConversation
                      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`
                    ;(e.target as HTMLImageElement).src = fallback
                  }}
                />
                {!isGroupConversation && (
                  selectedConversation?.other_user?.id ? (
                    <button
                      type="button"
                      className="conversation-info-profile-link"
                      onClick={() => openPublicProfile(selectedConversation.other_user?.id)}
                    >
                      {displayName}
                    </button>
                  ) : (
                    <span className="conversation-info-profile-name">{displayName}</span>
                  )
                )}
                {isGroupConversation && canEditGroup && (
                  <button
                    type="button"
                    className="conversation-info-photo-btn"
                    onClick={() => groupPhotoInputRef.current?.click()}
                  >
                    <Camera size={16} />
                    Changer la photo
                  </button>
                )}
                {isGroupConversation && (
                  <input
                    ref={groupPhotoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      setGroupPhotoFile(file)
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setGroupPhotoDraft(reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                )}
              </div>

              {isGroupConversation ? (
                <>
                  <div className="conversation-info-field">
                    <label>Nom du groupe</label>
                    <input
                      type="text"
                      value={groupNameDraft}
                      onChange={(event) => setGroupNameDraft(event.target.value)}
                      placeholder="Nom du groupe"
                      disabled={!canEditGroup || savingGroup}
                    />
                  </div>
                  <div className="conversation-info-field">
                    <label>Description</label>
                    <textarea
                      value={groupDescriptionDraft}
                      onChange={(event) => setGroupDescriptionDraft(event.target.value)}
                      placeholder="Décrivez votre groupe"
                      disabled={!canEditGroup || savingGroup}
                      rows={3}
                    />
                  </div>
                  {canEditGroup && (
                    <button
                      type="button"
                      className="conversation-info-save"
                      onClick={async () => {
                        if (!selectedConversation?.id) return
                        setSavingGroup(true)
                        try {
                          let photoUrl = selectedConversation.group_photo_url || null
                          if (groupPhotoFile) {
                            const fileExt = groupPhotoFile.name.split('.').pop()
                            const fileName = `${user?.id || 'group'}/${Date.now()}.${fileExt}`
                            const { error: uploadError } = await supabase.storage
                              .from('group-photos')
                              .upload(fileName, groupPhotoFile, { cacheControl: '3600', upsert: false })
                            if (uploadError) {
                              const { error: fallbackError } = await supabase.storage
                                .from('posts')
                                .upload(fileName, groupPhotoFile, { cacheControl: '3600', upsert: false })
                              if (fallbackError) throw fallbackError
                              const { data: fallbackData } = supabase.storage
                                .from('posts')
                                .getPublicUrl(fileName)
                              photoUrl = fallbackData.publicUrl
                            } else {
                              const { data } = supabase.storage
                                .from('group-photos')
                                .getPublicUrl(fileName)
                              photoUrl = data.publicUrl
                            }
                          }

                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const { error } = await (supabase.from('conversations') as any)
                            .update({
                              group_name: groupNameDraft.trim(),
                              group_description: groupDescriptionDraft.trim() || null,
                              group_photo_url: photoUrl
                            })
                            .eq('id', selectedConversation.id)

                          if (error) throw error

                          setSelectedConversation((prev) => prev ? ({
                            ...prev,
                            group_name: groupNameDraft.trim(),
                            group_description: groupDescriptionDraft.trim() || null,
                            group_photo_url: photoUrl || prev.group_photo_url
                          }) : prev)

                          const groupNameForMsg = groupNameDraft.trim()
                          const groupDescForMsg = (groupDescriptionDraft || '').trim()
                          const updates: string[] = []
                          if (groupNameForMsg && groupNameForMsg !== (selectedConversation.group_name || '').trim()) {
                            updates.push('le nom du groupe')
                          }
                          if (groupDescForMsg !== (selectedConversation.group_description || '').trim()) {
                            updates.push('la description du groupe')
                          }
                          if (photoUrl && photoUrl !== selectedConversation.group_photo_url) {
                            updates.push('la photo du groupe')
                          }
                          if (updates.length > 0) {
                            const content = updates.length === 1
                              ? `${updates[0]} a été modifié`
                              : `${updates.join(' et ')} ont été modifiés`
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            await (supabase.from('messages') as any).insert({
                              conversation_id: selectedConversation.id,
                              sender_id: user?.id,
                              message_type: 'text',
                              content,
                              calendar_request_data: {
                                kind: 'group_event',
                                event_type: 'group_updated',
                                group_name: groupNameForMsg
                              }
                            })
                            loadMessages(selectedConversation.id)
                            const firstUpdate = updates[0]
                            if (firstUpdate === 'la photo du groupe') showGroupActionFeedback('Photo modifiée')
                            else if (firstUpdate === 'le nom du groupe') showGroupActionFeedback('Nom modifié')
                            else if (firstUpdate === 'la description du groupe') showGroupActionFeedback('Description modifiée')
                            else showGroupActionFeedback('Modifications enregistrées')
                          }
                        } catch (error) {
                          console.error('Error saving group:', error)
                          alert('Erreur lors de la mise à jour du groupe')
                        } finally {
                          setSavingGroup(false)
                          setGroupPhotoFile(null)
                        }
                      }}
                    >
                      Enregistrer
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="conversation-info-field">
                    <label>Nom personnalisé</label>
                    <input
                      type="text"
                      value={aliasDraft}
                      onChange={(event) => setAliasDraft(event.target.value)}
                      placeholder={displayName}
                    />
                    <p className="conversation-info-helper">
                      Ce nom est visible uniquement par vous.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`conversation-info-save ${aliasSaveFeedback === 'saved' ? 'is-success' : ''}`}
                    onClick={() => {
                      if (!selectedConversation?.id) return
                      const trimmed = aliasDraft.trim()
                      const next = { ...conversationAliases, [selectedConversation.id]: trimmed }
                      setConversationAliases(next)
                      localStorage.setItem('messages_aliases', JSON.stringify(next))
                      setAliasSaveFeedback('saved')
                      if (aliasSaveFeedbackTimerRef.current) {
                        window.clearTimeout(aliasSaveFeedbackTimerRef.current)
                      }
                      aliasSaveFeedbackTimerRef.current = window.setTimeout(() => {
                        setAliasSaveFeedback('idle')
                        aliasSaveFeedbackTimerRef.current = null
                      }, 1400)
                    }}
                    aria-live="polite"
                  >
                    {aliasSaveFeedback === 'saved' ? (
                      <>
                        <Check size={16} />
                        Enregistré
                      </>
                    ) : (
                      'Enregistrer'
                    )}
                  </button>
                </>
              )}
            </div>

            {isGroupConversation && (
              <div className="conversation-info-members-section">
                <h3 className="conversation-info-members-title">Membres ({infoParticipants.length})</h3>
                <div className="conversation-info-card">
                  <div className="conversation-info-members-body">
                    <button
                      type="button"
                      className="conversation-info-add"
                      onClick={async () => {
                        if (!canEditGroup) return
                        setShowAddParticipants(true)
                        await loadSelectableUsers()
                      }}
                      disabled={!canEditGroup}
                      aria-label="Ajouter un membre"
                    >
                      <Plus size={16} />
                    </button>
                    {infoLoading ? (
                      <p className="conversation-info-muted">Chargement...</p>
                    ) : (
                      <div className="conversation-info-list">
                    {[...infoParticipants]
                      .sort((a, b) => {
                        if (a.user_id === user?.id) return -1
                        if (b.user_id === user?.id) return 1
                        return 0
                      })
                      .map((participant) => {
                      const display = participant.profile?.full_name || participant.profile?.username || 'Utilisateur'
                      const isModerator = participant.role === 'moderator'
                      const isCreator = participant.user_id === selectedConversation.group_creator_id
                      const isSelf = participant.user_id === user?.id
                      return (
                        <button
                          key={participant.user_id}
                          type="button"
                          className={`conversation-info-row conversation-info-row-clickable ${isSelf ? 'conversation-info-row-self' : ''}`}
                          onClick={() => {
                            if (!isSelf) {
                              setSelectedParticipant(participant)
                              setShowMemberBottomSheet(true)
                            }
                          }}
                        >
                          <div className="conversation-info-row-left">
                            <img
                              src={participant.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(display)}`}
                              alt={display}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(display)}`
                              }}
                            />
                            <span className="conversation-info-member-name">{display}</span>
                            {isCreator && (
                              <span className="conversation-info-role">Créateur(trice)</span>
                            )}
                            {!isCreator && isModerator && (
                              <span className="conversation-info-role">Administrateur(trice)</span>
                            )}
                            {!isCreator && !isModerator && (
                              <span className="conversation-info-role">Membre</span>
                            )}
                          </div>
                          <ChevronRight size={18} className="conversation-info-row-chevron" />
                        </button>
                      )
                    })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div
              className="conversation-info-card conversation-info-card-clickable"
              role="button"
              tabIndex={0}
              onClick={() => {
                const currentId = selectedConversation?.id || conversationId
                if (currentId) {
                  navigate(`/messages/${currentId}/media`)
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  const currentId = selectedConversation?.id || conversationId
                  if (currentId) {
                    navigate(`/messages/${currentId}/media`)
                  }
                }
              }}
            >
              <div className="conversation-info-header-row">
                <h3>Média, Lien et Documents</h3>
                <ChevronRight size={18} className="conversation-info-arrow" />
              </div>
              {null}
            </div>

            <div
              className="conversation-info-card conversation-info-card-clickable"
              role="button"
              tabIndex={0}
              onClick={() => {
                const currentId = selectedConversation?.id || conversationId
                if (currentId) {
                  navigate(`/messages/${currentId}/appointments`)
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  const currentId = selectedConversation?.id || conversationId
                  if (currentId) {
                    navigate(`/messages/${currentId}/appointments`)
                  }
                }
              }}
            >
              <div className="conversation-info-header-row">
                <h3>Rendez-vous</h3>
                <ChevronRight size={18} className="conversation-info-arrow" />
              </div>
              {appointmentMessages.length === 0 ? null : (
                <div className="conversation-info-preview-list">
                  {appointmentMessages.slice(0, 1).map((msg) => (
                    <div key={msg.id} className="conversation-info-preview-row">
                      <div className="conversation-info-preview-main">
                        <span className="conversation-info-preview-title">
                          {(msg.calendar_request_data as { title?: string })?.title || 'Rendez-vous'}
                        </span>
                        <span className="conversation-info-preview-subtitle">
                          {(msg.calendar_request_data as { appointment_datetime?: string })?.appointment_datetime
                            ? formatAppointmentDate((msg.calendar_request_data as { appointment_datetime?: string }).appointment_datetime as string)
                            : 'Date à confirmer'}
                        </span>
                      </div>
                      <ChevronRight size={16} className="conversation-info-arrow" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className="conversation-info-card conversation-info-card-clickable"
              role="button"
              tabIndex={0}
              onClick={() => {
                const currentId = selectedConversation?.id || conversationId
                if (currentId) {
                  navigate(`/messages/${currentId}/posts`)
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  const currentId = selectedConversation?.id || conversationId
                  if (currentId) {
                    navigate(`/messages/${currentId}/posts`)
                  }
                }
              }}
            >
              <div className="conversation-info-header-row">
                <h3>Annonces</h3>
                <ChevronRight size={18} className="conversation-info-arrow" />
              </div>
              {sharedPostMessages.length === 0 ? null : (
                <div className="conversation-info-preview-list">
                  {sharedPostMessages.slice(0, 1).map((msg) => (
                    <div key={msg.id} className="conversation-info-preview-row">
                      <div className="conversation-info-preview-main">
                        <span className="conversation-info-preview-title">
                          {getSharedPostLabel(msg)}
                        </span>
                        <span className="conversation-info-preview-subtitle">
                          Partagée le {formatAppointmentDate(msg.created_at)}
                        </span>
                      </div>
                      <ChevronRight size={16} className="conversation-info-arrow" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className="conversation-info-card conversation-info-card-clickable"
              role="button"
              tabIndex={0}
              onClick={() => {
                const currentId = selectedConversation?.id || conversationId
                if (currentId) {
                  navigate(`/messages/${currentId}/contracts`)
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  const currentId = selectedConversation?.id || conversationId
                  if (currentId) {
                    navigate(`/messages/${currentId}/contracts`)
                  }
                }
              }}
            >
              <div className="conversation-info-header-row">
                <h3>Contrats</h3>
                <ChevronRight size={18} className="conversation-info-arrow" />
              </div>
              {contractMessages.length === 0 ? null : (
                <div className="conversation-info-preview-list">
                  {contractMessages.slice(0, 1).map((msg) => (
                    <div key={msg.id} className="conversation-info-preview-row">
                      <div className="conversation-info-preview-main">
                        <span className="conversation-info-preview-title">
                          {getContractMessageLabel(msg)}
                        </span>
                        <span className="conversation-info-preview-subtitle">
                          Partagé le {formatAppointmentDate(msg.created_at)}
                        </span>
                      </div>
                      <ChevronRight size={16} className="conversation-info-arrow" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isGroupConversation && (
              <div className="conversation-info-members-section">
                <h3 className="conversation-info-members-title">Annonce liée</h3>
                <div className="conversation-info-card">
                  {selectedConversation?.post_id ? (
                    <div className="conversation-info-linked-post">
                      <p className="conversation-info-linked-post-label">Le groupe est lié à :</p>
                      <button
                        type="button"
                        className="conversation-info-linked-post-link"
                        onClick={() => navigate(`/post/${selectedConversation.post_id}`)}
                      >
                        {selectedConversation.postTitle || 'Voir l\'annonce'}
                      </button>
                      {canEditGroup && (
                        <button
                          type="button"
                          className="conversation-info-unlink-btn"
                          onClick={() => setShowDissociateConfirm(true)}
                        >
                          Dissocier
                        </button>
                      )}
                    </div>
                  ) : canEditGroup ? (
                    <button
                      type="button"
                      className="conversation-info-link-post-btn"
                      onClick={async () => {
                        setShowLinkPostSheet(true)
                        setLinkPostLoading(true)
                        const { data } = await supabase.from('posts').select('id, title').eq('user_id', user?.id).eq('status', 'active').order('created_at', { ascending: false }).limit(50)
                        setSelectablePostsForLink((data || []) as Array<{ id: string; title: string }>)
                        setLinkPostLoading(false)
                      }}
                    >
                      + Lier à une annonce
                    </button>
                  ) : (
                    <p className="conversation-info-muted">Aucune annonce liée</p>
                  )}
                </div>
              </div>
            )}

            {showLinkPostSheet && canEditGroup && createPortal(
              <>
                <div className="conversation-member-sheet-backdrop" onClick={() => setShowLinkPostSheet(false)} />
                <div className="conversation-member-sheet-panel">
                  <div className="conversation-member-sheet-header">
                    <h3>Lier à une annonce</h3>
                    <button type="button" className="conversation-member-sheet-close" onClick={() => setShowLinkPostSheet(false)}>×</button>
                  </div>
                  <div className="conversation-member-sheet-body">
                    {linkPostLoading ? (
                      <p className="conversation-info-muted">Chargement...</p>
                    ) : (
                      <div className="conversation-link-post-list">
                        {selectablePostsForLink.map((post) => (
                            <button
                              key={post.id}
                              type="button"
                              className="conversation-link-post-item"
                              onClick={async () => {
                                if (!selectedConversation?.id) return
                                try {
                                  const { error } = await (supabase.from('conversations') as any).update({ post_id: post.id }).eq('id', selectedConversation.id)
                                  if (error) throw error
                                  setSelectedConversation((prev) => prev ? { ...prev, post_id: post.id, postTitle: post.title } : prev)
                                  setShowLinkPostSheet(false)
                                } catch (e) {
                                  console.error(e)
                                  alert('Erreur lors de la liaison')
                                }
                              }}
                            >
                              {post.title}
                            </button>
                          ))}
                        {selectablePostsForLink.length === 0 && (
                          <p className="conversation-info-muted">Aucune annonce trouvée</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>,
              document.body
            )}

            {isGroupConversation && canEditGroup && (
              <div className="conversation-info-members-section">
                <h3 className="conversation-info-members-title">Lien d&apos;invitation</h3>
                <div className="conversation-info-card">
                  {inviteLinkToken ? (
                    <div className="conversation-info-invite-link">
                      <p className="conversation-info-muted">Partagez ce lien pour inviter à rejoindre le groupe :</p>
                      <div className="conversation-info-invite-link-row">
                        <code className="conversation-info-invite-link-code">
                          {typeof window !== 'undefined' ? `${window.location.origin}/messages?invite=${inviteLinkToken}` : `.../messages?invite=${inviteLinkToken}`}
                        </code>
                        <button
                          type="button"
                          className="conversation-info-copy-invite-btn"
                          onClick={() => {
                            const url = typeof window !== 'undefined' ? `${window.location.origin}/messages?invite=${inviteLinkToken}` : ''
                            navigator.clipboard?.writeText(url).then(() => alert('Lien copié'))
                          }}
                        >
                          <Copy size={16} />
                          Copier
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="conversation-info-link-post-btn"
                      disabled={inviteLinkLoading}
                      onClick={async () => {
                        if (!selectedConversation?.id || !user) return
                        setInviteLinkLoading(true)
                        try {
                          const token = `${crypto.randomUUID().replace(/-/g, '')}${Date.now().toString(36)}`
                          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                          const { error } = await (supabase.from('group_invite_tokens') as any).insert({
                            conversation_id: selectedConversation.id,
                            token,
                            created_by: user.id,
                            expires_at: expiresAt
                          })
                          if (error) throw error
                          setInviteLinkToken(token)
                          showGroupActionFeedback('Lien d\'invitation créé')
                        } catch (e) {
                          console.error(e)
                          alert('Impossible de créer le lien. Vérifiez que la migration add_group_invite_tokens.sql a été exécutée.')
                        } finally {
                          setInviteLinkLoading(false)
                        }
                      }}
                    >
                      {inviteLinkLoading ? 'Création...' : '+ Créer un lien d\'invitation'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {!isSystemConversation && (
              <div className="conversation-info-actions">
                <button
                  type="button"
                  className="conversation-action-item"
                  onClick={() => {
                    setReportReason('')
                    setShowReportModal(true)
                  }}
                >
                  {isGroupConversation ? 'Signaler le groupe' : 'Signaler l\'utilisateur'}
                </button>
                {!isGroupConversation && (
                  <button
                    type="button"
                    className="conversation-action-item"
                    onClick={() => setShowBlockConfirm(true)}
                  >
                    Bloquer l'utilisateur
                  </button>
                )}
                {isGroupConversation && (
                  <button
                    type="button"
                    className="conversation-action-item danger"
                    onClick={() => setShowLeaveGroupConfirm(true)}
                  >
                    Quitter ce groupe
                  </button>
                )}
                <button
                  type="button"
                  className="conversation-action-item danger"
                  onClick={() => {
                    setListActionConversation(null)
                    setShowDeleteConfirm(true)
                  }}
                >
                  Supprimer la conversation
                </button>
              </div>
            )}

            {groupActionFeedback && (
              <div className="conversation-info-action-feedback" role="status" aria-live="polite">
                <Check size={16} />
                {groupActionFeedback}
              </div>
            )}
          </div>

          {!isSystemConversation && showReportModal && (
            <div
              className="conversation-modal-overlay"
              onClick={() => {
                setShowReportModal(false)
                setReportReason('')
              }}
            >
              <div className="conversation-modal-content" onClick={(event) => event.stopPropagation()}>
                <div className="conversation-modal-header">
                  <h2>{isGroupConversation ? 'Signaler le groupe' : 'Signaler l\'utilisateur'}</h2>
                  <button
                    type="button"
                    className="conversation-modal-close"
                    onClick={() => {
                      setShowReportModal(false)
                      setReportReason('')
                    }}
                    aria-label="Fermer"
                  >
                    ×
                  </button>
                </div>
                <div className="conversation-modal-body">
                  <p className="conversation-modal-question">Raison du signalement :</p>
                  <div className="conversation-reasons-list">
                    <button type="button" className={`conversation-reason-btn ${reportReason === 'suspect' ? 'active' : ''}`} onClick={() => setReportReason('suspect')}>Suspect</button>
                    <button type="button" className={`conversation-reason-btn ${reportReason === 'fraudeur' ? 'active' : ''}`} onClick={() => setReportReason('fraudeur')}>Fraudeur</button>
                    <button type="button" className={`conversation-reason-btn ${reportReason === 'fondant' ? 'active' : ''}`} onClick={() => setReportReason('fondant')}>Fondant / Inapproprié</button>
                    <button type="button" className={`conversation-reason-btn ${reportReason === 'sexuel' ? 'active' : ''}`} onClick={() => setReportReason('sexuel')}>Contenu sexuel</button>
                    <button type="button" className={`conversation-reason-btn ${reportReason === 'spam' ? 'active' : ''}`} onClick={() => setReportReason('spam')}>Spam</button>
                    <button type="button" className={`conversation-reason-btn ${reportReason === 'autre' ? 'active' : ''}`} onClick={() => setReportReason('autre')}>Autre</button>
                  </div>
                  {reportReason && (
                    <button type="button" className="conversation-submit-btn" onClick={handleReportSubmit}>
                      Envoyer le signalement
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {showBlockConfirm && (
            <ConfirmationModal
              visible={showBlockConfirm}
              title="Bloquer l'utilisateur"
              message="Voulez-vous vraiment bloquer cet utilisateur ?"
              onCancel={() => setShowBlockConfirm(false)}
              onConfirm={async () => {
                await handleBlockUser()
                setShowBlockConfirm(false)
              }}
              confirmLabel="Bloquer"
              cancelLabel="Annuler"
              isDestructive={true}
              compact
            />
          )}
          {showLeaveGroupConfirm && (
            <ConfirmationModal
              visible={showLeaveGroupConfirm}
              title="Quitter le groupe"
              message="Voulez-vous vraiment quitter ce groupe ? Vous ne recevrez plus les messages de cette conversation."
              compact
              onCancel={() => setShowLeaveGroupConfirm(false)}
              onConfirm={async () => {
                if (!selectedConversation?.id || !user) return
                try {
                  const { data: myProfile } = await supabase
                    .from('profiles')
                    .select('full_name, username')
                    .eq('id', user.id)
                    .single()
                  const myName = (myProfile as { full_name?: string | null; username?: string | null } | null)?.full_name
                    || (myProfile as { full_name?: string | null; username?: string | null } | null)?.username
                    || 'Un membre'
                  const groupNameForMsg = (selectedConversation.group_name || selectedConversation.name || 'Groupe').trim()
                  // Message avant de quitter pour que l'utilisateur soit encore participant
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabase.from('messages') as any).insert({
                    conversation_id: selectedConversation.id,
                    sender_id: user.id,
                    message_type: 'text',
                    content: `${myName} a quitté le groupe`,
                    calendar_request_data: {
                      kind: 'group_event',
                      event_type: 'member_left',
                      members: [{ user_id: user.id, name: myName }],
                      group_name: groupNameForMsg
                    }
                  })
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const { error } = await (supabase.from('conversation_participants') as any)
                    .update({ is_active: false })
                    .eq('conversation_id', selectedConversation.id)
                    .eq('user_id', user.id)
                  if (error) throw error
                  setShowLeaveGroupConfirm(false)
                  setListActionConversation(null)
                  navigate('/messages')
                } catch (error) {
                  console.error('Error leaving group:', error)
                  alert('Impossible de quitter le groupe')
                }
              }}
              confirmLabel="Quitter le groupe"
              cancelLabel="Annuler"
              isDestructive={true}
            />
          )}
          {showRemoveMemberConfirm && participantToRemove && (
            <ConfirmationModal
              visible={showRemoveMemberConfirm}
              title="Retirer du groupe"
              message={`Voulez-vous vraiment retirer ${participantToRemove.profile?.full_name || participantToRemove.profile?.username || 'cet utilisateur'} du groupe ?`}
              compact
              onCancel={() => {
                setShowRemoveMemberConfirm(false)
                setParticipantToRemove(null)
              }}
              onConfirm={async () => {
                if (!selectedConversation?.id || !user || !participantToRemove) return
                try {
                  const removedName = participantToRemove.profile?.full_name || participantToRemove.profile?.username || 'Un membre'
                  const groupNameForMsg = (selectedConversation.group_name || selectedConversation.name || 'Groupe').trim()
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabase.from('conversation_participants') as any)
                    .update({ is_active: false })
                    .eq('conversation_id', selectedConversation.id)
                    .eq('user_id', participantToRemove.user_id)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabase.from('messages') as any).insert({
                    conversation_id: selectedConversation.id,
                    sender_id: user.id,
                    message_type: 'text',
                    content: `${removedName} a été retiré du groupe`,
                    calendar_request_data: {
                      kind: 'group_event',
                      event_type: 'member_removed',
                      members: [{ user_id: participantToRemove.user_id, name: removedName }],
                      group_name: groupNameForMsg
                    }
                  })
                  setInfoParticipants((prev) => prev.filter((p) => p.user_id !== participantToRemove.user_id))
                  setShowMemberBottomSheet(false)
                  setSelectedParticipant(null)
                  setShowRemoveMemberConfirm(false)
                  setParticipantToRemove(null)
                  loadMessages(selectedConversation.id)
                  showGroupActionFeedback('Membre retiré(e)')
                } catch (error) {
                  console.error('Error removing participant:', error)
                  alert('Impossible de retirer ce participant')
                }
              }}
              confirmLabel="Retirer"
              cancelLabel="Annuler"
              isDestructive={true}
            />
          )}
          {showDissociateConfirm && (
            <ConfirmationModal
              visible={showDissociateConfirm}
              title="Dissocier l'annonce"
              message="Voulez-vous vraiment dissocier cette annonce du groupe ?"
              compact
              onCancel={() => setShowDissociateConfirm(false)}
              onConfirm={async () => {
                if (!selectedConversation?.id) return
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const { error } = await (supabase.from('conversations') as any).update({ post_id: null }).eq('id', selectedConversation.id)
                  if (error) throw error
                  setSelectedConversation((prev) => prev ? { ...prev, post_id: null, postTitle: null } : prev)
                  setShowDissociateConfirm(false)
                  showGroupActionFeedback('Annonce dissociée')
                } catch (e) {
                  console.error(e)
                  alert('Erreur lors de la dissociation')
                }
              }}
              confirmLabel="Dissocier"
              cancelLabel="Annuler"
              isDestructive={false}
            />
          )}
          {showDeleteConfirm && (
            <ConfirmationModal
              visible={showDeleteConfirm}
              title="Supprimer la conversation"
              message="Voulez-vous vraiment supprimer cette conversation ?"
              compact
              onCancel={() => setShowDeleteConfirm(false)}
              onConfirm={async () => {
                const currentId = selectedConversation?.id || conversationId
                if (!currentId) return
                await handleDeleteConversationForUser(currentId)
                setShowDeleteConfirm(false)
                setListActionConversation(null)
                navigate('/messages')
              }}
              confirmLabel="Supprimer"
              cancelLabel="Annuler"
              isDestructive={true}
            />
          )}
          <SelectUsersModal
            visible={showAddParticipants}
            title="Ajouter des participants"
            users={selectableUsers.filter((candidate) => !infoParticipants.find((p) => p.user_id === candidate.id))}
            loading={selectableUsersLoading}
            multiple
            confirmLabel="Ajouter"
            emptyText="Aucun utilisateur disponible"
            onClose={() => setShowAddParticipants(false)}
            onConfirm={async (usersToAdd) => {
              if (!selectedConversation?.id || !user) return
              try {
                const rows = usersToAdd.map((participant) => ({
                  conversation_id: selectedConversation.id,
                  user_id: participant.id,
                  is_active: true,
                  role: 'member'
                }))
                if (rows.length > 0) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const { error } = await (supabase.from('conversation_participants') as any).insert(rows)
                  if (error) throw error

                  const groupNameForMsg = (selectedConversation.group_name || selectedConversation.name || 'Groupe').trim()
                  const members = usersToAdd.map((p) => ({
                    user_id: p.id,
                    name: p.full_name || p.username || 'Utilisateur'
                  }))
                  const names = members.map((m) => m.name)
                  const content =
                    names.length === 1
                      ? `${names[0]} a été ajouté au groupe`
                      : `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]} ont été ajoutés au groupe`

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabase.from('messages') as any).insert({
                    conversation_id: selectedConversation.id,
                    sender_id: user.id,
                    message_type: 'text',
                    content,
                    calendar_request_data: {
                      kind: 'group_event',
                      event_type: 'member_added',
                      members,
                      group_name: groupNameForMsg
                    }
                  })

                  const { data: adderProfile } = await supabase
                    .from('profiles')
                    .select('full_name, username')
                    .eq('id', user.id)
                    .single()
                  const adderName = (adderProfile as { full_name?: string | null; username?: string | null } | null)?.full_name
                    || (adderProfile as { full_name?: string | null; username?: string | null } | null)?.username
                    || 'Un membre'
                  for (const p of usersToAdd) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (supabase.from('notifications') as any).insert({
                      user_id: p.id,
                      type: 'message',
                      title: 'Vous avez été ajouté à un groupe',
                      content: `${adderName} vous a ajouté au groupe "${groupNameForMsg}"`,
                      related_id: selectedConversation.id,
                      metadata: { conversation_id: selectedConversation.id, group_name: groupNameForMsg }
                    })
                  }
                }

                setInfoParticipants((prev) => [
                  ...prev,
                  ...usersToAdd.map((participant) => ({
                    user_id: participant.id,
                    is_active: true,
                    role: 'member',
                    profile: {
                      id: participant.id,
                      username: participant.username,
                      full_name: participant.full_name,
                      avatar_url: participant.avatar_url
                    }
                  }))
                ])
                setShowAddParticipants(false)
                loadMessages(selectedConversation.id)
                showGroupActionFeedback(
                  usersToAdd.length === 1
                    ? 'Membre ajouté(e)'
                    : `${usersToAdd.length} membres ajouté(e)s`
                )
              } catch (error) {
                console.error('Error adding participants:', error)
                alert('Impossible d\'ajouter les participants')
              }
            }}
          />
          {selectedParticipant && showMemberBottomSheet && createPortal(
            <>
              <div
                className="conversation-member-sheet-backdrop"
                onClick={() => { setShowMemberBottomSheet(false); setSelectedParticipant(null) }}
              />
              <div className="conversation-member-sheet-panel">
                <div className="conversation-member-sheet-header conversation-member-sheet-header-minimal">
                  <button
                    type="button"
                    className="conversation-member-sheet-close"
                    onClick={() => { setShowMemberBottomSheet(false); setSelectedParticipant(null) }}
                    aria-label="Fermer"
                  >
                    ×
                  </button>
                </div>
                <div className="conversation-member-sheet-body">
                  <div className="conversation-member-sheet-profile-centered">
                    <img
                      src={selectedParticipant.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedParticipant.profile?.full_name || selectedParticipant.profile?.username || 'Utilisateur')}`}
                      alt={selectedParticipant.profile?.full_name || selectedParticipant.profile?.username || 'Utilisateur'}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedParticipant.profile?.full_name || selectedParticipant.profile?.username || 'Utilisateur')}`
                      }}
                    />
                    {selectedParticipant.user_id !== user?.id ? (
                      <button
                        type="button"
                        className="conversation-member-sheet-name conversation-member-sheet-name-link"
                        onClick={() => {
                          const profileId = selectedParticipant.profile?.id || selectedParticipant.user_id
                          if (!profileId) return
                          setShowMemberBottomSheet(false)
                          setSelectedParticipant(null)
                          openPublicProfile(profileId)
                        }}
                      >
                        {selectedParticipant.profile?.full_name || selectedParticipant.profile?.username || 'Utilisateur'}
                      </button>
                    ) : (
                      <p className="conversation-member-sheet-name">
                        {selectedParticipant.profile?.full_name || selectedParticipant.profile?.username || 'Utilisateur'}
                      </p>
                    )}
                    <p className="conversation-member-sheet-role">
                      {selectedParticipant.user_id === selectedConversation?.group_creator_id
                        ? 'Créateur(trice)'
                        : selectedParticipant.role === 'moderator'
                          ? 'Administrateur(trice)'
                          : 'Membre'}
                    </p>
                    {selectedParticipant.user_id !== user?.id && (
                      <button
                        type="button"
                        className="conversation-member-sheet-action-icon"
                        onClick={async () => {
                          if (!user) return
                          const conv = await findOrCreateConversation(selectedParticipant.user_id)
                          setShowMemberBottomSheet(false)
                          setSelectedParticipant(null)
                          if (conv && (conv as { id: string }).id) {
                            navigate(`/messages/${(conv as { id: string }).id}`)
                          }
                        }}
                        title="Message privé"
                      >
                        <MessageCircle size={20} />
                      </button>
                    )}
                  </div>
                  {selectedParticipant.user_id !== user?.id && canManageMembers && (
                        <div className="conversation-member-sheet-list">
                          <button
                            type="button"
                            className="conversation-member-sheet-list-item"
                            onClick={async () => {
                              if (!selectedConversation?.id) return
                              try {
                                const nextRole = selectedParticipant.role === 'moderator' ? 'member' : 'moderator'
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                await (supabase.from('conversation_participants') as any)
                                  .update({ role: nextRole })
                                  .eq('conversation_id', selectedConversation.id)
                                  .eq('user_id', selectedParticipant.user_id)
                                setInfoParticipants((prev) => prev.map((p) => p.user_id === selectedParticipant.user_id ? { ...p, role: nextRole } : p))
                                setSelectedParticipant((prev) => prev ? { ...prev, role: nextRole } : prev)
                                setShowMemberBottomSheet(false)
                                showGroupActionFeedback(nextRole === 'moderator' ? 'Administrateur(trice) ajouté(e)' : 'Administrateur(trice) retiré(e)')
                              } catch (error) {
                                console.error('Error updating role:', error)
                                alert('Impossible de mettre à jour le rôle')
                              }
                            }}
                          >
                            <span>{selectedParticipant.role === 'moderator' ? 'Retirer administrateur(trice)' : 'Définir administrateur(trice)'}</span>
                            <ChevronRight size={18} className="conversation-member-sheet-chevron" />
                          </button>
                          <button
                            type="button"
                            className="conversation-member-sheet-list-item danger"
                            onClick={() => {
                              setParticipantToRemove(selectedParticipant)
                              setShowRemoveMemberConfirm(true)
                            }}
                          >
                            <span>Retirer du groupe</span>
                            <ChevronRight size={18} className="conversation-member-sheet-chevron" />
                          </button>
                        </div>
                  )}
                </div>
              </div>
            </>,
            document.body
          )}
        </div>
      )
    }

    if (isMediaView) {
      const mediaItems = messages.filter((msg) => {
        if (!msg.file_url) return false
        if (msg.message_type === 'document') return false
        if (msg.message_type === 'photo' || msg.message_type === 'video') return true
        return !msg.message_type
      })
      const documentItems = messages.filter((msg) => msg.message_type === 'document' && msg.file_url)
      const linkItems = messages.filter((msg) => msg.message_type === 'link' || hasLinkContent(msg.content))

      const items = mediaTab === 'media'
        ? mediaItems
        : mediaTab === 'documents'
          ? documentItems
          : linkItems

      return (
        <div className="messages-page-container conversation-page conversation-media-page">
          <div className="conversation-header">
            <BackButton
              className="conversation-back-button"
              onClick={() => {
                const currentId = selectedConversation?.id || conversationId
                if (currentId) {
                  navigate(`/messages/${currentId}/info`)
                } else {
                  navigate('/messages')
                }
              }}
            />
            <div className="conversation-header-center">
              <h1 className="conversation-header-name">Médias</h1>
            </div>
          </div>

          <div className="conversation-media-content">
            <div className="conversation-media-tabs">
              <button
                className={`conversation-media-tab ${mediaTab === 'media' ? 'active' : ''}`}
                onClick={() => setMediaTab('media')}
              >
                Média
              </button>
              <button
                className={`conversation-media-tab ${mediaTab === 'links' ? 'active' : ''}`}
                onClick={() => setMediaTab('links')}
              >
                Lien
              </button>
              <button
                className={`conversation-media-tab ${mediaTab === 'documents' ? 'active' : ''}`}
                onClick={() => setMediaTab('documents')}
              >
                Documents
              </button>
            </div>

            {items.length === 0 ? (
              <div className="conversation-media-empty">
                {mediaTab === 'media' ? 'Aucun média' : mediaTab === 'links' ? 'Aucun lien' : 'Aucun document'}
              </div>
            ) : mediaTab === 'media' ? (
              <div className="conversation-media-grid">
                {items.map((msg) => (
                  <button
                    key={msg.id}
                    type="button"
                    className="conversation-media-item"
                    onClick={() => {
                      setSelectedMediaMessage(msg)
                      setShowMediaActions(true)
                    }}
                  >
                    {msg.message_type === 'video' ? (
                      <div className="conversation-media-video">
                        <Film size={18} />
                        <span>Vidéo</span>
                      </div>
                    ) : (
                      <img src={msg.file_url || ''} alt={msg.file_name || 'media'} />
                    )}
                  </button>
                ))}
              </div>
            ) : mediaTab === 'documents' ? (
              <div className="conversation-media-list">
                {items.map((msg) => (
                  <button
                    key={msg.id}
                    type="button"
                    className="conversation-media-row"
                    onClick={() => {
                      setSelectedMediaMessage(msg)
                      setShowMediaActions(true)
                    }}
                  >
                    <span>{msg.file_name || 'Document'}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="conversation-media-list">
                {items.map((msg) => (
                  <button
                    key={msg.id}
                    type="button"
                    className="conversation-media-row"
                    onClick={() => {
                      setSelectedMediaMessage(msg)
                      setShowMediaActions(true)
                    }}
                  >
                    <span>{(msg.content || '').trim()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {showMediaActions && selectedMediaMessage && (
            <div
              className="conversation-media-actions-overlay"
              onClick={() => setShowMediaActions(false)}
            >
              <div
                className="conversation-media-actions-sheet"
                onClick={(event) => event.stopPropagation()}
              >
                {mediaTab === 'links' && (
                  <button
                    type="button"
                    className="conversation-media-action"
                    onClick={() => {
                      const link = extractFirstLink(selectedMediaMessage.content)
                      if (link) window.open(link, '_blank', 'noopener,noreferrer')
                      setShowMediaActions(false)
                    }}
                  >
                    Ouvrir le lien
                  </button>
                )}
                {mediaTab !== 'links' && (
                  <button
                    type="button"
                    className="conversation-media-action"
                    onClick={() => {
                      if (selectedMediaMessage.file_url) {
                        window.open(selectedMediaMessage.file_url, '_blank', 'noopener,noreferrer')
                      }
                      setShowMediaActions(false)
                    }}
                  >
                    {mediaTab === 'documents' ? 'Voir ce document' : 'Voir ce média'}
                  </button>
                )}
                {mediaTab !== 'links' && (
                  <button
                    type="button"
                    className="conversation-media-action"
                    onClick={() => {
                      handleSaveMedia(selectedMediaMessage)
                      setShowMediaActions(false)
                    }}
                  >
                    <Download size={18} />
                    Enregistrer
                  </button>
                )}
                <button
                  type="button"
                  className="conversation-media-action"
                  onClick={async () => {
                    await handleShareMedia(selectedMediaMessage, mediaTab === 'links' ? 'link' : 'media')
                    setShowMediaActions(false)
                  }}
                >
                  <Share2 size={18} />
                  Partager
                </button>
                <button
                  type="button"
                  className="conversation-media-action"
                  onClick={async () => {
                    setShowMediaActions(false)
                    setShowForwardMessage(true)
                    setForwardMessage(selectedMediaMessage)
                    await loadSelectableUsers()
                  }}
                >
                  <Send size={18} />
                  Transférer
                </button>
                <button
                  type="button"
                  className="conversation-media-action danger"
                  onClick={async () => {
                    setShowMediaActions(false)
                    await handleDeleteMessage(
                      selectedMediaMessage,
                      selectedMediaMessage.sender_id === user?.id
                    )
                  }}
                >
                  <Trash2 size={18} />
                  Supprimer
                </button>
                <button
                  type="button"
                  className="conversation-media-action cancel"
                  onClick={() => setShowMediaActions(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
          <SelectUsersModal
            visible={showForwardMessage}
            title="Transférer le message"
            users={selectableUsers}
            loading={selectableUsersLoading}
            emptyText="Aucun utilisateur disponible"
            onClose={() => {
              setShowForwardMessage(false)
              setForwardMessage(null)
            }}
            onSelectUser={async (selectedUser) => {
              const selectedUserEmail = (selectedUser as { email?: string | null }).email
              if (isSystemUserEmail(selectedUserEmail)) {
                alert('Vous ne pouvez pas transférer de message vers le compte Ollync.')
                return
              }
              if (forwardMessage) {
                await handleForwardMessage(selectedUser, forwardMessage)
              }
              setShowForwardMessage(false)
              setForwardMessage(null)
            }}
          />
        </div>
      )
    }

    if (isAppointmentsView) {
      const appointmentItems = messages.filter((msg) =>
        msg.message_type === 'calendar_request' && msg.calendar_request_data
      )

      return (
        <div className="messages-page-container conversation-page conversation-media-page">
          <div className="conversation-header">
            <BackButton
              className="conversation-back-button"
              onClick={() => {
                const currentId = selectedConversation?.id || conversationId
                if (currentId) {
                  navigate(`/messages/${currentId}/info`)
                } else {
                  navigate('/messages')
                }
              }}
            />
            <div className="conversation-header-center">
              <h1 className="conversation-header-name">Rendez-vous</h1>
            </div>
          </div>

          <div className="conversation-media-content">
            {appointmentItems.length === 0 ? (
              <div className="conversation-media-empty">
                Aucun rendez-vous
              </div>
            ) : (
              <div className="conversation-media-list">
                {appointmentItems.map((msg) => (
                  <button
                    key={msg.id}
                    type="button"
                    className="conversation-record-row conversation-record-row--appointment"
                    onClick={() => openAppointmentDetailsFromMessage(msg)}
                  >
                    <div className="conversation-record-row-content">
                      <span className="conversation-record-row-title">
                        {(msg.calendar_request_data as { title?: string })?.title || 'Rendez-vous'}
                      </span>
                      <span className="conversation-record-row-subtitle">
                        {(msg.calendar_request_data as { appointment_datetime?: string })?.appointment_datetime
                          ? formatAppointmentDate((msg.calendar_request_data as { appointment_datetime?: string }).appointment_datetime as string)
                          : 'Date à confirmer'}
                      </span>
                    </div>
                    <div className="conversation-record-row-meta">
                      <span className="conversation-record-row-badge">Rendez-vous</span>
                      <ChevronRight size={16} className="conversation-record-row-chevron" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (isContractsView) {
      const contractItems = messages.filter((msg) => msg.message_type === 'contract_share')

      return (
        <div className="messages-page-container conversation-page conversation-media-page">
          <div className="conversation-header">
            <BackButton
              className="conversation-back-button"
              onClick={() => {
                const currentId = selectedConversation?.id || conversationId
                if (currentId) {
                  navigate(`/messages/${currentId}/info`)
                } else {
                  navigate('/messages')
                }
              }}
            />
            <div className="conversation-header-center">
              <h1 className="conversation-header-name">Contrats</h1>
            </div>
          </div>

          <div className="conversation-media-content">
            {contractItems.length === 0 ? (
              <div className="conversation-media-empty">
                Aucun contrat partagé
              </div>
            ) : (
              <div className="conversation-media-list">
                {contractItems.map((msg) => (
                  <button
                    key={msg.id}
                    type="button"
                    className="conversation-record-row conversation-record-row--contract"
                    onClick={() => openContractDetails(msg)}
                  >
                    <div className="conversation-record-row-content">
                      <span className="conversation-record-row-title">{getContractMessageLabel(msg)}</span>
                      <span className="conversation-record-row-subtitle">
                        Partagé le {formatAppointmentDate(msg.created_at)}
                      </span>
                    </div>
                    <div className="conversation-record-row-meta">
                      <span className="conversation-record-row-badge">Contrat</span>
                      <ChevronRight size={16} className="conversation-record-row-chevron" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (isPostsView) {
      const postItems = messages.filter((msg) => msg.message_type === 'post_share')

      return (
        <div className="messages-page-container conversation-page conversation-media-page">
          <div className="conversation-header">
            <BackButton
              className="conversation-back-button"
              onClick={() => {
                const currentId = selectedConversation?.id || conversationId
                if (currentId) {
                  navigate(`/messages/${currentId}/info`)
                } else {
                  navigate('/messages')
                }
              }}
            />
            <div className="conversation-header-center">
              <h1 className="conversation-header-name">Annonces</h1>
            </div>
          </div>

          <div className="conversation-media-content">
            {postItems.length === 0 ? (
              <div className="conversation-media-empty">
                Aucune annonce partagée
              </div>
            ) : (
              <div className="conversation-media-list">
                {postItems.map((msg) => (
                  <button
                    key={msg.id}
                    type="button"
                    className="conversation-record-row conversation-record-row--post"
                    onClick={() => {
                      if (msg.shared_post_id) {
                        navigate(`/post/${msg.shared_post_id}`)
                      }
                    }}
                    disabled={!msg.shared_post_id}
                  >
                    <div className="conversation-record-row-content">
                      <span className="conversation-record-row-title">{getSharedPostLabel(msg)}</span>
                      <span className="conversation-record-row-subtitle">
                        Partagée le {formatAppointmentDate(msg.created_at)}
                      </span>
                    </div>
                    <div className="conversation-record-row-meta">
                      <span className="conversation-record-row-badge">Annonce</span>
                      <ChevronRight size={16} className="conversation-record-row-chevron" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="messages-page-container conversation-page">
        <div className="conversation-header">
          <BackButton 
            className="conversation-back-button"
            onClick={() => {
              setSelectedConversation(null)
              navigate('/messages')
            }}
          />
          <div
            className={`conversation-header-center ${!isSystemConversation ? 'clickable' : ''}`}
            title={!isSystemConversation ? 'Infos de la conversation' : undefined}
            role={!isSystemConversation ? 'button' : undefined}
            tabIndex={!isSystemConversation ? 0 : undefined}
            onClick={() => {
              if (isSystemConversation) return
              const currentId = selectedConversation?.id || conversationId
              if (currentId) {
                navigate(`/messages/${currentId}/info`)
              }
            }}
            onKeyDown={(event) => {
              if (!isSystemConversation && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault()
                const currentId = selectedConversation?.id || conversationId
                if (currentId) {
                  navigate(`/messages/${currentId}/info`)
                }
              }
            }}
          >
            {isSystemConversation && (
              <div className="conversation-header-logo">
                <Logo className="conversation-header-logo-icon" width={40} height={20} />
              </div>
            )}
            <div className="conversation-header-text">
              <div className="conversation-header-name-row">
                <h1 className="conversation-header-name">{headerName}</h1>
                {!isSystemConversation && !isGroupConversation && selectedConversation?.other_user?.is_online && (
                  <span className="conversation-header-online-dot" title="En ligne" aria-hidden />
                )}
              </div>
              {!isSystemConversation && (
                <p className="conversation-header-status">
                  {!isGroupConversation && selectedConversation?.other_user?.is_online
                    ? 'En ligne'
                    : formatLastSeen(
                        isGroupConversation
                          ? (selectedConversation?.last_message_at || null)
                          : (selectedConversation?.other_user?.last_activity_at || null)
                      )}
                </p>
              )}
            </div>
            {!isSystemConversation && (
              <ChevronRight className="conversation-header-chevron" size={20} aria-hidden />
            )}
          </div>
        </div>
        {!isSystemConversation && showReportModal && (
          <div
            className="conversation-modal-overlay"
            onClick={() => {
              setShowReportModal(false)
              setReportReason('')
            }}
          >
            <div className="conversation-modal-content" onClick={(event) => event.stopPropagation()}>
              <div className="conversation-modal-header">
                <h2>Signaler</h2>
                <button
                  className="conversation-modal-close"
                  onClick={() => {
                    setShowReportModal(false)
                    setReportReason('')
                  }}
                >
                  ×
                </button>
              </div>
              <div className="conversation-modal-body">
                <p className="conversation-modal-question">Raison du signalement :</p>
                <div className="conversation-reasons-list">
                  <button
                    className={`conversation-reason-btn ${reportReason === 'suspect' ? 'active' : ''}`}
                    onClick={() => setReportReason('suspect')}
                  >
                    Suspect
                  </button>
                  <button
                    className={`conversation-reason-btn ${reportReason === 'fraudeur' ? 'active' : ''}`}
                    onClick={() => setReportReason('fraudeur')}
                  >
                    Fraudeur
                  </button>
                  <button
                    className={`conversation-reason-btn ${reportReason === 'fondant' ? 'active' : ''}`}
                    onClick={() => setReportReason('fondant')}
                  >
                    Fondant / Inapproprié
                  </button>
                  <button
                    className={`conversation-reason-btn ${reportReason === 'sexuel' ? 'active' : ''}`}
                    onClick={() => setReportReason('sexuel')}
                  >
                    Contenu sexuel
                  </button>
                  <button
                    className={`conversation-reason-btn ${reportReason === 'spam' ? 'active' : ''}`}
                    onClick={() => setReportReason('spam')}
                  >
                    Spam
                  </button>
                  <button
                    className={`conversation-reason-btn ${reportReason === 'autre' ? 'active' : ''}`}
                    onClick={() => setReportReason('autre')}
                  >
                    Autre
                  </button>
                </div>
                {reportReason && (
                  <button
                    className="conversation-submit-btn"
                    onClick={handleReportSubmit}
                  >
                    Envoyer le signalement
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {showBlockConfirm && (
          <ConfirmationModal
            visible={showBlockConfirm}
            title="Bloquer cet utilisateur"
            message="Voulez-vous vraiment bloquer cet utilisateur ?"
            compact
            onCancel={() => setShowBlockConfirm(false)}
            onConfirm={async () => {
              if (!user || !otherUserId) return
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error } = await (supabase.from('user_blocks') as any)
                  .insert({
                    blocker_id: user.id,
                    blocked_id: otherUserId
                  })

                if (error && error.code !== '23505') {
                  console.error('Error blocking user:', error)
                  alert('Erreur lors du blocage de l\'utilisateur')
                  return
                }
                setShowBlockConfirm(false)
                setSelectedConversation(null)
                navigate('/messages')
                loadConversations()
              } catch (error) {
                console.error('Error blocking user:', error)
                alert('Erreur lors du blocage de l\'utilisateur')
              }
            }}
            confirmLabel="Bloquer"
            cancelLabel="Annuler"
            isDestructive={true}
          />
        )}
        {showDeleteConfirm && !listActionConversation && (
          <ConfirmationModal
            visible={showDeleteConfirm}
            title="Supprimer la conversation"
            message="Voulez-vous vraiment supprimer cette conversation ?"
            compact
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={async () => {
              const currentId = selectedConversation?.id || conversationId
              if (!currentId) return
              await handleDeleteConversationForUser(currentId)
              setShowDeleteConfirm(false)
              setListActionConversation(null)
            }}
            confirmLabel="Supprimer"
            cancelLabel="Annuler"
            isDestructive={true}
          />
        )}
        <div
          className={`conversation-messages-container ${isSystemConversation ? 'system-conversation' : ''}`}
        >
          {loading || messagesLoading ? (
            <div className="loading-container">
              <Loader className="spinner-large" size={48} />
              <p>Chargement...</p>
            </div>
          ) : (
            <div className="conversation-messages-list" ref={messagesListRef}>
              {!isSystemConversation && (
                <div className="conversation-safety-card">
                {!showScamPrevention ? (
                  <button
                    type="button"
                    className="conversation-safety-title-btn"
                    onClick={() => setShowScamPrevention(true)}
                  >
                    Conseils de sécurité
                  </button>
                ) : (
                  <>
                    <div className="conversation-safety-header-row">
                      <h3 className="conversation-safety-title">Conseils de sécurité</h3>
                      <button
                        type="button"
                        className="conversation-safety-toggle conversation-safety-toggle-secondary"
                        onClick={() => setShowScamPrevention(false)}
                      >
                        Masquer
                      </button>
                    </div>
                    <div className="conversation-safety-details">
                    <div className="conversation-safety-section">
                      <h3>Repérer un comportement suspect</h3>
                      <ul>
                        <li>Demande d'argent urgente ou pression pour décider vite.</li>
                        <li>Refus de fournir des infos claires ou incohérences dans le récit.</li>
                      </ul>
                    </div>
                    <div className="conversation-safety-section">
                      <h3>Préparer une rencontre en toute sécurité</h3>
                      <ul>
                        <li>Préférez un lieu public et informez un proche.</li>
                        <li>Clarifiez les attentes, le cadre, le lieu et l'horaire.</li>
                        <li>Faites un appel téléphonique ou vidéo avant la rencontre.</li>
                      </ul>
                    </div>
                    <div className="conversation-safety-section">
                      <h3>Vérifications et justificatifs</h3>
                      <ul>
                        <li>Vous pouvez demander les informations nécessaires pour mieux vous comprendre.</li>
                        <li>Demandez des preuves concrètes et cohérentes (détails, contexte).</li>
                        <li>Pour vous rassurer : appel téléphonique, appel vidéo ou visio.</li>
                      </ul>
                    </div>
                    <div className="conversation-safety-section">
                      <h3>Contrat et traçabilité</h3>
                      <ul>
                        <li>Un contrat peut aider à formaliser l'accord et garder une trace.</li>
                        <li>Privilégiez les échanges et paiements dans l'application pour garder des preuves.</li>
                      </ul>
                    </div>
                    <div className="conversation-safety-section">
                      <h3>Moyens de paiement</h3>
                      <ul>
                        <li>Privilégiez les paiements sécurisés et vérifiables.</li>
                      </ul>
                    </div>
                    <div className="conversation-safety-section">
                      <h3>Documents sensibles</h3>
                      <ul>
                        <li>Pour une pièce d'identité, masquez les informations non nécessaires et ajoutez un filigrane (ex: “Uniquement pour vérification Ollync + date”).</li>
                        <li>Si vous partagez un document (RIB ou autre justificatif), transmettez uniquement ce qui est strictement nécessaire.</li>
                        <li>Évitez d'envoyer des codes, mots de passe, photo de carte bancaire ou données complètes non indispensables.</li>
                      </ul>
                    </div>
                    <div className="conversation-safety-section">
                      <h3>Vérifier une annonce face aux techniques d'IA</h3>
                      <ul>
                        <li>Incohérences dans les images, les dates ou les détails.</li>
                        <li>Descriptions trop vagues, copiées, ou réponses automatiques.</li>
                        <li>Refus de fournir des preuves supplémentaires ou un échange clair.</li>
                      </ul>
                    </div>
                    <div className="conversation-safety-section">
                      <h3>Outils de sécurité disponibles</h3>
                      <ul>
                        <li>Vous pouvez signaler un profil ou bloquer un utilisateur à tout moment.</li>
                        <li>En cas de doute, arrêtez la discussion et utilisez les outils de signalement.</li>
                      </ul>
                    </div>
                    <div className="conversation-safety-section">
                      <h3>Numéros utiles (France)</h3>
                      <ul>
                        <li>Urgences : 112 (Europe) ou 17 (Police).</li>
                        <li>SMS/relai pour personnes sourdes ou malentendantes : 114.</li>
                        <li>Violences femmes : 3919 (écoute, information).</li>
                        <li>Aide aux victimes : 116 006.</li>
                      </ul>
                    </div>
                  </div>
                    <button
                      type="button"
                      className="conversation-safety-toggle conversation-safety-toggle-secondary conversation-safety-masquer-bottom"
                      onClick={() => setShowScamPrevention(false)}
                    >
                      Masquer
                    </button>
                  </>
                )}
                </div>
              )}
              {isGroupConversation && (
                <div className="group-intro-wrapper">
                  <div className="group-intro-card">
                    <button
                      type="button"
                      className="group-intro-header"
                      onClick={() => {
                        const currentId = selectedConversation?.id || conversationId
                        if (currentId) {
                          navigate(`/messages/${currentId}/info`)
                        }
                      }}
                    >
                      <div className="group-intro-avatar">
                        <img
                          src={
                            (selectedConversation?.group_photo_url || '').trim()
                              ? selectedConversation?.group_photo_url || ''
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`
                          }
                          alt={displayName}
                          onError={(event) => {
                            const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`
                            ;(event.target as HTMLImageElement).src = fallback
                          }}
                        />
                      </div>
                      <div className="group-intro-text">
                        <p className="group-intro-title">{displayName || 'Groupe'}</p>
                      </div>
                    </button>
                    <p className="group-intro-meta">
                      Groupe créé le {groupCreatedAtLabel} par {groupCreatorName}.
                    </p>
                    <button
                      type="button"
                      className="group-intro-more"
                      onClick={() => {
                        const currentId = selectedConversation?.id || conversationId
                        if (currentId) {
                          navigate(`/messages/${currentId}/info`)
                        }
                      }}
                    >
                      En savoir plus
                    </button>
                  </div>
                </div>
              )}
              {groupedMessages.map((group, groupIndex) => (
                <div key={groupIndex} className="conversation-messages-group">
                  <div className="conversation-date-separator">
                    <span className="conversation-date-separator-line" aria-hidden="true" />
                    <span className="conversation-date-separator-text">
                      {formatDateSeparator(group.messages[0].created_at)}
                    </span>
                    <span className="conversation-date-separator-line" aria-hidden="true" />
                  </div>
                  {group.messages.map((msg, msgIndex) => {
                    const acceptedMatchId =
                      msg.message_type === 'match_accepted' && msg.id.startsWith('match-accepted-')
                        ? msg.id.replace('match-accepted-', '')
                        : null
                    const acceptedMatchForMessage = acceptedMatchId
                      ? acceptedMatchesForConversation.find((request) => request.id === acceptedMatchId)
                      : null

                    const groupEvent = (msg.calendar_request_data as { kind?: string; event_type?: string; members?: Array<{ user_id: string; name: string }> } | null)?.kind === 'group_event'
                      ? (msg.calendar_request_data as { kind: string; event_type: string; members?: Array<{ user_id: string; name: string }> })
                      : null

                    if (groupEvent) {
                      const isLastMessage = msg.id === lastDisplayMessageId
                      const eventText = msg.content || (groupEvent.members?.length
                        ? `${(groupEvent.members as Array<{ name: string }>).map((m) => m.name).join(', ')} ${
                            groupEvent.event_type === 'member_added'
                              ? ((groupEvent.members?.length ?? 0) === 1 ? 'a été ajouté au groupe' : 'ont été ajoutés au groupe')
                              : groupEvent.event_type === 'member_removed'
                                ? 'a été retiré du groupe'
                                : 'a quitté le groupe'
                          }`
                        : '')
                      return (
                        <div key={msg.id} ref={isLastMessage ? lastMessageRef : null} className="conversation-date-separator">
                          <span className="conversation-date-separator-line" aria-hidden="true" />
                          <span className="conversation-date-separator-text">{eventText}</span>
                          <span className="conversation-date-separator-line" aria-hidden="true" />
                        </div>
                      )
                    }

                    if (msg.message_type === 'match_accepted' && acceptedMatchForMessage?.related_post_id) {
                      const isLastMessage = msg.id === lastDisplayMessageId
                      const postRemoved = !acceptedMatchForMessage.related_post || acceptedMatchForMessage.related_post.status !== 'active'
                      const linkLabel = postRemoved ? 'Annonce supprimée' : (acceptedMatchForMessage.related_post?.title || 'Voir l\'annonce')

                      return (
                        <div key={msg.id} ref={isLastMessage ? lastMessageRef : null}>
                          <div className="conversation-match-message">
                            <div className="conversation-match-bubble">
                              <div className="conversation-match-label">Annonce acceptée</div>
                              <button
                                type="button"
                                className="conversation-match-link-inline"
                                onClick={() => navigate(`/post/${acceptedMatchForMessage.related_post_id}`)}
                              >
                                {linkLabel}
                              </button>
                              {postRemoved && (
                                <div className="conversation-match-removed-hint">Cette annonce a été supprimée.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    }

                    const isOwn = msg.sender_id === user?.id
                    const prevMsg = msgIndex > 0 ? group.messages[msgIndex - 1] : null
                    const showAvatar = !isOwn && (!prevMsg || prevMsg.sender_id !== msg.sender_id || 
                      new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300000) // 5 minutes
                    const isLastMessage = msg.id === lastDisplayMessageId

                    return (
                      <div
                        key={msg.id}
                        className={`message-swipe-row ${isOwn ? 'own' : 'other'}`}
                        ref={isLastMessage ? lastMessageRef : null}
                      >
                        <div
                          className="message-swipe-content"
                          onContextMenu={(event) => {
                            event.preventDefault()
                            setActiveMessage(msg)
                            setShowMessageActions(true)
                          }}
                          onTouchStart={(event) => {
                            const touch = event.touches[0]
                            messageTouchRef.current = { id: msg.id, startX: touch.clientX, startY: touch.clientY }
                            longPressTimerRef.current = window.setTimeout(() => {
                              setActiveMessage(msg)
                              setShowMessageActions(true)
                            }, 500)
                          }}
                          onTouchMove={(event) => {
                            const touch = event.touches[0]
                            const start = messageTouchRef.current
                            if (!start) return
                            const deltaX = touch.clientX - start.startX
                            const deltaY = touch.clientY - start.startY
                            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                              if (longPressTimerRef.current) {
                                window.clearTimeout(longPressTimerRef.current)
                                longPressTimerRef.current = null
                              }
                            }
                          }}
                          onTouchEnd={() => {
                            if (longPressTimerRef.current) {
                              window.clearTimeout(longPressTimerRef.current)
                              longPressTimerRef.current = null
                            }
                          }}
                        >
                          <MessageBubble
                            message={msg}
                            isOwn={isOwn}
                            showAvatar={showAvatar}
                            systemSenderEmail={SYSTEM_SENDER_EMAIL}
                            onDelete={async () => {
                              if (user && isOwn) {
                                await handleDeleteMessage(msg, false)
                              }
                            }}
                            onLike={async () => {
                              if (user) {
                                const { data: existingLike } = await supabase
                                  .from('message_likes')
                                  .select('id')
                                  .eq('message_id', msg.id)
                                  .eq('user_id', user.id)
                                  .maybeSingle()

                                if (existingLike) {
                                  await supabase
                                    .from('message_likes')
                                    .delete()
                                    .eq('id', (existingLike as { id: string }).id)
                                } else {
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  await (supabase.from('message_likes') as any)
                                    .insert({ message_id: msg.id, user_id: user.id })
                                }
                              }
                            }}
                            onReport={async () => {
                              if (user && !isOwn) {
                                const reason = prompt('Raison du signalement:')
                                if (reason) {
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  await (supabase.from('message_reports') as any)
                                    .insert({
                                      message_id: msg.id,
                                      reporter_id: user.id,
                                      reason
                                    })
                                  alert('Message signalé. Merci pour votre retour.')
                                }
                              }
                            }}
                            groupParticipants={isGroupConversation ? infoParticipants : undefined}
                            isGroupConversation={isGroupConversation}
                            currentUserGroupRole={
                              isGroupConversation && user
                                ? (infoParticipants.find((p) => p.user_id === user.id)?.role ?? null)
                                : null
                            }
                            onMentionClick={
                              isGroupConversation
                                ? (participant) => {
                                    const full = infoParticipants.find((p) => p.user_id === participant.user_id)
                                    if (full) {
                                      setSelectedParticipant(full)
                                      setShowMemberBottomSheet(true)
                                    }
                                  }
                                : undefined
                            }
                          />
                          {messageReactions[msg.id]?.length ? (
                            <div className={`message-reaction-row ${isOwn ? 'own' : 'other'}`}>
                              {messageReactions[msg.id].map((reaction) => (
                                <span key={reaction.emoji} className="message-reaction-chip">
                                  <span className="message-reaction-emoji">{reaction.emoji}</span>
                                  <span className="message-reaction-count">{reaction.count}</span>
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
              <div ref={bottomAnchorRef} className="conversation-bottom-anchor" />
            </div>
          )}
        </div>
        {showMessageActions && activeMessage && (
          <div
            className="message-actions-overlay"
            onClick={() => setShowMessageActions(false)}
          >
            <div
              className="message-actions-menu message-actions-card"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="message-actions-reactions">
                {reactionEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="message-reaction-btn"
                    onClick={async () => {
                      await handleAddReaction(activeMessage, emoji)
                      setShowMessageActions(false)
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                className="message-action-item"
                type="button"
                onClick={() => {
                  handleCopyMessage(activeMessage)
                  setShowMessageActions(false)
                }}
                disabled={!canCopyMessage}
              >
                <Copy size={18} />
                Copier
              </button>
              <button
                className="message-action-item"
                type="button"
                onClick={async () => {
                  setShowMessageActions(false)
                  setShowForwardMessage(true)
                  setForwardMessage(activeMessage)
                  await loadSelectableUsers()
                }}
              >
                <Send size={18} />
                Transférer
              </button>
              <button
                className="message-action-item danger"
                type="button"
                onClick={() => {
                  setShowMessageActions(false)
                  setShowDeleteMessageConfirm(true)
                }}
              >
                <Trash2 size={18} />
                Supprimer
              </button>
              <button
                className="message-actions-close"
                type="button"
                onClick={() => setShowMessageActions(false)}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
          </div>
        )}
        {showDeleteMessageConfirm && activeMessage && (
          <ConfirmationModal
            visible={showDeleteMessageConfirm}
            title="Supprimer le message"
            message="Supprimer pour vous uniquement ?"
            compact
            onConfirm={() => handleDeleteMessage(activeMessage, false)}
            onCancel={() => setShowDeleteMessageConfirm(false)}
            confirmLabel="Supprimer"
            cancelLabel="Annuler"
            isDestructive={true}
          />
        )}
        <SelectUsersModal
          visible={showForwardMessage}
          title="Transférer le message"
          users={selectableUsers}
          loading={selectableUsersLoading}
          emptyText="Aucun utilisateur disponible"
          onClose={() => {
            setShowForwardMessage(false)
            setForwardMessage(null)
          }}
          onSelectUser={async (selectedUser) => {
            const selectedUserEmail = (selectedUser as { email?: string | null }).email
            if (isSystemUserEmail(selectedUserEmail)) {
              alert('Vous ne pouvez pas transférer de message vers le compte Ollync.')
              return
            }
            if (forwardMessage) {
              await handleForwardMessage(selectedUser, forwardMessage)
            }
            setShowForwardMessage(false)
            setForwardMessage(null)
          }}
        />
        {user && (selectedConversation || conversationId) && (
          <div className="conversation-input-container" ref={inputContainerRef}>
            {isSystemConversation && (
              <div className="system-conversation-banner">
                Conversation d&apos;information Ollync. Vous pouvez uniquement lire ces messages.
              </div>
            )}
            <MessageInput
              conversationId={selectedConversation?.id || conversationId || ''}
              senderId={user.id}
              openCalendarOnMount={openAppointment}
              counterpartyId={!isGroupConversation ? (selectedConversation?.other_user?.id || null) : null}
              groupMembers={isGroupConversation ? infoParticipants : undefined}
              disabled={isSystemConversation}
              onMessageSent={async () => {
                const currentId = selectedConversation?.id || conversationId
                if (!currentId) return
                shouldScrollToBottomRef.current = true
                await loadMessages(currentId)
                scheduleScrollToBottom('center')
                loadConversations()
              }}
            />
          </div>
        )}
      </div>
    )
  }

  // Vue liste des conversations
  return (
    <>
      <PageMeta title={t('common:meta.messages.title')} description={t('common:meta.messages.description')} />
      <div className="messages-page-container" ref={containerRef}>
      {/* Header */}
      <div className="messages-header" ref={headerRef}>
        <div className="messages-header-title-row">
          <BackButton />
          <h1 className="messages-title">Messages</h1>
          <div className="messages-header-actions">
            <button
              className="messages-create-group-btn"
              onClick={() => setShowCreateActionModal(true)}
              title="Créer"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="messages-search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder={t('messages:searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="messages-search-input"
          />
        </div>

        {/* Filtres rapides */}
        <div className="messages-filters">
          <button
            className={`messages-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Tous
            {unreadCommunicationCounts.message > 0 && (
              <span className="messages-filter-badge">
                {unreadCommunicationCounts.message > 99 ? '99+' : unreadCommunicationCounts.message}
              </span>
            )}
          </button>
          <button
            className={`messages-filter-btn ${activeFilter === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveFilter('matches')}
          >
            Matchs
            {matchsBadgeCount > 0 && (
              <span className="messages-filter-badge">
                {matchsBadgeCount > 99 ? '99+' : matchsBadgeCount}
              </span>
            )}
          </button>
          <button
            className={`messages-filter-btn ${activeFilter === 'match_requests' ? 'active' : ''}`}
            onClick={() => setActiveFilter('match_requests')}
          >
            Demandes
            {demandesBadgeCount > 0 && (
              <span className="messages-filter-badge">
                {demandesBadgeCount > 99 ? '99+' : demandesBadgeCount}
              </span>
            )}
          </button>
          <button
            className={`messages-filter-btn ${activeFilter === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveFilter('groups')}
          >
            <Users size={16} />
            Groupes
          </button>
          <button
            className={`messages-filter-btn ${activeFilter === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveFilter('appointments')}
          >
            <Calendar size={16} />
            Rendez-vous
            {appointments.length > 0 && (
              <span className="messages-filter-badge">
                {appointments.length > 99 ? '99+' : appointments.length}
              </span>
            )}
          </button>
          <button
            className={`messages-filter-btn ${activeFilter === 'archived' ? 'active' : ''}`}
            onClick={() => setActiveFilter('archived')}
          >
            <Archive size={16} />
            Archivés
          </button>
        </div>
      </div>

      <div className="messages-content">
        {missingNotice && (
          <div className="messages-missing-banner">
            {missingNotice}
          </div>
        )}
        {loading ? (
          <div className="loading-container">
            <Loader className="spinner-large" size={48} />
            <p>Chargement...</p>
          </div>
        ) : activeFilter === 'match_requests' ? (
          // Afficher les match_requests pour l'onglet "Demandes"
          filteredMatchRequests.length === 0 ? (
            <EmptyState
              type="requests"
              customTitle="Les vraies collaborations commencent par un message."
              customSubtext="Envoie une demande et démarre la conversation."
              actionLabel="Voir les annonces récentes"
              onAction={() => navigate('/recent')}
              marketing
              marketingTone="blue"
            />
          ) : (
            <div className="conversations-list conversations-list--compact">
              {filteredMatchRequests.map((request) => {
                const isUnseen =
                  request.request_type === 'sent'
                    ? !request.opened_by_sender_at
                    : !request.opened_by_recipient_at
                return (
                <div
                  key={request.id}
                  className={`conversation-item ${isUnseen ? 'conversation-item--unseen' : ''}`}
                  onClick={async () => {
                    const openedAt = await markRequestAsOpenedByCurrentUser(request)
                    if (openedAt) {
                      const isSender = user ? request.from_user_id === user.id : false
                      setSelectedMatchRequest({
                        ...request,
                        ...(isSender
                          ? { opened_by_sender_at: openedAt }
                          : { opened_by_recipient_at: openedAt })
                      })
                      return
                    }
                    setSelectedMatchRequest(request)
                  }}
                >
                  <div className="conversation-avatar-wrapper">
                    <img
                      src={request.other_user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.other_user?.full_name || request.other_user?.username || 'User')}`}
                      alt={request.other_user?.full_name || request.other_user?.username || 'User'}
                      className="conversation-avatar"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.other_user?.full_name || request.other_user?.username || 'User')}`
                      }}
                    />
                  </div>

                  <div className="conversation-info">
                    <div className="conversation-item-header">
                      <h3 className="conversation-name">
                        {request.other_user?.full_name || request.other_user?.username || 'Utilisateur'}
                      </h3>
                      <span className="conversation-time">
                        {formatTime(request.created_at)}
                      </span>
                    </div>
                    {(request.related_post_id || request.related_post) && (
                      <>
                        <p className="conversation-post-title">
                          {request.related_post && request.related_post.status === 'active'
                            ? request.related_post.title
                            : 'Annonce supprimée'}
                        </p>
                        {(!request.related_post || request.related_post.status !== 'active') && (
                          <p className="conversation-post-removed-hint">Cette annonce a été supprimée.</p>
                        )}
                      </>
                    )}
                    {request.request_role && (
                      <p className="conversation-post-role">
                        Poste : {request.request_role}
                      </p>
                    )}
                    {!request.related_post && !request.related_post_id && request.related_service_name && (
                      <p className="conversation-post-title">
                        Service : {request.related_service_name}
                      </p>
                    )}
                    <div className="conversation-footer">
                      <span className={`conversation-badge ${request.from_user_id === user?.id ? 'sent' : 'received'}`}>
                        {request.from_user_id === user?.id ? 'Envoyée' : 'Reçue'}
                      </span>
                      <span className="conversation-status-text">
                        {request.status === 'pending' && 'En attente'}
                        {request.status === 'accepted' && 'Acceptée'}
                      </span>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )
        ) : activeFilter === 'matches' ? (
          // Afficher les match_requests acceptées pour l'onglet "Match"
          filteredMatches.length === 0 ? (
            <EmptyState
              type="matches"
              customTitle="Les vraies collaborations commencent par un message."
              customSubtext="Envoie une demande et démarre la conversation."
              actionLabel="Voir les annonces récentes"
              onAction={() => navigate('/recent')}
              marketing
              marketingTone="blue"
            />
          ) : (
            <div className="conversations-list conversations-list--compact">
              {filteredMatches.map((request) => {
                const isUnseen =
                  request.request_type === 'sent'
                    ? !request.opened_by_sender_at
                    : !request.opened_by_recipient_at
                return (
                <div
                  key={request.id}
                  className={`conversation-item ${isUnseen ? 'conversation-item--unseen' : ''}`}
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    await markRequestAsOpenedByCurrentUser(request)
                    
                    // Pour les match_requests acceptées, créer ou ouvrir la conversation
                    if (!user) return
                    
                    try {
                      const otherUserId = request.from_user_id === user.id ? request.to_user_id : request.from_user_id
                      
                      // Si une conversation existe déjà, l'ouvrir
                      if (request.conversation_id) {
                        navigate(`/messages/${request.conversation_id}`)
                        return
                      }
                      
                      // Sinon, créer ou trouver une conversation existante
                      const conversation = await findOrCreateConversation(otherUserId, request.related_post_id || undefined)
                      
                      if (conversation && (conversation as { id: string }).id) {
                        // Mettre à jour la match_request avec l'ID de conversation
                        await supabase
                          .from('match_requests')
                          .update({ conversation_id: (conversation as { id: string }).id } as never)
                          .eq('id', request.id)
                        
                        // Recharger les données
                        await loadMatchRequests().then((requests) => {
                          setMatchRequests(requests)
                        })
                        loadConversations()
                        
                        // Naviguer vers la conversation
                        navigate(`/messages/${(conversation as { id: string }).id}`)
                      } else {
                        alert('Erreur lors de la création de la conversation')
                      }
                    } catch (error) {
                      console.error('Error opening conversation from match:', error)
                      alert('Erreur lors de l\'ouverture de la conversation')
                    }
                  }}
                >
                  <div className="conversation-avatar-wrapper">
                    <img
                      src={request.other_user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.other_user?.full_name || request.other_user?.username || 'User')}`}
                      alt={request.other_user?.full_name || request.other_user?.username || 'User'}
                      className="conversation-avatar"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.other_user?.full_name || request.other_user?.username || 'User')}`
                      }}
                    />
                  </div>

                  <div className="conversation-info">
                    <div className="conversation-item-header">
                      <h3 className="conversation-name">
                        {request.other_user?.full_name || request.other_user?.username || 'Utilisateur'}
                      </h3>
                      <span className="conversation-time">
                        {formatTime(request.accepted_at || request.created_at)}
                      </span>
                    </div>
                    {(request.related_post_id || request.related_post) && (
                      <>
                        <p className="conversation-post-title">
                          {request.related_post && request.related_post.status === 'active'
                            ? request.related_post.title
                            : 'Annonce supprimée'}
                        </p>
                        {(!request.related_post || request.related_post.status !== 'active') && (
                          <p className="conversation-post-removed-hint">Cette annonce a été supprimée.</p>
                        )}
                      </>
                    )}
                    {!request.related_post && !request.related_post_id && request.related_service_name && (
                      <p className="conversation-post-title">
                        Service : {request.related_service_name}
                      </p>
                    )}
                    <p className="conversation-preview">
                      Match accepté - Cliquez pour démarrer la conversation
                    </p>
                  </div>
                </div>
              )})}
            </div>
          )
        ) : activeFilter === 'appointments' ? (
          sortedAppointments.length === 0 ? (
            <EmptyState
              type="messages"
              customTitle="Aucun rendez-vous"
              customSubtext="Vos rendez-vous apparaîtront ici."
            />
          ) : (
            <div className="conversations-list">
              {sortedAppointments.map((appointment) => {
                const isCancelled = appointment.status === 'cancelled'
                const isPastAppointment = new Date(appointment.appointment_datetime).getTime() < Date.now()
                const statusKind = isCancelled ? 'cancelled' : isPastAppointment ? 'past' : 'upcoming'
                const statusLabel = isCancelled ? 'Annulé' : isPastAppointment ? 'Passé' : 'À venir'
                const isModified = !!appointment.updated_at && !!appointment.created_at &&
                  (new Date(appointment.updated_at).getTime() - new Date(appointment.created_at).getTime() > 2000)
                return (
                <div
                  key={appointment.id}
                  className={`conversation-item appointment-item appointment-item--${statusKind}`}
                  onClick={() => setSelectedAppointmentPreview(appointment)}
                >
                  <div className="conversation-avatar-wrapper">
                    <img
                      src={appointment.other_user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.other_user?.full_name || appointment.other_user?.username || 'User')}`}
                      alt={appointment.other_user?.full_name || appointment.other_user?.username || 'User'}
                      className="conversation-avatar"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.other_user?.full_name || appointment.other_user?.username || 'User')}`
                      }}
                    />
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-item-header">
                      <h3 className="conversation-name">{appointment.title}</h3>
                      <span className="conversation-time">
                        {formatAppointmentDate(appointment.appointment_datetime)}
                      </span>
                    </div>
                    <div className="appointment-user-row">
                      <p className="appointment-user-name">
                        {appointment.other_user?.full_name || appointment.other_user?.username || 'Utilisateur'}
                      </p>
                      <div className="appointment-badges">
                        <span
                          className={`appointment-status-badge appointment-status-badge--${statusKind}`}
                          aria-label={isCancelled ? 'Rendez-vous annulé' : isPastAppointment ? 'Rendez-vous passé' : 'Rendez-vous à venir'}
                        >
                          {statusLabel}
                        </span>
                        {isModified && !isCancelled && (
                          <span
                            className="appointment-status-badge appointment-status-badge--modified"
                            aria-label="Rendez-vous modifié"
                          >
                            Mise à jour
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )
        ) : filteredConversations.length === 0 ? (
          <EmptyState 
            type={
              searchQuery ? 'category' : 
              activeFilter === 'archived' ? 'archived' :
              'messages'
            }
            customTitle={
              searchQuery
                ? 'Aucun résultat'
                : activeFilter === 'archived'
                  ? undefined
                  : 'Les vraies collaborations commencent par un message.'
            }
            customSubtext={
              searchQuery
                ? 'Aucune conversation ne correspond à votre recherche.'
                : activeFilter === 'archived'
                  ? undefined
                  : 'Envoie une demande et démarre la conversation.'
            }
            actionLabel={!searchQuery && activeFilter !== 'archived' ? 'Voir les annonces récentes' : undefined}
            onAction={!searchQuery && activeFilter !== 'archived' ? () => navigate('/recent') : undefined}
            marketing={!searchQuery && activeFilter !== 'archived'}
            marketingTone="blue"
          />
        ) : (
          <div className="conversations-list">
            {filteredConversations.map((conv) => {
              const isSystemConv = (conv.other_user?.email || '').toLowerCase() === SYSTEM_SENDER_EMAIL
              const isGroupConv = !!conv.is_group
              const groupName = (conv.group_name || conv.name || '').trim()
              const alias = (conversationAliases[conv.id] || '').trim()
              const displayName = isGroupConv
                ? (groupName || 'Groupe')
                : (alias || (conv.other_user?.full_name || conv.other_user?.username || 'Utilisateur'))
              const avatarUrl = isGroupConv
                ? (conv.group_photo_url || '')
                : (conv.other_user?.avatar_url || '')
              const avatarFallback = isGroupConv
                ? (groupName || 'Groupe')
                : (conv.other_user?.full_name || conv.other_user?.username || 'User')
              const preview = getConversationPreview(conv, matchRequests)
              return (
                <div key={conv.id}>
                  <div
                    className="conversation-item"
                    onClick={() => {
                      navigate(`/messages/${conv.id}`)
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      if (isSystemConv) return
                      setListActionConversation(conv)
                      setShowListConversationActions(true)
                    }}
                    onTouchStart={(event) => {
                      if (isSystemConv) return
                      const touch = event.touches[0]
                      conversationTouchRef.current = { id: conv.id, startX: touch.clientX, startY: touch.clientY }
                      longPressTimerRef.current = window.setTimeout(() => {
                      setListActionConversation(conv)
                      setShowListConversationActions(true)
                      }, 500)
                    }}
                    onTouchMove={(event) => {
                      if (isSystemConv) return
                      const touch = event.touches[0]
                      const start = conversationTouchRef.current
                      if (!start) return
                      const deltaX = touch.clientX - start.startX
                      const deltaY = touch.clientY - start.startY
                      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                        if (longPressTimerRef.current) {
                          window.clearTimeout(longPressTimerRef.current)
                          longPressTimerRef.current = null
                        }
                      }
                    }}
                    onTouchEnd={() => {
                      if (longPressTimerRef.current) {
                        window.clearTimeout(longPressTimerRef.current)
                        longPressTimerRef.current = null
                      }
                    }}
                  >
                    <div className="conversation-avatar-wrapper">
                      {isSystemConv ? (
                        <div className="conversation-avatar conversation-avatar-system">
                          <Logo className="conversation-avatar-logo" width={36} height={18} />
                        </div>
                      ) : (
                        <img
                          src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarFallback)}`}
                          alt={avatarFallback}
                          className="conversation-avatar"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarFallback)}`
                          }}
                        />
                      )}
                      {(() => {
                        const unreadCount = conv.unread ?? 0
                        return unreadCount > 0 ? (
                        <div className="conversation-unread-badge">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                        ) : null
                      })()}
                    </div>

                    <div className="conversation-info">
                      <div className="conversation-item-header">
                        <h3 className="conversation-name">
                          {isSystemConv ? SYSTEM_SENDER_NAME : displayName}
                        </h3>
                        <span className="conversation-time">
                          {formatTime(conv.lastMessage?.created_at || conv.last_message_at)}
                        </span>
                      </div>

                      {preview && (
                        <p className={`conversation-preview ${(conv.unread ?? 0) > 0 ? 'unread' : ''}`}>
                          {preview}
                        </p>
                      )}

                      {conv.is_pinned && (
                        <div className="conversation-pin-indicator">
                          <Pin size={14} />
                          Épinglé
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {showListConversationActions && listActionConversation && (
        <div
          className="conversation-actions-overlay"
          onClick={() => {
            setShowListConversationActions(false)
            setListActionConversation(null)
          }}
        >
          <div
            className="conversation-actions-menu"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="conversation-actions-title">Options</h3>
            <button
              className="conversation-action-item"
              type="button"
              onClick={async () => {
                await handlePinConversation(listActionConversation)
                setShowListConversationActions(false)
                setListActionConversation(null)
              }}
            >
              {listActionConversation.is_pinned ? 'Retirer le pin' : 'Épingler'}
            </button>
            <button
              className="conversation-action-item"
              type="button"
              onClick={async () => {
                const shouldArchive = !listActionConversation.is_archived
                await handleArchiveConversation(listActionConversation, shouldArchive)
                setShowListConversationActions(false)
                setListActionConversation(null)
              }}
            >
              {listActionConversation.is_archived ? 'Désarchiver' : 'Archiver'}
            </button>
            <button
              className="conversation-action-item danger"
              type="button"
              onClick={() => {
                setShowListConversationActions(false)
                setShowDeleteConfirm(true)
              }}
            >
              Supprimer
            </button>
            <button
              className="conversation-action-item cancel"
              type="button"
              onClick={() => {
                setShowListConversationActions(false)
                setListActionConversation(null)
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      {showDeleteConfirm && listActionConversation && (
        <ConfirmationModal
          visible={showDeleteConfirm}
          title="Supprimer la conversation"
          message="Voulez-vous vraiment supprimer cette conversation ?"
          compact
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            await handleDeleteConversationForUser(listActionConversation.id)
            setShowDeleteConfirm(false)
            setListActionConversation(null)
          }}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          isDestructive={true}
        />
      )}
      <CreateGroupModal
        visible={showCreateGroup}
        participants={selectedGroupUsers}
        onClose={() => {
          setShowCreateGroup(false)
          setSelectedGroupUsers([])
        }}
        onSuccess={() => {
          loadConversations()
          setSelectedGroupUsers([])
        }}
      />
      <CreateMessageActionModal
        visible={showCreateActionModal}
        onClose={() => setShowCreateActionModal(false)}
        onCreateGroup={async () => {
          setShowCreateActionModal(false)
          setShowSelectGroupUsers(true)
          await loadSelectableUsers()
        }}
        onCreateAppointment={async () => {
          setShowCreateActionModal(false)
          setShowSelectAppointmentUser(true)
          await loadSelectableUsers()
        }}
      />
      <SelectUsersModal
        visible={showSelectGroupUsers}
        title="Choisir les participants"
        users={selectableUsers}
        loading={selectableUsersLoading}
        multiple
        confirmLabel="Continuer"
        emptyText="Aucun utilisateur disponible pour un groupe"
        onClose={() => setShowSelectGroupUsers(false)}
        onConfirm={(users) => {
          const filteredUsers = users.filter((selectedUser) =>
            !isSystemUserEmail((selectedUser as { email?: string | null }).email)
          )
          if (filteredUsers.length === 0) {
            alert('Le compte Ollync ne peut pas être ajouté à un groupe.')
            return
          }
          setSelectedGroupUsers(filteredUsers)
          setShowSelectGroupUsers(false)
          setShowCreateGroup(true)
        }}
      />
      <SelectUsersModal
        visible={showSelectAppointmentUser}
        title="Choisir un utilisateur"
        users={selectableUsers}
        loading={selectableUsersLoading}
        emptyText="Aucun utilisateur disponible pour un rendez-vous"
        onClose={() => setShowSelectAppointmentUser(false)}
        onSelectUser={async (selectedUser) => {
          if (!user) return
          const selectedUserEmail = (selectedUser as { email?: string | null }).email
          if (isSystemUserEmail(selectedUserEmail)) {
            alert('Le compte Ollync ne peut pas être sélectionné pour un rendez-vous.')
            return
          }
          setShowSelectAppointmentUser(false)
          try {
            const conversation = await findOrCreateConversation(selectedUser.id)
            if (conversation && (conversation as { id: string }).id) {
              navigate(`/messages/${(conversation as { id: string }).id}?openAppointment=1`)
            } else {
              alert('Erreur lors de la création de la conversation')
            }
          } catch (error) {
            console.error('Error opening appointment conversation:', error)
            alert('Erreur lors de l\'ouverture de la conversation')
          }
        }}
      />
      {selectedMatchRequest && user && (
        <MatchRequestDetail
          request={selectedMatchRequest}
          currentUserId={user.id}
          onClose={() => setSelectedMatchRequest(null)}
          onUpdate={() => {
            loadMatchRequests().then((requests) => {
              setMatchRequests(requests)
              loadConversations()
            })
            setSelectedMatchRequest(null)
          }}
          onStartConversation={(conversationId) => {
            navigate(`/messages/${conversationId}`)
            setSelectedMatchRequest(null)
          }}
        />
      )}
      {selectedAppointmentPreview && (
        <div
          className="conversation-modal-overlay"
          onClick={() => setSelectedAppointmentPreview(null)}
        >
          <div
            className="conversation-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="conversation-modal-header">
              <h2>Rendez-vous</h2>
              <button
                className="conversation-modal-close"
                onClick={() => setSelectedAppointmentPreview(null)}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <div className="conversation-modal-body">
              <div className="messages-appointment-preview-card">
                <div className="messages-appointment-preview-title-row">
                  <Calendar size={18} />
                  <h3>{selectedAppointmentPreview.title || 'Rendez-vous'}</h3>
                </div>
                {selectedAppointmentPreview.status === 'cancelled' && (
                  <p className="messages-appointment-preview-cancelled">Rendez-vous annulé</p>
                )}
                {selectedAppointmentPreview.updated_at && selectedAppointmentPreview.created_at &&
                  (new Date(selectedAppointmentPreview.updated_at).getTime() - new Date(selectedAppointmentPreview.created_at).getTime() > 2000) && (
                  <p className="messages-appointment-preview-modified">Mise à jour</p>
                )}
                <p className="messages-appointment-preview-date">
                  {formatAppointmentDate(selectedAppointmentPreview.appointment_datetime)}
                </p>
                <p className="messages-appointment-preview-user">
                  {selectedAppointmentPreview.other_user?.full_name || selectedAppointmentPreview.other_user?.username || 'Utilisateur'}
                </p>
              </div>
              <div className="conversation-modal-actions messages-appointment-preview-actions">
                <button
                  className="conversation-submit-btn messages-appointment-preview-btn"
                  onClick={() => {
                    const conversationId = selectedAppointmentPreview.conversation_id
                    setSelectedAppointmentPreview(null)
                    if (conversationId) {
                      navigate(`/messages/${conversationId}`)
                    }
                  }}
                >
                  Ouvrir la conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
    </>
  )
}

export default Messages
