import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { MailOpen, Loader, Search, Users, Archive, Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import CreateGroupModal from '../components/Messages/CreateGroupModal'
import MessageInput from '../components/Messages/MessageInput'
import MessageBubble from '../components/Messages/MessageBubble'
import { EmptyState } from '../components/EmptyState'
import MatchRequestDetail from '../components/Messages/MatchRequestDetail'
import './Messages.css'

type FilterType = 'all' | 'posts' | 'matches' | 'match_requests' | 'groups' | 'archived'

interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  post_id?: string | null
  last_message_at?: string | null
  lastMessage?: {
    content: string
    created_at: string
  } | null
  other_user?: {
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
  postTitle?: string | null
  unread?: number
  is_group?: boolean
  has_messages?: boolean
  is_archived?: boolean
  archived_at?: string | null
  deleted_at?: string | null
  type?: string | null
}

interface MatchRequest {
  id: string
  from_user_id: string
  to_user_id: string
  related_post_id?: string | null
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

interface Message {
  id: string
  content?: string | null
  sender_id: string
  created_at: string
  read_at?: string | null
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
  sender?: {
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

const Messages = () => {
  const navigate = useNavigate()
  const { id: conversationId } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const postId = searchParams.get('post')
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([])
  const [selectedMatchRequest, setSelectedMatchRequest] = useState<MatchRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  // Lire le paramètre filter depuis l'URL pour activer automatiquement le bon filtre
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam && ['all', 'posts', 'matches', 'match_requests', 'groups', 'archived'].includes(filterParam)) {
      setActiveFilter(filterParam as FilterType)
    }
  }, [searchParams])

  useEffect(() => {
    if (user) {
      if (postId) {
        handlePostMessage(postId)
      } else if (conversationId) {
        loadConversation(conversationId)
      } else {
        loadConversations()
      }
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, postId, conversationId])

  // Recharger la conversation quand l'URL change
  useEffect(() => {
    if (user && conversationId && !selectedConversation) {
      loadConversation(conversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user])

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

  // Fonction utilitaire pour trouver ou créer une conversation unique entre deux utilisateurs
  const findOrCreateConversation = async (otherUserId: string, postId?: string | null) => {
    if (!user) return null

    try {
      // Chercher une conversation existante entre ces deux utilisateurs (pas un groupe, pas supprimée)
      const { data: existingConvs, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
        .is('deleted_at', null) // Exclure les conversations supprimées

      if (searchError) {
        console.error('Error searching for conversation:', searchError)
      }

      // Filtrer pour exclure les groupes et les conversations supprimées
      const existingConv = existingConvs?.find(conv => {
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
          const { data: retryConvs } = await supabase
            .from('conversations')
            .select('*')
            .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
            .is('deleted_at', null)
            .limit(1)
          
          if (retryConvs && retryConvs.length > 0) {
            return retryConvs[0]
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
    try {
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single()

      if (!conv || !(conv as { id: string }).id) {
        alert('Conversation introuvable')
        navigate('/messages')
        return
      }

      const convData = conv as { id: string; user1_id: string; user2_id: string; post_id?: string | null }
      const otherUserId = convData.user1_id === user.id ? convData.user2_id : convData.user1_id

      // Récupérer les informations de l'utilisateur
      const { data: otherUser } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', otherUserId)
        .single()

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

      setSelectedConversation({
        ...convData,
        other_user: otherUser ? {
          ...(otherUser as { id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null })
        } : null,
        postTitle
      } as Conversation)

      loadMessages(convId)
    } catch (error) {
      console.error('Error loading conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (convId: string) => {
    if (!user) return

    // Utiliser select('*') pour éviter les problèmes de colonnes manquantes
    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error)
      setMessages([])
      return
    } else if (messagesData && messagesData.length > 0) {
      // Filtrer les messages supprimés côté client (soft delete)
      // Un message est visible si :
      // - is_deleted est null/false OU
      // - deleted_for_user_id n'est pas égal à l'utilisateur actuel
      const visibleMessages = (messagesData as Array<Message & { 
        is_deleted?: boolean | null
        deleted_for_user_id?: string | null
      }>).filter((msg) => {
        // Si le message est marqué comme supprimé pour cet utilisateur, l'exclure
        if (msg.is_deleted === true && msg.deleted_for_user_id === user.id) {
          return false
        }
        return true
      })

      const senderIds = [...new Set(visibleMessages.map((msg) => msg.sender_id).filter(Boolean))]
      
      const { data: senders, error: sendersError } = senderIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', senderIds) : { data: [], error: null }

      if (sendersError) {
        console.error('Error loading senders:', sendersError)
      }

      const sendersMap = new Map((senders as Array<{ id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null }> || []).map((s) => [s.id, s]))

      const formattedMessages: Message[] = visibleMessages.map((msg) => ({
        ...msg,
        sender: sendersMap.get(msg.sender_id) || null
      }))

      setMessages(formattedMessages)

      // Marquer les messages non lus comme lus
      const unreadMessages = formattedMessages.filter(
        (msg) => msg.sender_id !== user.id && !msg.read_at
      )

      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map((msg) => msg.id)
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() } as never)
          .in('id', unreadIds)
      }
    } else {
      setMessages([])
    }
  }

  // Charger les match_requests (demandes envoyées uniquement pour l'affichage dans Messages)
  // 
  // LOGIQUE DE RÉPARTITION DES MATCH_REQUESTS :
  // - Messages > "Demandes" : Affiche uniquement les demandes ENVOYÉES (from_user_id = current_user) avec status='pending'
  // - Messages > "Matchs" : Affiche uniquement les matchs ACCEPTÉS (status='accepted' ET from_user_id = current_user)
  // - Notifications : Affiche les notifications pour :
  //   * match_request_received : Quand on RECOIT une demande (to_user_id = current_user)
  //   * match_request_accepted : Quand quelqu'un ACCEPTE notre demande (from_user_id = current_user ET status='accepted')
  //   Les demandes reçues peuvent être acceptées/refusées depuis les Notifications
  const loadMatchRequests = useCallback(async () => {
    if (!user) return []

    try {
      // Charger uniquement les demandes ENVOYÉES par l'utilisateur (from_user_id = current_user)
      const { data: requestsData, error } = await supabase
        .from('match_requests')
        .select('*')
        .eq('from_user_id', user.id) // Seulement les demandes envoyées
        .in('status', ['pending', 'accepted'])
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
        .select('id, username, full_name, avatar_url')
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
        const key = request.related_post_id 
          ? `${request.related_post_id}_${request.from_user_id === user.id ? request.to_user_id : request.from_user_id}`
          : `${request.from_user_id}_${request.to_user_id}`
        
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

  const loadConversations = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      // Charger les match_requests
      const requestsData = await loadMatchRequests()
      setMatchRequests(requestsData)

      // Pour l'onglet "Tout" : toutes les conversations (même sans messages)
      // Exclure uniquement les conversations supprimées (soft delete)
      let query = supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id},group_creator_id.eq.${user.id}`)
        .is('deleted_at', null) // Exclure les conversations supprimées

      // Appliquer les filtres selon le type
      if (activeFilter === 'posts') {
        query = query.not('post_id', 'is', null).or('is_archived.is.null,is_archived.eq.false')
      } else if (activeFilter === 'groups') {
        query = query.eq('is_group', true).or('is_archived.is.null,is_archived.eq.false')
      } else if (activeFilter === 'archived') {
        query = query.eq('is_archived', true)
      } else if (activeFilter === 'all') {
        // Pour "Tout", afficher toutes les conversations (même sans messages)
        // Exclure uniquement les archivées et supprimées
        // Si is_archived est NULL, considérer comme non archivé
        query = query.or('is_archived.is.null,is_archived.eq.false')
      }

      // Trier par last_message_at si disponible, sinon par created_at
      // Utiliser nulls last pour mettre les conversations sans messages en fin de liste
      const { data: convs, error } = await query
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

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
          .select('id, username, full_name, avatar_url')
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

        // Pour chaque conversation, récupérer le dernier message et compter les non-lus
        const convsWithData = await Promise.all(
          (convs as Array<{ id: string; user1_id: string; user2_id: string; post_id?: string | null; last_message_at?: string | null; is_group?: boolean }>).map(async (conv) => {
            const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
            const otherUser = usersMap.get(otherUserId) || null
            const postTitle = conv.post_id ? postsMap.get(conv.post_id) || null : null

            // Vérifier si la conversation a des messages
            // Note: On garde cette information mais on n'exclut plus les conversations sans messages
            const { count: messageCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)

            const hasMessages = (messageCount || 0) > 0

            // Récupérer le dernier message (sans utiliser .single() pour éviter les erreurs)
            const { data: lastMsgData, error: lastMsgError } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)

            let lastMsg = null
            if (!lastMsgError && lastMsgData && lastMsgData.length > 0) {
              lastMsg = lastMsgData[0]
            }

            // Compter les messages non lus (seulement si otherUserId existe)
            let unreadCount = 0
            if (otherUserId && hasMessages) {
              const { count, error: countError } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .eq('sender_id', otherUserId)
                .is('read_at', null)
              
              if (!countError) {
                unreadCount = count || 0
              }
            }

            return {
              ...conv,
              other_user: otherUser,
              postTitle,
              lastMessage: lastMsg ? {
                content: (lastMsg as { content: string }).content,
                created_at: (lastMsg as { created_at: string }).created_at
              } : null,
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
        
        // Trier par date de dernier message (plus récent en premier)
        filteredConvs.sort((a, b) => {
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
      setLoading(false)
    }
  }, [user, activeFilter, loadMatchRequests])


  // Filtrer les match_requests selon l'onglet actif
  // Dans Messages, on affiche uniquement les demandes ENVOYÉES
  const filteredMatchRequests = matchRequests.filter((request) => {
    if (activeFilter === 'match_requests') {
      // Demandes : uniquement les demandes ENVOYÉES en attente (pending)
      // request_type est déjà 'sent' car on charge seulement from_user_id = current_user
      return request.status === 'pending' && request.request_type === 'sent'
    }
    return false
  })

  // Filtrer les matches selon l'onglet actif
  // L'onglet "Match" affiche uniquement les matchs ACCEPTÉS (demandes qu'on a envoyées et qui ont été acceptées)
  // Les conversations créées à partir de ces matches apparaîtront aussi dans "Tout" si elles ont des messages
  const filteredMatches = matchRequests.filter((request) => {
    if (activeFilter === 'matches') {
      // Match : afficher uniquement les match_requests ACCEPTÉES qu'on a envoyées
      // (status='accepted' ET from_user_id = current_user)
      return request.status === 'accepted' && request.request_type === 'sent'
    }
    return false
  })

  const filteredConversations = conversations.filter((conv) => {
    // Filtre par recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const name = (conv.other_user?.full_name || conv.other_user?.username || '').toLowerCase()
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
    } else if (activeFilter === 'matches' || activeFilter === 'match_requests') {
      // Les matches sont gérés séparément via filteredMatches
      return false
    }

    return true
  })

  if (!user) {
    return (
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
  if (selectedConversation || conversationId) {
    const otherUserName = selectedConversation?.other_user?.full_name || selectedConversation?.other_user?.username || 'Utilisateur'
    const otherUserUsername = selectedConversation?.other_user?.username
    const displayName = otherUserName !== 'Utilisateur' ? otherUserName : (otherUserUsername ? `@${otherUserUsername}` : 'Utilisateur')
    const groupedMessages = groupMessagesByDate(messages)

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
          <div className="conversation-header-center">
            <h1 className="conversation-header-name">{displayName}</h1>
          </div>
          <div className="conversation-header-spacer"></div>
        </div>
        <div className="conversation-messages-container">
          {loading ? (
            <div className="loading-container">
              <Loader className="spinner-large" size={48} />
              <p>Chargement...</p>
            </div>
          ) : (
            <div className="conversation-messages-list">
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
                    
                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        onDelete={async () => {
                          if (user && isOwn) {
                            // Suppression soft
                            await supabase
                              .from('messages')
                              .update({ is_deleted: true, deleted_for_user_id: user.id } as never)
                              .eq('id', msg.id)
                            loadMessages(selectedConversation?.id || conversationId || '')
                          }
                        }}
                        onLike={async () => {
                          if (user) {
                            // Toggle like
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
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
        {user && (selectedConversation || conversationId) && (
          <MessageInput
            conversationId={selectedConversation?.id || conversationId || ''}
            senderId={user.id}
            onMessageSent={() => {
              if (selectedConversation || conversationId) {
                loadMessages(selectedConversation?.id || conversationId || '')
                loadConversations()
              }
            }}
          />
        )}
      </div>
    )
  }

  // Vue liste des conversations
  return (
    <div className="messages-page-container">
      {/* Header */}
      <div className="messages-header">
        <div className="messages-header-title-row">
          <BackButton />
          <h1 className="messages-title">Messages</h1>
          <div className="messages-header-actions">
            <button
              className="messages-create-group-btn"
              onClick={() => setShowCreateGroup(true)}
              title="Créer un groupe"
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
            placeholder="Rechercher une conversation"
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
            className={`messages-filter-btn ${activeFilter === 'archived' ? 'active' : ''}`}
            onClick={() => setActiveFilter('archived')}
          >
            <Archive size={16} />
            Archivés
          </button>
        </div>
      </div>

      <div className="messages-content">
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
            <div className="conversations-list">
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
                    <div className="conversation-footer">
                      <span className={`conversation-badge ${request.request_type === 'sent' ? 'sent' : 'received'}`}>
                        {request.request_type === 'sent' ? 'Envoyée' : 'Reçue'}
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
            <div className="conversations-list">
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
                    <p className="conversation-preview">
                      Match accepté - Cliquez pour démarrer la conversation
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
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className="conversation-item"
                onClick={() => navigate(`/messages/${conv.id}`)}
              >
                <div className="conversation-avatar-wrapper">
                  <img
                    src={conv.other_user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.other_user?.full_name || conv.other_user?.username || 'User')}`}
                    alt={conv.other_user?.full_name || conv.other_user?.username || 'User'}
                    className="conversation-avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.other_user?.full_name || conv.other_user?.username || 'User')}`
                    }}
                  />
                  {conv.unread && conv.unread > 0 && (
                    <div className="conversation-unread-badge">
                      {conv.unread > 99 ? '99+' : conv.unread}
                    </div>
                  )}
                </div>

                <div className="conversation-info">
                  <div className="conversation-item-header">
                    <h3 className="conversation-name">
                      {conv.other_user?.full_name || conv.other_user?.username || 'Utilisateur'}
                    </h3>
                    <span className="conversation-time">
                      {formatTime(conv.lastMessage?.created_at || conv.last_message_at)}
                    </span>
                  </div>

                  {conv.postTitle && (
                    <p className="conversation-post-title">
                      {conv.postTitle}
                    </p>
                  )}

                  {conv.lastMessage && (
                    <p className={`conversation-preview ${conv.unread && conv.unread > 0 ? 'unread' : ''}`}>
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <CreateGroupModal
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onSuccess={() => {
          loadConversations()
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
