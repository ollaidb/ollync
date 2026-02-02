import { useTranslation } from 'react-i18next'
import BackButton from '../../components/BackButton'
import './Resources.css'

const ResourcesBusiness = () => {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  const content = isEnglish
    ? {
        title: 'Start your business',
        paragraphs: [
          'Starting your business is an important step. The process depends on the legal status you choose (sole proprietor, limited company, etc.). The goal is to select a framework that matches your income, social protection, and desired level of liability. Before you begin, clarify your offer, target audience, and pricing to validate the viability of your activity.',
          'For most creators, the first step is to compare legal statuses. The official website guides you based on your situation: entreprendre.service-public.fr. You will find steps, required documents, and potential costs there.',
          'Once the status is chosen, prepare the required documents: ID, proof of address, activity description, and possibly a lease or domiciliation. Registration is done online via the single business formalities portal: formalites.entreprises.gouv.fr. This portal centralizes all declarations (creation, modification, closure).',
          'After registration, consider opening a dedicated bank account if required by your status, taking out professional insurance if mandatory in your sector, and setting up clear invoicing. If you sell online, legal notices and terms may also be necessary.',
          'To go further, here are useful official resources:'
        ],
        links: [
          'Official guide to start a business',
          'One-stop portal - business formalities',
          'Service-public.fr - professionals area'
        ]
      }
    : {
        title: 'Créer son entreprise',
        paragraphs: [
          "Créer son entreprise est une étape importante. Le processus dépend du statut choisi (auto-entrepreneur, entreprise individuelle, SASU, EURL, etc.). L'objectif est de sélectionner un cadre adapté à vos revenus, à votre protection sociale et au niveau de responsabilité que vous souhaitez. Avant de démarrer, clarifiez votre offre, votre cible et vos tarifs afin de valider la viabilité de votre activité.",
          'Pour la plupart des créateurs, la première étape consiste à comparer les statuts. Le site officiel vous guide selon votre situation : entreprendre.service-public.fr. Vous y trouverez les démarches, les documents requis et les coûts éventuels.',
          "Une fois le statut choisi, préparez les pièces nécessaires : pièce d'identité, justificatif de domicile, description de l'activité, éventuellement un bail ou une domiciliation. L'immatriculation se fait en ligne via le guichet unique des formalités d'entreprises : formalites.entreprises.gouv.fr. Ce portail centralise l'ensemble des déclarations (création, modification, cessation).",
          "Après l'immatriculation, pensez à ouvrir un compte bancaire dédié si votre statut l'exige, souscrire une assurance professionnelle si elle est obligatoire dans votre secteur, et mettre en place une facturation claire. Si vous vendez en ligne, la rédaction de mentions légales et de conditions générales peut être nécessaire.",
          'Pour aller plus loin, voici des ressources officielles utiles :'
        ],
        links: [
          'Guide officiel pour créer son entreprise',
          "Guichet unique - formalités d'entreprises",
          'Service-public.fr - espace professionnels'
        ]
      }

  return (
    <div className="resources-detail-page">
      <div className="resources-header">
        <BackButton />
        <h2 className="resources-title">{content.title}</h2>
        <div className="resources-header-spacer"></div>
      </div>

      <div className="resources-detail-section">
        <p>{content.paragraphs[0]}</p>
        <p>
          {content.paragraphs[1]}{' '}
          <a href="https://entreprendre.service-public.fr/" target="_blank" rel="noreferrer">
            entreprendre.service-public.fr
          </a>.
        </p>
        <p>
          {content.paragraphs[2]}{' '}
          <a href="https://formalites.entreprises.gouv.fr/" target="_blank" rel="noreferrer">
            formalites.entreprises.gouv.fr
          </a>.
        </p>
        <p>{content.paragraphs[3]}</p>
        <p>{content.paragraphs[4]}</p>
        <ul className="resources-links">
          <li>
            <a href="https://entreprendre.service-public.fr/" target="_blank" rel="noreferrer">
              {content.links[0]}
            </a>
          </li>
          <li>
            <a href="https://formalites.entreprises.gouv.fr/" target="_blank" rel="noreferrer">
              {content.links[1]}
            </a>
          </li>
          <li>
            <a href="https://www.service-public.fr/professionnels-entreprises" target="_blank" rel="noreferrer">
              {content.links[2]}
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ResourcesBusiness
