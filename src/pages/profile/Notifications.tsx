import PageHeader from '../../components/PageHeader'
import './Notifications.css'

const Notifications = () => {
  return (
    <div className="page">
      <PageHeader title="Notifications" />
      <div className="page-content notifications-settings-page">
        <div className="notifications-settings-container">
          <div className="empty-state">
            <p>Fonctionnalité à venir</p>
            <p className="empty-state-subtitle">La gestion des notifications sera disponible prochainement.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications

