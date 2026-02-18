import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Shield, Lock, Scale, ShoppingBag, Cookie, ChevronRight } from 'lucide-react'
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
            title: 'Legal notice'
          },
          privacy: {
            title: 'Privacy policy'
          },
          cgu: {
            title: 'Terms of use'
          },
          cgv: {
            title: 'Terms of sale'
          },
          cookies: {
            title: 'Cookie policy'
          },
          security: {
            title: 'Security page'
          }
        }
      }
    : {
        title: 'Informations légales',
        pages: {
          mentions: {
            title: 'Mentions légales'
          },
          privacy: {
            title: 'Politique de confidentialité'
          },
          cgu: {
            title: 'CGU'
          },
          cgv: {
            title: 'CGV'
          },
          cookies: {
            title: 'Politique cookies'
          },
          security: {
            title: 'Page Sécurité'
          }
        }
      }

  const legalPages = [
    {
      id: 'mentions-legales',
      title: labels.pages.mentions.title,
      icon: Lock,
      path: '/profile/legal/mentions-legales'
    },
    {
      id: 'politique-confidentialite',
      title: labels.pages.privacy.title,
      icon: Shield,
      path: '/profile/legal/politique-confidentialite'
    },
    {
      id: 'cgu',
      title: labels.pages.cgu.title,
      icon: Scale,
      path: '/profile/legal/cgu'
    },
    {
      id: 'cgv',
      title: labels.pages.cgv.title,
      icon: ShoppingBag,
      path: '/profile/legal/cgv'
    },
    {
      id: 'politique-cookies',
      title: labels.pages.cookies.title,
      icon: Cookie,
      path: '/profile/legal/politique-cookies'
    },
    {
      id: 'securite',
      title: labels.pages.security.title,
      icon: Shield,
      path: '/profile/legal/securite'
    }
  ]

  return (
    <div className="legal-page">
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
