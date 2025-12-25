import { useNavigate } from 'react-router-dom'
import { User, CreditCard, Palette, Bell, Mail, Wifi, Database, ChevronRight, Trash2 } from 'lucide-react'
import './Settings.css'

const Settings = () => {
  const navigate = useNavigate()

  const menuItems = [
    {
      id: 'personal-info',
      icon: User,
      label: 'Informations personnelles',
      path: '/profile/settings/personal-info'
    },
    {
      id: 'mail',
      icon: Mail,
      label: 'Mail',
      path: '/profile/settings/mail'
    },
    {
      id: 'online-status',
      icon: Wifi,
      label: 'Statut en ligne',
      path: '/profile/settings/online-status'
    },
    {
      id: 'payment',
      icon: CreditCard,
      label: 'Moyens de paiement',
      path: '/profile/settings/payment'
    },
    {
      id: 'appearance',
      icon: Palette,
      label: 'Apparence',
      path: '/profile/settings/appearance'
    },
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notifications',
      path: '/profile/settings/notifications'
    },
    {
      id: 'data-management',
      icon: Database,
      label: 'Gestion de mes données',
      path: '/profile/settings/data-management'
    },
    {
      id: 'delete-account',
      icon: Trash2,
      label: 'Suppression de compte',
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
                return (
                  <button
                    key={item.id}
                    className={`settings-menu-item ${isDestructive ? 'settings-menu-item-destructive' : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    <div className={`settings-menu-item-icon ${isDestructive ? 'settings-menu-item-icon-destructive' : ''}`}>
                      <Icon size={20} />
                    </div>
                    <span className="settings-menu-item-label">{item.label}</span>
                    {!isDestructive && <ChevronRight size={18} className="settings-menu-item-chevron" />}
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
