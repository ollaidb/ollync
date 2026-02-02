import { useTranslation } from 'react-i18next'
import BackButton from '../../components/BackButton'
import './Resources.css'

const ResourcesIncome = () => {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  const content = isEnglish
    ? {
        title: 'Declare your income',
        paragraphs: [
          'Declaring your income is essential to stay compliant. Depending on your status (self-employed, sole proprietor, or company), obligations vary. The most important thing is to organize your tracking: keep invoices, record payments received, and file your receipts.',
          'Self-employed creators usually declare turnover monthly or quarterly. Other statuses declare annual results with different deadlines. For tax procedures, the main reference is: impots.gouv.fr.',
          'In parallel, social declarations may be required depending on your regime. Check your obligations from your online space and plan ahead to avoid penalties. If you approach VAT thresholds, prepare for billing adjustments.',
          'Recommended official resources:'
        ],
        links: [
          'Official tax portal',
          'Declarations for professionals (service-public)',
          'URSSAF - social declarations'
        ]
      }
    : {
        title: 'Déclarer ses revenus',
        paragraphs: [
          "Déclarer ses revenus est indispensable pour rester en règle. Selon votre statut (auto-entrepreneur, entreprise individuelle ou société), les obligations varient. Le plus important est d'organiser votre suivi : conservez vos factures, notez les paiements reçus et classez vos justificatifs.",
          'Les auto-entrepreneurs déclarent généralement leur chiffre d\'affaires mensuellement ou trimestriellement. Les autres statuts déclarent leurs résultats annuels, avec des échéances différentes. Pour les démarches fiscales, la référence principale est : impots.gouv.fr.',
          'En parallèle, des déclarations sociales peuvent être demandées selon votre régime. Vérifiez vos obligations depuis votre espace en ligne et anticipez les échéances pour éviter les pénalités. Si vous approchez des seuils de TVA, préparez-vous aux ajustements de facturation.',
          'Ressources officielles recommandées :'
        ],
        links: [
          'Portail officiel des impôts',
          'Déclarations pour les professionnels (service-public)',
          'URSSAF - déclarations sociales'
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
          <a href="https://www.impots.gouv.fr/" target="_blank" rel="noreferrer">
            impots.gouv.fr
          </a>.
        </p>
        <p>{content.paragraphs[2]}</p>
        <p>{content.paragraphs[3]}</p>
        <ul className="resources-links">
          <li>
            <a href="https://www.impots.gouv.fr/" target="_blank" rel="noreferrer">
              {content.links[0]}
            </a>
          </li>
          <li>
            <a href="https://www.service-public.fr/professionnels-entreprises/vosdroits/N24262" target="_blank" rel="noreferrer">
              {content.links[1]}
            </a>
          </li>
          <li>
            <a href="https://www.urssaf.fr/" target="_blank" rel="noreferrer">
              {content.links[2]}
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ResourcesIncome
