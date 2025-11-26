import { useNavigate } from 'react-router-dom'
import { Users, ShoppingBag, Wrench, Target, MoreHorizontal } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import './Menu.css'

const Menu = () => {
  const navigate = useNavigate()

  const menuItems = [
    { id: 'match', icon: Users, label: 'Match', color: '#667eea', path: '/match' },
    { id: 'service', icon: Wrench, label: 'Service', color: '#4facfe', path: '/service' },
    { id: 'vente', icon: ShoppingBag, label: 'Vente', color: '#f093fb', path: '/vente' },
    { id: 'mission', icon: Target, label: 'Mission', color: '#43e97b', path: '/mission' },
    { id: 'autre', icon: MoreHorizontal, label: 'Autre', color: '#ffa726', path: '/autre' }
  ]

  return (
    <div className="page">
      <PageHeader title="Menu" />
      <div className="page-content menu-page">
        <div className="menu-container">
          <div className="menu-grid">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className="menu-item"
                  onClick={() => navigate(item.path)}
                  style={{ '--item-color': item.color } as React.CSSProperties}
                >
                  <div className="menu-icon-wrapper">
                    <Icon size={32} />
                  </div>
                  <span className="menu-item-label">{item.label}</span>
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

