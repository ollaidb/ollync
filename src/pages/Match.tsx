import PageHeader from '../components/PageHeader'
import './Page.css'

const Match = () => {
  return (
    <div className="page">
      <PageHeader title="Match" />
      <div className="page-content">
        <div className="page-body">
          <div className="empty-state">
            <h2>Match</h2>
            <p>Trouvez des personnes qui correspondent à vos besoins.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Match

