import { useState } from 'react'
import './Wallet.css'

const WalletPage = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [isPendingOpen, setIsPendingOpen] = useState(false)

  return (
    <div className="wallet-page">
      <div className="wallet-balance-card">
        <span className="wallet-balance-label">Solde disponible</span>
        <span className="wallet-balance-amount">0,00 €</span>
        <div className="wallet-balance-meta">
          <span className="wallet-balance-sub-label">En attente de confirmation</span>
          <span className="wallet-balance-sub-amount">0,00 €</span>
        </div>
      </div>

      <div className="wallet-pending">
        <button
          className={`wallet-pending-toggle ${isPendingOpen ? 'open' : ''}`}
          type="button"
          onClick={() => setIsPendingOpen((prev) => !prev)}
        >
          <span>En attente de confirmation</span>
          <span className="wallet-pending-amount">0,00 €</span>
        </button>
        {isPendingOpen && (
          <div className="wallet-pending-list">
            <div className="wallet-pending-item">
              <div className="wallet-pending-info">
                <span className="wallet-pending-title">Transaction en attente</span>
                <span className="wallet-pending-subtitle">À confirmer ou rejeter</span>
              </div>
              <div className="wallet-pending-actions">
                <button className="wallet-action-btn confirm" type="button">
                  Confirmer
                </button>
                <button className="wallet-action-btn reject" type="button">
                  Rejeter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="wallet-activity">
        <div className="wallet-tabs">
          <button
            className={`wallet-tab ${activeTab === 'received' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('received')}
          >
            Transactions reçues
          </button>
          <button
            className={`wallet-tab ${activeTab === 'sent' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('sent')}
          >
            Transactions envoyées
          </button>
        </div>
        <div className="wallet-list">
          <div className="wallet-empty">
            <p>
              {activeTab === 'received'
                ? 'Aucune transaction reçue pour le moment.'
                : 'Aucune transaction envoyée pour le moment.'}
            </p>
            <span>
              {activeTab === 'received'
                ? 'Les paiements validés apparaîtront ici.'
                : 'Les paiements envoyés apparaîtront ici.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WalletPage
