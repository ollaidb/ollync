import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Heart, PlusCircle, MessageCircle, User } from 'lucide-react'
import './Footer.css'

const Footer = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const navItems = [
    { path: '/home', icon: Home, label: t('nav.home') },
    { path: '/favorites', icon: Heart, label: t('nav.favorites') },
    { path: '/publish', icon: PlusCircle, label: t('nav.publish') },
    { path: '/messages', icon: MessageCircle, label: t('nav.messages') },
    { path: '/profile', icon: User, label: t('nav.profile') }
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

