import PageHeader from '../components/PageHeader'
import './Page.css'

const Messages = () => {
  return (
    <div className="page">
      <PageHeader title="Messages" />
      <div className="page-content">
        <div className="page-body">
          <div className="empty-state">
            <h2>Messages</h2>
            <p>Aucun message pour le moment.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Messages

