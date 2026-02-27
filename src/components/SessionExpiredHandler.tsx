import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useSupabase'
import { isPrivatePath } from '../utils/privatePaths'

/**
 * Détecte la perte de session sur une page privée (user passe de connecté à null).
 * Redirige vers login sauf si la déconnexion a été initiée par l'utilisateur.
 */
export function SessionExpiredHandler() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const previousUserRef = useRef<typeof user>(undefined)

  useEffect(() => {
    if (loading) return
    if (location.pathname.startsWith('/auth/')) {
      previousUserRef.current = user
      return
    }
    const hadUser = previousUserRef.current != null
    const lostSession = hadUser && user === null
    if (lostSession && isPrivatePath(location.pathname)) {
      const userInitiatedLogout =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('ollync-logout-initiated') === '1'
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('ollync-logout-initiated')
      }
      if (!userInitiatedLogout) {
        const returnTo = encodeURIComponent(location.pathname + location.search)
        navigate(`/auth/login?returnTo=${returnTo}`, { replace: true })
      }
    }
    previousUserRef.current = user
  }, [loading, user, location.pathname, location.search, navigate])

  return null
}
