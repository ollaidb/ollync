import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Bell, Image, FileText, Loader, CheckCircle, XCircle, Send, UserCheck, Star, Calendar, Inbox, FileSignature } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabaseClient'
import { AuthBackground } from '../components/Auth/AuthBackground'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import { useAuth } from '../hooks/useSupabase'
import { useIsMobile } from '../hooks/useIsMobile'
import { EmptyState } from '../components/EmptyState'
import { PullToRefresh } from '../components/PullToRefresh/PullToRefresh'
import { PageMeta } from '../components/PageMeta'
import './Auth.css'
import './Notifications.css'

type FilterType = 'all' | 'like' | 'message' | 'request' | 'match' | 'appointment' | 'review' | 'news'

const SYSTEM_SENDER_EMAIL = 'binta22116@gmail.com'
const SYSTEM_SENDER_NAME = 'Ollync'
const isSystemSenderEmail = (email?: string | null) =>
  (email || '').trim().toLowerCase() === SYSTEM_SENDER_EMAIL

interface Notification {
  id: string
  type: string
  title: string
  content?: string | null
  related_id?: string | null
  read: boolean
  created_at: string
  sender_id?: string | null
  metadata?: {
    conversation_id?: string | null
    is_group?: boolean | null
    appointment_id?: string | null
  } | null
  sender?: {
    avatar_url?: string | null
    full_name?: string | null
    username?: string | null
    email?: string | null
  } | null
}

