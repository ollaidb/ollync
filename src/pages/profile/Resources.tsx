import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Rocket, Building2, Receipt, ShieldCheck, CheckCircle, ArrowRight } from 'lucide-react'
import BackButton from '../../components/BackButton'
import './Resources.css'

const Resources = () => {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  const labels = isEnglish
    ? {
        title: 'Resources',
        introTitle: 'Guides to succeed',
        introText:
          'Clear resources to help you use the app, structure your activity, and manage your income.',
        businessTitle: 'Start your business',
        businessDescription:
          'A complete guide with all the steps, key points, and official links to start your business.',
        businessButton: 'Read the full guide',
        incomeTitle: 'Declare your income',
        incomeDescription:
          'A detailed page to understand filings, deadlines, and useful links.',
        incomeButton: 'View the full explanations',
        footerText: 'Need personalized support? Our team can guide you.',
        footerButton: 'Contact support'
      }
    : {
        title: 'Ressources',
        introTitle: 'Guides pour réussir',
        introText:
          "Des ressources claires pour faciliter l'utilisation de l'application, structurer votre activité et mieux gérer vos revenus.",
        businessTitle: 'Créer son entreprise',
        businessDescription:
          "Un guide complet avec toutes les étapes, les points d'attention et les liens officiels pour créer votre entreprise.",
        businessButton: 'Lire le guide complet',
        incomeTitle: 'Déclarer ses revenus',
        incomeDescription:
          'Une page détaillée pour comprendre les déclarations, les échéances et les liens utiles.',
        incomeButton: 'Accéder aux explications complètes',
        footerText: "Besoin d'un accompagnement personnalisé ? Notre équipe peut vous guider.",
        footerButton: 'Contacter le support'
      }

  const resourceSections = isEnglish
    ? [
        {
          id: 'getting-started',
          title: 'Getting started on Ollync',
          icon: Rocket,
          items: [
            {
              title: 'Build your profile and portfolio',
              description:
                'Add a clear bio, your skills, and project examples to build credibility.'
            },
            {
              title: 'Publish your first listing',
              description:
                'Describe the need, budget, timeline, and expected format to attract the right profiles.'
            },
            {
              title: 'Understand categories',
              description:
                'Use categories to be visible to the right audience and make searches easier.'
            }
          ]
        },
        {
          id: 'best-practices',
          title: 'Best practices',
          icon: ShieldCheck,
          items: [
            {
              title: 'Secure your exchanges',
              description:
                'Prioritize clear communication, a complete brief, and written approvals.'
            },
            {
              title: 'Manage your schedule',
              description:
                'Block time slots and plan deliverables ahead to avoid delays.'
            },
            {
              title: 'Build your reputation',
              description:
                'Deliver quality work, reply quickly, and request reviews after each job.'
            }
          ]
        }
      ]
    : [
        {
          id: 'getting-started',
          title: 'Bien démarrer sur Ollync',
          icon: Rocket,
          items: [
            {
              title: 'Créer votre profil et portfolio',
              description:
                'Ajoutez une bio claire, vos compétences et des exemples de projets pour gagner en crédibilité.'
            },
            {
              title: 'Publier votre première annonce',
              description:
                'Décrivez le besoin, le budget, le délai et le format attendu pour attirer les bons profils.'
            },
            {
              title: 'Comprendre les catégories',
              description:
                'Utilisez les catégories pour être visible par la bonne audience et faciliter les recherches.'
            }
          ]
        },
        {
          id: 'best-practices',
          title: 'Bonnes pratiques',
          icon: ShieldCheck,
          items: [
            {
              title: 'Sécuriser vos échanges',
              description:
                'Privilégiez des échanges clairs, un brief complet et des validations écrites.'
            },
            {
              title: 'Gérer votre planning',
              description:
                'Bloquez des créneaux et anticipez les livrables pour éviter les retards.'
            },
            {
              title: 'Construire votre réputation',
              description:
                'Soignez vos livrables, répondez rapidement et demandez des avis après chaque mission.'
            }
          ]
        }
      ]

  return (
    <div className="resources-page">
      <div className="resources-header">
        <BackButton />
        <h2 className="resources-title">{labels.title}</h2>
        <div className="resources-header-spacer"></div>
      </div>

      <div className="resources-intro">
        <div className="resources-intro-icon">
          <BookOpen size={26} />
        </div>
        <div>
          <h3>{labels.introTitle}</h3>
          <p>
            {labels.introText}
          </p>
        </div>
      </div>

      <div className="resources-section">
        <h3 className="resources-section-title">
          <Building2 size={20} />
          {labels.businessTitle}
        </h3>
        <p className="resources-section-description">
          {labels.businessDescription}
        </p>
        <button
          className="resources-link-card"
          onClick={() => navigate('/profile/resources/creation-entreprise')}
        >
          <span>{labels.businessButton}</span>
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="resources-section">
        <h3 className="resources-section-title">
          <Receipt size={20} />
          {labels.incomeTitle}
        </h3>
        <p className="resources-section-description">
          {labels.incomeDescription}
        </p>
        <button
          className="resources-link-card"
          onClick={() => navigate('/profile/resources/declaration-revenus')}
        >
          <span>{labels.incomeButton}</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {resourceSections.map((section) => {
        const Icon = section.icon
        return (
          <div key={section.id} className="resources-section">
            <h3 className="resources-section-title">
              <Icon size={20} />
              {section.title}
            </h3>
            <div className="resources-list">
              {section.items.map((item) => (
                <div key={item.title} className="resources-item">
                  <CheckCircle size={18} className="resources-item-icon" />
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="resources-footer">
        <p>{labels.footerText}</p>
        <button className="resources-contact-button" onClick={() => navigate('/profile/contact')}>
          {labels.footerButton}
        </button>
      </div>
    </div>
  )
}

export default Resources
