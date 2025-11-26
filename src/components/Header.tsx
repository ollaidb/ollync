import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Users, Wrench, ShoppingBag, Target, MoreHorizontal } from 'lucide-react'
import './Header.css'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const getPageTitle = () => {
    const titles: { [key: string]: string } = {
      '/': 'Accueil',
      '/favorites': 'Favoris',
      '/publish': 'Publication',
      '/messages': 'Messages',
      '/profile': 'Profil',
      '/menu': 'Menu',
      '/match': 'Match',
      '/service': 'Service',
      '/vente': 'Vente',
      '/mission': 'Mission',
      '/autre': 'Autre'
    }
    return titles[location.pathname] || 'Ollync'
  }

  const menuCategories = [
    { id: 'match', icon: Users, label: 'Match', path: '/match' },
    { id: 'service', icon: Wrench, label: 'Service', path: '/service' },
    { id: 'vente', icon: ShoppingBag, label: 'Vente', path: '/vente' },
    { id: 'mission', icon: Target, label: 'Mission', path: '/mission' },
    { id: 'autre', icon: MoreHorizontal, label: 'Autre', path: '/autre' }
  ]

  const isHomePage = location.pathname === '/'

  return (
    <header className="header">
      {/* Section 1: Logo et Notifications */}
      <div className="header-section-1">
        <button 
          className="header-logo-btn"
          onClick={() => navigate('/')}
        >
          <h1 className="header-logo">Ollync</h1>
        </button>
        <button
          className="notification-btn"
          onClick={() => navigate('/menu')}
          aria-label="Notifications"
        >
          <Bell size={24} />
          <span className="notification-badge">17</span>
        </button>
      </div>

      {/* Section 2: Barre de recherche */}
      <div className="header-section-2">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher sur Ollync"
            className="search-input"
          />
        </div>
      </div>

      {/* Section 3: Menu horizontal scrollable - Visible uniquement sur la page d'accueil */}
      {isHomePage && (
        <div className="header-section-3">
          <div className="menu-scroll">
            {menuCategories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  className="menu-category"
                  onClick={() => navigate(category.path)}
                >
                  <Icon size={24} />
                  <span className="menu-category-label">{category.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header

