import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, FileText, BookOpen, ChevronRight } from 'lucide-react'
import './Help.css'

const Help = () => {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  const labels = isEnglish
    ? {
        contactTitle: 'Contact',
        contactDescription: 'How to reach us',
        legalTitle: 'Legal information',
        legalDescription: 'Legal notice, terms of use and more',
        resourcesTitle: 'Resources',
        resourcesDescription: 'Practical guides to use the app well'
      }
    : {
        contactTitle: 'Contact',
        contactDescription: 'Nos moyens de contact',
        legalTitle: 'Informations légales',
        legalDescription: 'Mentions légales, CGU, CGV et plus',
        resourcesTitle: 'Ressources',
        resourcesDescription: "Guides pratiques pour bien utiliser l'application"
      }

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
                <h3>{labels.contactTitle}</h3>
                <p>{labels.contactDescription}</p>
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
                <h3>{labels.legalTitle}</h3>
                <p>{labels.legalDescription}</p>
        </div>
      </div>
            <ChevronRight size={20} className="help-menu-arrow" />
          </button>

          <button
            className="help-menu-item"
            onClick={() => navigate('/profile/resources')}
          >
            <div className="help-menu-item-content">
              <div className="help-menu-icon">
                <BookOpen size={24} />
              </div>
              <div className="help-menu-text">
                <h3>{labels.resourcesTitle}</h3>
                <p>{labels.resourcesDescription}</p>
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

