import { useNavigate } from 'react-router-dom'
import { Mail, FileText, ChevronRight } from 'lucide-react'
import './Help.css'

const Help = () => {
  const navigate = useNavigate()

  return (
    <div className="help-page">
      <div className="help-section">
        <div className="help-menu-list">
              <button
            className="help-menu-item"
            onClick={() => navigate('/profile/contact')}
          >
            <div className="help-menu-item-content">
              <div className="help-menu-icon">
              <Mail size={24} />
            </div>
              <div className="help-menu-text">
                <h3>Contact</h3>
                <p>Nos moyens de contact</p>
          </div>
            </div>
            <ChevronRight size={20} className="help-menu-arrow" />
          </button>

          <button
            className="help-menu-item"
            onClick={() => navigate('/profile/legal')}
          >
            <div className="help-menu-item-content">
              <div className="help-menu-icon">
                <FileText size={24} />
          </div>
              <div className="help-menu-text">
                <h3>Informations légales</h3>
                <p>Mentions légales, CGU, CGV et plus</p>
        </div>
      </div>
            <ChevronRight size={20} className="help-menu-arrow" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Help

