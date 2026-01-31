import { useState } from 'react'
import './Transactions.css'

const Transactions = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')

  return (
    <div className="transactions-page">
      <div className="transactions-tabs">
        <button
          className={`transactions-tab ${activeTab === 'received' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('received')}
        >
          Transactions reçues
        </button>
        <button
          className={`transactions-tab ${activeTab === 'sent' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('sent')}
        >
          Transactions envoyées
        </button>
      </div>

      <div className="transactions-list">
        <div className="transactions-empty">
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
  )
}

export default Transactions
