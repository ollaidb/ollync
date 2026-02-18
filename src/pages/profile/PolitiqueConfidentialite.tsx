import { useTranslation } from 'react-i18next'
import './LegalPage.css'

const PolitiqueConfidentialite = () => {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')
  const dateLocale = isEnglish ? 'en-US' : 'fr-FR'

  const content = isEnglish
    ? {
        title: 'Privacy policy',
        updatedLabel: 'Last updated:',
        intro:
          'This privacy policy explains how Ollync collects, uses, and protects your personal information when you use our platform.',
        collection: {
          title: '1. Data collection',
          intro: 'We collect the following data:',
          items: [
            'Identity data (name, surname)',
            'Contact details (email address, phone number)',
            'Location (if enabled)',
            'Messages exchanged via the messaging feature',
            'Published content (listings, photos, videos, descriptions)',
            'Connection and usage data (for example, login date/time, actions performed in the app)'
          ],
          note:
            'You provide some data directly, and other data is generated when you use the app.'
        },
        usage: {
          title: '2. Data use',
          intro: 'We use your personal data to:',
          items: [
            'Create and manage your user account',
            'Allow you to publish and manage listings',
            'Enable messaging between users',
            'Improve the experience and security of the app',
            'Comply with legal obligations'
          ]
        },
        sharing: {
          title: '3. Data sharing',
          intro:
            'We do not sell your personal data to third parties. We may share your information only in the following cases:',
          items: [
            'With your explicit consent',
            'With service providers needed to operate the app (hosting, storage, email delivery)',
            'To comply with a legal obligation or respond to a request from a competent authority'
          ]
        },
        legalBasis: {
          title: '4. Legal basis',
          intro: 'The processing is based on:',
          items: [
            'The execution of the service (account creation, listings, messaging)',
            'Your consent (for example, location, media)',
            'Our legitimate interest (security, fraud prevention)'
          ]
        },
        rights: {
          title: '5. Your rights',
          intro:
            'In accordance with the GDPR, you have the following rights regarding your personal data:',
          items: [
            { label: 'Right of access:', text: 'You can request a copy of your personal data' },
            { label: 'Right to rectification:', text: 'You can correct inaccurate or incomplete data' },
            { label: 'Right to erasure:', text: 'You can request the deletion of your data' },
            { label: 'Right to object:', text: 'You can object to the processing of your data' },
            { label: 'Right to portability:', text: 'You can retrieve your data in a structured format' },
            { label: 'Right to restriction:', text: 'You can request a limitation of processing' }
          ],
          contact: 'To exercise these rights, contact us at: collabbinta@gmail.com'
        },
        security: {
          title: '6. Security',
          intro:
            'We implement appropriate technical and organizational security measures to protect your personal data from unauthorized access, alteration, disclosure, or destruction. These measures include:',
          items: [
            'Encryption of sensitive data',
            'Secure access to servers',
            'Strong authentication for administrator access',
            'Regular monitoring of our systems'
          ]
        },
        retention: {
          title: '7. Data retention',
          text:
            'We keep your personal data for 2 years after your last account activity, unless a longer retention period is required by law.'
        },
        cookies: {
          title: '8. Cookies',
          textBefore: 'Our site uses cookies to improve your experience. For more information, see our ',
          linkText: 'Cookie policy',
          textAfter: '.'
        },
        changes: {
          title: '9. Changes',
          text:
            'We reserve the right to modify this privacy policy at any time. Any change will be published on this page with an updated “Last updated” date.'
        },
        complaint: {
          title: '10. Complaint',
          text: 'You can lodge a complaint with your data protection authority (CNIL in France).'
        }
      }
    : {
        title: 'Politique de confidentialité',
        updatedLabel: 'Dernière mise à jour :',
        intro:
          'La présente politique de confidentialité décrit la façon dont Ollync collecte, utilise et protège vos informations personnelles lorsque vous utilisez notre plateforme.',
        collection: {
          title: '1. Collecte des données',
          intro: 'Nous collectons les données suivantes :',
          items: [
            'Identité (nom, prénom)',
            'Coordonnées (adresse email, numéro de téléphone)',
            'Localisation (si activée)',
            'Messages échangés via la messagerie',
            'Contenus publiés (annonces, photos, vidéos, descriptions)',
            "Données de connexion et d'usage (ex : date/heure de connexion, actions réalisées dans l’application)"
          ],
          note:
            'Certaines données sont fournies par vous, d’autres sont générées lors de l’utilisation de l’application.'
        },
        usage: {
          title: '2. Utilisation des données',
          intro: 'Nous utilisons vos données personnelles pour :',
          items: [
            'Créer et gérer votre compte utilisateur',
            'Permettre la publication et la gestion des annonces',
            'Assurer la messagerie entre utilisateurs',
            'Améliorer l’expérience et la sécurité de l’application',
            'Respecter les obligations légales'
          ]
        },
        sharing: {
          title: '3. Partage des données',
          intro:
            "Nous ne vendons pas vos données personnelles à des tiers. Nous pouvons partager vos informations uniquement dans les cas suivants :",
          items: [
            'Avec votre consentement explicite',
            "Avec des prestataires nécessaires au fonctionnement de l’application (hébergement, stockage, envoi d’emails)",
            "Pour se conformer à une obligation légale ou répondre à une demande d'autorité compétente"
          ]
        },
        legalBasis: {
          title: '4. Base légale',
          intro: 'Les traitements sont fondés sur :',
          items: [
            'L’exécution du service (création de compte, annonces, messagerie)',
            'Votre consentement (ex : localisation, médias)',
            'L’intérêt légitime (sécurité, prévention des fraudes)'
          ]
        },
        rights: {
          title: '5. Vos droits',
          intro:
            'Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :',
          items: [
            { label: "Droit d'accès :", text: 'Vous pouvez demander une copie de vos données personnelles' },
            { label: 'Droit de rectification :', text: 'Vous pouvez corriger vos données inexactes ou incomplètes' },
            { label: "Droit à l'effacement :", text: 'Vous pouvez demander la suppression de vos données' },
            { label: "Droit d'opposition :", text: 'Vous pouvez vous opposer au traitement de vos données' },
            { label: 'Droit à la portabilité :', text: 'Vous pouvez récupérer vos données dans un format structuré' },
            { label: 'Droit à la limitation :', text: 'Vous pouvez demander la limitation du traitement' }
          ],
          contact: 'Pour exercer ces droits, contactez-nous à : collabbinta@gmail.com'
        },
        security: {
          title: '6. Sécurité',
          intro:
            'Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, altération, divulgation ou destruction. Ces mesures incluent notamment :',
          items: [
            'Chiffrement des données sensibles',
            'Accès sécurisé aux serveurs',
            'Authentification forte pour les accès administrateurs',
            'Surveillance régulière de nos systèmes'
          ]
        },
        retention: {
          title: '7. Conservation des données',
          text:
            'Nous conservons vos données personnelles pendant 2 ans à compter de la dernière activité du compte, sauf obligation légale de conservation plus longue.'
        },
        cookies: {
          title: '8. Cookies',
          textBefore:
            'Notre site utilise des cookies pour améliorer votre expérience. Pour plus d\'informations, consultez notre ',
          linkText: 'Politique cookies',
          textAfter: '.'
        },
        changes: {
          title: '9. Modifications',
          text:
            'Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification sera publiée sur cette page avec une mise à jour de la date de "Dernière mise à jour".'
        },
        complaint: {
          title: '10. Réclamation',
          text: 'Vous pouvez déposer une réclamation auprès de la CNIL.'
        }
      }

  return (
    <div className="legal-detail-page">
      <div className="legal-detail-section">
        <div className="legal-detail-content">
          <div className="legal-detail-update">
            <strong>{content.updatedLabel}</strong> {new Date().toLocaleDateString(dateLocale)}
          </div>

          <p>{content.intro}</p>

          <h4>{content.collection.title}</h4>
          <p>{content.collection.intro}</p>
          <ul>
            {content.collection.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{content.collection.note}</p>

          <h4>{content.usage.title}</h4>
          <p>{content.usage.intro}</p>
          <ul>
            {content.usage.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.sharing.title}</h4>
          <p>{content.sharing.intro}</p>
          <ul>
            {content.sharing.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.legalBasis.title}</h4>
          <p>{content.legalBasis.intro}</p>
          <ul>
            {content.legalBasis.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.rights.title}</h4>
          <p>{content.rights.intro}</p>
          <ul>
            {content.rights.items.map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong> {item.text}
              </li>
            ))}
          </ul>
          <p>{content.rights.contact}</p>

          <h4>{content.security.title}</h4>
          <p>{content.security.intro}</p>
          <ul>
            {content.security.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.retention.title}</h4>
          <p>{content.retention.text}</p>

          <h4>{content.cookies.title}</h4>
          <p>
            {content.cookies.textBefore}
            <a href="/profile/legal/politique-cookies" style={{ color: 'var(--primary)' }}>
              {content.cookies.linkText}
            </a>
            {content.cookies.textAfter}
          </p>

          <h4>{content.changes.title}</h4>
          <p>{content.changes.text}</p>

          <h4>{content.complaint.title}</h4>
          <p>{content.complaint.text}</p>
        </div>
      </div>
    </div>
  )
}

export default PolitiqueConfidentialite
