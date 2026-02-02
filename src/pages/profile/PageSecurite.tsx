import { useTranslation } from 'react-i18next'
import BackButton from '../../components/BackButton'
import './LegalPage.css'

const PageSecurite = () => {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')
  const dateLocale = isEnglish ? 'en-US' : 'fr-FR'

  const content = isEnglish
    ? {
        title: 'Security page',
        updatedLabel: 'Last updated:',
        commitment: {
          title: '1. Our security commitment',
          text:
            'The security of your personal data and your account is our top priority. Ollync implements high-level technical and organizational security measures to protect your information against unauthorized access, loss, alteration, or disclosure.'
        },
        technical: {
          title: '2. Technical security measures',
          encryptionTitle: 'Data encryption',
          encryptionText: 'All sensitive data is encrypted in transit and at rest:',
          encryptionItems: [
            'Secure connections via HTTPS/TLS for all communications',
            'Password hashing with secure algorithms',
            'Payment data encryption in accordance with PCI DSS standards',
            'Secure storage in encrypted databases'
          ],
          serversTitle: 'Server security',
          serversText: 'Our infrastructure is secured by:',
          serversItems: [
            '24/7 monitoring of our systems',
            'Regular security updates',
            'Protection against DDoS attacks',
            'Regular and secure backups',
            'Restricted server access with strong authentication'
          ],
          authTitle: 'Authentication',
          authText: 'We offer multiple security levels for your account:',
          authItems: [
            'Mandatory strong passwords',
            'Two-factor authentication (2FA) available',
            'Email verification for sensitive actions',
            'Detection of suspicious logins',
            'Login attempt rate limiting'
          ]
        },
        organizational: {
          title: '3. Organizational measures',
          text:
            'Beyond technical measures, we implement strict organizational procedures:',
          items: [
            'Access to personal data limited to authorized staff only',
            'Regular training on security and data protection',
            'Regular security audits',
            'Strict security incident management policy',
            'Compliance with GDPR and other applicable regulations'
          ]
        },
        account: {
          title: '4. Your account security',
          intro:
            'You also play an important role in your account security. Here are our recommendations:',
          passwordTitle: 'Strong password',
          passwordItems: [
            'Use a unique and complex password (at least 12 characters)',
            'Mix uppercase and lowercase letters, numbers, and symbols',
            'Do not reuse passwords across multiple sites',
            'Change your password regularly',
            'Use a password manager'
          ],
          twoFactorTitle: 'Two-factor authentication',
          twoFactorText:
            'Enable two-factor authentication (2FA) to add an extra layer of security. Even if someone gets your password, they cannot access your account without your authentication code.',
          vigilanceTitle: 'Vigilance',
          vigilanceItems: [
            'Never share your login credentials',
            'Beware of suspicious emails claiming to be from Ollync',
            'Regularly review your account activity',
            'Log out after using a shared device',
            'Report any suspicious activity immediately'
          ]
        },
        incidents: {
          title: '5. Reporting security incidents',
          intro:
            'If you discover a security vulnerability or suspect unauthorized access to your account, contact us immediately at: security@ollync.com',
          followUp: 'We take every report seriously and commit to:',
          items: [
            'Investigate the incident quickly',
            'Fix any identified vulnerability',
            'Inform you if your data has been compromised',
            'Take measures to prevent future incidents'
          ]
        },
        fraud: {
          title: '6. Fraud protection',
          intro:
            'We use advanced fraud detection systems to protect our users:',
          items: [
            'Detection of suspicious behavior',
            'Verification of suspicious transactions',
            'Protection against phishing and identity theft',
            'Proactive content moderation'
          ]
        },
        compliance: {
          title: '7. Compliance and certifications',
          intro: 'Ollync commits to complying with applicable standards and regulations:',
          items: [
            'GDPR (General Data Protection Regulation)',
            'PCI DSS standards for payment data',
            'ISO 27001 (certification in progress)'
          ]
        },
        transparency: {
          title: '8. Transparency',
          text:
            'We commit to informing you in case of a security incident affecting your personal data, in accordance with legal requirements.'
        },
        questions: {
          title: '9. Questions',
          text:
            'If you have any questions about the security of your data or our platform, contact us at: security@ollync.com'
        },
        safety: {
          title: '10. Meeting safety and emergencies',
          intro:
            'In case of a risky situation during a meeting, here are simple guidelines and useful numbers (France). Adapt them to your country if needed.',
          emergencyTitle: 'Immediate emergency',
          emergencyItems: [
            'European emergency number: 112',
            'Police: 17',
            'Fire brigade: 18',
            'Medical emergency (SAMU): 15',
            'SMS emergency for deaf/hard of hearing: 114'
          ],
          assaultTitle: 'Sexual assault or violence',
          assaultItems: [
            'Call emergency services immediately: 112 or 17',
            'Support and listening: 3919 (Violences Femmes Info)',
            'Specialized hotline: 0 800 05 95 95 (Viols-Femmes-Informations)',
            'Preserve evidence (messages, places, photos) and see a doctor if possible'
          ],
          theftTitle: 'Equipment theft or suspected scam',
          theftItems: [
            'Get to safety and contact authorities: 17 or 112',
            'File a complaint and keep all exchanges and proof',
            'Report the profile or conversation via the reporting option in the app'
          ]
        }
      }
    : {
        title: 'Page Sécurité',
        updatedLabel: 'Dernière mise à jour :',
        commitment: {
          title: '1. Notre engagement en matière de sécurité',
          text:
            "La sécurité de vos données personnelles et de votre compte est notre priorité absolue. Ollync met en œuvre des mesures de sécurité techniques et organisationnelles de haut niveau pour protéger vos informations contre tout accès non autorisé, perte, altération ou divulgation."
        },
        technical: {
          title: '2. Mesures techniques de sécurité',
          encryptionTitle: 'Chiffrement des données',
          encryptionText: 'Toutes les données sensibles sont chiffrées en transit et au repos :',
          encryptionItems: [
            'Connexions sécurisées via HTTPS/TLS pour toutes les communications',
            'Chiffrement des mots de passe avec des algorithmes de hachage sécurisés',
            'Chiffrement des données de paiement conformément aux standards PCI DSS',
            'Stockage sécurisé des données dans des bases de données chiffrées'
          ],
          serversTitle: 'Sécurité des serveurs',
          serversText: 'Notre infrastructure est sécurisée par :',
          serversItems: [
            'Surveillance 24/7 de nos systèmes',
            'Mises à jour régulières de sécurité',
            'Protection contre les attaques DDoS',
            'Sauvegardes régulières et sécurisées',
            'Accès restreint aux serveurs avec authentification forte'
          ],
          authTitle: 'Authentification',
          authText: 'Nous proposons plusieurs niveaux de sécurité pour votre compte :',
          authItems: [
            'Mots de passe forts obligatoires',
            'Authentification à deux facteurs (2FA) disponible',
            'Vérification par email pour les actions sensibles',
            'Détection des connexions suspectes',
            'Limitation des tentatives de connexion'
          ]
        },
        organizational: {
          title: '3. Mesures organisationnelles',
          text:
            'Au-delà des mesures techniques, nous mettons en place des procédures organisationnelles strictes :',
          items: [
            'Accès limité aux données personnelles uniquement aux personnes autorisées',
            'Formation régulière de notre équipe sur la sécurité et la protection des données',
            'Audits de sécurité réguliers',
            'Politique stricte de gestion des incidents de sécurité',
            'Conformité avec le RGPD et autres réglementations applicables'
          ]
        },
        account: {
          title: '4. Sécurité de votre compte',
          intro:
            'Vous aussi avez un rôle important à jouer dans la sécurité de votre compte. Voici nos recommandations :',
          passwordTitle: 'Mot de passe fort',
          passwordItems: [
            'Utilisez un mot de passe unique et complexe (au moins 12 caractères)',
            'Mélangez lettres majuscules, minuscules, chiffres et symboles',
            'Ne réutilisez pas vos mots de passe sur plusieurs sites',
            'Changez votre mot de passe régulièrement',
            'Utilisez un gestionnaire de mots de passe'
          ],
          twoFactorTitle: 'Authentification à deux facteurs',
          twoFactorText:
            "Activez l'authentification à deux facteurs (2FA) pour ajouter une couche supplémentaire de sécurité à votre compte. Même si quelqu'un obtient votre mot de passe, il ne pourra pas accéder à votre compte sans votre code d'authentification.",
          vigilanceTitle: 'Vigilance',
          vigilanceItems: [
            'Ne partagez jamais vos identifiants de connexion',
            "Méfiez-vous des emails suspects prétendant provenir d'Ollync",
            "Vérifiez régulièrement l'activité de votre compte",
            "Déconnectez-vous après utilisation sur un appareil partagé",
            'Signalez immédiatement toute activité suspecte'
          ]
        },
        incidents: {
          title: "5. Signalement d'incidents de sécurité",
          intro:
            "Si vous découvrez une faille de sécurité ou suspectez un accès non autorisé à votre compte, contactez-nous immédiatement à : security@ollync.com",
          followUp: 'Nous prenons très au sérieux tout signalement et nous nous engageons à :',
          items: [
            "Enquêter rapidement sur l'incident",
            'Corriger toute faille identifiée',
            'Vous informer si vos données ont été compromises',
            'Prendre les mesures nécessaires pour prévenir de futurs incidents'
          ]
        },
        fraud: {
          title: '6. Protection contre les fraudes',
          intro:
            'Nous utilisons des systèmes de détection de fraude avancés pour protéger nos utilisateurs :',
          items: [
            'Détection des comportements suspects',
            'Vérification des transactions suspectes',
            "Protection contre le phishing et l'usurpation d'identité",
            'Modération proactive du contenu'
          ]
        },
        compliance: {
          title: '7. Conformité et certifications',
          intro: "Ollync s'engage à respecter les normes et réglementations en vigueur :",
          items: [
            'RGPD (Règlement Général sur la Protection des Données)',
            'Standards PCI DSS pour les données de paiement',
            'ISO 27001 (en cours de certification)'
          ]
        },
        transparency: {
          title: '8. Transparence',
          text:
            "Nous nous engageons à vous informer en cas d'incident de sécurité affectant vos données personnelles, conformément aux exigences légales."
        },
        questions: {
          title: '9. Questions',
          text:
            "Si vous avez des questions concernant la sécurité de vos données ou de notre plateforme, n'hésitez pas à nous contacter à : security@ollync.com"
        },
        safety: {
          title: '10. Sécurité des rencontres et urgences',
          intro:
            "En cas de situation à risque pendant une rencontre, voici des repères simples et des numéros utiles (France). Adaptez selon votre pays si besoin.",
          emergencyTitle: 'Urgence immédiate',
          emergencyItems: [
            'Urgences européennes : 112',
            'Police / Gendarmerie : 17',
            'Pompiers : 18',
            'SAMU : 15',
            'Urgence SMS (personnes sourdes/malentendantes) : 114'
          ],
          assaultTitle: 'Agression sexuelle ou violence',
          assaultItems: [
            'Appelez immédiatement les secours : 112 ou 17',
            'Soutien et écoute : 3919 (Violences Femmes Info)',
            'Écoute spécialisée : 0 800 05 95 95 (Viols-Femmes-Informations)',
            'Conservez les preuves (messages, lieux, photos) et consultez un médecin si possible'
          ],
          theftTitle: "Vol de matériel ou suspicion d'arnaque",
          theftItems: [
            'Mettez-vous en sécurité et contactez les autorités : 17 ou 112',
            'Déposez plainte et conservez tous les échanges et justificatifs',
            "Signalez le profil ou la conversation via l'option de signalement dans l'app"
          ]
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

          <h4>{content.commitment.title}</h4>
          <p>{content.commitment.text}</p>

          <h4>{content.technical.title}</h4>
          <h5>{content.technical.encryptionTitle}</h5>
          <p>{content.technical.encryptionText}</p>
          <ul>
            {content.technical.encryptionItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h5>{content.technical.serversTitle}</h5>
          <p>{content.technical.serversText}</p>
          <ul>
            {content.technical.serversItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h5>{content.technical.authTitle}</h5>
          <p>{content.technical.authText}</p>
          <ul>
            {content.technical.authItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.organizational.title}</h4>
          <p>{content.organizational.text}</p>
          <ul>
            {content.organizational.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.account.title}</h4>
          <p>{content.account.intro}</p>

          <h5>{content.account.passwordTitle}</h5>
          <ul>
            {content.account.passwordItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h5>{content.account.twoFactorTitle}</h5>
          <p>{content.account.twoFactorText}</p>

          <h5>{content.account.vigilanceTitle}</h5>
          <ul>
            {content.account.vigilanceItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.incidents.title}</h4>
          <p>{content.incidents.intro}</p>
          <p>{content.incidents.followUp}</p>
          <ul>
            {content.incidents.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.fraud.title}</h4>
          <p>{content.fraud.intro}</p>
          <ul>
            {content.fraud.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.compliance.title}</h4>
          <p>{content.compliance.intro}</p>
          <ul>
            {content.compliance.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.transparency.title}</h4>
          <p>{content.transparency.text}</p>

          <h4>{content.questions.title}</h4>
          <p>{content.questions.text}</p>

          <h4>{content.safety.title}</h4>
          <p>{content.safety.intro}</p>

          <h5>{content.safety.emergencyTitle}</h5>
          <ul>
            {content.safety.emergencyItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h5>{content.safety.assaultTitle}</h5>
          <ul>
            {content.safety.assaultItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h5>{content.safety.theftTitle}</h5>
          <ul>
            {content.safety.theftItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default PageSecurite

