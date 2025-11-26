import { useNavigate } from 'react-router-dom'
import { Shield, Lock, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
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
    }
  ]

  return (
    <div className="page">
      <PageHeader title="Mon compte" />
      <div className="page-content security-page">
        <div className="security-container">
          <div className="security-section">
            <div className="security-section-header">
              <Shield size={20} />
              <h2 className="security-section-title">Connexion et Sécurité</h2>
            </div>
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
    </div>
  )
}

export default Security
