import { useNavigate, useLocation } from 'react-router-dom'
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

    // Règle 1 : Pour les sous-pages de profil (ex: /profile/settings/personal-info)
    // Retourner au niveau parent (ex: /profile/settings ou /profile)
    if (path.startsWith('/profile/')) {
      // Cas spécial : si on vient de /profile/public, retourner vers /profile/public
      if (path === '/profile/edit') {
        const previousPath = getPreviousPath()
        if (previousPath === '/profile/public' || previousPath.startsWith('/profile/public')) {
          markNavigatingBack()
          navigate('/profile/public')
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

    // Règle 2 : Pour TOUTES les catégories (tous niveaux), retourner directement vers /home
    const categorySlugs = [
      'creation-contenu', 'montage', 'casting-role', 'projets-equipe', 
      'services', 'vente', 'match', 'service', 'role', 'recrutement', 
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

    // Règle 3 : Pour les pages du footer, vérifier si on vient d'une catégorie
    const footerPages = ['/home', '/favorites', '/likes', '/publish', '/publier-annonce', '/messages', '/profile']
    if (footerPages.includes(path) || footerPages.some(footerPage => path.startsWith(footerPage + '/'))) {
      // Vérifier si la page précédente est une catégorie
      const previousPath = getPreviousPath()
      const previousPathParts = previousPath.split('/').filter(Boolean)
      const categorySlugs = [
        'creation-contenu', 'montage', 'casting-role', 'projets-equipe', 
        'services', 'vente', 'match', 'service', 'role', 'recrutement', 
        'projet', 'mission', 'autre'
      ]
      
      // Si on vient d'une catégorie, retourner à la catégorie
      if (previousPathParts.length > 0 && categorySlugs.includes(previousPathParts[0])) {
        markNavigatingBack()
        navigate(previousPath)
        return
      }
      
      // Sinon, retourner vers /home
      markNavigatingBack()
      navigate('/home')
      return
    }

    // Règle 4 : Pour toutes les autres pages, utiliser l'historique de navigation
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
      className={`back-button ${className}`}
      onClick={handleClick}
      aria-label="Retour"
    >
      <ChevronLeft size={24} />
    </button>
  )
}

export default BackButton

