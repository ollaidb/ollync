import { useTranslation } from 'react-i18next'
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
          title: '2. Purpose of the service',
          intro: 'Ollync is an application that allows users to:',
          items: [
            'Publish listings',
            'Browse content and profiles',
            'Use the internal messaging feature',
            'Respond to listings and interact with other users',
            'Connect around services, projects, jobs, or collaborations'
          ]
        },
        account: {
          title: '3. Access and account',
          intro:
            'The application is accessible free of charge. Some services may be offered for a fee, which will be specified at the time of purchase (see Terms of Sale). Access is reserved for users with an account. By creating an account, you agree to:',
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
            'You agree to use Ollync legally and in compliance with these terms. It is prohibited to:',
          items: [
            'Use the service for illegal or unauthorized purposes',
            'Impersonate others or provide false information',
            'Collect personal data from other users without their consent',
            'Post illegal, defamatory, hateful, violent, discriminatory, or inappropriate content',
            'Send spam or unwanted solicitations',
            'Attempt to access data or systems without authorization',
            'Use the application for fraudulent or unlawful purposes'
          ]
        },
        userContent: {
          title: '5. User responsibility',
          paragraphs: [
            'You are solely responsible for the content you publish, the exchanges you initiate, and the commitments you make through the application.',
            'You guarantee that the information and content you share are accurate and that you have the rights to publish them.'
          ]
        },
        contracts: {
          title: '6. Contracts between users',
          paragraphs: [
            'When users create a contract through Ollync, it is a direct agreement between those users only.',
            'Ollync is not a party to the contract and does not provide legal advice.',
            'Contract terms, execution, and legal compliance remain under the full responsibility of the users.'
          ]
        },
        intellectual: {
          title: '7. Intellectual property',
          paragraph:
            'All elements of the application (texts, logo, design, interface) are protected. Any unauthorized reproduction is prohibited.'
        },
        liability: {
          title: '8. Publisher responsibility',
          intro:
            'Ollync implements reasonable means to ensure the proper functioning of the application but does not guarantee the absence of interruptions or errors. Ollync cannot be held liable for:',
          items: [
            'Exchanges, content, or commitments between users',
            'Direct or indirect damages resulting from use of or inability to use the service',
            'Disputes between users'
          ]
        },
        suspension: {
          title: '9. Moderation and suspension',
          paragraph:
            'Ollync reserves the right to remove or suspend any content or account in case of non-compliance with these Terms of Use, without prior notice.'
        },
        personalData: {
          title: '10. Personal data',
          textBefore: 'The processing of your personal data is governed by our ',
          linkText: 'Privacy policy',
          textAfter: '.'
        },
        law: {
          title: '11. Governing law',
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
          title: '2. Objet du service',
          intro: 'Ollync est une application permettant aux utilisateurs de :',
          items: [
            'Publier des annonces',
            'Consulter des contenus et des profils',
            'Utiliser la messagerie interne',
            'Répondre à des annonces et interagir avec d’autres utilisateurs',
            'Entrer en relation autour de services, projets, emplois ou collaborations'
          ]
        },
        account: {
          title: '3. Accès et compte',
          intro:
            'L’application est accessible gratuitement. Certains services peuvent être proposés de façon payante, ce qui sera précisé au moment de l’achat (voir CGV). L’accès est réservé aux utilisateurs disposant d’un compte. En créant un compte, vous vous engagez à :',
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
            'Vous vous engagez à utiliser Ollync de manière légale et conforme à ces conditions. Il est interdit de :',
          items: [
            'Utiliser le service à des fins illégales ou non autorisées',
            "Usurper l'identité d'autrui ou fournir de fausses informations",
            "Collecter des données personnelles d'autres utilisateurs sans leur consentement",
            'Publier des contenus illégaux, diffamatoires, haineux, violents, discriminatoires ou inappropriés',
            'Envoyer du spam ou des sollicitations non désirées',
            "Tenter d'accéder aux données ou systèmes sans autorisation",
            "Utiliser l’application à des fins frauduleuses ou contraires à la loi"
          ]
        },
        userContent: {
          title: '5. Responsabilité de l’utilisateur',
          paragraphs: [
            'L’utilisateur reste seul responsable des contenus qu’il publie, des échanges qu’il initie, et des engagements qu’il prend via l’application.',
            'Il garantit que les informations et contenus partagés sont exacts et qu’il dispose des droits nécessaires pour les publier.'
          ]
        },
        contracts: {
          title: '6. Contrats entre utilisateurs',
          paragraphs: [
            'Lorsqu’un contrat est créé via Ollync, il s’agit d’un accord direct entre les utilisateurs concernés.',
            'Ollync n’est pas partie au contrat et ne fournit pas de conseil juridique.',
            'Le contenu du contrat, son exécution et sa conformité légale relèvent de la responsabilité des utilisateurs.'
          ]
        },
        intellectual: {
          title: '7. Propriété intellectuelle',
          paragraph:
            'Tous les éléments de l’application (textes, logo, design, interface) sont protégés. Toute reproduction non autorisée est interdite.'
        },
        liability: {
          title: '8. Responsabilité de l’éditeur',
          intro:
            'Ollync met en œuvre des moyens raisonnables pour assurer le fonctionnement de l’application, mais ne garantit pas l’absence d’interruptions ou d’erreurs. Ollync ne saurait être tenue responsable :',
          items: [
            'Des échanges, contenus ou engagements entre utilisateurs',
            "Des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service",
            'Des litiges entre utilisateurs'
          ]
        },
        suspension: {
          title: '9. Modération et suspension',
          paragraph:
            'Ollync se réserve le droit de supprimer ou suspendre tout contenu ou compte en cas de non-respect des CGU, sans préavis.'
        },
        personalData: {
          title: '10. Données personnelles',
          textBefore: 'Le traitement de vos données personnelles est régi par notre ',
          linkText: 'Politique de confidentialité',
          textAfter: '.'
        },
        law: {
          title: '11. Loi applicable',
          paragraph:
            "Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation et/ou à leur exécution relève des tribunaux français."
        }
      }

  return (
    <div className="legal-detail-page">
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

          <h4>{content.contracts.title}</h4>
          {content.contracts.paragraphs.map((paragraph) => (
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
