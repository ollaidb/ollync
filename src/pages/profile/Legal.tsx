import { useNavigate } from 'react-router-dom'
import { FileText, Shield, Lock, Scale, ShoppingBag, Cookie, ChevronRight } from 'lucide-react'
import BackButton from '../../components/BackButton'
import './Legal.css'

const Legal = () => {
  const navigate = useNavigate()

  const legalPages = [
    {
      id: 'mentions-legales',
      title: 'Mentions légales',
      description: 'Informations sur l\'éditeur et l\'hébergement',
      icon: Lock,
      path: '/profile/legal/mentions-legales'
    },
    {
      id: 'politique-confidentialite',
      title: 'Politique de confidentialité',
      description: 'Gestion et protection de vos données personnelles',
      icon: Shield,
      path: '/profile/legal/politique-confidentialite'
    },
    {
      id: 'cgu',
      title: 'CGU',
      description: 'Conditions Générales d\'Utilisation',
      icon: Scale,
      path: '/profile/legal/cgu'
    },
    {
      id: 'cgv',
      title: 'CGV',
      description: 'Conditions Générales de Vente',
      icon: ShoppingBag,
      path: '/profile/legal/cgv'
    },
    {
      id: 'politique-cookies',
      title: 'Politique cookies',
      description: 'Utilisation des cookies sur notre site',
      icon: Cookie,
      path: '/profile/legal/politique-cookies'
    },
    {
      id: 'securite',
      title: 'Page Sécurité',
      description: 'Mesures de sécurité et protection des données',
      icon: Shield,
      path: '/profile/legal/securite'
    }
  ]

  return (
    <div className="legal-page">
      <div className="legal-page-header">
        <BackButton />
        <h2 className="legal-title">Informations légales</h2>
        <div className="legal-header-spacer"></div>
      </div>

      <div className="legal-section">
        <div className="legal-menu-list">
          {legalPages.map((page) => {
            const Icon = page.icon
            return (
              <button
                key={page.id}
                className="legal-menu-item"
                onClick={() => navigate(page.path)}
              >
                <div className="legal-menu-item-content">
                  <div className="legal-menu-icon">
                    <Icon size={24} />
        </div>
                  <div className="legal-menu-text">
                    <h3>{page.title}</h3>
                    <p>{page.description}</p>
        </div>
      </div>
                <ChevronRight size={20} className="legal-menu-arrow" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Legal

