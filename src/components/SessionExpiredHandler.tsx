import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useSupabase'
import { useToastContext } from '../contexts/ToastContext'
import { isPrivatePath } from '../utils/privatePaths'

const SESSION_EXPIRED_MESSAGE = 'Votre session a expiré, veuillez vous reconnecter.'

/**
 * Détecte la perte de session sur une page privée (user passe de connecté à null)
 * et redirige vers /auth/login avec returnTo.
 */
export function SessionExpiredHandler() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { showInfo } = useToastContext()
  const previousUserRef = useRef<typeof user>(undefined)

  useEffect(() => {
    if (loading) return
    // Ne rien faire si on est déjà sur une page auth
    if (location.pathname.startsWith('/auth/')) {
      previousUserRef.current = user
      return
    }
    const hadUser = previousUserRef.current != null
    const lostSession = hadUser && user === null
    if (lostSession && isPrivatePath(location.pathname)) {
      showInfo(SESSION_EXPIRED_MESSAGE, 4000)
      const returnTo = encodeURIComponent(location.pathname + location.search)
      navigate(`/auth/login?returnTo=${returnTo}`, { replace: true })
    }
    previousUserRef.current = user
  }, [loading, user, location.pathname, location.search, navigate, showInfo])

  return null
}
