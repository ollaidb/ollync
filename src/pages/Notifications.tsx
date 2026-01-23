import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Bell, Image, FileText, Loader, CheckCircle, XCircle, Send, UserCheck, Star, Calendar, Inbox, FileSignature } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import { useAuth } from '../hooks/useSupabase'
import { EmptyState } from '../components/EmptyState'
import './Notifications.css'

type FilterType = 'all' | 'like' | 'message' | 'request' | 'match' | 'appointment' | 'review' | 'news'

interface Notification {
  id: string
  type: string
  title: string
  content?: string | null
  related_id?: string | null
  read: boolean
  created_at: string
  sender_id?: string | null
  sender?: {
    avatar_url?: string | null
  } | null
}

const Notifications = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching notifications:', error)
      } else {
        setNotifications(data || [])
      }
      setLoading(false)
    }

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    fetchNotifications()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const markAsRead = async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('notifications') as any)
      .update({ read: true })
      .eq('id', id)

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)

    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'new_post':
      case 'post_updated':
      case 'post_closed':
        if (notification.related_id) {
          navigate(`/post/${notification.related_id}`)
        }
        break
      case 'review':
        if (notification.related_id) {
          navigate(`/profile/${notification.related_id}`)
        } else {
          navigate('/profile')
        }
        break
      case 'message':
        navigate('/messages')
        break
      case 'follow':
        if (notification.related_id) {
          navigate(`/profile/${notification.related_id}`)
        }
        break
      case 'match_request_received':
        // Les demandes reçues sont gérées dans Notifications
        // L'utilisateur peut accepter/refuser depuis ici
        // Pour l'instant, rediriger vers Messages où on pourra gérer la demande
        // TODO: Ajouter un modal pour accepter/refuser directement depuis les notifications
        navigate('/messages?filter=match_requests')
        break
      case 'match_request_accepted':
        // Notification quand quelqu'un a accepté notre demande
        // Rediriger vers Messages > Matchs pour voir le match accepté
        navigate('/messages?filter=matches')
        break
      case 'match_request_declined':
      case 'match_request_sent':
        // Rediriger vers Messages > Demandes pour voir les demandes envoyées
        navigate('/messages?filter=match_requests')
        break
      case 'application_received':
      case 'application_accepted':
      case 'application_declined':
      case 'application_sent':
        if (notification.related_id) {
          navigate(`/post/${notification.related_id}`)
        }
        break
      case 'contract_created':
      case 'contract_signature_required':
      case 'contract_signed':
        navigate('/profile/contracts')
        break
      case 'appointment':
        navigate('/messages?filter=appointments')
        break
      case 'group_added':
        navigate('/messages')
        break
      case 'welcome':
        navigate('/')
        break
      default:
        break
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={18} />
      case 'comment':
        return <MessageCircle size={18} />
      case 'review':
        return <Star size={18} />
      case 'follow':
        return <UserPlus size={18} />
      case 'message':
        return <MessageCircle size={18} />
      case 'advertisement':
        return <Image size={18} />
      case 'new_post':
        return <FileText size={18} />
      case 'match_request_sent':
        return <Send size={18} />
      case 'match_request_received':
        return <UserCheck size={18} />
      case 'match_request_accepted':
        return <CheckCircle size={18} />
      case 'match_request_declined':
        return <XCircle size={18} />
      case 'application_sent':
        return <Send size={18} />
      case 'application_received':
        return <UserCheck size={18} />
      case 'application_accepted':
        return <CheckCircle size={18} />
      case 'application_declined':
        return <XCircle size={18} />
      case 'contract_created':
      case 'contract_signature_required':
      case 'contract_signed':
        return <FileSignature size={18} />
      case 'appointment':
        return <Calendar size={18} />
      case 'group_added':
        return <UserPlus size={18} />
      case 'post_updated':
        return <FileText size={18} />
      case 'post_closed':
        return <XCircle size={18} />
      case 'welcome':
        return <Bell size={18} />
      default:
        return <Bell size={18} />
    }
  }

  // Formater la date pour l'affichage (Aujourd'hui, Hier, ou date complète)
  const formatDateHeader = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (notificationDate.getTime() === today.getTime()) {
      return "Aujourd'hui"
    } else if (notificationDate.getTime() === yesterday.getTime()) {
      return "Hier"
    } else {
      // Format: "3 avril" ou "27 mars"
      const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
      ]
      return `${date.getDate()} ${months[date.getMonth()]}`
    }
  }

  // Filtrer les notifications selon le filtre actif
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') {
      return notifications
    } else if (activeFilter === 'like') {
      return notifications.filter(n => n.type === 'like')
    } else if (activeFilter === 'message') {
      return notifications.filter(n => n.type === 'message')
    } else if (activeFilter === 'review') {
      return notifications.filter(n => n.type === 'review' || n.type === 'comment')
    } else if (activeFilter === 'match') {
      return notifications.filter(n => 
        n.type === 'match_request_accepted'
      )
    } else if (activeFilter === 'appointment') {
      return notifications.filter(n => n.type === 'appointment')
    } else if (activeFilter === 'request') {
      return notifications.filter(n =>
        n.type === 'match_request_received' ||
        n.type === 'match_request_sent' ||
        n.type === 'match_request_declined' ||
        n.type === 'application_received' ||
        n.type === 'application_accepted' ||
        n.type === 'application_declined' ||
        n.type === 'application_sent' ||
        n.type === 'contract_created' ||
        n.type === 'contract_signature_required' ||
        n.type === 'contract_signed'
      )
    } else if (activeFilter === 'news') {
      return notifications.filter(n => 
        n.type === 'new_post' || 
        n.type === 'post_updated' || 
        n.type === 'post_closed'
      )
    }
    return notifications
  }, [notifications, activeFilter])

  // Grouper les notifications par date
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {}
    
    filteredNotifications.forEach(notification => {
      const dateKey = formatDateHeader(notification.created_at)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(notification)
    })

    // Convertir en tableau et trier par date (plus récent en premier)
    return Object.entries(groups).sort((a, b) => {
      // Trier par date de la première notification du groupe
      const dateA = new Date(a[1][0].created_at).getTime()
      const dateB = new Date(b[1][0].created_at).getTime()
      return dateB - dateA
    })
  }, [filteredNotifications])

  if (!user) {
    return (
      <div className="notifications-page-container">
        <div className="notifications-header-not-connected">
          <h1 className="notifications-title-centered">Notifications</h1>
        </div>
        <div className="notifications-content-not-connected">
          <Bell className="notifications-not-connected-icon" strokeWidth={1.5} />
          <h2 className="notifications-not-connected-title">Vous n'êtes pas connecté</h2>
          <p className="notifications-not-connected-text">Connectez-vous pour accéder à vos notifications</p>
          <button 
            className="notifications-not-connected-button" 
            onClick={() => navigate('/auth/register')}
          >
            S'inscrire
          </button>
          <p className="notifications-not-connected-login-link">
            Déjà un compte ?{' '}
            <button 
              className="notifications-not-connected-link" 
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

  return (
    <div className="app">
      <div className="notifications-page">
        {/* Header fixe */}
        <div className="notifications-header-fixed">
          <div className="notifications-header-content">
            <BackButton />
            <h1 className="notifications-title">Notifications</h1>
            <div className="notifications-header-spacer"></div>
          </div>
          
          {/* Menu de filtres */}
          <div className="notifications-filters">
            <button
              className={`notifications-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              Tout
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'like' ? 'active' : ''}`}
              onClick={() => setActiveFilter('like')}
            >
              <Heart size={16} />
              Like
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'message' ? 'active' : ''}`}
              onClick={() => setActiveFilter('message')}
            >
              <MessageCircle size={16} />
              Message
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'request' ? 'active' : ''}`}
              onClick={() => setActiveFilter('request')}
            >
              <Inbox size={16} />
              Demande
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'match' ? 'active' : ''}`}
              onClick={() => setActiveFilter('match')}
            >
              <UserCheck size={16} />
              Match
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'appointment' ? 'active' : ''}`}
              onClick={() => setActiveFilter('appointment')}
            >
              <Calendar size={16} />
              Rendez-vous
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'review' ? 'active' : ''}`}
              onClick={() => setActiveFilter('review')}
            >
              <Star size={16} />
              Review
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'news' ? 'active' : ''}`}
              onClick={() => setActiveFilter('news')}
            >
              <FileText size={16} />
              Actualité
            </button>
          </div>
        </div>

        {/* Zone scrollable */}
        <div className="notifications-scrollable">

          {loading ? (
            <div className="loading-container">
              <Loader className="spinner-large" size={48} />
              <p>Chargement...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <EmptyState type="notifications" />
          ) : (
            <div className="notifications-list">
              {groupedNotifications.map(([dateHeader, dateNotifications]) => (
                <div key={dateHeader} className="notifications-date-group">
                  <div className="notifications-date-header">{dateHeader}</div>
                  {dateNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        {notification.content && (
                          <div className="notification-text">{notification.content}</div>
                        )}
                      </div>
                      {!notification.read && <div className="notification-dot" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Notifications

