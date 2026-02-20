import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check, XCircle, MessageCircle, FileText, Download } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import MessageInput from './MessageInput'
import ConfirmationModal from '../ConfirmationModal'
import './MatchRequestDetail.css'

interface MatchRequestDetailProps {
  request: {
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
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showMessageInput, setShowMessageInput] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false)
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isEditingMessage, setIsEditingMessage] = useState(false)
  const [draftMessage, setDraftMessage] = useState(request.request_message || '')
  const isConfirmVisible = showAcceptConfirm || showDeclineConfirm || showCancelConfirm

  const isReceived = request.to_user_id === currentUserId
  const isSent = request.from_user_id === currentUserId
  const isPending = request.status === 'pending'
  const isAccepted = request.status === 'accepted'
  const profileUserId = request.other_user?.id

  const formatReservationDuration = (minutes?: number | null) => {
    if (!minutes || minutes <= 0) return ''
    const hours = Math.floor(minutes / 60)
    const remaining = minutes % 60
    if (hours > 0 && remaining > 0) return `${hours}h${String(remaining).padStart(2, '0')}`
    if (hours > 0) return `${hours}h`
    return `${remaining} min`
  }

  const findOrCreateConversation = async (otherUserId: string) => {
    try {
      const { data: existingConvs, error: searchError } = await supabase
        .from('public_conversations_with_users')
        .select('*')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUserId})`)

      if (searchError) {
        console.error('Error searching for conversation:', searchError)
      }

      const existingConv = existingConvs?.find(conv => {
        const convData = conv as { is_group?: boolean }
        return !convData.is_group
      })

      if (existingConv && (existingConv as { id: string }).id) {
        return existingConv as { id: string }
      }

      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          user1_id: currentUserId,
          user2_id: otherUserId,
          post_id: request.related_post_id || null,
          type: 'direct',
          is_group: false
        } as never)
        .select()
        .single()

      if (convError) throw convError

      return newConv as { id: string }
    } catch (error) {
      console.error('Error finding/creating conversation:', error)
      return null
    }
  }

  // Accepter une demande reçue
  const handleAccept = async () => {
    if (!isReceived || !isPending) return

    setLoading(true)
    try {
      const otherUserId = request.from_user_id
      const conversation = await findOrCreateConversation(otherUserId)
      if (!conversation?.id) {
        throw new Error('Conversation introuvable')
      }

      // Mettre à jour la demande avec le statut accepté et l'ID de la conversation
      const { error } = await supabase
        .from('match_requests')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          conversation_id: conversation.id
        } as never)
        .eq('id', request.id)

      if (error) throw error

      // Afficher le champ de message pour envoyer le premier message
      setConversationId(conversation.id)
      setShowMessageInput(true)
      setShowAcceptConfirm(false)
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
      setShowDeclineConfirm(false)
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
      setShowCancelConfirm(false)
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
        const otherUserId = request.from_user_id === currentUserId ? request.to_user_id : request.from_user_id
        const conversation = await findOrCreateConversation(otherUserId)
        if (!conversation?.id) {
          throw new Error('Conversation introuvable')
        }
        convId = conversation.id

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

  const handleUpdateMessage = async () => {
    if (!isSent || !isPending) return

    setLoading(true)
    try {
      const trimmed = draftMessage.trim()
      const { error } = await supabase
        .from('match_requests')
        .update({ request_message: trimmed.length > 0 ? trimmed : null } as never)
        .eq('id', request.id)
        .eq('from_user_id', currentUserId)

      if (error) throw error

      onUpdate()
      setIsEditingMessage(false)
    } catch (error) {
      console.error('Error updating request message:', error)
      alert('Erreur lors de la modification du message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="match-request-detail-overlay">
      {!isConfirmVisible && (
        <div className="match-request-detail-content">
          <button className="match-request-detail-close" onClick={onClose}>
            <X size={24} />
          </button>

          <div className="match-request-detail-header">
            {profileUserId ? (
              <button
                type="button"
                className="match-request-detail-name match-request-detail-name-link"
                onClick={() => navigate(`/profile/public/${profileUserId}`)}
              >
                {request.other_user?.full_name || request.other_user?.username || 'Utilisateur'}
              </button>
            ) : (
              <h2 className="match-request-detail-name">
                {request.other_user?.full_name || request.other_user?.username || 'Utilisateur'}
              </h2>
            )}
            <div className={`match-request-detail-badge ${isReceived ? 'received' : 'sent'}`}>
              {isReceived ? 'Reçue' : 'Envoyée'}
            </div>
          </div>

          {request.related_post && (
            <div className="match-request-detail-post">
              <p className="match-request-detail-post-label">Annonce concernée :</p>
              <p className="match-request-detail-post-title">{request.related_post.title}</p>
              {request.request_role && (
                <p className="match-request-detail-post-subtitle">
                  Poste demandé : {request.request_role}
                </p>
              )}
            </div>
          )}

          {!request.related_post && request.related_service_name && (
            <div className="match-request-detail-post">
              <p className="match-request-detail-post-label">Service demandé :</p>
              <p className="match-request-detail-post-title">{request.related_service_name}</p>
              {request.related_service_payment_type === 'price' && request.related_service_value && (
                <p className="match-request-detail-post-subtitle">Prix : {request.related_service_value}</p>
              )}
              {request.related_service_payment_type === 'exchange' && request.related_service_value && (
                <p className="match-request-detail-post-subtitle">Échange : {request.related_service_value}</p>
              )}
            </div>
          )}

          {(request.request_message || isEditingMessage) && (
            <div className="match-request-detail-message">
              <p className="match-request-detail-message-label">Message :</p>
              {isEditingMessage ? (
                <>
                  <textarea
                    className="match-request-detail-message-input"
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Modifier votre message..."
                    maxLength={280}
                    rows={3}
                  />
                  <div className="match-request-detail-message-actions">
                    <button
                      className="match-request-detail-message-btn secondary"
                      type="button"
                      onClick={() => {
                        setDraftMessage(request.request_message || '')
                        setIsEditingMessage(false)
                      }}
                      disabled={loading}
                    >
                      Annuler
                    </button>
                    <button
                      className="match-request-detail-message-btn primary"
                      type="button"
                      onClick={handleUpdateMessage}
                      disabled={loading}
                    >
                      Enregistrer
                    </button>
                  </div>
                </>
              ) : (
                <p className="match-request-detail-message-text">{request.request_message}</p>
              )}
            </div>
          )}

          {request.request_document_url && (
            <div className="match-request-detail-document">
              <p className="match-request-detail-document-label">CV :</p>
              <a
                href={request.request_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="match-request-detail-document-link"
                download={request.request_document_name}
              >
                <FileText size={18} />
                <span>{request.request_document_name || 'Document'}</span>
                <Download size={16} />
              </a>
            </div>
          )}

          {request.request_cover_letter_url && (
            <div className="match-request-detail-document">
              <p className="match-request-detail-document-label">Lettre de motivation :</p>
              <a
                href={request.request_cover_letter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="match-request-detail-document-link"
                download={request.request_cover_letter_name}
              >
                <FileText size={18} />
                <span>{request.request_cover_letter_name || 'Lettre de motivation'}</span>
                <Download size={16} />
              </a>
            </div>
          )}

          {(request.reservation_date || request.reservation_time || request.reservation_duration_minutes) && (
            <div className="match-request-detail-message">
              <p className="match-request-detail-message-label">Réservation :</p>
              <p className="match-request-detail-message-text">
                {request.reservation_date || 'Date non précisée'}
                {request.reservation_time ? ` à ${request.reservation_time}` : ''}
                {request.reservation_duration_minutes
                  ? ` pour ${formatReservationDuration(request.reservation_duration_minutes)}`
                  : ''}
              </p>
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
                <div className="match-request-action-row">
                  <button
                    className="match-request-action-btn decline"
                    onClick={() => setShowDeclineConfirm(true)}
                    disabled={loading}
                  >
                    <XCircle size={20} />
                    Refuser
                  </button>
                  <button
                    className="match-request-action-btn accept"
                    onClick={() => setShowAcceptConfirm(true)}
                    disabled={loading}
                  >
                    <Check size={20} />
                    Accepter
                  </button>
                </div>
              )}

              {isSent && isPending && (
                <div className="match-request-action-row">
                  <button
                    className="match-request-action-btn cancel"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={loading}
                  >
                    <XCircle size={20} />
                    Annuler
                  </button>
                  <button
                    className="match-request-action-btn start"
                    onClick={() => {
                      setDraftMessage(request.request_message || '')
                      setIsEditingMessage(true)
                    }}
                    disabled={loading}
                  >
                    <MessageCircle size={20} />
                    Modifier
                  </button>
                </div>
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
      )}

      <ConfirmationModal
        visible={showAcceptConfirm}
        title="Accepter la demande"
        message="Voulez-vous accepter cette demande ?"
        onConfirm={handleAccept}
        onCancel={() => setShowAcceptConfirm(false)}
        confirmLabel={loading ? 'Acceptation...' : 'Accepter'}
        cancelLabel="Annuler"
      />

      <ConfirmationModal
        visible={showDeclineConfirm}
        title="Refuser la demande"
        message="Voulez-vous refuser cette demande ?"
        onConfirm={handleDecline}
        onCancel={() => setShowDeclineConfirm(false)}
        confirmLabel={loading ? 'Refus...' : 'Refuser'}
        cancelLabel="Annuler"
      />

      <ConfirmationModal
        visible={showCancelConfirm}
        title="Annuler la demande"
        message="Voulez-vous annuler cette demande envoyée ?"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
        confirmLabel={loading ? 'Annulation...' : 'Oui, annuler'}
        cancelLabel="Non, garder"
      />
    </div>
  )
}

export default MatchRequestDetail
