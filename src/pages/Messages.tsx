import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { MessageCircle, Loader, Search, Users, Archive } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import CreateGroupModal from '../components/Messages/CreateGroupModal'
import MessageInput from '../components/Messages/MessageInput'
import MessageBubble from '../components/Messages/MessageBubble'
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
}

interface Message {
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

const Messages = () => {
  const navigate = useNavigate()
  const { id: conversationId } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const postId = searchParams.get('post')
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [showCreateGroup, setShowCreateGroup] = useState(false)

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

      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId},post_id.eq.${postIdParam}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id},post_id.eq.${postIdParam})`)
        .maybeSingle()

      if (existingConv && (existingConv as { id: string }).id) {
        navigate(`/messages/${(existingConv as { id: string }).id}`)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newConv, error } = await (supabase.from('conversations') as any).insert({
        user1_id: user.id,
        user2_id: otherUserId,
        post_id: postIdParam
      }).select().single()

      if (error) throw error

      if (newConv) {
        navigate(`/messages/${newConv.id}`)
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
        other_user: otherUser || null,
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
      const senderIds = [...new Set((messagesData as Array<{ sender_id: string }>).map((msg) => msg.sender_id).filter(Boolean))]
      
      const { data: senders, error: sendersError } = senderIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', senderIds) : { data: [], error: null }

      if (sendersError) {
        console.error('Error loading senders:', sendersError)
      }

      const sendersMap = new Map((senders as Array<{ id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null }> || []).map((s) => [s.id, s]))

      const formattedMessages = (messagesData as Array<{ id: string; content: string; sender_id: string; created_at: string; read_at?: string | null }>).map((msg) => ({
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

  const loadConversations = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      let query = supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id},group_creator_id.eq.${user.id}`)

      // Appliquer les filtres selon le type
      if (activeFilter === 'posts') {
        query = query.not('post_id', 'is', null)
      } else if (activeFilter === 'groups') {
        query = query.eq('is_group', true)
      } else if (activeFilter === 'archived') {
        query = query.eq('is_archived', true)
      } else if (activeFilter === 'matches') {
        // Les matchs sont gérés via la table matches
        // Pour l'instant, on charge toutes les conversations et on filtre côté client
      }

      const { data: convs, error } = await query.order('last_message_at', { ascending: false })

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
          (convs as Array<{ id: string; user1_id: string; user2_id: string; post_id?: string | null; last_message_at?: string | null }>).map(async (conv) => {
            const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
            const otherUser = usersMap.get(otherUserId) || null
            const postTitle = conv.post_id ? postsMap.get(conv.post_id) || null : null

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
            if (otherUserId) {
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
              unread: unreadCount || 0
            }
          })
        )

        setConversations(convsWithData)
      } else {
        setConversations([])
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [user, activeFilter])


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
      return true
    } else if (activeFilter === 'posts') {
      return !!conv.post_id
    } else if (activeFilter === 'groups') {
      return !!(conv as { is_group?: boolean }).is_group
    } else if (activeFilter === 'archived') {
      return !!(conv as { is_archived?: boolean }).is_archived
    } else if (activeFilter === 'matches') {
      // Pour l'instant, on considère que les matchs sont des conversations sans post_id
      // TODO: Implémenter la logique avec la table matches
      return !conv.post_id && !(conv as { is_group?: boolean }).is_group
    } else if (activeFilter === 'match_requests') {
      // TODO: Implémenter la logique avec la table matches (status = 'pending')
      return false
    }

    return true
  })

  if (!user) {
    return (
      <div className="messages-page-container">
        <div className="messages-header">
          <BackButton />
          <h1 className="messages-title">Messages</h1>
          <div className="messages-header-spacer"></div>
        </div>
        <div className="messages-content">
          <div className="empty-state">
            <MessageCircle size={48} />
            <h2>Vous n'êtes pas connecté</h2>
            <p>Connectez-vous pour accéder à vos messages</p>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/auth/login')}
            >
              Se connecter
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Si une conversation est sélectionnée, afficher la vue de conversation
  if (selectedConversation || conversationId) {
    return (
      <div className="messages-page-container">
        <div className="messages-header">
          <button 
            className="messages-back-button"
            onClick={() => {
              setSelectedConversation(null)
              navigate('/messages')
            }}
          >
            ← Retour
          </button>
          <h1 className="messages-title">
            {selectedConversation?.other_user?.full_name || selectedConversation?.other_user?.username || 'Messages'}
          </h1>
        </div>
        <div className="messages-content conversation-view">
          {loading ? (
            <div className="loading-container">
              <Loader className="spinner-large" size={48} />
              <p>Chargement...</p>
            </div>
          ) : (
            <>
              <div className="messages-list">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id
                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={isOwn}
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
            </>
          )}
        </div>
        <Footer />
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
              <Users size={20} />
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
            className={`messages-filter-btn ${activeFilter === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveFilter('posts')}
          >
            Annonces
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
        ) : filteredConversations.length === 0 ? (
          <div className="empty-state">
            <MessageCircle size={48} />
            <h2>{searchQuery ? 'Aucun résultat' : 'Aucun message'}</h2>
            <p>{searchQuery ? 'Aucune conversation ne correspond à votre recherche.' : 'Vous n\'avez pas encore de conversations.'}</p>
          </div>
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
                  <div className="conversation-header">
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
      <Footer />
    </div>
  )
}

export default Messages
