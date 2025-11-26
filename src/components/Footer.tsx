import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Heart, PlusSquare, MessageCircle, User } from 'lucide-react'
import './Footer.css'

const Footer = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/favorites', icon: Heart, label: 'Favoris' },
    { path: '/publish', icon: PlusSquare, label: 'Publication' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profil' }
  ]

  return (
    <footer className="footer">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path
        return (
          <button
            key={item.path}
            className={`footer-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <Icon size={24} />
            <span className="footer-label">{item.label}</span>
          </button>
        )
      })}
    </footer>
  )
}

export default Footer

