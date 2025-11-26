import PageHeader from '../components/PageHeader'
import './Page.css'

const Publish = () => {
  return (
    <div className="page">
      <PageHeader title="Publier une annonce" />
      <div className="page-content">
        <div className="page-body">
          <div className="empty-state">
            <h2>Publier une annonce</h2>
            <p>Créez votre annonce de mise en relation.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Publish

