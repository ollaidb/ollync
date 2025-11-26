import PageHeader from '../components/PageHeader'
import './Page.css'

const Favorites = () => {
  return (
    <div className="page">
      <PageHeader title="Mes Favoris" />
      <div className="page-content">
        <div className="page-body">
          <div className="empty-state">
            <h2>Mes Favoris</h2>
            <p>Aucun favori pour le moment.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Favorites

