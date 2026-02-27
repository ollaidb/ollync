import { useNavigate, useLocation } from 'react-router-dom'
import { User, CreditCard, Palette, Bell, Mail, Wifi, Database, ChevronRight, Trash2, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './Settings.css'

const Settings = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation(['settings'])

  const menuItems = [
    {
      id: 'personal-info',
      icon: User,
      label: t('settings:personalInfo'),
      path: '/profile/settings/personal-info'
    },
    {
      id: 'mail',
      icon: Mail,
      label: t('settings:mail'),
      path: '/profile/settings/mail'
    },
    {
      id: 'online-status',
      icon: Wifi,
      label: t('settings:onlineStatus'),
      path: '/profile/settings/online-status'
    },
    {
      id: 'payment',
      icon: CreditCard,
      label: t('settings:payment'),
      path: '/profile/settings/payment'
    },
    {
      id: 'appearance',
      icon: Palette,
      label: t('settings:appearance'),
      path: '/profile/settings/appearance'
    },
    {
      id: 'notifications',
      icon: Bell,
      label: t('settings:notifications'),
      path: '/profile/settings/notifications'
    },
    {
      id: 'language',
      icon: Globe,
      label: t('settings:language'),
      path: '/profile/settings/language'
    },
    {
      id: 'data-management',
      icon: Database,
      label: t('settings:dataManagement'),
      path: '/profile/settings/data-management'
    },
    {
      id: 'delete-account',
      icon: Trash2,
      label: t('settings:deleteAccount'),
      path: '/profile/settings/delete-account'
    }
  ]

  return (
    <div className="settings-page">
        <div className="settings-container">
          <div className="settings-section">
            <div className="settings-menu-list">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isDestructive = item.id === 'delete-account'
                const isActive = item.path != null && location.pathname === item.path
                return (
                  <button
                    key={item.id}
                    className={`settings-menu-item ${isActive ? 'active' : ''} ${isDestructive ? 'settings-menu-item-destructive' : ''}`}
                    onClick={() => item.path && navigate(item.path)}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className={`settings-menu-item-icon-wrap ${isDestructive ? 'settings-menu-item-icon-destructive' : ''}`} aria-hidden>
                      <Icon size={24} className="settings-menu-item-icon" />
                    </div>
                    <span className="settings-menu-item-label">{item.label}</span>
                    {!isDestructive && <ChevronRight size={18} className="settings-menu-item-chevron" aria-hidden />}
                  </button>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
