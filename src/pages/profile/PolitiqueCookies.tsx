import { useTranslation } from 'react-i18next'
import './LegalPage.css'

const PolitiqueCookies = () => {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')
  const dateLocale = isEnglish ? 'en-US' : 'fr-FR'

  const content = isEnglish
    ? {
        title: 'Cookie policy',
        updatedLabel: 'Last updated:',
        what: {
          title: '1. What is a cookie?',
          text: 'A cookie is a small text file placed on your device when you visit a website.'
        },
        usage: {
          title: '2. Cookies used by Ollync',
          intro: 'Ollync may use:',
          items: [
            'Strictly necessary cookies (operation, security, sessions)',
            'Preference cookies (language, display)',
            'Audience measurement cookies (if enabled)'
          ]
        },
        thirdParty: {
          title: '3. Third-party cookies',
          intro:
            'Some cookies may be placed by third-party services linked to the operation of the application (for example, hosting or performance tools). Ollync does not control these third-party cookies.'
        },
        consent: {
          title: '4. Consent',
          text:
            'On your first visit, you can accept or refuse non-essential cookies. You can change your choice at any time.'
        },
        retention: {
          title: '5. Retention period',
          intro: 'Cookies may be:',
          items: [
            { label: 'Session cookies:', text: 'Deleted when you close your browser' },
            { label: 'Persistent cookies:', text: 'Stored for a limited period' }
          ]
        },
        management: {
          title: '6. Managing cookies',
          text: 'You can manage or delete cookies in your browser settings.'
        },
        personalData: {
          title: '7. Links',
          textBefore:
            'For more information about personal data, please see our ',
          linkText: 'Privacy policy',
          textAfter: '.'
        }
      }
    : {
        title: 'Politique cookies',
        updatedLabel: 'Dernière mise à jour :',
        what: {
          title: "1. Qu'est-ce qu'un cookie ?",
          text: 'Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d’un site.'
        },
        usage: {
          title: '2. Cookies utilisés par Ollync',
          intro: 'Ollync peut utiliser :',
          items: [
            'Cookies strictement nécessaires (fonctionnement, sécurité, sessions)',
            'Cookies de préférences (langue, affichage)',
            'Cookies de mesure d’audience (si activés)'
          ]
        },
        thirdParty: {
          title: '3. Cookies tiers',
          intro:
            'Certains cookies peuvent être déposés par des services tiers liés au fonctionnement de l’application (ex : hébergement, outils de performance). Ollync ne contrôle pas ces cookies tiers.'
        },
        consent: {
          title: '4. Consentement',
          text:
            'Lors de votre première visite, vous pouvez accepter ou refuser les cookies non essentiels. Vous pouvez modifier votre choix à tout moment.'
        },
        retention: {
          title: '5. Durée de conservation',
          intro: 'Les cookies peuvent être :',
          items: [
            { label: 'Cookies de session :', text: 'Supprimés à la fermeture du navigateur' },
            { label: 'Cookies persistants :', text: 'Conservés pour une durée limitée' }
          ]
        },
        management: {
          title: '6. Gestion des cookies',
          text: 'Vous pouvez gérer ou supprimer les cookies dans les paramètres de votre navigateur.'
        },
        personalData: {
          title: '7. Liens',
          textBefore:
            'Pour plus d’informations sur le traitement des données, consultez notre ',
          linkText: 'Politique de confidentialité',
          textAfter: '.'
        }
      }

  return (
    <div className="legal-detail-page">
      <div className="legal-detail-section">
        <div className="legal-detail-content">
          <div className="legal-detail-update">
            <strong>{content.updatedLabel}</strong> {new Date().toLocaleDateString(dateLocale)}
          </div>

          <h4>{content.what.title}</h4>
          <p>{content.what.text}</p>

          <h4>{content.usage.title}</h4>
          <p>{content.usage.intro}</p>
          <ul>
            {content.usage.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.thirdParty.title}</h4>
          <p>{content.thirdParty.intro}</p>

          <h4>{content.consent.title}</h4>
          <p>{content.consent.text}</p>

          <h4>{content.retention.title}</h4>
          <p>{content.retention.intro}</p>
          <ul>
            {content.retention.items.map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong> {item.text}
              </li>
            ))}
          </ul>

          <h4>{content.management.title}</h4>
          <p>{content.management.text}</p>

          <h4>{content.personalData.title}</h4>
          <p>
            {content.personalData.textBefore}
            <a href="/profile/legal/politique-confidentialite" style={{ color: 'var(--primary)' }}>
              {content.personalData.linkText}
            </a>
            {content.personalData.textAfter}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PolitiqueCookies
