import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Users, ShoppingBag, Wrench, Target, MoreHorizontal, Briefcase, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Footer from '../components/Footer'
import './Menu.css'

interface SubMenu {
  name: string
  slug: string
}

interface MenuCategory {
  id: string
  icon: typeof Users
  label: string
  color: string
  path: string
  subMenus: SubMenu[]
}

// Catégories du menu - définies en dehors du composant pour éviter les problèmes de dépendances
const menuCategories: MenuCategory[] = [
    { 
      id: 'match', 
      icon: Users, 
      label: 'Match', 
      color: '#667eea', 
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
      color: '#9c27b0', 
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
      color: '#2196f3', 
      path: '/projet',
      subMenus: [
        { name: 'Associer / Collaboration', slug: 'associer-collaboration' }
      ]
    },
    { 
      id: 'service', 
      icon: Wrench, 
      label: 'Service', 
      color: '#4facfe', 
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
      color: '#f093fb', 
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
      color: '#43e97b', 
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
      color: '#ffa726', 
      path: '/autre',
      subMenus: [
        { name: 'Non classé', slug: 'non-classe' },
        { name: 'Autre service', slug: 'autre-service' }
      ]
    }
  ]

const Menu = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Si un paramètre de catégorie est présent dans l'URL, sélectionner automatiquement cette catégorie
  useEffect(() => {
    if (categoryParam) {
      const category = menuCategories.find(cat => cat.id === categoryParam)
      if (category) {
        setSelectedCategory(category)
      }
    }
  }, [categoryParam])

  const handleCategoryClick = (category: MenuCategory) => {
    setSelectedCategory(category)
  }

  const handleSubMenuClick = (subMenu: SubMenu) => {
    if (selectedCategory) {
      navigate(`${selectedCategory.path}/${subMenu.slug}`)
    }
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
    setSearchQuery('')
  }

  // Filtrer les catégories en fonction de la recherche
  const filteredCategories = menuCategories.filter(category => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      category.label.toLowerCase().includes(query) ||
      category.subMenus.some(subMenu => subMenu.name.toLowerCase().includes(query))
    )
  })

  // Filtrer les sous-menus en fonction de la recherche
  const filteredSubMenus = selectedCategory?.subMenus.filter(subMenu => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return subMenu.name.toLowerCase().includes(query)
  }) || []

  const clearSearch = () => {
    setSearchQuery('')
  }

  // Si une catégorie est sélectionnée, afficher les sous-menus
  if (selectedCategory) {
    return (
      <div className="app">
        <div className="menu-page">
          {/* Header fixe */}
          <div className="menu-header-fixed">
            <div className="menu-header-content">
              <button 
                className="menu-back-button"
                onClick={handleBackToCategories}
              >
                <ChevronLeft size={24} />
              </button>
              <h1 className="menu-title">{selectedCategory.label}</h1>
              <div className="menu-header-spacer"></div>
            </div>
          </div>

          {/* Zone scrollable */}
          <div className="menu-scrollable">
            <div className="menu-container">
            {/* Barre de recherche pour les sous-menus */}
            <div className="menu-search-wrapper">
              <div className="menu-search-input">
                <Search size={20} className="menu-search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher un sous-menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="menu-search-field"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="menu-search-clear"
                    aria-label="Effacer la recherche"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="submenu-list">
              <h3 className="submenu-title">Choisissez une option</h3>
              {filteredSubMenus.length > 0 ? (
                <>
                  {filteredSubMenus.map((subMenu) => (
                    <button
                      key={subMenu.slug}
                      className="submenu-item"
                      onClick={() => handleSubMenuClick(subMenu)}
                      style={{ '--item-color': selectedCategory.color } as React.CSSProperties}
                    >
                      <span className="submenu-name">{subMenu.name}</span>
                      <ChevronRight size={20} className="submenu-arrow" />
                    </button>
                  ))}
                  
                  {/* Option pour accéder à la page principale de la catégorie */}
                  <button
                    className="submenu-item submenu-item-all"
                    onClick={() => navigate(selectedCategory.path)}
                    style={{ '--item-color': selectedCategory.color } as React.CSSProperties}
                  >
                    <span className="submenu-name">Voir tout</span>
                    <ChevronRight size={20} className="submenu-arrow" />
                  </button>
                </>
              ) : (
                <div className="menu-no-results">
                  <p>Aucun résultat trouvé pour "{searchQuery}"</p>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Afficher les catégories principales
  return (
    <div className="app">
      <div className="menu-page">
        {/* Header fixe */}
        <div className="menu-header-fixed">
          <div className="menu-header-content">
            <h1 className="menu-title">Menu</h1>
          </div>
        </div>

        {/* Zone scrollable */}
        <div className="menu-scrollable">
          <div className="menu-container">
          {/* Barre de recherche pour les catégories */}
          <div className="menu-search-wrapper">
            <div className="menu-search-input">
              <Search size={20} className="menu-search-icon" />
              <input
                type="text"
                placeholder="Rechercher une catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="menu-search-field"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="menu-search-clear"
                  aria-label="Effacer la recherche"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="menu-grid">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    className="menu-item"
                    onClick={() => handleCategoryClick(category)}
                    style={{ '--item-color': category.color } as React.CSSProperties}
                  >
                    <div className="menu-icon-wrapper">
                      <Icon size={32} />
                    </div>
                    <span className="menu-item-label">{category.label}</span>
                  </button>
                )
              })
            ) : (
              <div className="menu-no-results">
                <p>Aucun résultat trouvé pour "{searchQuery}"</p>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Menu

