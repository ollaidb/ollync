import './Wallet.css'

const WalletPage = () => {
  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <h2>Porte-monnaie</h2>
        <p>Consultez les montants reçus dans l’application.</p>
      </div>

      <div className="wallet-summary">
        <div className="wallet-card">
          <span className="wallet-label">Solde disponible</span>
          <span className="wallet-amount">0,00 €</span>
          <span className="wallet-helper">Montant prêt à être retiré.</span>
        </div>
        <div className="wallet-card secondary">
          <span className="wallet-label">En attente de confirmation</span>
          <span className="wallet-amount">0,00 €</span>
          <span className="wallet-helper">Paiements en validation.</span>
        </div>
      </div>

      <div className="wallet-section">
        <h3>Transactions reçues</h3>
        <div className="wallet-empty">
          <p>Aucune transaction reçue pour le moment.</p>
          <span>Les paiements validés apparaîtront ici.</span>
        </div>
      </div>

      <div className="wallet-section">
        <h3>Connexion Stripe</h3>
        <div className="wallet-connect">
          <p>Connectez votre compte bancaire pour recevoir vos paiements.</p>
          <button className="wallet-primary-btn" disabled>
            Connecter Stripe (bientôt)
          </button>
        </div>
      </div>
    </div>
  )
}

export default WalletPage
