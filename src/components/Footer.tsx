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
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.path)
        return (
          <button
            key={item.path}
            className={`footer-item ${active ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <Icon size={22} />
            <span className="footer-label">{item.label}</span>
          </button>
        )
      })}
    </footer>
  )
}

export default Footer

