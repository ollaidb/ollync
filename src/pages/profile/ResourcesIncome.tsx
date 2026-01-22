import BackButton from '../../components/BackButton'
import './Resources.css'

const ResourcesIncome = () => {
  return (
    <div className="resources-detail-page">
      <div className="resources-header">
        <BackButton />
        <h2 className="resources-title">Déclarer ses revenus</h2>
        <div className="resources-header-spacer"></div>
      </div>

      <div className="resources-detail-section">
        <p>
          Déclarer ses revenus est indispensable pour rester en règle. Selon votre statut (auto-entrepreneur,
          entreprise individuelle ou société), les obligations varient. Le plus important est d'organiser
          votre suivi : conservez vos factures, notez les paiements reçus et classez vos justificatifs.
        </p>
        <p>
          Les auto-entrepreneurs déclarent généralement leur chiffre d'affaires mensuellement ou
          trimestriellement. Les autres statuts déclarent leurs résultats annuels, avec des échéances
          différentes. Pour les démarches fiscales, la référence principale est :
          <a href="https://www.impots.gouv.fr/" target="_blank" rel="noreferrer">
            impots.gouv.fr
          </a>.
        </p>
        <p>
          En parallèle, des déclarations sociales peuvent être demandées selon votre régime. Vérifiez vos
          obligations depuis votre espace en ligne et anticipez les échéances pour éviter les pénalités.
          Si vous approchez des seuils de TVA, préparez-vous aux ajustements de facturation.
        </p>
        <p>
          Ressources officielles recommandées :
        </p>
        <ul className="resources-links">
          <li>
            <a href="https://www.impots.gouv.fr/" target="_blank" rel="noreferrer">
              Portail officiel des impôts
            </a>
          </li>
          <li>
            <a href="https://www.service-public.fr/professionnels-entreprises/vosdroits/N24262" target="_blank" rel="noreferrer">
              Déclarations pour les professionnels (service-public)
            </a>
          </li>
          <li>
            <a href="https://www.urssaf.fr/" target="_blank" rel="noreferrer">
              URSSAF - déclarations sociales
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ResourcesIncome
