import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState'
import './Transactions.css'

const Transactions = () => {
  const navigate = useNavigate()
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
        <EmptyState
          type="category"
          customTitle={activeTab === 'received' ? 'Transforme tes actions en revenus.' : 'Lance tes actions et fais avancer tes projets.'}
          customSubtext={
            activeTab === 'received'
              ? 'Tes transactions validées apparaîtront ici automatiquement.'
              : 'Tes paiements envoyés seront visibles ici.'
          }
          actionLabel={activeTab === 'received' ? 'Publier une annonce' : 'Voir les annonces'}
          onAction={() => navigate(activeTab === 'received' ? '/publish' : '/search')}
          marketing
          marketingTone={activeTab === 'received' ? 'teal' : 'purple'}
        />
      </div>
    </div>
  )
}

export default Transactions
