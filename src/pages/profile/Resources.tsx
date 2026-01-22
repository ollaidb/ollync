import { useNavigate } from 'react-router-dom'
import { BookOpen, Rocket, Building2, Receipt, ShieldCheck, CheckCircle, ArrowRight } from 'lucide-react'
import BackButton from '../../components/BackButton'
import './Resources.css'

const Resources = () => {
  const navigate = useNavigate()

  const resourceSections = [
    {
      id: 'getting-started',
      title: 'Bien démarrer sur Ollync',
      icon: Rocket,
      items: [
        {
          title: 'Créer votre profil et portfolio',
          description: 'Ajoutez une bio claire, vos compétences et des exemples de projets pour gagner en crédibilité.'
        },
        {
          title: 'Publier votre première annonce',
          description: 'Décrivez le besoin, le budget, le délai et le format attendu pour attirer les bons profils.'
        },
        {
          title: 'Comprendre les catégories',
          description: 'Utilisez les catégories pour être visible par la bonne audience et faciliter les recherches.'
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
          description: 'Privilégiez des échanges clairs, un brief complet et des validations écrites.'
        },
        {
          title: 'Gérer votre planning',
          description: 'Bloquez des créneaux et anticipez les livrables pour éviter les retards.'
        },
        {
          title: 'Construire votre réputation',
          description: 'Soignez vos livrables, répondez rapidement et demandez des avis après chaque mission.'
        }
      ]
    }
  ]

  return (
    <div className="resources-page">
      <div className="resources-header">
        <BackButton />
        <h2 className="resources-title">Ressources</h2>
        <div className="resources-header-spacer"></div>
      </div>

      <div className="resources-intro">
        <div className="resources-intro-icon">
          <BookOpen size={26} />
        </div>
        <div>
          <h3>Guides pour réussir</h3>
          <p>
            Des ressources claires pour faciliter l'utilisation de l'application, structurer votre activité
            et mieux gérer vos revenus.
          </p>
        </div>
      </div>

      <div className="resources-section">
        <h3 className="resources-section-title">
          <Building2 size={20} />
          Créer son entreprise
        </h3>
        <p className="resources-section-description">
          Un guide complet avec toutes les étapes, les points d'attention et les liens officiels pour créer
          votre entreprise.
        </p>
        <button
          className="resources-link-card"
          onClick={() => navigate('/profile/resources/creation-entreprise')}
        >
          <span>Lire le guide complet</span>
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="resources-section">
        <h3 className="resources-section-title">
          <Receipt size={20} />
          Déclarer ses revenus
        </h3>
        <p className="resources-section-description">
          Une page détaillée pour comprendre les déclarations, les échéances et les liens utiles.
        </p>
        <button
          className="resources-link-card"
          onClick={() => navigate('/profile/resources/declaration-revenus')}
        >
          <span>Accéder aux explications complètes</span>
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
        <p>Besoin d'un accompagnement personnalisé ? Notre équipe peut vous guider.</p>
        <button className="resources-contact-button" onClick={() => navigate('/profile/contact')}>
          Contacter le support
        </button>
      </div>
    </div>
  )
}

export default Resources