const Notifications = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const { t, i18n } = useTranslation(['notifications', 'common'])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const isInFilter = useCallback((notification: Notification, filter: FilterType) => {
    if (filter === 'all') return true
    if (filter === 'like') return notification.type === 'like'
    if (filter === 'message') return notification.type === 'message'
    if (filter === 'review') return notification.type === 'review' || notification.type === 'comment'
    if (filter === 'match') return notification.type === 'match_request_accepted'
    if (filter === 'appointment') return notification.type === 'appointment' || notification.type === 'appointment_cancelled'
    if (filter === 'request') {
      return (
        notification.type === 'match_request_received' ||
        notification.type === 'match_request_sent' ||
        notification.type === 'match_request_declined' ||
        notification.type === 'application_received' ||
        notification.type === 'application_accepted' ||
        notification.type === 'application_declined' ||
        notification.type === 'application_sent' ||
        notification.type === 'contract_created' ||
        notification.type === 'contract_signature_required' ||
        notification.type === 'contract_signed'
      )
    }
    if (filter === 'news') {
      return (
        notification.type === 'new_post' ||
        notification.type === 'post_updated' ||
        notification.type === 'post_closed' ||
        notification.type === 'post_expiring'
      )
    }
    return true
  }, [])

  const formatUnreadCount = useCallback((count: number) => {
    return count > 99 ? '+99' : String(count)
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*, sender:profiles!notifications_sender_id_fkey(avatar_url, full_name, username, email)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching notifications:', error)
    } else {
      setNotifications(data || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
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
      case 'post_expiring':
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
        if (notification.metadata?.conversation_id) {
          navigate(`/messages/${notification.metadata.conversation_id}`)
        } else {
          navigate('/messages')
        }
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
      case 'appointment_cancelled':
        if (notification.metadata?.conversation_id) {
          navigate(`/messages/${notification.metadata.conversation_id}?filter=appointments`)
        } else {
          navigate('/messages?filter=appointments')
        }
        break
      case 'group_added':
        if (notification.metadata?.conversation_id) {
          navigate(`/messages/${notification.metadata.conversation_id}`)
        } else {
          navigate('/messages')
        }
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
      case 'appointment_cancelled':
        return <Calendar size={18} />
      case 'group_added':
        return <UserPlus size={18} />
      case 'post_updated':
        return <FileText size={18} />
      case 'post_closed':
        return <XCircle size={18} />
      case 'post_expiring':
        return <FileText size={18} />
      case 'welcome':
        return <Bell size={18} />
      default:
        return <Bell size={18} />
    }
  }

  // Formater la date pour l'affichage (Aujourd'hui, Hier, ou date complète)
  const formatDateHeader = useCallback((dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (notificationDate.getTime() === today.getTime()) {
      return t('notifications:today')
    } else if (notificationDate.getTime() === yesterday.getTime()) {
      return t('notifications:yesterday')
    }
    return new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long' }).format(date)
  }, [i18n.language, t])

  const getNotificationTitle = (notification: Notification) => {
    if (notification.title && notification.title.trim().length > 0) {
      const trimmedTitle = notification.title.trim()
      if (isSystemSenderEmail(notification.sender?.email)) {
        if (notification.type === 'message') {
          return `${SYSTEM_SENDER_NAME} vous a envoyé un message`
        }

        const senderName = notification.sender?.full_name || notification.sender?.username
        if (senderName && trimmedTitle.includes(senderName)) {
          return trimmedTitle.replace(senderName, SYSTEM_SENDER_NAME)
        }
      }
      return trimmedTitle
    }
    return t(`notifications:types.${notification.type}`, {
      defaultValue: ''
    })
  }

  // Filtrer les notifications selon le filtre actif
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => isInFilter(notification, activeFilter))
  }, [notifications, activeFilter, isInFilter])

  const unreadCountsByFilter = useMemo(() => {
    const filters: FilterType[] = ['all', 'like', 'message', 'request', 'match', 'appointment', 'review', 'news']
    const entries = filters.map((filter) => {
      const unreadCount = notifications.reduce((acc, notification) => {
        if (!notification.read && isInFilter(notification, filter)) {
          return acc + 1
        }
        return acc
      }, 0)
      return [filter, unreadCount] as const
    })

    return Object.fromEntries(entries) as Record<FilterType, number>
  }, [notifications, isInFilter])

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
  }, [filteredNotifications, formatDateHeader])

  if (!user) {
    return (
      <>
        <PageMeta title={t('common:meta.notifications.title')} description={t('common:meta.notifications.description')} />
        <div className="auth-page-wrap">
        <AuthBackground />
        <div className="auth-page">
          <div className="notifications-page-container">
            <div className="notifications-header-not-connected">
              <h1 className="notifications-title-centered">{t('notifications:title')}</h1>
            </div>
            <div className="notifications-content-not-connected">
              <Bell className="notifications-not-connected-icon" strokeWidth={1.5} />
              <h2 className="notifications-not-connected-title">{t('notifications:notConnectedTitle')}</h2>
              <p className="notifications-not-connected-text">{t('notifications:notConnectedText')}</p>
              <button
                className="notifications-not-connected-button"
                onClick={() => navigate('/auth/register')}
              >
                {t('notifications:register')}
              </button>
              <p className="notifications-not-connected-login-link">
                {t('notifications:alreadyAccount')}{' '}
                <button
                  className="notifications-not-connected-link"
                  onClick={() => navigate('/auth/login')}
                >
                  {t('notifications:signIn')}
                </button>
              </p>
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </>
    )
  }

  return (
    <>
      <PageMeta title={t('common:meta.notifications.title')} description={t('common:meta.notifications.description')} />
      <div className="app">
      <div className="notifications-page">
        {/* Header fixe */}
        <div className="notifications-header-fixed">
          <div className="notifications-header-content">
            <BackButton to="/home" />
            <h1 className="notifications-title">{t('notifications:title')}</h1>
            <div className="notifications-header-spacer"></div>
          </div>
          
          {/* Menu de filtres */}
          <div className="notifications-filters">
            <button
              className={`notifications-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              {t('notifications:filters.all')}
              {unreadCountsByFilter.all > 0 && (
                <span className="notifications-filter-count">{formatUnreadCount(unreadCountsByFilter.all)}</span>
              )}
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'like' ? 'active' : ''}`}
              onClick={() => setActiveFilter('like')}
            >
              <Heart size={16} />
              {t('notifications:filters.like')}
              {unreadCountsByFilter.like > 0 && (
                <span className="notifications-filter-count">{formatUnreadCount(unreadCountsByFilter.like)}</span>
              )}
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'message' ? 'active' : ''}`}
              onClick={() => setActiveFilter('message')}
            >
              <MessageCircle size={16} />
              {t('notifications:filters.message')}
              {unreadCountsByFilter.message > 0 && (
                <span className="notifications-filter-count">{formatUnreadCount(unreadCountsByFilter.message)}</span>
              )}
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'request' ? 'active' : ''}`}
              onClick={() => setActiveFilter('request')}
            >
              <Inbox size={16} />
              {t('notifications:filters.request')}
              {unreadCountsByFilter.request > 0 && (
                <span className="notifications-filter-count">{formatUnreadCount(unreadCountsByFilter.request)}</span>
              )}
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'match' ? 'active' : ''}`}
              onClick={() => setActiveFilter('match')}
            >
              <UserCheck size={16} />
              {t('notifications:filters.match')}
              {unreadCountsByFilter.match > 0 && (
                <span className="notifications-filter-count">{formatUnreadCount(unreadCountsByFilter.match)}</span>
              )}
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'appointment' ? 'active' : ''}`}
              onClick={() => setActiveFilter('appointment')}
            >
              <Calendar size={16} />
              {t('notifications:filters.appointment')}
              {unreadCountsByFilter.appointment > 0 && (
                <span className="notifications-filter-count">{formatUnreadCount(unreadCountsByFilter.appointment)}</span>
              )}
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'review' ? 'active' : ''}`}
              onClick={() => setActiveFilter('review')}
            >
              <Star size={16} />
              {t('notifications:filters.review')}
              {unreadCountsByFilter.review > 0 && (
                <span className="notifications-filter-count">{formatUnreadCount(unreadCountsByFilter.review)}</span>
              )}
            </button>
            <button
              className={`notifications-filter-btn ${activeFilter === 'news' ? 'active' : ''}`}
              onClick={() => setActiveFilter('news')}
            >
              <FileText size={16} />
              {t('notifications:filters.news')}
              {unreadCountsByFilter.news > 0 && (
                <span className="notifications-filter-count">{formatUnreadCount(unreadCountsByFilter.news)}</span>
              )}
            </button>
          </div>
        </div>

        {/* Zone scrollable */}
        <PullToRefresh onRefresh={fetchNotifications} className="notifications-scrollable" enabled={isMobile} loading={loading}>

          {loading ? (
            <div className="loading-container">
              <Loader className="spinner-large" size={48} />
              <p>{t('notifications:loading')}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              type="notifications"
              customTitle="Tout commence quand tu passes à l’action."
              customSubtext="Publie, postule, échange : tes notifications arrivent ici."
              actionLabel="Voir les annonces récentes"
              onAction={() => navigate('/recent')}
              marketing
              marketingTone="orange"
            />
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
                      <div className="notification-content">
                        <div className="notification-title-row">
                          <div className="notification-icon">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="notification-title">{getNotificationTitle(notification)}</div>
                        </div>
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
        </PullToRefresh>
      </div>
    </div>
    </>
  )
}

export default Notifications
