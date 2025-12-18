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
  const { getPreviousPath, markNavigatingBack } = useNavigationHistory()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    if (to) {
      markNavigatingBack()
      navigate(to)
      return
    }

    // Logique intelligente basée sur la route actuelle
    const path = location.pathname

    // Si on est dans une conversation de messages, retourner vers /messages
    if (path.startsWith('/messages/') && path !== '/messages') {
      markNavigatingBack()
      navigate('/messages')
      return
    }

    // Si on est dans une sous-page de catégorie (avec sous-menus), retourner au niveau précédent
    const pathParts = path.split('/').filter(Boolean)
    const categorySlugs = [
      'creation-contenu', 'montage', 'casting-role', 'projets-equipe', 
      'services', 'vente', 'match', 'service', 'role', 'recrutement', 
      'projet', 'mission', 'autre'
    ]
    
    if (pathParts.length > 0) {
      const firstPart = pathParts[0]
      if (categorySlugs.includes(firstPart)) {
        // Si on a plusieurs niveaux (ex: /creation-contenu/submenu/subSubMenu)
        if (pathParts.length > 1) {
          // Retourner au niveau précédent dans la catégorie
          const previousLevel = '/' + pathParts.slice(0, -1).join('/')
          markNavigatingBack()
          navigate(previousLevel)
          return
        } else {
          // Si on est au premier niveau de la catégorie, retourner vers /home
          markNavigatingBack()
          navigate('/home')
          return
        }
      }
    }

    // Sous-pages de profil -> retourner vers /profile ou la page précédente
    if (path.startsWith('/profile/') && path !== '/profile') {
      // Si on est dans un profil public depuis une annonce, retourner à l'annonce
      const previousPath = getPreviousPath()
      if (previousPath.startsWith('/post/')) {
        markNavigatingBack()
        navigate(previousPath)
        return
      }
      // Sinon retourner vers /profile
      markNavigatingBack()
      navigate('/profile')
      return
    }

    // Si on est sur la page d'accueil, ne rien faire (ou retourner à la page précédente si on a un historique)
    if (path === '/home' || path === '/') {
      const previousPath = getPreviousPath()
      if (previousPath && previousPath !== '/home' && previousPath !== '/') {
        markNavigatingBack()
        navigate(previousPath)
        return
      }
      // Si pas d'historique, rester sur /home
      return
    }

    // Pour les autres pages, utiliser l'historique de navigation
    const previousPath = getPreviousPath()
    if (previousPath && previousPath !== path) {
      markNavigatingBack()
      navigate(previousPath)
    } else {
      // Fallback: utiliser l'historique du navigateur ou /home
      if (window.history.length > 1) {
        markNavigatingBack()
        navigate(-1)
      } else {
        markNavigatingBack()
        navigate('/home')
      }
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

