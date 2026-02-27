import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { scrollToHomeTop } from '../utils/scrollToHomeTop'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Home, Heart, PlusCircle, MessageCircle, User } from 'lucide-react'
import { prefetchRoute } from '../utils/routePrefetch'
import { useAuth } from '../hooks/useSupabase'
import { supabase } from '../lib/supabaseClient'
import { useUnreadCommunicationCounts } from '../hooks/useUnreadCommunicationCounts'
import './Footer.css'

const Footer = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const { counts: unreadCommunicationCounts } = useUnreadCommunicationCounts()

  useEffect(() => {
    if (!user?.id) {
      setUnreadMessagesCount(0)
      return
    }

    let isMounted = true

    const loadUnreadMessagesCount = async () => {
      try {
        const { data: participantRows, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (participantsError) {
          console.error('Error loading participant conversations for footer badge:', participantsError)
        }

        const participantIds = (participantRows || [])
          .map((row) => (row as { conversation_id?: string | null }).conversation_id)
          .filter((id): id is string => Boolean(id))

        const participantFilter = participantIds.length > 0
          ? `,id.in.(${participantIds.join(',')})`
          : ''

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conversationsQuery = (supabase.from('public_conversations_with_users' as any) as any)
        const { data: conversations, error: conversationsError } = await conversationsQuery
          .select('id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id},group_creator_id.eq.${user.id}${participantFilter}`)
          .is('deleted_at', null)

        if (conversationsError) {
          console.error('Error loading conversations for footer unread badge:', conversationsError)
          return
        }

        const conversationIds = ((conversations || []) as Array<{ id?: string | null }>)
          .map((row) => row.id)
          .filter((id): id is string => Boolean(id))

        if (conversationIds.length === 0) {
          if (isMounted) setUnreadMessagesCount(0)
          return
        }

        const { data: stateRows, error: statesError } = await supabase
          .from('conversation_user_states')
          .select('conversation_id, is_archived, deleted_at')
          .eq('user_id', user.id)
          .in('conversation_id', conversationIds)

        if (statesError) {
          console.error('Error loading conversation user states for footer badge:', statesError)
        }

        const hiddenConversationIds = new Set(
          ((stateRows || []) as Array<{
            conversation_id?: string | null
            is_archived?: boolean | null
            deleted_at?: string | null
          }>)
            .filter((row) => Boolean(row.conversation_id) && (row.is_archived || row.deleted_at))
            .map((row) => String(row.conversation_id))
        )

        // Reuse the same RPC as the Messages page so the footer badge matches the list unread indicators.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: summaries, error: summariesError } = await (supabase as any).rpc(
          'get_conversation_summaries',
          {
            conversation_ids: conversationIds,
            viewer_id: user.id
          }
        )

        if (summariesError) {
          console.error('Error loading conversation summaries for footer unread badge:', summariesError)
          return
        }

        const totalUnread = Array.isArray(summaries)
          ? summaries.reduce((sum, row) => {
              if (row?.conversation_id && hiddenConversationIds.has(String(row.conversation_id))) {
                return sum
              }
              const unread = typeof row?.unread_count === 'number' ? row.unread_count : 0
              return sum + (unread > 0 ? 1 : 0)
            }, 0)
          : 0

        if (isMounted) {
          setUnreadMessagesCount(totalUnread)
        }
      } catch (error) {
        console.error('Error computing footer unread messages count:', error)
      }
    }

    const channel = supabase
      .channel(`footer-unread-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadUnreadMessagesCount()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants'
        },
        () => {
          loadUnreadMessagesCount()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_user_states'
        },
        () => {
          loadUnreadMessagesCount()
        }
      )
      .subscribe()

    loadUnreadMessagesCount()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const messagesBadgeTotal =
    unreadMessagesCount +
    unreadCommunicationCounts.request +
    unreadCommunicationCounts.match +
    unreadCommunicationCounts.appointment
  const formattedMessagesBadge =
    messagesBadgeTotal > 99 ? '+99' : String(messagesBadgeTotal)

  const navItems = [
    { path: '/home', icon: Home, label: t('nav.home') },
    { path: '/favorites', icon: Heart, label: t('nav.favorites') },
    { path: '/publish', icon: PlusCircle, label: t('nav.publish') },
    { path: '/messages', icon: MessageCircle, label: t('nav.messages') },
    { path: '/profile', icon: User, label: t('nav.profile') }
  ]

  const isActive = (path: string) => {
    if (path === '/home') {
      return location.pathname === '/' || location.pathname === '/home'
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const handleHomeClick = () => {
    if (location.pathname === '/home' || location.pathname === '/') {
      scrollToHomeTop()
    } else {
      navigate('/home')
    }
  }

  return (
    <footer className="footer">
      {navItems.map((item, index) => {
        const Icon = item.icon
        const active = isActive(item.path)
        const isCenter = index === 2 // L'icône PlusCircle est au centre
        const isHome = item.path === '/home'
        return (
          <motion.button
            key={item.path}
            className={`footer-item ${active ? 'active' : ''} ${isCenter ? 'footer-center' : ''}`}
            onClick={() => (isHome ? handleHomeClick() : navigate(item.path))}
            onMouseEnter={() => prefetchRoute(item.path)}
            onFocus={() => prefetchRoute(item.path)}
            aria-label={item.label}
          >
            {isCenter ? (
              <div className="footer-center-icon-wrapper">
                <Icon size={24} strokeWidth={1.5} />
              </div>
            ) : (
              <div className="footer-icon-wrapper">
                <Icon size={24} strokeWidth={1.5} />
                {item.path === '/messages' && messagesBadgeTotal > 0 && (
                  <span className="footer-badge">
                    {formattedMessagesBadge}
                  </span>
                )}
              </div>
            )}
          </motion.button>
        )
      })}
    </footer>
  )
}

export default Footer
