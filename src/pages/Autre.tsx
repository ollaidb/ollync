import PageHeader from '../components/PageHeader'
import './Page.css'

const Autre = () => {
  return (
    <div className="page">
      <PageHeader title="Autre" />
      <div className="page-content">
        <div className="page-body">
          <div className="empty-state">
            <h2>Autre</h2>
            <p>Découvrez d'autres catégories.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Autre

