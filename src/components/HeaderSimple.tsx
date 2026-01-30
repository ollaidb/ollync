import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useNavigationHistory } from '../hooks/useNavigationHistory'
import './HeaderSimple.css'

interface HeaderSimpleProps {
  title: string
  showBack?: boolean
}

const HeaderSimple = ({ title, showBack = true }: HeaderSimpleProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { getPreviousPath, markNavigatingBack, canGoBack } = useNavigationHistory()

  const handleBack = () => {
    const path = location.pathname
    const pathParts = path.split('/').filter(Boolean)

    // Si on est dans une sous-page de profil, retourner au bon niveau
    if (path.startsWith('/profile/')) {
      // Pour /profile/xxx, retourner vers /profile
      if (pathParts.length === 2) {
        markNavigatingBack()
        navigate('/profile')
        return
      }

      // Pour /profile/xxx/yyy, retourner au niveau parent
      if (pathParts.length > 2) {
        const parentPath = '/' + pathParts.slice(0, -1).join('/')
        markNavigatingBack()
        navigate(parentPath)
        return
      }
    }

    // Pour les catégories, retourner directement vers /home
    const categorySlugs = [
      'creation-contenu', 'montage', 'casting-role', 'projets-equipe', 
      'services', 'vente', 'match', 'service', 'role', 'recrutement', 
      'projet', 'mission', 'autre'
    ]
    
    if (pathParts.length > 0 && categorySlugs.includes(pathParts[0])) {
      markNavigatingBack()
      navigate('/home')
      return
    }

    // Pour les pages du footer, vérifier si on vient d'une catégorie
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

    // Pour toutes les autres pages, utiliser l'historique de navigation
    const previousPath = getPreviousPath()
    if (canGoBack() && previousPath && previousPath !== path) {
      markNavigatingBack()
      navigate(previousPath)
    } else {
      // Fallback: retourner vers /home
      markNavigatingBack()
      navigate('/home')
    }
  }

  return (
    <header className="header-simple">
      {showBack && (
        <button className="header-simple-back" onClick={handleBack}>
          <ArrowLeft size={24} />
        </button>
      )}
      <h1 className="header-simple-title">{title}</h1>
      <div className="header-simple-spacer"></div>
    </header>
  )
}

export default HeaderSimple

