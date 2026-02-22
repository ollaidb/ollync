import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useSupabase'

export type CommunicationNotificationType = 'message' | 'request' | 'match' | 'appointment'

type CommunicationCounts = Record<CommunicationNotificationType, number>

const EMPTY_COUNTS: CommunicationCounts = {
  message: 0,
  request: 0,
  match: 0,
  appointment: 0
}

const COMM_TYPES: CommunicationNotificationType[] = ['message', 'request', 'match', 'appointment']

export const useUnreadCommunicationCounts = () => {
  const { user } = useAuth()
  const [counts, setCounts] = useState<CommunicationCounts>(EMPTY_COUNTS)

  useEffect(() => {
    if (!user?.id) {
      setCounts(EMPTY_COUNTS)
      return
    }

    let isMounted = true

    const loadCounts = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('type')
        .eq('user_id', user.id)
        .eq('read', false)
        .in('type', COMM_TYPES)

      if (error) {
        console.error('Error loading unread communication counts:', error)
        return
      }

      const next: CommunicationCounts = {
        message: 0,
        request: 0,
        match: 0,
        appointment: 0
      }

      ;((data || []) as Array<{ type?: string | null }>).forEach((row) => {
        const type = row.type
        if (type === 'message' || type === 'request' || type === 'match' || type === 'appointment') {
          next[type] += 1
        }
      })

      if (isMounted) {
        setCounts(next)
      }
    }

    const channel = supabase
      .channel(`unread-communication-counts-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadCounts()
        }
      )
      .subscribe()

    loadCounts()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const total = useMemo(
    () => counts.message + counts.request + counts.match + counts.appointment,
    [counts]
  )

  const markTypesAsRead = useCallback(async (types: CommunicationNotificationType[]) => {
    if (!user?.id || types.length === 0) return

    const uniqueTypes = Array.from(new Set(types))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('notifications') as any)
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .in('type', uniqueTypes)

    if (error) {
      console.error('Error marking communication notifications as read:', error)
      return
    }

    setCounts((prev) => {
      const next = { ...prev }
      uniqueTypes.forEach((type) => {
        next[type] = 0
      })
      return next
    })
  }, [user?.id])

  return { counts, total, markTypesAsRead }
}
