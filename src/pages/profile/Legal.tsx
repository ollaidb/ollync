import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Shield, Lock, Scale, ShoppingBag, Cookie, ChevronRight } from 'lucide-react'
import BackButton from '../../components/BackButton'
import './Legal.css'

const Legal = () => {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  const labels = isEnglish
    ? {
        title: 'Legal information',
        pages: {
          mentions: {
            title: 'Legal notice',
            description: 'Publisher and hosting details'
          },
          privacy: {
            title: 'Privacy policy',
            description: 'How we manage and protect your personal data'
          },
          cgu: {
            title: 'Terms of use',
            description: 'General terms of use'
          },
          cgv: {
            title: 'Terms of sale',
            description: 'General terms of sale'
          },
          cookies: {
            title: 'Cookie policy',
            description: 'How cookies are used on our site'
          },
          security: {
            title: 'Security page',
            description: 'Security measures and data protection'
          }
        }
      }
    : {
        title: 'Informations légales',
        pages: {
          mentions: {
            title: 'Mentions légales',
            description: "Informations sur l'éditeur et l'hébergement"
          },
          privacy: {
            title: 'Politique de confidentialité',
            description: 'Gestion et protection de vos données personnelles'
          },
          cgu: {
            title: 'CGU',
            description: "Conditions Générales d'Utilisation"
          },
          cgv: {
            title: 'CGV',
            description: 'Conditions Générales de Vente'
          },
          cookies: {
            title: 'Politique cookies',
            description: 'Utilisation des cookies sur notre site'
          },
          security: {
            title: 'Page Sécurité',
            description: 'Mesures de sécurité et protection des données'
          }
        }
      }

  const legalPages = [
    {
      id: 'mentions-legales',
      title: labels.pages.mentions.title,
      description: labels.pages.mentions.description,
      icon: Lock,
      path: '/profile/legal/mentions-legales'
    },
    {
      id: 'politique-confidentialite',
      title: labels.pages.privacy.title,
      description: labels.pages.privacy.description,
      icon: Shield,
      path: '/profile/legal/politique-confidentialite'
    },
    {
      id: 'cgu',
      title: labels.pages.cgu.title,
      description: labels.pages.cgu.description,
      icon: Scale,
      path: '/profile/legal/cgu'
    },
    {
      id: 'cgv',
      title: labels.pages.cgv.title,
      description: labels.pages.cgv.description,
      icon: ShoppingBag,
      path: '/profile/legal/cgv'
    },
    {
      id: 'politique-cookies',
      title: labels.pages.cookies.title,
      description: labels.pages.cookies.description,
      icon: Cookie,
      path: '/profile/legal/politique-cookies'
    },
    {
      id: 'securite',
      title: labels.pages.security.title,
      description: labels.pages.security.description,
      icon: Shield,
      path: '/profile/legal/securite'
    }
  ]

  return (
    <div className="legal-page">
      <div className="legal-page-header">
        <BackButton />
        <h2 className="legal-title">{labels.title}</h2>
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

