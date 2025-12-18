import { useState } from 'react'
import { X, Check, XCircle, MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import MessageInput from './MessageInput'
import './MatchRequestDetail.css'

interface MatchRequestDetailProps {
  request: {
    id: string
    from_user_id: string
    to_user_id: string
    related_post_id?: string | null
    status: 'pending' | 'accepted' | 'declined' | 'cancelled'
    created_at: string
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
    request_type?: 'sent' | 'received'
  }
  currentUserId: string
  onClose: () => void
  onUpdate: () => void
  onStartConversation?: (conversationId: string) => void
}

const MatchRequestDetail = ({ 
  request, 
  currentUserId, 
  onClose, 
  onUpdate,
  onStartConversation 
}: MatchRequestDetailProps) => {
  const [loading, setLoading] = useState(false)
  const [showMessageInput, setShowMessageInput] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const isReceived = request.request_type === 'received'
  const isSent = request.request_type === 'sent'
  const isPending = request.status === 'pending'
  const isAccepted = request.status === 'accepted'

  // Accepter une demande reçue
  const handleAccept = async () => {
    if (!isReceived || !isPending) return

    setLoading(true)
    try {
      // Créer la conversation d'abord
      const otherUserId = request.from_user_id
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          user1_id: currentUserId,
          user2_id: otherUserId,
          post_id: request.related_post_id || null
        } as never)
        .select()
        .single()

      if (convError) throw convError

      const convId = (newConv as { id: string }).id

      // Mettre à jour la demande avec le statut accepté et l'ID de la conversation
      const { error } = await supabase
        .from('match_requests')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          conversation_id: convId
        } as never)
        .eq('id', request.id)

      if (error) throw error

      // Afficher le champ de message pour envoyer le premier message
      setConversationId(convId)
      setShowMessageInput(true)
      onUpdate()
    } catch (error) {
      console.error('Error accepting request:', error)
      alert('Erreur lors de l\'acceptation de la demande')
    } finally {
      setLoading(false)
    }
  }

  // Refuser une demande reçue
  const handleDecline = async () => {
    if (!isReceived || !isPending) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('match_requests')
        .update({ status: 'declined' } as never)
        .eq('id', request.id)

      if (error) throw error

      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error declining request:', error)
      alert('Erreur lors du refus de la demande')
    } finally {
      setLoading(false)
    }
  }

  // Annuler une demande envoyée
  const handleCancel = async () => {
    if (!isSent || !isPending) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('match_requests')
        .update({ status: 'cancelled' } as never)
        .eq('id', request.id)

      if (error) throw error

      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error cancelling request:', error)
      alert('Erreur lors de l\'annulation de la demande')
    } finally {
      setLoading(false)
    }
  }

  // Démarrer une conversation (pour demande acceptée)
  const handleStartConversation = async () => {
    if (!isAccepted) return

    setLoading(true)
    try {
      // Vérifier si une conversation existe déjà
      let convId = request.conversation_id

      if (!convId) {
        // Créer une nouvelle conversation
        const otherUserId = request.from_user_id === currentUserId ? request.to_user_id : request.from_user_id
        
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            user1_id: currentUserId,
            user2_id: otherUserId,
            post_id: request.related_post_id || null
          } as never)
          .select()
          .single()

        if (convError) throw convError

        convId = (newConv as { id: string }).id

        // Mettre à jour la demande avec l'ID de la conversation
        await supabase
          .from('match_requests')
          .update({ conversation_id: convId } as never)
          .eq('id', request.id)
      }

      setConversationId(convId)
      setShowMessageInput(true)
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Erreur lors de la création de la conversation')
    } finally {
      setLoading(false)
    }
  }

  // Gérer l'envoi du premier message
  const handleFirstMessageSent = async () => {
    if (conversationId && onStartConversation) {
      onStartConversation(conversationId)
    }
    onUpdate()
    onClose()
  }

  return (
    <div className="match-request-detail-overlay" onClick={onClose}>
      <div className="match-request-detail-content" onClick={(e) => e.stopPropagation()}>
        <button className="match-request-detail-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="match-request-detail-header">
          <img
            src={request.other_user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.other_user?.full_name || request.other_user?.username || 'User')}`}
            alt={request.other_user?.full_name || request.other_user?.username || 'User'}
            className="match-request-detail-avatar"
          />
          <h2 className="match-request-detail-name">
            {request.other_user?.full_name || request.other_user?.username || 'Utilisateur'}
          </h2>
          <div className={`match-request-detail-badge ${isReceived ? 'received' : 'sent'}`}>
            {isReceived ? 'Reçue' : 'Envoyée'}
          </div>
        </div>

        {request.related_post && (
          <div className="match-request-detail-post">
            <p className="match-request-detail-post-label">Annonce concernée :</p>
            <p className="match-request-detail-post-title">{request.related_post.title}</p>
          </div>
        )}

        <div className="match-request-detail-status">
          <span className={`status-badge status-${request.status}`}>
            {request.status === 'pending' && 'En attente'}
            {request.status === 'accepted' && 'Acceptée'}
            {request.status === 'declined' && 'Refusée'}
            {request.status === 'cancelled' && 'Annulée'}
          </span>
        </div>

        {!showMessageInput && (
          <div className="match-request-detail-actions">
            {isReceived && isPending && (
              <>
                <button
                  className="match-request-action-btn accept"
                  onClick={handleAccept}
                  disabled={loading}
                >
                  <Check size={20} />
                  Accepter
                </button>
                <button
                  className="match-request-action-btn decline"
                  onClick={handleDecline}
                  disabled={loading}
                >
                  <XCircle size={20} />
                  Refuser
                </button>
              </>
            )}

            {isSent && isPending && (
              <button
                className="match-request-action-btn cancel"
                onClick={handleCancel}
                disabled={loading}
              >
                <XCircle size={20} />
                Annuler la demande
              </button>
            )}

            {isSent && isAccepted && (
              <button
                className="match-request-action-btn start"
                onClick={handleStartConversation}
                disabled={loading}
              >
                <MessageCircle size={20} />
                Démarrer la conversation
              </button>
            )}

            {isReceived && isAccepted && !request.conversation_id && (
              <button
                className="match-request-action-btn start"
                onClick={handleStartConversation}
                disabled={loading}
              >
                <MessageCircle size={20} />
                Démarrer la conversation
              </button>
            )}
          </div>
        )}

        {showMessageInput && conversationId && (
          <div className="match-request-detail-message">
            <p className="match-request-detail-message-label">
              {isReceived ? 'Envoyer un premier message' : 'Démarrer la conversation'}
            </p>
            <MessageInput
              conversationId={conversationId}
              senderId={currentUserId}
              onMessageSent={handleFirstMessageSent}
            />
          </div>
        )}

        {showMessageInput && isReceived && isAccepted && !conversationId && (
          <div className="match-request-detail-message">
            <p className="match-request-detail-message-label">
              Envoyer un premier message
            </p>
            <p className="match-request-detail-message-info">
              La conversation sera créée automatiquement lors de l'envoi du message.
            </p>
            <button
              className="match-request-action-btn start"
              onClick={handleStartConversation}
              disabled={loading}
            >
              Créer la conversation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MatchRequestDetail

