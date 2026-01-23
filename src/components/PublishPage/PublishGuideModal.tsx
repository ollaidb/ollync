import { X } from 'lucide-react'
import './PublishGuideModal.css'

type GuideSection = {
  title: string
  questions: string[]
  examples: string[]
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: 'Collaboration / Duo',
    questions: [
      'Quel type de duo veux-tu créer (humour, lifestyle, challenge) ?',
      'Tu veux une collab ponctuelle ou régulière ?',
      'Quel format et quelle plateforme ?',
    ],
    examples: [
      'Cherche partenaire pour créer un duo régulier',
      'Besoin d’un créateur pour collab TikTok',
      'Duo créatif pour Reels Instagram',
      'Collaboration pour une série de vidéos',
      'Binôme pour challenges tendance',
    ],
  },
  {
    title: 'Caméraman / Suivi',
    questions: [
      'Tu veux juste quelqu’un pour filmer ou aussi cadrer/son ?',
      'Durée de tournage prévue ?',
      'Tu filmes avec téléphone ou caméra ?',
    ],
    examples: [
      'Cherche personne pour me filmer',
      'Quelqu’un pour me suivre sur un vlog journée',
      'Besoin d’un caméraman mobile',
      'Recherche cadreur discret pour tournage rapide',
      'Besoin d’aide pour filmer un reel',
    ],
  },
  {
    title: 'Vlog / Storytelling',
    questions: [
      'Quel thème de vlog (train, ville, backstage, travel) ?',
      'Tu veux un montage court ou long ?',
      'Lieu et durée du vlog ?',
    ],
    examples: [
      'Vlog “train/transport” à filmer',
      'Vidéo “une journée avec moi”',
      'Vlog découverte en ville',
      'Tournage vlog backstage',
      'Vlog challenge en extérieur',
    ],
  },
  {
    title: 'Interview / Questions',
    questions: [
      'Sujet précis et angle de discussion ?',
      'Format interview (face cam, micro‑trottoir) ?',
      'Durée et plateforme ciblée ?',
    ],
    examples: [
      'Je cherche quelqu’un pour poser des questions',
      'Interview courte pour TikTok',
      'Discussion à deux pour YouTube',
      'Talk vidéo sur un sujet spécifique',
      'Interview “micro‑trottoir” en ville',
    ],
  },
  {
    title: 'Chaîne YouTube / Formats longs',
    questions: [
      'Thème de la chaîne et fréquence de publication ?',
      'Tu cherches un co‑host ou un invité ?',
      'Tu as besoin d’aide pour montage ?',
    ],
    examples: [
      'Création d’une chaîne YouTube à deux',
      'Cherche co‑host pour vidéos longues',
      'Partenaire pour vidéos YouTube régulières',
      'Recherche invité pour format YouTube',
      'Équipe pour série YouTube',
    ],
  },
  {
    title: 'Concepts spécifiques',
    questions: [
      'Quel concept exact (challenge, réaction, expérimentation) ?',
      'Lieu et timing du tournage ?',
      'Besoin de participants ou figurants ?',
    ],
    examples: [
      'Vidéo “train/transport” à filmer',
      'Concept “reaction” en duo',
      'Vidéo test/expérience sociale',
      'Concept humoristique à tourner',
      'Challenge à plusieurs',
    ],
  },
  {
    title: 'Lieu / Spot de tournage',
    questions: [
      'Quel type de lieu (studio, café, extérieur) ?',
      'Durée d’occupation et budget ?',
      'Accessibilité et autorisations ?',
    ],
    examples: [
      'Recherche lieu pour shooting',
      'Besoin d’un endroit pour créer du contenu',
      'Studio photo dispo pour 2h',
      'Lieu lumineux pour vidéo',
      'Spots sympas pour tournage',
    ],
  },
  {
    title: 'Modèle / Figurants',
    questions: [
      'Quel type de profil et style ?',
      'Durée et lieu du shooting ?',
      'Contenu rémunéré ou collab ?',
    ],
    examples: [
      'Cherche modèle pour shooting',
      'Figurant recherché pour vidéo courte',
      'Casting rapide pour contenu produit',
      'Modèle pour portraits',
      'Mannequin pour lookbook',
    ],
  },
  {
    title: 'Photographe / Vidéaste',
    questions: [
      'Tu veux photo, vidéo, ou les deux ?',
      'Style souhaité (lifestyle, urbain, studio) ?',
      'Délai et livrables attendus ?',
    ],
    examples: [
      'Photographe recherché pour shooting',
      'Besoin d’un vidéaste pour contenu',
      'Recherche photographe lifestyle',
      'Vidéaste pour clips courts',
      'Photographe pour book perso',
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
          Utilise ces exemples pour rédiger un titre clair. Tu peux aussi répondre aux questions
          rapides pour structurer ta demande.
        </p>

        <div className="publish-guide-sections">
          {GUIDE_SECTIONS.map((section) => (
            <div key={section.title} className="publish-guide-section">
              <h3 className="publish-guide-section-title">{section.title}</h3>
              <div className="publish-guide-block">
                <p className="publish-guide-block-title">Questions utiles</p>
                <ul className="publish-guide-list">
                  {section.questions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
              <div className="publish-guide-block">
                <p className="publish-guide-block-title">Exemples de titres</p>
                <ul className="publish-guide-list">
                  {section.examples.map((example) => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
