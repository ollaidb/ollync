import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import './CategorySubMenuHover.css'

interface SubMenu {
  name: string
  slug: string
}

interface CategorySubMenuHoverProps {
  category: string
  categoryPath: string
  subMenus: SubMenu[]
  children: React.ReactNode
}

const CategorySubMenuHover = ({ category, categoryPath, subMenus, children }: CategorySubMenuHoverProps) => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filtrer les sous-sous-menus (photo/vidéo pour création de contenu)
  const filteredSubMenus = subMenus?.filter(subMenu => 
    !subMenu.slug.includes('creation-contenu-photo') && 
    !subMenu.slug.includes('creation-contenu-video')
  ) || []

  // Debug: afficher les sous-menus dans la console
  console.log(`CategorySubMenuHover - ${category}:`, { 
    subMenus, 
    filteredSubMenus, 
    hasSubMenus: subMenus && subMenus.length > 0,
    hasFilteredSubMenus: filteredSubMenus && filteredSubMenus.length > 0
  })

  // IMPORTANT: Tous les hooks doivent être appelés AVANT tout return conditionnel
  useEffect(() => {
    if (isHovered && wrapperRef.current && dropdownRef.current) {
      const wrapperRect = wrapperRef.current.getBoundingClientRect()
      dropdownRef.current.style.top = `${wrapperRect.bottom + 8}px`
      dropdownRef.current.style.left = `${wrapperRect.left}px`
    }
  }, [isHovered])

  // Return conditionnel APRÈS tous les hooks
  if (!filteredSubMenus || filteredSubMenus.length === 0) {
    console.log(`No submenus to display for ${category}`)
    return <>{children}</>
  }

  return (
    <div
      ref={wrapperRef}
      className="category-submenu-hover-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {/* Dropdown des sous-menus */}
      {isHovered && (
        <div ref={dropdownRef} className="category-submenu-dropdown">
          <div className="category-submenu-dropdown-content">
            {filteredSubMenus.map((subMenu) => (
              <button
                key={subMenu.slug}
                className="category-submenu-dropdown-item"
                onClick={() => navigate(`${categoryPath}/${subMenu.slug}`)}
              >
                <span>{subMenu.name}</span>
                <ChevronRight size={16} />
              </button>
            ))}
            <button
              className="category-submenu-dropdown-item category-submenu-dropdown-item-all"
              onClick={() => navigate(categoryPath)}
            >
              <span>Voir tout</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategorySubMenuHover

