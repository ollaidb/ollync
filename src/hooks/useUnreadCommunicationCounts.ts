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

// Types réels en base (match_request_received, match_request_accepted) vs types de l'app (request, match)
const NOTIFICATION_TYPES_TO_QUERY = [
  'message',
  'match_request_received', // → request (demandes reçues)
  'match_request_accepted', // → match (demandes acceptées)
  'appointment'
]

const mapDbTypeToAppType = (dbType: string | null | undefined): CommunicationNotificationType | null => {
  if (dbType === 'message' || dbType === 'appointment') return dbType
  if (dbType === 'match_request_received') return 'request'
  if (dbType === 'match_request_accepted') return 'match'
  return null
}

export const useUnreadCommunicationCounts = () => {
  const { user } = useAuth()
  const [counts, setCounts] = useState<CommunicationCounts>(EMPTY_COUNTS)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  useEffect(() => {
    if (!user?.id) {
      setCounts(EMPTY_COUNTS)
      setPendingRequestsCount(0)
      return
    }

    let isMounted = true

    const loadCounts = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('type')
        .eq('user_id', user.id)
        .eq('read', false)
        .in('type', NOTIFICATION_TYPES_TO_QUERY)

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
        const appType = mapDbTypeToAppType(row.type)
        if (appType) next[appType] += 1
      })

      if (isMounted) {
        setCounts(next)
      }
    }

    // Requête légère : nombre de demandes en attente (envoyées + reçues)
    // S'exécute au chargement comme pour les matchs, pour affichage immédiat du badge Demandes
    const loadPendingRequestsCount = async () => {
      const { count, error } = await supabase
        .from('match_requests')
        .select('*', { count: 'exact', head: true })
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .eq('status', 'pending')

      if (error) {
        console.error('Error loading pending requests count:', error)
        return
      }
      if (isMounted) {
        setPendingRequestsCount(count ?? 0)
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_requests'
        },
        () => {
          loadPendingRequestsCount()
        }
      )
      .subscribe()

    loadCounts()
    loadPendingRequestsCount()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const total = useMemo(
    () => counts.message + counts.request + counts.match + counts.appointment,
    [counts]
  )

  const mapAppTypeToDbTypes = (appType: CommunicationNotificationType): string[] => {
    if (appType === 'request') return ['match_request_received']
    if (appType === 'match') return ['match_request_accepted']
    return [appType]
  }

  const markTypesAsRead = useCallback(async (types: CommunicationNotificationType[]) => {
    if (!user?.id || types.length === 0) return

    const uniqueTypes = Array.from(new Set(types))
    const dbTypes = uniqueTypes.flatMap(mapAppTypeToDbTypes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('notifications') as any)
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .in('type', dbTypes)

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

  return { counts, total, markTypesAsRead, pendingRequestsCount }
}
