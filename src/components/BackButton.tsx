import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import './BackButton.css'

interface BackButtonProps {
  to?: string
  onClick?: () => void
  className?: string
}

const BackButton = ({ to, onClick, className = '' }: BackButtonProps) => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    if (to) {
      navigate(to)
      return
    }

    // Logique intelligente basée sur la route actuelle
    const path = location.pathname

    // Pages de catégories -> retourner vers /home
    if (path.startsWith('/match') || 
        path.startsWith('/service') || 
        path.startsWith('/recrutement') || 
        path.startsWith('/projet') || 
        path.startsWith('/vente') || 
        path.startsWith('/mission') || 
        path.startsWith('/autre')) {
      navigate('/home')
      return
    }

    // Sous-pages de profil -> retourner vers /profile
    if (path.startsWith('/profile/') && path !== '/profile') {
      navigate('/profile')
      return
    }

    // Pour les autres pages, utiliser l'historique ou /home
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/home')
    }
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

