import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Search, Camera, Users, Target, ShoppingBag, Briefcase, Building2, Calendar, LucideIcon, ChevronRight } from 'lucide-react'
import { fetchSubMenusForCategory } from '../utils/categoryHelpers'
import Logo from './Logo'
import './Header.css'

interface MenuCategory {
  id: string
  icon: LucideIcon
  label: string
  path: string
  subMenus: Array<{ name: string; slug: string }>
}

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation(['categories', 'common', 'home'])
  const translateCategoryLabel = (id: string, fallback: string) =>
    t(`categories:titles.${id}`, { defaultValue: fallback })
  const translateSubMenuLabel = (slug: string, fallback: string) =>
    t(`categories:submenus.${slug}`, { defaultValue: fallback })
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([
    { 
      id: 'creation-contenu', 
      icon: Camera, 
      label: translateCategoryLabel('creation-contenu', 'Création de contenu'), 
      path: '/creation-contenu',
      subMenus: []
    },
    { 
      id: 'casting-role', 
      icon: Users, 
      label: translateCategoryLabel('casting-role', 'Casting'), 
      path: '/casting-role',
      subMenus: []
    },
    { 
      id: 'emploi', 
      icon: Briefcase, 
      label: translateCategoryLabel('emploi', 'Emploi'), 
      path: '/emploi',
      subMenus: []
    },
    { 
      id: 'studio-lieu', 
      icon: Building2, 
      label: translateCategoryLabel('studio-lieu', 'Studio & lieu'), 
      path: '/studio-lieu',
      subMenus: []
    },
    { 
      id: 'services', 
      icon: Target, 
      label: translateCategoryLabel('services', 'Services'), 
      path: '/services',
      subMenus: []
    },
    {
      id: 'evenements',
      icon: Calendar,
      label: translateCategoryLabel('evenements', 'Événement'),
      path: '/evenements',
      subMenus: []
    },
    { 
      id: 'vente', 
      icon: ShoppingBag, 
      label: translateCategoryLabel('vente', 'Vente'), 
      path: '/vente',
      subMenus: []
    }
  ])

  // Charger les sous-menus depuis la base de données
  useEffect(() => {
    const loadSubMenus = async () => {
      const categoriesConfig = [
        { id: 'creation-contenu', icon: Camera, label: translateCategoryLabel('creation-contenu', 'Création de contenu'), path: '/creation-contenu' },
        { id: 'casting-role', icon: Users, label: translateCategoryLabel('casting-role', 'Casting'), path: '/casting-role' },
        { id: 'emploi', icon: Briefcase, label: translateCategoryLabel('emploi', 'Emploi'), path: '/emploi' },
      { id: 'studio-lieu', icon: Building2, label: translateCategoryLabel('studio-lieu', 'Studio & lieu'), path: '/studio-lieu' },
        { id: 'services', icon: Target, label: translateCategoryLabel('services', 'Services'), path: '/services' },
        { id: 'evenements', icon: Calendar, label: translateCategoryLabel('evenements', 'Événement'), path: '/evenements' },
        { id: 'vente', icon: ShoppingBag, label: translateCategoryLabel('vente', 'Vente'), path: '/vente' }
      ]

      const updatedCategories = await Promise.all(
        categoriesConfig.map(async (category) => {
          const subMenus = await fetchSubMenusForCategory(category.id)
          return {
            ...category,
            subMenus
          }
        })
      )
      setMenuCategories(updatedCategories)
    }

    loadSubMenus()
  }, [i18n.language])

  const isHomePage = location.pathname === '/' || location.pathname === '/home'

  return (
    <header className="header">
      {/* Section 1: Logo et Notifications */}
      <div className="header-section-1">
        <button
          className="header-logo-btn"
          onClick={() => navigate('/')}
          aria-label={t('common:nav.home') || 'Accueil'}
        >
          <Logo className="header-logo" width={100} height={50} />
        </button>
        <button
          className="notification-btn"
          onClick={() => navigate('/notifications')}
          aria-label={t('nav.notifications')}
        >
          <Bell size={24} />
          <span className="notification-badge">17</span>
        </button>
      </div>

      {/* Section 2: Barre de recherche */}
      <div className="header-section-2">
        <div
          className="search-bar"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/search')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              navigate('/search')
            }
          }}
          aria-label={t('home:searchPlaceholder') || 'Rechercher une annonce'}
          style={{ cursor: 'pointer' }}
        >
          <Search className="search-icon" size={20} aria-hidden />
          <input
            type="text"
            placeholder={t('home:searchPlaceholder')}
            className="search-input"
            readOnly
            tabIndex={-1}
            aria-hidden
            onClick={(e) => {
              e.stopPropagation()
              navigate('/search')
            }}
          />
          <button 
            className="camera-btn" 
            aria-label={t('common:actions.scan')}
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
                            <span>{translateSubMenuLabel(subMenu.slug, subMenu.name)}</span>
                            <ChevronRight size={16} />
                          </button>
                        ))}
                        <button
                          className="submenu-dropdown-item submenu-dropdown-item-all"
                          onClick={() => navigate(category.path)}
                        >
                          <span>{t('categories:ui.viewAll')}</span>
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
