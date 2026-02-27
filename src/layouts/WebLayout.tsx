import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { prefetchRoute } from '../utils/routePrefetch'
import { scrollToHomeTop } from '../utils/scrollToHomeTop'
import './WebLayout.css'

type WebLayoutProps = {
  children: React.ReactNode
}

const WebLayout = ({ children }: WebLayoutProps) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navItems = [
    { label: t('nav.profile'), to: '/profile' },
    { label: t('nav.messages'), to: '/messages' },
    { label: t('nav.favorites'), to: '/favorites' },
    { label: t('nav.notifications'), to: '/notifications' },
  ]
  return (
    <div className="web-layout">
      <aside className="web-sidebar">
        <div className="web-sidebar-header">
          <NavLink
            to="/home"
            className="web-logo"
            onMouseEnter={() => prefetchRoute('/home')}
            onFocus={() => prefetchRoute('/home')}
            onClick={(e) => {
              if (location.pathname === '/home' || location.pathname === '/') {
                e.preventDefault()
                scrollToHomeTop()
              }
            }}
          >
            ollync
          </NavLink>
        </div>
        <nav className="web-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className="web-nav-link" onMouseEnter={() => prefetchRoute(item.to)} onFocus={() => prefetchRoute(item.to)}>
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
