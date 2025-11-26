import PageHeader from '../../components/PageHeader'
import './PaymentMethods.css'

const PaymentMethods = () => {
  return (
    <div className="page">
      <PageHeader title="Moyens de paiement" />
      <div className="page-content payment-methods-page">
        <div className="payment-methods-container">
          <div className="empty-state">
            <p>Fonctionnalité à venir</p>
            <p className="empty-state-subtitle">La gestion des moyens de paiement sera disponible prochainement.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentMethods

