import './Transactions.css'

const Transactions = () => {
  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <h2>Transactions</h2>
        <p>Suivez ce que vous avez acheté et vendu dans l’application.</p>
      </div>

      <div className="transactions-section">
        <h3>Transactions reçues</h3>
        <div className="transactions-list empty">
          <p>Aucune transaction reçue pour le moment.</p>
          <span>Les ventes validées apparaîtront ici.</span>
        </div>
      </div>

      <div className="transactions-section">
        <h3>Transactions envoyées</h3>
        <div className="transactions-list empty">
          <p>Aucune transaction envoyée pour le moment.</p>
          <span>Vos achats validés apparaîtront ici.</span>
        </div>
      </div>
    </div>
  )
}

export default Transactions
