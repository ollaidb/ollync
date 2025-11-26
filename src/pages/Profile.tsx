import PageHeader from '../components/PageHeader'
import './Page.css'

const Profile = () => {
  return (
    <div className="page">
      <PageHeader title="Mon Profil" />
      <div className="page-content">
        <div className="page-body">
          <div className="empty-state">
            <h2>Mon Profil</h2>
            <p>Gérez vos informations personnelles.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

