import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Search, Camera, Users, Briefcase, Wrench, ShoppingBag, Target, MoreHorizontal, ChevronRight } from 'lucide-react'
import './Header.css'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const menuCategories = [
    { 
      id: 'match', 
      icon: Users, 
      label: 'Match', 
      path: '/match',
      subMenus: [
        { name: 'Création de contenu', slug: 'creation-contenu' },
        { name: 'Sortie', slug: 'sortie' },
        { name: 'Événement', slug: 'evenement' }
      ]
    },
    { 
      id: 'recrutement', 
      icon: Briefcase, 
      label: 'Recrutement', 
      path: '/recrutement',
      subMenus: [
        { name: 'Modèle', slug: 'modele' },
        { name: 'Figurant', slug: 'figurant' }
      ]
    },
    { 
      id: 'projet', 
      icon: Briefcase, 
      label: 'Projet', 
      path: '/projet',
      subMenus: [
        { name: 'Associer / Collaboration', slug: 'associer-collaboration' }
      ]
    },
    { 
      id: 'service', 
      icon: Wrench, 
      label: 'Service', 
      path: '/service',
      subMenus: [
        { name: 'Échange de service', slug: 'echange-service' },
        { name: 'Tâches', slug: 'taches' },
        { name: 'Formation', slug: 'formation' }
      ]
    },
    { 
      id: 'vente', 
      icon: ShoppingBag, 
      label: 'Vente', 
      path: '/vente',
      subMenus: [
        { name: 'Échange', slug: 'echange' },
        { name: 'Vente de compte', slug: 'vente-compte' },
        { name: 'Gratuit', slug: 'gratuit' }
      ]
    },
    { 
      id: 'mission', 
      icon: Target, 
      label: 'Mission', 
      path: '/mission',
      subMenus: [
        { name: 'Colis', slug: 'colis' },
        { name: 'Vérification', slug: 'verification' }
      ]
    },
    { 
      id: 'autre', 
      icon: MoreHorizontal, 
      label: 'Autre', 
      path: '/autre',
      subMenus: [
        { name: 'Non classé', slug: 'non-classe' },
        { name: 'Autre service', slug: 'autre-service' }
      ]
    }
  ]

  const isHomePage = location.pathname === '/' || location.pathname === '/home'

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
        <div 
          className="search-bar"
          onClick={() => navigate('/search')}
          style={{ cursor: 'pointer' }}
        >
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Rechercher sur Ollync"
            className="search-input"
            readOnly
            onClick={(e) => {
              e.stopPropagation()
              navigate('/search')
            }}
          />
          <button 
            className="camera-btn" 
            aria-label="Scanner"
            onClick={(e) => {
              e.stopPropagation()
              // Fonctionnalité du scanner à implémenter plus tard
            }}
          >
            <Camera size={20} />
          </button>
        </div>
      </div>

      {/* Section 3: Menu horizontal scrollable - Visible uniquement sur la page d'accueil */}
      {isHomePage && (
        <div className="header-section-3">
          <div className="menu-scroll">
            {menuCategories.map((category) => {
              const Icon = category.icon
              const isHovered = hoveredCategory === category.id
              return (
                <div
                  key={category.id}
                  className="menu-category-wrapper"
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <button
                    className="menu-category"
                    onClick={() => navigate(category.path)}
                  >
                    <Icon size={24} />
                    <span className="menu-category-label">{category.label}</span>
                  </button>
                  
                  {/* Dropdown des sous-menus */}
                  {isHovered && category.subMenus.length > 0 && (
                    <div className="submenu-dropdown">
                      <div className="submenu-dropdown-content">
                        {category.subMenus.map((subMenu) => (
                          <button
                            key={subMenu.slug}
                            className="submenu-dropdown-item"
                            onClick={() => navigate(`${category.path}/${subMenu.slug}`)}
                          >
                            <span>{subMenu.name}</span>
                            <ChevronRight size={16} />
                          </button>
                        ))}
                        <button
                          className="submenu-dropdown-item submenu-dropdown-item-all"
                          onClick={() => navigate(category.path)}
                        >
                          <span>Voir tout</span>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header

