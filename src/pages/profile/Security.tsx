import { useNavigate } from 'react-router-dom'
import { Shield, Lock, Phone, KeyRound, Smartphone, ChevronRight } from 'lucide-react'
import './Security.css'

const Security = () => {
  const navigate = useNavigate()

  const menuItems = [
    {
      id: 'account-security',
      icon: Shield,
      label: 'Sécurité du compte',
      path: '/profile/security/account-security'
    },
    {
      id: 'password',
      icon: Lock,
      label: 'Mot de passe',
      path: '/profile/security/password'
    },
    {
      id: 'phone',
      icon: Phone,
      label: 'Numéro de téléphone',
      path: '/profile/security/phone'
    },
    {
      id: 'two-factor',
      icon: KeyRound,
      label: 'Connexion à deux étapes',
      path: '/profile/security/two-factor'
    },
    {
      id: 'devices',
      icon: Smartphone,
      label: 'Appareils connectés',
      path: '/profile/security/devices'
    }
  ]

  return (
    <div className="security-page">
        <div className="security-container">
          <div className="security-section">
            <div className="security-menu-list">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    className="security-menu-item"
                    onClick={() => navigate(item.path)}
                  >
                    <div className="security-menu-item-icon">
                      <Icon size={20} />
                    </div>
                    <span className="security-menu-item-label">{item.label}</span>
                    <ChevronRight size={18} className="security-menu-item-chevron" />
                  </button>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Security
