import { MapPin, Clock, Code, Globe } from 'lucide-react'
import './ProfileInfo.css'

interface ProfileInfoProps {
  bio?: string | null
  location?: string | null
  locationVisible?: boolean
  availability?: string | null
  skills?: string[]
  languages?: Array<{ name: string; level: string }>
}

export const ProfileInfo = ({
  bio,
  location,
  locationVisible = true,
  availability,
  skills = [],
  languages = []
}: ProfileInfoProps) => {
  return (
    <div className="profile-info-container">
      {bio && (
        <div className="profile-info-section">
          <p className="profile-bio-text">{bio}</p>
        </div>
      )}

      {(location || availability) && (
        <div className="profile-info-section">
          {location && locationVisible && (
            <div className="profile-info-item">
              <MapPin size={18} />
              <span>{location}</span>
            </div>
          )}
          {availability && (
            <div className="profile-info-item">
              <Clock size={18} />
              <span>{availability}</span>
            </div>
          )}
        </div>
      )}

      {skills.length > 0 && (
        <div className="profile-info-section">
          <div className="profile-info-header">
            <Code size={18} />
            <h3>Compétences</h3>
          </div>
          <div className="profile-skills">
            {skills.map((skill, index) => (
              <span key={index} className="profile-skill-tag">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {languages.length > 0 && (
        <div className="profile-info-section">
          <div className="profile-info-header">
            <Globe size={18} />
            <h3>Langues</h3>
          </div>
          <div className="profile-languages">
            {languages.map((lang, index) => (
              <div key={index} className="profile-language-item">
                <span className="language-name">{lang.name}</span>
                <span className="language-level">{lang.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

