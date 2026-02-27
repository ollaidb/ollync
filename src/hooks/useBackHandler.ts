import { useNavigate, useLocation } from 'react-router-dom'
import { useNavigationHistory } from './useNavigationHistory'

export interface BackHandlerOptions {
  /** Override: navigate to this path instead of using default back logic */
  to?: string
  /** Override: call this instead of navigating */
  onClick?: () => void
}

/**
 * Hook that returns the same back navigation logic as BackButton.
 * Used by BackButton and SwipeBack for consistent behavior.
 */
export function useBackHandler(options: BackHandlerOptions = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { getPreviousPath, markNavigatingBack, canGoBack } = useNavigationHistory()

  const handleBack = () => {
    if (options.onClick) {
      options.onClick()
      return
    }

    if (options.to) {
      markNavigatingBack()
      navigate(options.to)
      return
    }

    const path = location.pathname
    const pathParts = path.split('/').filter(Boolean)
    const mainTabRoots = [
      '/home',
      '/favorites',
      '/likes',
      '/publish',
      '/publier-annonce',
      '/messages',
      '/profile',
      '/search'
    ]
    const isMainTabRoot = mainTabRoots.includes(path)

    if (path.startsWith('/profile/')) {
      const previousPath = getPreviousPath()
      const state = location.state as { fromConsentLearnMore?: boolean; returnTo?: string } | null
      const helpRoots = ['/profile/contact', '/profile/legal', '/profile/resources']
      const isHelpOrLegalPage = helpRoots.some((root) => path.startsWith(root))
      if (isHelpOrLegalPage && state?.fromConsentLearnMore && state?.returnTo) {
        markNavigatingBack()
        navigate(state.returnTo)
        return
      }
      if (isHelpOrLegalPage && previousPath && !previousPath.startsWith('/profile/')) {
        markNavigatingBack()
        navigate(previousPath)
        return
      }
      const profileSubRoutes = [
        'settings',
        'security',
        'help',
        'contact',
        'resources',
        'legal',
        'annonces',
        'contracts',
        'wallet',
        'transactions',
        'edit',
        'public'
      ]
      const isProfileIdRoute =
        pathParts.length === 2 && pathParts[0] === 'profile' && !profileSubRoutes.includes(pathParts[1])
      const isPublicProfileRoute = path.startsWith('/profile/public/')

      if ((isPublicProfileRoute || isProfileIdRoute) && previousPath && previousPath !== path) {
        markNavigatingBack()
        navigate(previousPath)
        return
      }
      if (path === '/profile/contracts' && previousPath.startsWith('/messages')) {
        markNavigatingBack()
        navigate(previousPath)
        return
      }
      if (path.startsWith('/profile/public') && previousPath.startsWith('/post/')) {
        markNavigatingBack()
        navigate(previousPath)
        return
      }
      if (path === '/profile/edit') {
        if (previousPath === '/profile/public' || previousPath.startsWith('/profile/public')) {
          markNavigatingBack()
          navigate('/profile/public')
          return
        }
      }
      if (helpRoots.some((root) => path.startsWith(root))) {
        if (pathParts.length === 2) {
          markNavigatingBack()
          navigate('/profile/help')
          return
        }
      }
      if (pathParts.length >= 2) {
        if (pathParts.length === 2) {
          markNavigatingBack()
          navigate('/profile')
          return
        }
        const parentPath = '/' + pathParts.slice(0, -1).join('/')
        markNavigatingBack()
        navigate(parentPath)
        return
      }
      markNavigatingBack()
      navigate('/home')
      return
    }

    if (path.startsWith('/messages/')) {
      markNavigatingBack()
      navigate('/messages')
      return
    }

    if (isMainTabRoot) {
      markNavigatingBack()
      navigate('/home')
      return
    }

    const categorySlugs = [
      'creation-contenu', 'emploi', 'casting-role',
      'services', 'evenements', 'vente', 'match', 'service', 'role', 'recrutement',
      'projet', 'mission', 'autre'
    ]
    if (pathParts.length > 0 && categorySlugs.includes(pathParts[0])) {
      markNavigatingBack()
      navigate('/home')
      return
    }

    const previousPath = getPreviousPath()
    if (canGoBack() && previousPath && previousPath !== path) {
      markNavigatingBack()
      navigate(previousPath)
    } else {
      markNavigatingBack()
      navigate('/home')
    }
  }

  return handleBack
}
