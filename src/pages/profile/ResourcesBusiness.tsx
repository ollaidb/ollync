import BackButton from '../../components/BackButton'
import './Resources.css'

const ResourcesBusiness = () => {
  return (
    <div className="resources-detail-page">
      <div className="resources-header">
        <BackButton />
        <h2 className="resources-title">Créer son entreprise</h2>
        <div className="resources-header-spacer"></div>
      </div>

      <div className="resources-detail-section">
        <p>
          Créer son entreprise est une étape importante. Le processus dépend du statut choisi (auto-entrepreneur,
          entreprise individuelle, SASU, EURL, etc.). L'objectif est de sélectionner un cadre adapté à vos revenus,
          à votre protection sociale et au niveau de responsabilité que vous souhaitez. Avant de démarrer,
          clarifiez votre offre, votre cible et vos tarifs afin de valider la viabilité de votre activité.
        </p>
        <p>
          Pour la plupart des créateurs, la première étape consiste à comparer les statuts. Le site officiel
          vous guide selon votre situation : 
          <a href="https://entreprendre.service-public.fr/" target="_blank" rel="noreferrer">
            entreprendre.service-public.fr
          </a>.
          Vous y trouverez les démarches, les documents requis et les coûts éventuels.
        </p>
        <p>
          Une fois le statut choisi, préparez les pièces nécessaires : pièce d'identité, justificatif de
          domicile, description de l'activité, éventuellement un bail ou une domiciliation. L'immatriculation
          se fait en ligne via le guichet unique des formalités d'entreprises : 
          <a href="https://formalites.entreprises.gouv.fr/" target="_blank" rel="noreferrer">
            formalites.entreprises.gouv.fr
          </a>.
          Ce portail centralise l'ensemble des déclarations (création, modification, cessation).
        </p>
        <p>
          Après l'immatriculation, pensez à ouvrir un compte bancaire dédié si votre statut l'exige, souscrire
          une assurance professionnelle si elle est obligatoire dans votre secteur, et mettre en place une
          facturation claire. Si vous vendez en ligne, la rédaction de mentions légales et de conditions
          générales peut être nécessaire.
        </p>
        <p>
          Pour aller plus loin, voici des ressources officielles utiles :
        </p>
        <ul className="resources-links">
          <li>
            <a href="https://entreprendre.service-public.fr/" target="_blank" rel="noreferrer">
              Guide officiel pour créer son entreprise
            </a>
          </li>
          <li>
            <a href="https://formalites.entreprises.gouv.fr/" target="_blank" rel="noreferrer">
              Guichet unique - formalités d'entreprises
            </a>
          </li>
          <li>
            <a href="https://www.service-public.fr/professionnels-entreprises" target="_blank" rel="noreferrer">
              Service-public.fr - espace professionnels
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ResourcesBusiness
