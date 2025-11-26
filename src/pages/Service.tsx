import PageHeader from '../components/PageHeader'
import './Page.css'

const Service = () => {
  return (
    <div className="page">
      <PageHeader title="Service" />
      <div className="page-content">
        <div className="page-body">
          <div className="empty-state">
            <h2>Service</h2>
            <p>Découvrez les services disponibles.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Service

