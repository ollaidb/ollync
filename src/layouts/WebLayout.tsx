import { NavLink } from 'react-router-dom'
import './WebLayout.css'

type WebLayoutProps = {
  children: React.ReactNode
}

const navItems = [
  { label: 'Profil', to: '/profile' },
  { label: 'Messages', to: '/messages' },
  { label: 'Favoris', to: '/favorites' },
  { label: 'Notifications', to: '/notifications' },
]

const WebLayout = ({ children }: WebLayoutProps) => {
  return (
    <div className="web-layout">
      <aside className="web-sidebar">
        <div className="web-sidebar-header">
          <span className="web-logo">ollync</span>
        </div>
        <nav className="web-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className="web-nav-link">
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="web-content">{children}</div>
    </div>
  )
}

export default WebLayout
