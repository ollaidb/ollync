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
          text:
            'A cookie is a small text file stored on your device (computer, tablet, smartphone) when you visit a website. Cookies allow the site to recognize your device and remember certain information about your preferences or past actions.'
        },
        usage: {
          title: '2. How do we use cookies?',
          intro:
            'Ollync uses cookies to improve your browsing experience and provide personalized features. We use cookies to:',
          items: [
            'Ensure the proper functioning of the site',
            'Remember your preferences and settings',
            'Maintain your login session',
            'Analyze site usage to improve our services',
            'Personalize content and advertisements',
            'Ensure platform security'
          ]
        },
        types: {
          title: '3. Types of cookies used',
          items: [
            {
              title: 'Strictly necessary cookies',
              text:
                'These cookies are essential to the functioning of the site. They allow us to maintain your login session and secure your access. Without these cookies, some features may not work properly.'
            },
            {
              title: 'Performance and analytics cookies',
              text:
                'These cookies help us understand how visitors use our site by collecting anonymous information. They help us improve the site by identifying the most visited pages and user journeys.'
            },
            {
              title: 'Functionality cookies',
              text:
                'These cookies allow the site to remember your choices (language, region, display preferences) and provide enhanced, personalized features.'
            },
            {
              title: 'Targeting/advertising cookies',
              text:
                'These cookies may be used to show you personalized ads based on your interests. They can also limit the number of times an ad is shown and measure campaign effectiveness.'
            }
          ]
        },
        thirdParty: {
          title: '4. Third-party cookies',
          intro:
            'Some cookies are placed by third-party services on our site. These cookies may include:',
          items: [
            'Analytics cookies (Google Analytics, etc.)',
            'Social network cookies (if you interact with share buttons)',
            'Payment service cookies',
            'Mapping service cookies'
          ],
          note:
            'We do not control these third-party cookies. We recommend consulting their privacy policies for more information.'
        },
        retention: {
          title: '5. Retention period',
          intro: 'Cookies we use have different lifetimes:',
          items: [
            { label: 'Session cookies:', text: 'Deleted when you close your browser' },
            {
              label: 'Persistent cookies:',
              text:
                'Remain on your device for a set period (a few days to several months) or until you delete them'
            }
          ]
        },
        management: {
          title: '6. Managing cookies',
          intro: 'You can control and manage cookies in several ways:',
          browserTitle: 'Browser settings',
          browserText:
            'Most browsers allow you to refuse or accept cookies, or receive a notification before a cookie is stored. Here is how to manage cookies by browser:',
          browsers: [
            'Chrome: Settings > Privacy and security > Cookies',
            'Firefox: Options > Privacy & Security > Cookies',
            'Safari: Preferences > Privacy > Cookies',
            'Edge: Settings > Privacy > Cookies'
          ],
          consentTitle: 'Consent',
          consentText:
            'On your first visit, you can choose to accept or refuse non-essential cookies via our consent banner.'
        },
        refusal: {
          title: '7. Consequences of refusing cookies',
          intro:
            'If you choose to disable cookies, some features of the site may not function properly:',
          items: [
            'You will need to log in again on each visit',
            'Your preferences will not be saved',
            'Some personalized features will be unavailable'
          ]
        },
        personalData: {
          title: '8. Cookies and personal data',
          textBefore:
            'Some cookies may collect personal data. The processing of this data is governed by our ',
          linkText: 'Privacy policy',
          textAfter: '.'
        },
        changes: {
          title: '9. Changes',
          text:
            'We reserve the right to modify this cookie policy at any time. Any change will be published on this page with an updated “Last updated” date.'
        }
      }
    : {
        title: 'Politique cookies',
        updatedLabel: 'Dernière mise à jour :',
        what: {
          title: "1. Qu'est-ce qu'un cookie ?",
          text:
            "Un cookie est un petit fichier texte stocké sur votre appareil (ordinateur, tablette, smartphone) lorsque vous visitez un site web. Les cookies permettent au site de reconnaître votre appareil et de mémoriser certaines informations sur vos préférences ou actions passées."
        },
        usage: {
          title: '2. Comment utilisons-nous les cookies ?',
          intro:
            'Ollync utilise des cookies pour améliorer votre expérience de navigation et vous fournir des fonctionnalités personnalisées. Nous utilisons les cookies pour :',
          items: [
            'Assurer le bon fonctionnement du site',
            'Mémoriser vos préférences et paramètres',
            'Maintenir votre session de connexion',
            "Analyser l'utilisation du site pour améliorer nos services",
            'Personnaliser le contenu et les publicités',
            'Assurer la sécurité de la plateforme'
          ]
        },
        types: {
          title: '3. Types de cookies utilisés',
          items: [
            {
              title: 'Cookies strictement nécessaires',
              text:
                "Ces cookies sont indispensables au fonctionnement du site. Ils permettent notamment de maintenir votre session de connexion et de sécuriser votre accès. Sans ces cookies, certaines fonctionnalités ne peuvent pas fonctionner correctement."
            },
            {
              title: "Cookies de performance et d'analyse",
              text:
                'Ces cookies nous permettent de comprendre comment les visiteurs utilisent notre site en collectant des informations anonymes. Ils nous aident à améliorer le fonctionnement du site en identifiant les pages les plus visitées, les parcours utilisateurs, etc.'
            },
            {
              title: 'Cookies de fonctionnalité',
              text:
                "Ces cookies permettent au site de se souvenir de vos choix (langue, région, préférences d'affichage) et de vous offrir des fonctionnalités améliorées et personnalisées."
            },
            {
              title: 'Cookies de ciblage/publicitaires',
              text:
                'Ces cookies peuvent être utilisés pour vous proposer des publicités personnalisées basées sur vos intérêts. Ils peuvent également être utilisés pour limiter le nombre de fois qu\'une publicité vous est présentée et mesurer l\'efficacité des campagnes publicitaires.'
            }
          ]
        },
        thirdParty: {
          title: '4. Cookies tiers',
          intro:
            'Certains cookies sont placés par des services tiers présents sur notre site. Ces cookies peuvent inclure :',
          items: [
            "Cookies d'analyse (Google Analytics, etc.)",
            'Cookies de réseaux sociaux (si vous interagissez avec des boutons de partage)',
            'Cookies de services de paiement',
            'Cookies de services de cartographie'
          ],
          note:
            "Nous n'avons pas le contrôle sur ces cookies tiers. Nous vous recommandons de consulter les politiques de confidentialité de ces tiers pour plus d'informations."
        },
        retention: {
          title: '5. Durée de conservation',
          intro: 'Les cookies que nous utilisons ont différentes durées de vie :',
          items: [
            { label: 'Cookies de session :', text: 'Supprimés à la fermeture de votre navigateur' },
            {
              label: 'Cookies persistants :',
              text:
                "Restent sur votre appareil pendant une durée déterminée (quelques jours à plusieurs mois) ou jusqu'à ce que vous les supprimiez"
            }
          ]
        },
        management: {
          title: '6. Gestion des cookies',
          intro: 'Vous pouvez contrôler et gérer les cookies de plusieurs façons :',
          browserTitle: 'Paramètres du navigateur',
          browserText:
            'La plupart des navigateurs vous permettent de refuser ou d\'accepter les cookies, ou de recevoir une notification avant qu\'un cookie ne soit stocké. Voici comment gérer les cookies selon votre navigateur :',
          browsers: [
            'Chrome : Paramètres > Confidentialité et sécurité > Cookies',
            'Firefox : Options > Vie privée et sécurité > Cookies',
            'Safari : Préférences > Confidentialité > Cookies',
            'Edge : Paramètres > Confidentialité > Cookies'
          ],
          consentTitle: 'Consentement',
          consentText:
            'Lors de votre première visite, vous pouvez choisir d\'accepter ou de refuser les cookies non essentiels via notre bannière de consentement.'
        },
        refusal: {
          title: '7. Conséquences du refus des cookies',
          intro:
            'Si vous choisissez de désactiver les cookies, certaines fonctionnalités du site peuvent ne pas fonctionner correctement :',
          items: [
            'Vous devrez vous reconnecter à chaque visite',
            'Vos préférences ne seront pas sauvegardées',
            'Certaines fonctionnalités personnalisées seront indisponibles'
          ]
        },
        personalData: {
          title: '8. Cookies et données personnelles',
          textBefore:
            'Certains cookies peuvent collecter des données personnelles. Le traitement de ces données est régi par notre ',
          linkText: 'Politique de confidentialité',
          textAfter: '.'
        },
        changes: {
          title: '9. Modifications',
          text:
            'Nous nous réservons le droit de modifier cette politique cookies à tout moment. Toute modification sera publiée sur cette page avec une mise à jour de la date de "Dernière mise à jour".'
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

          <h4>{content.types.title}</h4>
          {content.types.items.map((typeItem) => (
            <div key={typeItem.title}>
              <h5>{typeItem.title}</h5>
              <p>{typeItem.text}</p>
            </div>
          ))}

          <h4>{content.thirdParty.title}</h4>
          <p>{content.thirdParty.intro}</p>
          <ul>
            {content.thirdParty.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{content.thirdParty.note}</p>

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
          <p>{content.management.intro}</p>
          <h5>{content.management.browserTitle}</h5>
          <p>{content.management.browserText}</p>
          <ul>
            {content.management.browsers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h5>{content.management.consentTitle}</h5>
          <p>{content.management.consentText}</p>

          <h4>{content.refusal.title}</h4>
          <p>{content.refusal.intro}</p>
          <ul>
            {content.refusal.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.personalData.title}</h4>
          <p>
            {content.personalData.textBefore}
            <a href="/profile/legal/politique-confidentialite" style={{ color: 'var(--primary)' }}>
              {content.personalData.linkText}
            </a>
            {content.personalData.textAfter}
          </p>

          <h4>{content.changes.title}</h4>
          <p>{content.changes.text}</p>
        </div>
      </div>
    </div>
  )
}

export default PolitiqueCookies

