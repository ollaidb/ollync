import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { MessageCircle, Send, Loader } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import PageHeader from '../components/PageHeader'
import Footer from '../components/Footer'
import './Page.css'
import './Messages.css'

interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  post_id?: string | null
  last_message?: {
    content: string
    created_at: string
  } | null
  other_user?: {
    id: string
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
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Array<{
    id: string
    content: string
    sender_id: string
    created_at: string
    sender?: {
      username?: string | null
      full_name?: string | null
      avatar_url?: string | null
    } | null
  }>>([])

  useEffect(() => {
    if (user) {
      if (postId) {
        // Créer ou récupérer une conversation pour ce post
        handlePostMessage(postId)
      } else if (conversationId) {
        // Charger une conversation spécifique
        loadConversation(conversationId)
      } else {
        // Charger toutes les conversations
        loadConversations()
      }
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, postId, conversationId])

  const handlePostMessage = async (postIdParam: string) => {
    if (!user) return

    setLoading(true)
    try {
      // Récupérer l'auteur du post
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: postData } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postIdParam)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!postData || (postData as any).user_id === user.id) {
        alert('Vous ne pouvez pas vous envoyer un message à vous-même')
        navigate('/messages')
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const otherUserId = (postData as any).user_id

      // Vérifier si une conversation existe déjà
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId},post_id.eq.${postIdParam}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id},post_id.eq.${postIdParam})`)
        .maybeSingle()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (existingConv && (existingConv as any).id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigate(`/messages/${(existingConv as any).id}`)
        return
      }

      // Créer une nouvelle conversation
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
      // Récupérer la conversation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!conv || !(conv as any).id) {
        alert('Conversation introuvable')
        navigate('/messages')
        return
      }

      // Déterminer l'autre utilisateur
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convData = conv as any
      const otherUserId = convData.user1_id === user.id ? convData.user2_id : convData.user1_id

      // Récupérer les informations de l'autre utilisateur
      const { data: otherUser } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', otherUserId)
        .single()

      setSelectedConversation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(conv as any),
        other_user: otherUser || null
      } as Conversation)

      // Charger les messages
      loadMessages(convId)
    } catch (error) {
      console.error('Error loading conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (convId: string) => {
    if (!user) return

    // Récupérer les messages sans relation (car Supabase ne trouve pas la relation)
      const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error)
    } else if (messagesData && messagesData.length > 0) {
      // Récupérer les informations des expéditeurs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const senderIds = [...new Set((messagesData as any[]).map((msg: any) => msg.sender_id).filter(Boolean))]
      
      const { data: senders } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', senderIds)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sendersMap = new Map((senders || []).map((s: any) => [s.id, s]))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMessages((messagesData as any[]).map((msg: any) => ({
        ...msg,
        sender: sendersMap.get(msg.sender_id) || null
      })))
    } else {
      setMessages([])
    }
  }

  const loadConversations = async () => {
    if (!user) return

    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // Récupérer les informations des autres utilisateurs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userIds = (convs as any[]).map((conv: any) => 
          conv.user1_id === user.id ? conv.user2_id : conv.user1_id
        )

        const { data: users } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const usersMap = new Map((users || []).map((u: any) => [u.id, u]))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const convsWithUsers = (convs as any[]).map((conv: any) => ({
          ...conv,
          other_user: usersMap.get(conv.user1_id === user.id ? conv.user2_id : conv.user1_id) || null
        }))

        setConversations(convsWithUsers)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

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

      setMessage('')
      loadMessages(selectedConversation.id)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Erreur lors de l\'envoi du message')
    } finally {
      setSending(false)
    }
  }

  if (!user) {
    return (
      <div className="page">
        <PageHeader title="Messages" />
        <div className="page-content">
          <div className="page-body">
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
        </div>
        <Footer />
      </div>
    )
  }

  // Si une conversation est sélectionnée, afficher la vue de conversation
  if (selectedConversation || conversationId) {
    return (
      <div className="page">
        <PageHeader title={selectedConversation?.other_user?.full_name || selectedConversation?.other_user?.username || 'Messages'} />
        <div className="page-content">
          <div className="messages-page conversation-view">
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
        </div>
        <Footer />
      </div>
    )
  }

  // Vue liste des conversations
  return (
    <div className="page">
      <PageHeader title="Messages" />
      <div className="page-content">
        <div className="page-body messages-page">
          {loading ? (
            <div className="loading-container">
              <Loader className="spinner-large" size={48} />
              <p>Chargement...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-state">
              <MessageCircle size={48} />
              <h2>Aucun message</h2>
              <p>Vous n'avez pas encore de conversations.</p>
            </div>
          ) : (
            <div className="conversations-list">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="conversation-item"
                  onClick={() => navigate(`/messages/${conv.id}`)}
                >
                  {conv.other_user?.avatar_url && (
                    <img src={conv.other_user.avatar_url} alt={conv.other_user.full_name || ''} className="conversation-avatar" />
                  )}
                  <div className="conversation-info">
                    <h3>{conv.other_user?.full_name || conv.other_user?.username || 'Utilisateur'}</h3>
                    {conv.last_message && (
                      <p className="conversation-preview">{conv.last_message.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Messages

