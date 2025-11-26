import PageHeader from '../../components/PageHeader'
import './AccountSecurity.css'

const AccountSecurity = () => {
  return (
    <div className="page">
      <PageHeader title="Sécurité du compte" />
      <div className="page-content account-security-page">
        <div className="account-security-container">
          <div className="empty-state">
            <p>Fonctionnalité à venir</p>
            <p className="empty-state-subtitle">Les paramètres de sécurité du compte seront disponibles prochainement.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountSecurity

