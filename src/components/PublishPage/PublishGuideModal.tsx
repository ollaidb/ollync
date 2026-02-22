import { X } from 'lucide-react'
import './PublishGuideModal.css'

type GuideSection = {
  title: string
  offerExamples: string[]
  requestExamples?: string[]
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: 'Création de contenu',
    offerExamples: [
      'Je propose de filmer vos contenus lifestyle',
      'Créateur dispo pour photos et vidéos de marque',
      'Je propose du montage court format réseaux',
    ],
    requestExamples: [
      'Je cherche un vidéaste pour filmer ma journée',
      'Recherche photographe pour contenu Instagram',
      'Besoin d’un monteur pour vidéos YouTube',
    ],
  },
  {
    title: 'Emploi',
    offerExamples: [
      'Community manager disponible pour mission mensuelle',
      'Je propose mes services en montage vidéo',
      'Rédacteur de contenu disponible à distance',
    ],
    requestExamples: [
      'Recherche monteur pour vidéos hebdomadaires',
      'Je cherche un community manager pour une marque',
      'Besoin d’un profil rédaction contenu en freelance',
    ],
  },
  {
    title: 'Casting',
    offerExamples: [
      'Je propose de participer comme figurant',
      'Modèle photo disponible pour shooting studio',
      'Voix off disponible pour vidéos promotionnelles',
    ],
    requestExamples: [
      'Je cherche 3 figurants pour un sketch',
      'Recherche modèle vidéo pour clip musical',
      'Besoin d’une voix off grave pour publicité',
    ],
  },
  {
    title: 'Lieu',
    offerExamples: [
      'Lieu de loisirs disponible pour tournage soirée',
      'Espace bien-être disponible pour prestations',
      'Je propose un lieu privatisable le week-end',
    ],
  },
  {
    title: 'Service/Mission',
    offerExamples: [
      'Je propose du coaching contenu personnalisé',
      'Animation de compte disponible pour marque',
      'Développement business pour créateurs',
    ],
    requestExamples: [
      'Je cherche un coach pour structurer mon contenu',
      'Recherche animation de compte pour mon projet',
      'Besoin d’un accompagnement branding',
    ],
  },
  {
    title: 'Événement',
    offerExamples: [
      'Je propose l’organisation d’une masterclass',
      'Intervenant disponible pour conférence',
      'Je propose un atelier pratique en présentiel',
    ],
  },
  {
    title: 'Vente',
    offerExamples: [
      'Je vends un kit lumière complet',
      'Vente micro pro pour podcast',
      'Je propose du matériel photo en bon état',
    ],
  },
]

type PublishGuideModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const PublishGuideModal = ({ isOpen, onClose }: PublishGuideModalProps) => {
  if (!isOpen) return null

  return (
    <div className="publish-guide-overlay" onClick={onClose}>
      <div className="publish-guide-content" onClick={(event) => event.stopPropagation()}>
        <div className="publish-guide-header">
          <h2 className="publish-guide-title">Guide de publication</h2>
          <button className="publish-guide-close" onClick={onClose} aria-label="Fermer">
            <X size={22} />
          </button>
        </div>

        <p className="publish-guide-intro">
          Guide rapide pour rédiger un titre selon le type de besoin. Pour chaque catégorie, tu as
          des exemples pour Offre puis Demande.
        </p>

        <div className="publish-guide-sections">
          {GUIDE_SECTIONS.map((section) => (
            <div key={section.title} className="publish-guide-section">
              <h3 className="publish-guide-section-title">{section.title}</h3>
              <div className="publish-guide-block">
                <p className="publish-guide-block-title">Offre - exemples de titres</p>
                <ul className="publish-guide-list">
                  {section.offerExamples.map((example) => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              </div>
              {section.requestExamples && section.requestExamples.length > 0 && (
                <div className="publish-guide-block">
                  <p className="publish-guide-block-title">Demande - exemples de titres</p>
                  <ul className="publish-guide-list">
                    {section.requestExamples.map((example) => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
