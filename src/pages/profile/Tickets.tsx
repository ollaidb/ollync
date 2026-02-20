import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useSupabase'
import { supabase } from '../../lib/supabaseClient'
import { EmptyState } from '../../components/EmptyState'
import './Tickets.css'

type TicketStatus = 'upcoming' | 'past'

interface TicketItem {
  id: string
  title: string
  dateLabel: string
  location: string
  status: TicketStatus
}

const Tickets = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TicketStatus>('upcoming')
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTickets = async () => {
      if (!user) return
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('event_tickets' as never)
          .select('id, title, event_date, location, status')
          .eq('user_id', user.id)
          .order('event_date', { ascending: true })

        if (error) throw error

        const formatted = ((data || []) as Array<Record<string, unknown>>).map((ticket) => ({
          id: String(ticket.id),
          title: String(ticket.title || 'Billet'),
          dateLabel: new Date(String(ticket.event_date)).toLocaleDateString('fr-FR'),
          location: String(ticket.location || 'Lieu non précisé'),
          status: (ticket.status === 'past' ? 'past' : 'upcoming') as TicketStatus
        }))
        setTickets(formatted)
      } catch (error) {
        console.error('Error loading tickets:', error)
        setTickets([])
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [user])

  const filteredTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === activeTab),
    [activeTab, tickets]
  )

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
          filteredTickets.map((ticket) => (
            <div className="ticket-card" key={ticket.id}>
              <div className="ticket-title">{ticket.title}</div>
              <div className="ticket-meta">
                <span>{ticket.dateLabel}</span>
                <span>{ticket.location}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Tickets
