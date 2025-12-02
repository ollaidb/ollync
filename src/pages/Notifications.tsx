import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Bell, Image, FileText, Loader } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import HeaderMinimal from '../components/HeaderMinimal'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import { useAuth } from '../hooks/useSupabase'
import './Notifications.css'

interface Notification {
  id: string
  type: string
  title: string
  content?: string | null
  related_id?: string | null
  read: boolean
  created_at: string
  sender?: {
    avatar_url?: string | null
  } | null
}

const Notifications = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

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
        if (notification.related_id) {
          navigate(`/post/${notification.related_id}`)
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
      default:
        break
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    const unreadIds = notifications
      .filter((n) => !n.read)
      .map((n) => n.id)

    if (unreadIds.length === 0) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('notifications') as any)
      .update({ read: true })
      .in('id', unreadIds)

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} />
      case 'comment':
        return <MessageCircle size={20} />
      case 'follow':
        return <UserPlus size={20} />
      case 'message':
        return <MessageCircle size={20} />
      case 'advertisement':
        return <Image size={20} />
      case 'new_post':
        return <FileText size={20} />
      default:
        return <Bell size={20} />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`
  }

  if (!user) {
    return (
      <div className="app">
        <HeaderMinimal />
        <main className="main-content without-header">
          <div className="notifications-page">
            <div className="empty-state">
              <Bell size={64} />
              <h2>Vous n'êtes pas connecté</h2>
              <p>Connectez-vous pour voir vos notifications</p>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/auth/login')}
              >
                Se connecter
              </button>
            </div>
          </div>
        </main>
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
            {notifications.filter((n) => !n.read).length > 0 ? (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                title="Tout marquer comme lu"
              >
                Tout marquer comme lu
              </button>
            ) : (
              <div className="notifications-header-spacer"></div>
            )}
          </div>
        </div>

        {/* Zone scrollable */}
        <div className="notifications-scrollable">

          {loading ? (
            <div className="loading-container">
              <Loader className="spinner-large" size={48} />
              <p>Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
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
                    <div className="notification-time">
                      {formatTimeAgo(notification.created_at)}
                    </div>
                  </div>
                  {!notification.read && <div className="notification-dot" />}
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

export default Notifications

