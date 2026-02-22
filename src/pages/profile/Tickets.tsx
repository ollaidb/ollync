import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, QrCode, User, X } from 'lucide-react'
import { useAuth } from '../../hooks/useSupabase'
import { supabase } from '../../lib/supabaseClient'
import { EmptyState } from '../../components/EmptyState'
import './Tickets.css'

type TicketTab = 'upcoming' | 'past'
type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

interface TicketItem {
  id: string
  postId: string
  ownerId: string
  ownerName: string
  ownerAvatarUrl: string | null
  title: string
  description: string
  eventDate: string | null
  location: string | null
  locationAddress: string | null
  eventMode: 'in_person' | 'remote' | null
  eventPlatform: string | null
  paymentType: string | null
  requestStatus: RequestStatus
  status: TicketTab
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Non renseigné'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Non renseigné'
  return parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const getRequestStatusLabel = (status: RequestStatus) => {
  if (status === 'accepted') return 'Accepté'
  if (status === 'pending') return 'En attente'
  if (status === 'declined') return 'Refusé'
  return 'Annulé'
}

const toDayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

const buildQrValue = (ticket: TicketItem) => {
  const baseUrl = window.location.origin
  return `${baseUrl}/post/${ticket.postId}?ticketValidation=1&ticketRequest=${encodeURIComponent(ticket.id)}`
}

const Tickets = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TicketTab>('upcoming')
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)

  useEffect(() => {
    const loadTickets = async () => {
      if (!user?.id) {
        setTickets([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data: requestsData, error: requestsError } = await (supabase.from('match_requests') as any)
          .select(`
            id,
            related_post_id,
            to_user_id,
            status,
            request_intent
          `)
          .eq('from_user_id', user.id)
          .eq('request_intent', 'ticket')
          .in('status', ['pending', 'accepted', 'declined', 'cancelled'])
          .order('created_at', { ascending: false })

        if (requestsError) throw requestsError

        if (!requestsData || requestsData.length === 0) {
          setTickets([])
          setLoading(false)
          return
        }

        const postIds = Array.from(new Set(
          (requestsData as Array<{ related_post_id?: string | null }>)
            .map((req) => req.related_post_id)
            .filter((value): value is string => Boolean(value))
        ))

        const ownerIds = Array.from(new Set(
          (requestsData as Array<{ to_user_id: string }>).map((req) => req.to_user_id).filter(Boolean)
        ))

        const { data: postsData, error: postsError } = postIds.length > 0
          ? await supabase
            .from('posts')
            .select('id, title, description, needed_date, location, location_address, event_mode, event_platform, payment_type')
            .in('id', postIds)
          : { data: [], error: null }

        if (postsError) throw postsError

        const { data: ownersData, error: ownersError } = ownerIds.length > 0
          ? await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', ownerIds)
          : { data: [], error: null }

        if (ownersError) throw ownersError

        const postsMap = new Map(
          ((postsData || []) as Array<Record<string, unknown>>).map((post) => [String(post.id), post])
        )
        const ownersMap = new Map(
          ((ownersData || []) as Array<Record<string, unknown>>).map((profile) => [String(profile.id), profile])
        )

        const todayStart = toDayStart(new Date())

        const formatted = ((requestsData || []) as Array<Record<string, unknown>>)
          .map((request) => {
            const postId = String(request.related_post_id || '')
            const post = postsMap.get(postId)
            if (!post) return null

            const ownerId = String(request.to_user_id || '')
            const owner = ownersMap.get(ownerId)

            const eventDateRaw = (post.needed_date as string | null) || null
            const eventDateValue = eventDateRaw ? new Date(eventDateRaw) : null
            const eventIsPast = Boolean(
              eventDateValue && !Number.isNaN(eventDateValue.getTime()) && toDayStart(eventDateValue) < todayStart
            )

            return {
              id: String(request.id),
              postId,
              ownerId,
              ownerName: String(owner?.full_name || owner?.username || 'Utilisateur'),
              ownerAvatarUrl: owner?.avatar_url ? String(owner.avatar_url) : null,
              title: String(post.title || 'Annonce événement'),
              description: String(post.description || ''),
              eventDate: eventDateRaw,
              location: post.location ? String(post.location) : null,
              locationAddress: post.location_address ? String(post.location_address) : null,
              eventMode: (post.event_mode as 'in_person' | 'remote' | null) || null,
              eventPlatform: post.event_platform ? String(post.event_platform) : null,
              paymentType: post.payment_type ? String(post.payment_type) : null,
              requestStatus: (request.status as RequestStatus) || 'pending',
              status: eventIsPast ? 'past' : 'upcoming'
            } as TicketItem
          })
          .filter((ticket): ticket is TicketItem => Boolean(ticket))

        setTickets(formatted)
      } catch (error) {
        console.error('Error loading tickets:', error)
        setTickets([])
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [user?.id])

  const filteredTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === activeTab),
    [activeTab, tickets]
  )

  const canShowQr = useMemo(() => {
    if (!selectedTicket) return false
    if (selectedTicket.requestStatus !== 'accepted') return false
    if (selectedTicket.eventMode !== 'in_person') return false
    if (selectedTicket.paymentType === 'remuneration') return false
    return true
  }, [selectedTicket])

  const qrImageUrl = useMemo(() => {
    if (!selectedTicket || !canShowQr) return ''
    const value = encodeURIComponent(buildQrValue(selectedTicket))
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${value}`
  }, [canShowQr, selectedTicket])

  return (
    <div className="tickets-page">
      <div className="tickets-tabs">
        <button
          type="button"
          className={`tickets-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          A venir
        </button>
        <button
          type="button"
          className={`tickets-tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Passés
        </button>
      </div>

      <div className="tickets-list">
        {loading ? (
          <div className="tickets-empty">
            <p>Chargement des billets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <EmptyState
            type="category"
            customTitle={activeTab === 'upcoming' ? 'Ta prochaine place t’attend.' : 'Garde l’élan, vise le prochain billet.'}
            customSubtext={
              activeTab === 'upcoming'
                ? 'Découvre les événements et réserve ton billet en quelques secondes.'
                : 'Retrouve de nouveaux événements à rejoindre dès maintenant.'
            }
            actionLabel="Voir les événements"
            onAction={() => navigate('/search?category=evenements')}
            marketing
            marketingTone={activeTab === 'upcoming' ? 'orange' : 'blue'}
          />
        ) : (
          filteredTickets.map((ticket) => {
            const isAccepted = ticket.requestStatus === 'accepted'
            return (
              <button
                type="button"
                className="ticket-card"
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="ticket-card-header">
                  <div className="ticket-title-wrap">
                    <div className={`ticket-status-dot ${isAccepted ? 'accepted' : 'pending'}`} />
                    <div className="ticket-title">{ticket.title}</div>
                  </div>
                  <div className={`ticket-status-pill ${ticket.requestStatus}`}>
                    {getRequestStatusLabel(ticket.requestStatus)}
                  </div>
                </div>
                <div className="ticket-meta">
                  <span className="ticket-meta-row">
                    <CalendarDays size={13} />
                    {formatDate(ticket.eventDate)}
                  </span>
                  <span className="ticket-meta-row">
                    <MapPin size={13} />
                    {ticket.eventMode === 'remote' ? (ticket.eventPlatform || 'Événement à distance') : (ticket.location || 'Lieu non précisé')}
                  </span>
                </div>
                <div className="ticket-card-footer">
                  <span className="ticket-mode-chip">
                    {ticket.eventMode === 'remote' ? 'À distance' : 'Présentiel'}
                  </span>
                  <span className="ticket-open-hint">Voir le billet</span>
                </div>
              </button>
            )
          })
        )}
      </div>

      {selectedTicket && (
        <div className="ticket-detail-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="ticket-detail-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="ticket-detail-close" onClick={() => setSelectedTicket(null)}>
              <X size={18} />
            </button>

            <div className="ticket-detail-header">
              <div className={`ticket-status-dot ${selectedTicket.requestStatus === 'accepted' ? 'accepted' : 'pending'}`} />
              <h3>{selectedTicket.title}</h3>
            </div>

            <div className="ticket-detail-grid">
              <div className="ticket-detail-row">
                <span className="ticket-detail-label"><CalendarDays size={14} /> Date de l'événement</span>
                <span className="ticket-detail-value">{formatDate(selectedTicket.eventDate)}</span>
              </div>

              <div className="ticket-detail-row">
                <span className="ticket-detail-label"><User size={14} /> Organisateur</span>
                <button
                  type="button"
                  className="ticket-detail-link"
                  onClick={() => navigate(`/profile/public/${selectedTicket.ownerId}`)}
                >
                  {selectedTicket.ownerName}
                </button>
              </div>

              <div className="ticket-detail-row">
                <span className="ticket-detail-label">Annonce</span>
                <button
                  type="button"
                  className="ticket-detail-link"
                  onClick={() => navigate(`/post/${selectedTicket.postId}`)}
                >
                  {selectedTicket.title}
                </button>
              </div>

              <div className="ticket-detail-row ticket-detail-row-block">
                <span className="ticket-detail-label">Description</span>
                <p className="ticket-detail-description">{selectedTicket.description || 'Aucune description.'}</p>
              </div>

              <div className="ticket-detail-row ticket-detail-row-block">
                <span className="ticket-detail-label"><MapPin size={14} /> Lieu / accès</span>
                {selectedTicket.eventMode === 'remote' ? (
                  <p className="ticket-detail-description">
                    Événement à distance
                    {selectedTicket.eventPlatform ? ` • Plateforme: ${selectedTicket.eventPlatform}` : ''}
                  </p>
                ) : (
                  <p className="ticket-detail-description">
                    {selectedTicket.location || selectedTicket.locationAddress || 'Adresse non renseignée'}
                  </p>
                )}
              </div>
            </div>

            {canShowQr && (
              <div className="ticket-qr-section">
                <div className="ticket-qr-title"><QrCode size={16} /> QR code d'accès</div>
                <img src={qrImageUrl} alt="QR code accès événement" className="ticket-qr-image" />
              </div>
            )}

            {selectedTicket.requestStatus === 'accepted' && selectedTicket.paymentType === 'remuneration' && (
              <div className="ticket-info-banner">
                Le QR code sera disponible après confirmation du paiement.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Tickets
