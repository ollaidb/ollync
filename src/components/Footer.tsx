import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Heart, PlusCircle, MessageCircle, User } from 'lucide-react'
import './Footer.css'

const Footer = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { path: '/home', icon: Home, label: 'Accueil' },
    { path: '/favorites', icon: Heart, label: 'Favoris' },
    { path: '/publish', icon: PlusCircle, label: 'Publier' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profil' }
  ]

  const isActive = (path: string) => {
    if (path === '/home') {
      return location.pathname === '/' || location.pathname === '/home'
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <footer className="footer">
      {navItems.map((item, index) => {
        const Icon = item.icon
        const active = isActive(item.path)
        const isCenter = index === 2 // L'icône PlusCircle est au centre
        return (
          <button
            key={item.path}
            className={`footer-item ${active ? 'active' : ''} ${isCenter ? 'footer-center' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            {isCenter ? (
              <div className="footer-center-icon-wrapper">
                <Icon size={28} strokeWidth={2} />
              </div>
            ) : (
              <Icon size={24} strokeWidth={1.5} />
            )}
          </button>
        )
      })}
    </footer>
  )
}

export default Footer

