import PageHeader from '../components/PageHeader'
import './Page.css'

const Vente = () => {
  return (
    <div className="page">
      <PageHeader title="Vente" />
      <div className="page-content">
        <div className="page-body">
          <div className="empty-state">
            <h2>Vente</h2>
            <p>Parcourez les annonces de vente.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Vente

