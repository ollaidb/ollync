import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { MessageCircle, Send, Loader, Search } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import Footer from '../components/Footer'
import './Messages.css'

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
  content: string
  sender_id: string
  created_at: string
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
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

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

    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error)
    } else if (messagesData && messagesData.length > 0) {
      const senderIds = [...new Set((messagesData as Array<{ sender_id: string }>).map((msg) => msg.sender_id).filter(Boolean))]
      
      const { data: senders } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', senderIds)

      const sendersMap = new Map((senders || []).map((s) => [s.id, s]))

      setMessages((messagesData as Array<{ id: string; content: string; sender_id: string; created_at: string }>).map((msg) => ({
        ...msg,
        sender: sendersMap.get(msg.sender_id) || null
      })))
    } else {
      setMessages([])
    }
  }

  const loadConversations = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

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

        const { data: users } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds)

        const { data: posts } = postIds.length > 0 ? await supabase
          .from('posts')
          .select('id, title')
          .in('id', postIds) : { data: null }

        const usersMap = new Map((users || []).map((u) => [u.id, u]))
        const postsMap = new Map((posts || []).map((p) => [p.id, (p as { title: string }).title]))

        // Pour chaque conversation, récupérer le dernier message et compter les non-lus
        const convsWithData = await Promise.all(
          (convs as Array<{ id: string; user1_id: string; user2_id: string; post_id?: string | null; last_message_at?: string | null }>).map(async (conv) => {
            const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
            const otherUser = usersMap.get(otherUserId) || null
            const postTitle = conv.post_id ? postsMap.get(conv.post_id) || null : null

            // Récupérer le dernier message
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            // Compter les messages non lus
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('sender_id', otherUserId)
              .is('read_at', null)

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
  }, [user])

  const sendMessage = async () => {
    if (!user || !message.trim() || !selectedConversation) return

    setSending(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('messages') as any).insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: message.trim()
      })

      if (error) throw error

      // Mettre à jour last_message_at de la conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation.id)

      setMessage('')
      loadMessages(selectedConversation.id)
      loadConversations() // Rafraîchir la liste des conversations
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Erreur lors de l\'envoi du message')
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const name = (conv.other_user?.full_name || conv.other_user?.username || '').toLowerCase()
    const postTitle = (conv.postTitle || '').toLowerCase()
    const lastMessage = (conv.lastMessage?.content || '').toLowerCase()
    
    return name.includes(query) || postTitle.includes(query) || lastMessage.includes(query)
  })

  if (!user) {
    return (
      <div className="messages-page-container">
        <div className="messages-header">
          <h1 className="messages-title">Messages</h1>
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
                  const isOwn = msg.sender_id === user.id
                  return (
                    <div key={msg.id} className={`message ${isOwn ? 'own' : 'other'}`}>
                      {!isOwn && msg.sender?.avatar_url && (
                        <img src={msg.sender.avatar_url} alt={msg.sender.full_name || ''} className="message-avatar" />
                      )}
                      <div className="message-content">
                        <p>{msg.content}</p>
                        <span className="message-time">
                          {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="message-input">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Tapez votre message..."
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || sending}
                  className="send-btn"
                >
                  {sending ? (
                    <Loader className="spinner" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
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
        <h1 className="messages-title">Messages</h1>
        
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
            {filteredConversations.map((conv, index) => (
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
      <Footer />
    </div>
  )
}

export default Messages
