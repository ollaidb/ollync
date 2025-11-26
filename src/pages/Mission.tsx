import PageHeader from '../components/PageHeader'
import './Page.css'

const Mission = () => {
  return (
    <div className="page">
      <PageHeader title="Mission" />
      <div className="page-content">
        <div className="page-body">
          <div className="empty-state">
            <h2>Mission</h2>
            <p>Explorez les missions disponibles.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Mission

