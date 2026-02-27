import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { useNavigationHistory } from '../hooks/useNavigationHistory'
import './BackButton.css'

interface BackButtonProps {
  to?: string
  onClick?: () => void
  className?: string
  hideOnHome?: boolean // Si true, cache le bouton sur la page d'accueil
}

const BackButton = ({ to, onClick, className = '', hideOnHome = false }: BackButtonProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { getPreviousPath, markNavigatingBack, canGoBack } = useNavigationHistory()
  const { t } = useTranslation()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    // Si un chemin spécifique est fourni, l'utiliser
    if (to) {
      markNavigatingBack()
      navigate(to)
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

    // Règle 1 : Pour les sous-pages de profil (ex: /profile/settings/personal-info)
    // Retourner au niveau parent (ex: /profile/settings ou /profile)
    if (path.startsWith('/profile/')) {
      const previousPath = getPreviousPath()
      const state = location.state as { fromConsentLearnMore?: boolean; returnTo?: string } | null
      const helpRoots = ['/profile/contact', '/profile/legal', '/profile/resources']
      const isHelpOrLegalPage = helpRoots.some((root) => path.startsWith(root))
      // Retour depuis "En savoir plus" d'un bloc de consentement : revenir là où l'utilisateur était
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

      // Cas spécial : profils publics (issus d'une annonce, favoris, etc.)
      // Retourner vers la page précédente, pas vers /profile
      if ((isPublicProfileRoute || isProfileIdRoute) && previousPath && previousPath !== path) {
        markNavigatingBack()
        navigate(previousPath)
        return
      }

      // Cas spécial : retour depuis un contrat ouvert depuis une conversation
      if (path === '/profile/contracts' && previousPath.startsWith('/messages')) {
        markNavigatingBack()
        navigate(previousPath)
        return
      }

      // Cas spécial : retour depuis un profil public ouvert depuis une annonce
      if (path.startsWith('/profile/public') && previousPath.startsWith('/post/')) {
        markNavigatingBack()
        navigate(previousPath)
        return
      }

      // Cas spécial : si on vient de /profile/public, retourner vers /profile/public
      if (path === '/profile/edit') {
        if (previousPath === '/profile/public' || previousPath.startsWith('/profile/public')) {
          markNavigatingBack()
          navigate('/profile/public')
          return
        }
      }

      if (helpRoots.some((root) => path.startsWith(root))) {
        // Pour /profile/contact|legal|resources -> retour vers /profile/help (si on venait du profil)
        if (pathParts.length === 2) {
          markNavigatingBack()
          navigate('/profile/help')
          return
        }
      }
      
      // Si on est dans une sous-page (ex: /profile/xxx ou /profile/xxx/yyy)
      if (pathParts.length >= 2) {
        // Pour /profile/xxx, retourner vers /profile
        if (pathParts.length === 2) {
          markNavigatingBack()
          navigate('/profile')
          return
        }

        // Pour /profile/xxx/yyy, retourner au niveau parent
        const parentPath = '/' + pathParts.slice(0, -1).join('/')
        markNavigatingBack()
        navigate(parentPath)
        return
      }
      // Si on est au niveau principal du profil (/profile), retourner vers /home
      markNavigatingBack()
      navigate('/home')
      return
    }

    // Règle 2 : Dans une conversation Messages, retour vers Messages
    if (path.startsWith('/messages/')) {
      markNavigatingBack()
      navigate('/messages')
      return
    }

    // Règle 3 : Onglets principaux (racine) -> retour par défaut vers Accueil
    if (isMainTabRoot) {
      markNavigatingBack()
      navigate('/home')
      return
    }

    // Règle 4 : Pour TOUTES les catégories (tous niveaux), retourner directement vers /home
    const categorySlugs = [
      'creation-contenu', 'emploi', 'casting-role',
      'services', 'evenements', 'vente', 'match', 'service', 'role', 'recrutement',
      'projet', 'mission', 'autre'
    ]
    
    if (pathParts.length > 0) {
      const firstPart = pathParts[0]
      if (categorySlugs.includes(firstPart)) {
        // Retourner directement vers /home, peu importe le niveau
        markNavigatingBack()
        navigate('/home')
        return
      }
    }

    // Règle 5 : Pour toutes les autres pages, utiliser l'historique de navigation
    // pour retourner à la page précédente (peut être /home ou autre)
    const previousPath = getPreviousPath()
    if (canGoBack() && previousPath && previousPath !== path) {
      markNavigatingBack()
      navigate(previousPath)
    } else {
      // Fallback : retourner vers /home par défaut
      markNavigatingBack()
      navigate('/home')
    }
  }

  // Cacher le bouton sur la page d'accueil si hideOnHome est true
  if (hideOnHome && (location.pathname === '/home' || location.pathname === '/')) {
    return null
  }

  return (
    <button 
      className={`back-button tap-effect ${className}`}
      onClick={handleClick}
      aria-label={t('back')}
    >
      <ChevronLeft size={24} />
    </button>
  )
}

export default BackButton
