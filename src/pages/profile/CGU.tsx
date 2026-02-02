import { useTranslation } from 'react-i18next'
import BackButton from '../../components/BackButton'
import './LegalPage.css'

const CGU = () => {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')
  const dateLocale = isEnglish ? 'en-US' : 'fr-FR'

  const content = isEnglish
    ? {
        title: 'Terms of Use',
        updatedLabel: 'Last updated:',
        acceptance: {
          title: '1. Acceptance of terms',
          paragraphs: [
            'By accessing and using Ollync, you agree to be bound by these Terms of Use. If you do not accept these terms, please do not use our service.',
            'We reserve the right to modify these terms at any time. It is your responsibility to review them regularly. Your continued use of the service after any changes constitutes your acceptance of the new terms.'
          ]
        },
        service: {
          title: '2. Description of the service',
          intro: 'Ollync is a matchmaking platform that allows users to:',
          items: [
            'Publish listings',
            'Search for opportunities and services',
            'Interact with other community members',
            'Exchange messages via an integrated chat',
            'Leave and view reviews'
          ]
        },
        account: {
          title: '3. Registration and user account',
          intro: 'To use our services, you must create an account. You agree to:',
          items: [
            'Provide accurate, complete, and up-to-date information',
            'Maintain the security of your account and password',
            'Be responsible for all activities that occur under your account',
            'Notify Ollync immediately of any unauthorized use of your account'
          ]
        },
        usage: {
          title: '4. Use of the service',
          intro:
            'You agree to use Ollync legally and in compliance with these terms. You agree not to:',
          items: [
            'Use the service for illegal or unauthorized purposes',
            'Violate the rights of others, including intellectual property rights',
            'Post defamatory, offensive, obscene, or illegal content',
            'Transmit viruses, malware, or any other harmful code',
            'Attempt unauthorized access to Ollync systems or networks',
            'Impersonate others or provide false information',
            'Collect personal data from other users without their consent'
          ]
        },
        userContent: {
          title: '5. User content',
          paragraphs: [
            'You retain ownership of any content you post on Ollync. By posting content, you grant Ollync a worldwide, non-exclusive, royalty-free, transferable license to use, reproduce, distribute, and display that content as part of operating the platform.',
            'You are solely responsible for the content you publish and warrant that you have all necessary rights to publish it.'
          ]
        },
        intellectual: {
          title: '6. Intellectual property',
          paragraph:
            'All content on Ollync, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software, is the property of Ollync or its licensors and is protected by French and international copyright laws.'
        },
        liability: {
          title: '7. Limitation of liability',
          intro: 'Ollync acts as a matchmaking platform. We are not responsible for:',
          items: [
            'The quality, safety, or legality of listings or services offered',
            'Users’ ability to complete transactions',
            'Direct or indirect damages resulting from use of or inability to use the service',
            'Disputes between users'
          ]
        },
        suspension: {
          title: '8. Suspension and termination',
          paragraph:
            'We reserve the right to suspend or terminate your account and access to the service at any time, without notice, in case of violation of these terms or for any other legitimate reason.'
        },
        personalData: {
          title: '9. Personal data',
          textBefore: 'The processing of your personal data is governed by our ',
          linkText: 'Privacy policy',
          textAfter: '.'
        },
        law: {
          title: '10. Applicable law and jurisdiction',
          paragraph:
            'These Terms of Use are governed by French law. Any dispute relating to their interpretation and/or execution shall fall under the jurisdiction of French courts.'
        }
      }
    : {
        title: "Conditions Générales d'Utilisation",
        updatedLabel: 'Dernière mise à jour :',
        acceptance: {
          title: '1. Acceptation des conditions',
          paragraphs: [
            "En accédant et en utilisant Ollync, vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.",
            "Nous nous réservons le droit de modifier ces CGU à tout moment. Il est de votre responsabilité de consulter régulièrement ces conditions. Votre utilisation continue du service après toute modification constitue votre acceptation des nouvelles conditions."
          ]
        },
        service: {
          title: '2. Description du service',
          intro: 'Ollync est une plateforme de mise en relation permettant aux utilisateurs de :',
          items: [
            'Publier des annonces',
            'Rechercher des opportunités et services',
            "Interagir avec d'autres membres de la communauté",
            'Échanger via une messagerie intégrée',
            'Laisser et consulter des avis'
          ]
        },
        account: {
          title: '3. Inscription et compte utilisateur',
          intro: 'Pour utiliser nos services, vous devez créer un compte. Vous vous engagez à :',
          items: [
            'Fournir des informations exactes, complètes et à jour',
            'Maintenir la sécurité de votre compte et de votre mot de passe',
            'Être responsable de toutes les activités qui se produisent sous votre compte',
            'Notifier immédiatement Ollync de tout usage non autorisé de votre compte'
          ]
        },
        usage: {
          title: '4. Utilisation du service',
          intro:
            'Vous vous engagez à utiliser Ollync de manière légale et conforme à ces conditions. Vous acceptez de ne pas :',
          items: [
            'Utiliser le service à des fins illégales ou non autorisées',
            "Violer les droits d'autrui, y compris les droits de propriété intellectuelle",
            'Publier du contenu diffamatoire, offensant, obscène ou illégal',
            'Transmettre des virus, logiciels malveillants ou tout autre code nuisible',
            "Tenter d'accéder non autorisé aux systèmes ou réseaux d'Ollync",
            "Usurper l'identité d'autrui ou fournir de fausses informations",
            "Collecter des données personnelles d'autres utilisateurs sans leur consentement"
          ]
        },
        userContent: {
          title: '5. Contenu utilisateur',
          paragraphs: [
            "Vous conservez la propriété de tout contenu que vous publiez sur Ollync. En publiant du contenu, vous accordez à Ollync une licence mondiale, non exclusive, gratuite et transférable pour utiliser, reproduire, distribuer et afficher ce contenu dans le cadre de l'exploitation de la plateforme.",
            'Vous êtes seul responsable du contenu que vous publiez et garantissez que vous disposez de tous les droits nécessaires pour le publier.'
          ]
        },
        intellectual: {
          title: '6. Propriété intellectuelle',
          paragraph:
            "Tous les contenus présents sur Ollync, y compris mais sans s'y limiter, les textes, graphiques, logos, icônes, images, clips audio, téléchargements numériques, compilations de données et logiciels, sont la propriété d'Ollync ou de ses concédants de licence et sont protégés par les lois françaises et internationales sur le droit d'auteur."
        },
        liability: {
          title: '7. Limitation de responsabilité',
          intro: 'Ollync agit en tant que plateforme de mise en relation. Nous ne sommes pas responsables :',
          items: [
            'De la qualité, sécurité ou légalité des annonces ou services proposés',
            'De la capacité des utilisateurs à effectuer des transactions',
            "Des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service",
            'Des litiges entre utilisateurs'
          ]
        },
        suspension: {
          title: '8. Suspension et résiliation',
          paragraph:
            "Nous nous réservons le droit de suspendre ou résilier votre compte et votre accès au service à tout moment, sans préavis, en cas de violation de ces CGU ou pour toute autre raison légitime."
        },
        personalData: {
          title: '9. Données personnelles',
          textBefore: 'Le traitement de vos données personnelles est régi par notre ',
          linkText: 'Politique de confidentialité',
          textAfter: '.'
        },
        law: {
          title: '10. Droit applicable et juridiction',
          paragraph:
            "Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation et/ou à leur exécution relève des tribunaux français."
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

          <h4>{content.acceptance.title}</h4>
          {content.acceptance.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.service.title}</h4>
          <p>{content.service.intro}</p>
          <ul>
            {content.service.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.account.title}</h4>
          <p>{content.account.intro}</p>
          <ul>
            {content.account.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.usage.title}</h4>
          <p>{content.usage.intro}</p>
          <ul>
            {content.usage.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.userContent.title}</h4>
          {content.userContent.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.intellectual.title}</h4>
          <p>{content.intellectual.paragraph}</p>

          <h4>{content.liability.title}</h4>
          <p>{content.liability.intro}</p>
          <ul>
            {content.liability.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.suspension.title}</h4>
          <p>{content.suspension.paragraph}</p>

          <h4>{content.personalData.title}</h4>
          <p>
            {content.personalData.textBefore}
            <a href="/profile/legal/politique-confidentialite" style={{ color: 'var(--primary)' }}>
              {content.personalData.linkText}
            </a>
            {content.personalData.textAfter}
          </p>

          <h4>{content.law.title}</h4>
          <p>{content.law.paragraph}</p>
        </div>
      </div>
    </div>
  )
}

export default CGU

