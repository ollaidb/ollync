import { useTranslation } from 'react-i18next'
import BackButton from '../../components/BackButton'
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
          intro: 'We collect information you provide directly, including when you:',
          items: [
            'Create your user account',
            'Publish listings',
            'Use our messaging services',
            'Contact our support team',
            'Subscribe to our newsletters'
          ],
          note:
            'Collected data may include: first and last name, email address, phone number, postal address, payment information, photos, and any other information you choose to share.'
        },
        usage: {
          title: '2. Data use',
          intro: 'We use your personal data to:',
          items: [
            'Provide, maintain, and improve our services',
            'Process your transactions and manage your account',
            'Send important information about your account or our services',
            'Personalize your experience on the platform',
            'Ensure platform security and prevent fraud',
            'Comply with legal and regulatory obligations'
          ]
        },
        sharing: {
          title: '3. Data sharing',
          intro:
            'We do not sell your personal data to third parties. We may share your information only in the following cases:',
          items: [
            'With your explicit consent',
            'With service providers that help us operate the platform (hosting, payment processing, etc.) with appropriate safeguards',
            'To comply with a legal obligation or respond to a request from a competent authority',
            'In the event of a merger, acquisition, or sale of assets, subject to prior notification'
          ]
        },
        rights: {
          title: '4. Your rights',
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
          contact: 'To exercise these rights, contact us at: contact@ollync.com'
        },
        security: {
          title: '5. Security',
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
          title: '6. Data retention',
          text:
            'We keep your personal data for as long as necessary for the purposes described in this policy, unless a longer retention period is required or permitted by law.'
        },
        cookies: {
          title: '7. Cookies',
          textBefore: 'Our site uses cookies to improve your experience. For more information, see our ',
          linkText: 'Cookie policy',
          textAfter: '.'
        },
        changes: {
          title: '8. Changes',
          text:
            'We reserve the right to modify this privacy policy at any time. Any change will be published on this page with an updated “Last updated” date.'
        }
      }
    : {
        title: 'Politique de confidentialité',
        updatedLabel: 'Dernière mise à jour :',
        intro:
          'La présente politique de confidentialité décrit la façon dont Ollync collecte, utilise et protège vos informations personnelles lorsque vous utilisez notre plateforme.',
        collection: {
          title: '1. Collecte des données',
          intro: 'Nous collectons les informations que vous nous fournissez directement, notamment lors de :',
          items: [
            'La création de votre compte utilisateur',
            "La publication d'annonces",
            "L'utilisation de nos services de messagerie",
            'La communication avec notre service client',
            "L'inscription à nos newsletters"
          ],
          note:
            'Les données collectées peuvent inclure : nom, prénom, adresse email, numéro de téléphone, adresse postale, informations de paiement, photos, et autres informations que vous choisissez de partager.'
        },
        usage: {
          title: '2. Utilisation des données',
          intro: 'Nous utilisons vos données personnelles pour :',
          items: [
            'Fournir, maintenir et améliorer nos services',
            'Traiter vos transactions et gérer votre compte',
            'Vous communiquer des informations importantes concernant votre compte ou nos services',
            "Personnaliser votre expérience sur la plateforme",
            'Assurer la sécurité de la plateforme et prévenir la fraude',
            'Respecter nos obligations légales et réglementaires'
          ]
        },
        sharing: {
          title: '3. Partage des données',
          intro:
            "Nous ne vendons pas vos données personnelles à des tiers. Nous pouvons partager vos informations uniquement dans les cas suivants :",
          items: [
            'Avec votre consentement explicite',
            "Avec des prestataires de services qui nous aident à exploiter notre plateforme (hébergement, traitement des paiements, etc.) sous réserve de garanties appropriées",
            "Pour se conformer à une obligation légale ou répondre à une demande d'autorité compétente",
            "En cas de fusion, acquisition ou vente d'actifs, sous réserve de notification préalable"
          ]
        },
        rights: {
          title: '4. Vos droits',
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
          contact: 'Pour exercer ces droits, contactez-nous à : contact@ollync.com'
        },
        security: {
          title: '5. Sécurité',
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
          title: '6. Conservation des données',
          text:
            'Nous conservons vos données personnelles aussi longtemps que nécessaire pour les finalités décrites dans cette politique, sauf si une période de conservation plus longue est requise ou permise par la loi.'
        },
        cookies: {
          title: '7. Cookies',
          textBefore:
            'Notre site utilise des cookies pour améliorer votre expérience. Pour plus d\'informations, consultez notre ',
          linkText: 'Politique cookies',
          textAfter: '.'
        },
        changes: {
          title: '8. Modifications',
          text:
            'Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification sera publiée sur cette page avec une mise à jour de la date de "Dernière mise à jour".'
        }
      }

  return (
    <div className="legal-detail-page">
      <div className="legal-detail-header">
        <BackButton />
        <h2 className="legal-detail-title">{content.title}</h2>
        <div className="legal-detail-header-spacer"></div>
      </div>

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
        </div>
      </div>
    </div>
  )
}

export default PolitiqueConfidentialite

