import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Users, ShoppingBag, Wrench, Target, MoreHorizontal, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'
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
  }

  // Si une catégorie est sélectionnée, afficher les sous-menus
  if (selectedCategory) {
    return (
      <div className="page">
        <PageHeader title={selectedCategory.label} />
        <div className="page-content menu-page">
          <div className="menu-container">
            <button 
              className="back-button"
              onClick={handleBackToCategories}
            >
              <ChevronLeft size={20} />
              <span>Retour aux catégories</span>
            </button>
            
            <div className="submenu-list">
              <h3 className="submenu-title">Choisissez une option</h3>
              {selectedCategory.subMenus.map((subMenu) => (
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
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Afficher les catégories principales
  return (
    <div className="page">
      <PageHeader title="Menu" />
      <div className="page-content menu-page">
        <div className="menu-container">
          <div className="menu-grid">
            {menuCategories.map((category) => {
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
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Menu

