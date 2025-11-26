import { useNavigate, useLocation } from 'react-router-dom'
import './SubMenuNavigation.css'

interface SubMenu {
  name: string
  slug: string
}

interface SubMenuNavigationProps {
  category: string
  subMenus: SubMenu[]
}

const SubMenuNavigation = ({ category, subMenus }: SubMenuNavigationProps) => {
  const navigate = useNavigate()
  const location = useLocation()

  const currentSubMenu = location.pathname.split('/').pop() || ''

  return (
    <div className="submenu-navigation">
      <div className="submenu-scroll">
        {subMenus.map((subMenu) => {
          const isActive = currentSubMenu === subMenu.slug || 
            (currentSubMenu === category && subMenus[0]?.slug === subMenu.slug)
          
          return (
            <button
              key={subMenu.slug}
              className={`submenu-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(`/${category}/${subMenu.slug}`)}
            >
              {subMenu.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SubMenuNavigation

