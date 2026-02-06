import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom'
import { MailOpen, Loader, Search, Users, Archive, Plus, Calendar, Pin, Trash2, Copy, Send, Camera, Film, ChevronRight, Download, Share2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
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
  related_service_name?: string | null
  related_service_description?: string | null
  related_service_payment_type?: 'price' | 'exchange' | null
  related_service_value?: string | null
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  created_at: string
  updated_at?: string | null
  accepted_at?: string | null
  conversation_id?: string | null
  other_user?: {
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
  related_post?: {
    id: string
    title: string
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
  const { t } = useTranslation(['messages'])
  const navigate = useNavigate()
  const location = useLocation()
  const { id: conversationId } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const postId = searchParams.get('post')
  const openAppointment = searchParams.get('openAppointment') === '1'
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([])
  const [selectedMatchRequest, setSelectedMatchRequest] = useState<MatchRequest | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
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
  const [mediaTab, setMediaTab] = useState<'media' | 'links' | 'documents'>('media')
  const [showAddParticipants, setShowAddParticipants] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<ConversationParticipant | null>(null)
  const [showMediaActions, setShowMediaActions] = useState(false)
  const [selectedMediaMessage, setSelectedMediaMessage] = useState<Message | null>(null)
  const [missingNotice, setMissingNotice] = useState<string | null>(null)

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
  const isInfoView = location.pathname.endsWith('/info')
  const isMediaView = location.pathname.endsWith('/media')
  const isAppointmentsView = location.pathname.endsWith('/appointments')
  const isConversationView = Boolean(conversationId || selectedConversation)

  // Lire le paramètre filter depuis l'URL pour activer automatiquement le bon filtre
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam && ['all', 'posts', 'matches', 'match_requests', 'groups', 'appointments', 'archived'].includes(filterParam)) {
      setActiveFilter(filterParam as FilterType)
    }
  }, [searchParams])

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

  // Recharger la conversation quand l'URL change
  useEffect(() => {
    if (user && conversationId && !selectedConversation) {
      loadConversation(conversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user])

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

  const getConversationPreview = (conv: Conversation) => {
    const lastMessage = conv.lastMessage
    if (!lastMessage) return ''
    const isSentByUser = lastMessage.sender_id === user?.id
    const directionLabel = isSentByUser ? 'envoyée' : 'reçue'

    switch (lastMessage.message_type) {
      case 'photo':
        return `Image ${directionLabel}`
      case 'video':
        return `Vidéo ${directionLabel}`
      case 'document':
        return `Document ${directionLabel}`
      case 'location':
        return `Localisation ${directionLabel}`
      case 'price':
        return `Prix proposé ${directionLabel}`
      case 'rate':
        return `Tarif ${directionLabel}`
      case 'calendar_request':
        return `Rendez-vous ${directionLabel}`
      case 'post_share':
        return `Annonce ${directionLabel}`
      default: {
        const text = (lastMessage.content || '').trim()
        if (!text || text === '0') return ''
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
        .select('id, username, full_name, avatar_url, email, last_activity_at')
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
          })
        } : null,
        postTitle
      } as Conversation)

      setMissingNotice(null)
      await loadMessages(convId)
    } catch (error) {
      console.error('Error loading conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (convId: string) => {
    if (!user) return

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

        const senderIds = [...new Set(visibleMessages.map((msg) => msg.sender_id).filter(Boolean))]
        
        const { data: senders, error: sendersError } = senderIds.length > 0 ? await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, email')
          .in('id', senderIds) : { data: [], error: null }

        if (sendersError) {
          console.error('Error loading senders:', sendersError)
        }

        const sendersMap = new Map((senders as Array<{ id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null; email?: string | null }> || []).map((s) => [s.id, s]))

        const formattedMessages: Message[] = visibleMessages.map((msg) => ({
          ...msg,
          sender: sendersMap.get(msg.sender_id) || null
        }))

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
        setMessages([])
      }
    } finally {
      setMessagesLoading(false)
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
        const { data, error } = await supabase
          .from('conversation_participants')
          .select('user_id, is_active, role, profiles:user_id (id, username, full_name, avatar_url)')
          .eq('conversation_id', selectedConversation.id)
          .order('joined_at', { ascending: true })

        if (error) throw error

        const normalized = (data || []).filter((row) => {
          const typedRow = row as { is_active?: boolean | null }
          return typedRow.is_active !== false
        }).map((row) => {
          const typedRow = row as {
            user_id: string
            is_active?: boolean | null
            role?: string | null
            profiles?: {
              id: string
              username?: string | null
              full_name?: string | null
              avatar_url?: string | null
            } | null
          }
          return {
            user_id: typedRow.user_id,
            is_active: typedRow.is_active ?? true,
            role: typedRow.role ?? null,
            profile: typedRow.profiles ?? null
          }
        })

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

      // Charger les posts liés
      const { data: posts } = postIds.length > 0 ? await supabase
        .from('posts')
        .select('id, title')
        .in('id', [...new Set(postIds)]) : { data: [] }

      const usersMap = new Map((users || []).map((u: { id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null }) => [u.id, u]))
      const postsMap = new Map((posts || []).map((p: { id: string; title: string }) => [p.id, p]))

      // Formater les demandes avec les informations complémentaires
      const requestsWithData = requestsData.map((req: { 
        id: string
        from_user_id: string
        to_user_id: string
        related_post_id?: string | null
        request_message?: string | null
        related_service_name?: string | null
        related_service_description?: string | null
        related_service_payment_type?: 'price' | 'exchange' | null
        related_service_value?: string | null
        status: string
        created_at: string
        updated_at?: string | null
        accepted_at?: string | null
        conversation_id?: string | null
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
          related_service_name: req.related_service_name || null,
          related_service_description: req.related_service_description || null,
          related_service_payment_type: req.related_service_payment_type || null,
          related_service_value: req.related_service_value || null,
          status: req.status as 'pending' | 'accepted' | 'declined' | 'cancelled',
          created_at: req.created_at,
          updated_at: req.updated_at,
          accepted_at: req.accepted_at,
          conversation_id: req.conversation_id,
          other_user: otherUser,
          related_post: relatedPost,
          request_type: requestType
        }
      })

      // Dédupliquer : ne garder qu'une seule demande par annonce
      // Si plusieurs demandes existent pour la même annonce, garder la plus récente
      const uniqueRequests = new Map<string, MatchRequest>()
      
      requestsWithData.forEach((request) => {
        // Clé unique : annonce + utilisateur (pour les demandes envoyées) ou annonce + destinataire (pour les demandes reçues)
        const otherUserKey = request.from_user_id === user.id ? request.to_user_id : request.from_user_id
        const key = request.related_post_id 
          ? `post_${request.related_post_id}_${otherUserKey}`
          : request.related_service_name
            ? `service_${request.related_service_name}_${otherUserKey}`
            : `user_${otherUserKey}`
        
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
        .not('status', 'in', '("declined","cancelled")')
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

      // Charger les match_requests uniquement si nécessaire
      if (activeFilter === 'match_requests' || activeFilter === 'matches') {
        const requestsData = await loadMatchRequests()
        setMatchRequests(requestsData)
      }

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

      if (error) {
        const fallbackResult = await fallbackQuery
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
        convs = fallbackResult.data
        error = fallbackResult.error
      }

      if (error) {
        console.error('Error loading conversations:', error)
        setLoading(false)
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

        // Pour chaque conversation, récupérer le dernier message et compter les non-lus
        const convsWithData = await Promise.all(
          activeConvs.map(async (conv) => {
            const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
            const otherUser = usersMap.get(otherUserId) || null
            const postTitleRaw = conv.post_id ? postsMap.get(conv.post_id) || null : null
            const postTitleTrimmed = postTitleRaw?.trim() || ''
            const postTitle = postTitleTrimmed && postTitleTrimmed !== '0' ? postTitleTrimmed : null

            // Récupérer le dernier message (sans utiliser .single() pour éviter les erreurs)
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

            const lastMsgRow = !lastMsgError
              ? (lastMsgData as Array<{
                  content?: string | null
                  created_at: string
                  sender_id?: string | null
                  message_type?: string | null
                }> | null)?.[0] ?? null
              : null
            const hasMessages = !!lastMsgRow
            const rawContent = lastMsgRow?.content || ''
            const sanitizedContent = rawContent.trim() === '0' ? '' : rawContent

            // Compter les messages non lus (seulement si otherUserId existe)
            let unreadCount = 0
            if (otherUserId && hasMessages) {
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

        setConversations(filteredConvs)
      } else {
        setConversations([])
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      if (!isConversationView) {
        setLoading(false)
      }
    }
  }, [user, activeFilter, loadMatchRequests, loadAppointments, isConversationView])

  const handleReportSubmit = async () => {
    if (!user || !selectedConversation?.other_user?.id || !reportReason) {
      alert('Veuillez sélectionner une raison.')
      return
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('reports') as any)
        .insert({
          reporter_id: user.id,
          reported_user_id: selectedConversation.other_user.id,
          reported_post_id: null,
          report_type: 'profile',
          report_reason: reportReason,
          report_category: 'behavior',
          description: null
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

  // Filtrer les match_requests selon l'onglet actif
  // Dans Messages, l'onglet "Demandes" affiche uniquement les demandes en attente
  const filteredMatchRequests = matchRequests.filter((request) => {
    if (blockedUserIds.includes(request.other_user?.id || '')) {
      return false
    }
    if (activeFilter === 'match_requests') {
      // Demandes : afficher les demandes ENVOYÉES/REÇUES en attente
      return request.status === 'pending'
    }
    return false
  })

  // Filtrer les matches selon l'onglet actif
  // L'onglet "Match" affiche uniquement les matchs ACCEPTÉS (envoyés ou reçus)
  // Les conversations créées à partir de ces matches apparaîtront aussi dans "Tout" si elles ont des messages
  const filteredMatches = matchRequests.filter((request) => {
    if (blockedUserIds.includes(request.other_user?.id || '')) {
      return false
    }
    if (activeFilter === 'matches') {
      // Match : afficher uniquement les match_requests ACCEPTÉES
      return request.status === 'accepted'
    }
    return false
  })

  const filteredConversations = conversations.filter((conv) => {
    if (blockedUserIds.includes(conv.other_user?.id || '')) {
      return false
    }
    // Filtre par recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
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
  })

  const filteredAppointments = appointments.filter((appointment) => {
    if (blockedUserIds.includes(appointment.other_user?.id || '')) {
      return false
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const title = appointment.title?.toLowerCase() || ''
      const name = (appointment.other_user?.full_name || appointment.other_user?.username || '').toLowerCase()
      if (!title.includes(query) && !name.includes(query)) {
        return false
      }
    }
    return true
  })

  if (!user) {
    return (
      <div className="messages-page-container">
        <div className="messages-header-not-connected">
          <h1 className="messages-title-centered">{t('messages:title')}</h1>
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
    const groupedMessages = groupMessagesByDate(messages)
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

    if (isInfoView) {
      const isGroupOwner = !!user && selectedConversation?.group_creator_id === user.id
      const groupPhoto = groupPhotoDraft || selectedConversation?.group_photo_url || ''
      const groupName = groupNameDraft || groupDisplayName || 'Groupe'
      const appointmentMessages = messages.filter((msg) =>
        msg.message_type === 'calendar_request' && msg.calendar_request_data
      )

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
                {isGroupConversation && isGroupOwner && (
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
                      disabled={!isGroupOwner || savingGroup}
                    />
                  </div>
                  <div className="conversation-info-field">
                    <label>Description</label>
                    <textarea
                      value={groupDescriptionDraft}
                      onChange={(event) => setGroupDescriptionDraft(event.target.value)}
                      placeholder="Décrivez votre groupe"
                      disabled={!isGroupOwner || savingGroup}
                      rows={3}
                    />
                  </div>
                  {isGroupOwner && (
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
                    className="conversation-info-save"
                    onClick={() => {
                      if (!selectedConversation?.id) return
                      const trimmed = aliasDraft.trim()
                      const next = { ...conversationAliases, [selectedConversation.id]: trimmed }
                      setConversationAliases(next)
                      localStorage.setItem('messages_aliases', JSON.stringify(next))
                    }}
                  >
                    Enregistrer
                  </button>
                </>
              )}
            </div>

            {isGroupConversation && (
              <div className="conversation-info-card">
                <div className="conversation-info-header-row">
                  <button
                    type="button"
                    className="conversation-info-add"
                    onClick={async () => {
                      if (!isGroupOwner) return
                      setShowAddParticipants(true)
                      await loadSelectableUsers()
                    }}
                    disabled={!isGroupOwner}
                  >
                    <Plus size={16} />
                    Ajouter un membre
                  </button>
                </div>
                {infoLoading ? (
                  <p className="conversation-info-muted">Chargement...</p>
                ) : (
                  <div className="conversation-info-list">
                    {infoParticipants.map((participant) => {
                      const display = participant.profile?.full_name || participant.profile?.username || 'Utilisateur'
                      const isModerator = participant.role === 'moderator'
                      const isCreator = participant.user_id === selectedConversation.group_creator_id
                      return (
                        <button
                          key={participant.user_id}
                          type="button"
                          className="conversation-info-row conversation-info-row-button"
                          onClick={() => setSelectedParticipant(participant)}
                        >
                          <div className="conversation-info-row-left">
                            <img
                              src={participant.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(display)}`}
                              alt={display}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(display)}`
                              }}
                            />
                            <span>{display}</span>
                          </div>
                          <div className="conversation-info-row-actions">
                            {isCreator && (
                              <span className="conversation-info-role">Créateur</span>
                            )}
                            {!isCreator && isModerator && (
                              <span className="conversation-info-role">Admin</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
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
                <div className="conversation-info-list">
                  {appointmentMessages.slice(0, 6).map((msg) => (
                    <div key={msg.id} className="conversation-info-row">
                      <div className="conversation-info-row-left">
                        <span>{(msg.calendar_request_data as { title?: string })?.title || 'Rendez-vous'}</span>
                      </div>
                      <span className="conversation-info-role">
                        {(msg.calendar_request_data as { appointment_datetime?: string })?.appointment_datetime
                          ? formatAppointmentDate((msg.calendar_request_data as { appointment_datetime?: string }).appointment_datetime as string)
                          : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isSystemConversation && (
              <div className="conversation-info-card">
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
                      onClick={async () => {
                        if (!selectedConversation?.id || !user) return
                        try {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const { error } = await (supabase.from('conversation_participants') as any)
                            .update({ is_active: false })
                            .eq('conversation_id', selectedConversation.id)
                            .eq('user_id', user.id)
                          if (error) throw error
                          navigate('/messages')
                        } catch (error) {
                          console.error('Error leaving group:', error)
                          alert('Impossible de quitter le groupe')
                        }
                      }}
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
                  <p>Pourquoi souhaitez-vous signaler ?</p>
                  <div className="conversation-report-options">
                    {['Spam', 'Harcèlement', 'Contenu inapproprié', 'Autre'].map((reason) => (
                      <button
                        key={reason}
                        className={`conversation-report-option ${reportReason === reason ? 'active' : ''}`}
                        onClick={() => setReportReason(reason)}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="conversation-modal-footer">
                  <button onClick={() => setShowReportModal(false)} className="conversation-modal-cancel">
                    Annuler
                  </button>
                  <button onClick={handleReportSubmit} className="conversation-modal-submit" disabled={!reportReason}>
                    Envoyer
                  </button>
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
            />
          )}
          {showDeleteConfirm && (
            <ConfirmationModal
              visible={showDeleteConfirm}
              title="Supprimer la conversation"
              message="Voulez-vous vraiment supprimer cette conversation ?"
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
              if (!selectedConversation?.id) return
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
              } catch (error) {
                console.error('Error adding participants:', error)
                alert('Impossible d\'ajouter les participants')
              }
            }}
          />
          {selectedParticipant && (
            <div
              className="conversation-modal-overlay"
              onClick={() => setSelectedParticipant(null)}
            >
              <div className="conversation-modal-content" onClick={(event) => event.stopPropagation()}>
                <div className="conversation-modal-header">
                  <h2>Participant</h2>
                  <button
                    className="conversation-modal-close"
                    onClick={() => setSelectedParticipant(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="conversation-modal-body">
                  <div className="conversation-participant-detail">
                    <img
                      src={selectedParticipant.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedParticipant.profile?.full_name || selectedParticipant.profile?.username || 'Utilisateur')}`}
                      alt={selectedParticipant.profile?.full_name || selectedParticipant.profile?.username || 'Utilisateur'}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedParticipant.profile?.full_name || selectedParticipant.profile?.username || 'Utilisateur')}`
                      }}
                    />
                    <div>
                      <p className="conversation-participant-name">
                        {selectedParticipant.profile?.full_name || selectedParticipant.profile?.username || 'Utilisateur'}
                      </p>
                      <p className="conversation-participant-role">
                        {selectedParticipant.user_id === selectedConversation?.group_creator_id
                          ? 'Créateur'
                          : selectedParticipant.role === 'moderator'
                            ? 'Admin'
                            : 'Membre'}
                      </p>
                    </div>
                  </div>
                  {isGroupOwner && selectedParticipant.user_id !== user?.id && (
                    <div className="conversation-participant-actions">
                      <button
                        type="button"
                        className="conversation-action-item"
                        onClick={async () => {
                          if (!selectedConversation?.id) return
                          try {
                            const nextRole = selectedParticipant.role === 'moderator' ? 'member' : 'moderator'
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            await (supabase.from('conversation_participants') as any)
                              .update({ role: nextRole })
                              .eq('conversation_id', selectedConversation.id)
                              .eq('user_id', selectedParticipant.user_id)
                            setInfoParticipants((prev) => prev.map((p) => p.user_id === selectedParticipant.user_id ? {
                              ...p,
                              role: nextRole
                            } : p))
                            setSelectedParticipant((prev) => prev ? { ...prev, role: nextRole } : prev)
                          } catch (error) {
                            console.error('Error updating role:', error)
                            alert('Impossible de mettre à jour le rôle')
                          }
                        }}
                      >
                        {selectedParticipant.role === 'moderator' ? 'Retirer admin' : 'Définir admin'}
                      </button>
                      <button
                        type="button"
                        className="conversation-action-item danger"
                        onClick={async () => {
                          if (!selectedConversation?.id) return
                          try {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            await (supabase.from('conversation_participants') as any)
                              .update({ is_active: false })
                              .eq('conversation_id', selectedConversation.id)
                              .eq('user_id', selectedParticipant.user_id)
                            setInfoParticipants((prev) => prev.filter((p) => p.user_id !== selectedParticipant.user_id))
                            setSelectedParticipant(null)
                          } catch (error) {
                            console.error('Error removing participant:', error)
                            alert('Impossible de retirer ce participant')
                          }
                        }}
                      >
                        Retirer du groupe
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
                  <div key={msg.id} className="conversation-media-row">
                    <span>
                      {(msg.calendar_request_data as { title?: string })?.title || 'Rendez-vous'}
                    </span>
                    <span className="conversation-info-role">
                      {(msg.calendar_request_data as { appointment_datetime?: string })?.appointment_datetime
                        ? formatAppointmentDate((msg.calendar_request_data as { appointment_datetime?: string }).appointment_datetime as string)
                        : ''}
                    </span>
                  </div>
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
              <h1 className="conversation-header-name">{headerName}</h1>
              {!isSystemConversation && (
                <p className="conversation-header-status">
                  {formatLastSeen(
                    isGroupConversation
                      ? (selectedConversation?.last_message_at || null)
                      : (selectedConversation?.other_user?.last_activity_at || null)
                  )}
                </p>
              )}
            </div>
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
        <div className={`conversation-messages-container ${isSystemConversation ? 'system-conversation' : ''}`}>
          {loading || messagesLoading ? (
            <div className="loading-container">
              <Loader className="spinner-large" size={48} />
              <p>Chargement...</p>
            </div>
          ) : (
            <div className="conversation-messages-list" ref={messagesListRef}>
              {!isSystemConversation && (
                <div className="conversation-safety-card">
                <div className="conversation-safety-header">
                  <div>
                    <p className="conversation-safety-label">Attention aux arnaques</p>
                    <p className="conversation-safety-summary">
                      Protégez-vous : vérifiez l'annonce, le profil et les moyens de paiement.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="conversation-safety-toggle"
                    onClick={() => setShowScamPrevention((prev) => !prev)}
                    aria-expanded={showScamPrevention}
                  >
                    {showScamPrevention ? 'Réduire' : 'Lire plus'}
                  </button>
                </div>
                {showScamPrevention && (
                  <div className="conversation-safety-details">
                    <div className="conversation-safety-section">
                      <h3>Repérer un comportement suspect</h3>
                      <ul>
                        <li>Demande d'argent urgente ou pression pour décider vite.</li>
                        <li>Refus de fournir des infos claires ou incohérences dans le récit.</li>
                        <li>Invitation à continuer la discussion hors de la plateforme.</li>
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
                        <li>Évitez les virements instantanés ou moyens non traçables.</li>
                        <li>Ne cliquez jamais sur des liens de paiement envoyés par message.</li>
                        <li>Privilégiez les paiements sécurisés et vérifiables.</li>
                      </ul>
                    </div>
                    <div className="conversation-safety-section">
                      <h3>Documents à ne pas envoyer</h3>
                      <ul>
                        <li>Pièce d'identité, RIB, codes ou mots de passe.</li>
                        <li>Photos de cartes bancaires ou justificatifs confidentiels.</li>
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
                    <button
                      type="button"
                      className="conversation-safety-toggle conversation-safety-toggle-bottom"
                      onClick={() => setShowScamPrevention(false)}
                    >
                      Réduire
                    </button>
                  </div>
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
                        <p className="group-intro-subtitle">Créé par {groupCreatorName}</p>
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
                    {formatDateSeparator(group.messages[0].created_at)}
                  </div>
                  {group.messages.map((msg, msgIndex) => {
                    const isOwn = msg.sender_id === user?.id
                    const prevMsg = msgIndex > 0 ? group.messages[msgIndex - 1] : null
                    const showAvatar = !isOwn && (!prevMsg || prevMsg.sender_id !== msg.sender_id || 
                      new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300000) // 5 minutes
                    const isLastMessage = msg.id === messages[messages.length - 1]?.id

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
    <div className="messages-page-container" ref={containerRef}>
      {/* Header */}
      <div className="messages-header" ref={headerRef}>
        <div className="messages-header-title-row">
          <BackButton />
          <h1 className="messages-title">{t('messages:title')}</h1>
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
          </button>
          <button
            className={`messages-filter-btn ${activeFilter === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveFilter('matches')}
          >
            Matchs
          </button>
          <button
            className={`messages-filter-btn ${activeFilter === 'match_requests' ? 'active' : ''}`}
            onClick={() => setActiveFilter('match_requests')}
          >
            Demandes
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
            <EmptyState type="requests" />
          ) : (
            <div className="conversations-list conversations-list--compact">
              {filteredMatchRequests.map((request) => (
                <div
                  key={request.id}
                  className="conversation-item"
                  onClick={() => setSelectedMatchRequest(request)}
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
                    {request.related_post && (
                      <p className="conversation-post-title">
                        {request.related_post.title}
                      </p>
                    )}
                    {!request.related_post && request.related_service_name && (
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
              ))}
            </div>
          )
        ) : activeFilter === 'matches' ? (
          // Afficher les match_requests acceptées pour l'onglet "Match"
          filteredMatches.length === 0 ? (
            <EmptyState type="matches" />
          ) : (
            <div className="conversations-list conversations-list--compact">
              {filteredMatches.map((request) => (
                <div
                  key={request.id}
                  className="conversation-item"
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
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
                    {request.related_post && (
                      <p className="conversation-post-title">
                        {request.related_post.title}
                      </p>
                    )}
                    {!request.related_post && request.related_service_name && (
                      <p className="conversation-post-title">
                        Service : {request.related_service_name}
                      </p>
                    )}
                    <p className="conversation-preview">
                      Match accepté - Cliquez pour démarrer la conversation
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeFilter === 'appointments' ? (
          filteredAppointments.length === 0 ? (
            <EmptyState
              type="messages"
              customTitle="Aucun rendez-vous"
              customSubtext="Vos rendez-vous apparaîtront ici."
            />
          ) : (
            <div className="conversations-list">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="conversation-item appointment-item"
                  onClick={() => navigate(`/messages/${appointment.conversation_id}`)}
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
                    <p className="appointment-user-name">
                      {appointment.other_user?.full_name || appointment.other_user?.username || 'Utilisateur'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredConversations.length === 0 ? (
          <EmptyState 
            type={
              searchQuery ? 'category' : 
              activeFilter === 'archived' ? 'archived' :
              'messages'
            }
            customTitle={searchQuery ? 'Aucun résultat' : undefined}
            customSubtext={searchQuery ? 'Aucune conversation ne correspond à votre recherche.' : undefined}
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
              const preview = conv.has_messages ? getConversationPreview(conv) : ''
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
      <Footer />
    </div>
  )
}

export default Messages
