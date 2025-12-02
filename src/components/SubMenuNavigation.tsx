import { useNavigate, useLocation, useParams } from 'react-router-dom'
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
  const { submenu } = useParams<{ submenu?: string; subSubMenu?: string }>()

  // Utiliser le paramètre submenu de l'URL ou le deuxième segment du pathname
  const currentSubMenu = submenu || location.pathname.split('/')[2] || ''

  return (
    <div className="submenu-navigation">
      <div className="submenu-scroll">
        {subMenus.map((subMenu) => {
          // Le sous-menu est actif si le slug correspond, ou si on est sur la page principale de la catégorie et c'est le premier sous-menu
          const isActive = currentSubMenu === subMenu.slug || 
            (!currentSubMenu && location.pathname === `/${category}` && subMenus[0]?.slug === subMenu.slug)
          
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

