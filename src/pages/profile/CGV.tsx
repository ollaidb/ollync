import { useTranslation } from 'react-i18next'
import BackButton from '../../components/BackButton'
import './LegalPage.css'

const CGV = () => {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')
  const dateLocale = isEnglish ? 'en-US' : 'fr-FR'

  const content = isEnglish
    ? {
        title: 'Terms of Sale',
        updatedLabel: 'Last updated:',
        purpose: {
          title: '1. Purpose',
          paragraphs: [
            'These Terms of Sale govern the relationship between Ollync and its users regarding paid services offered on the platform.',
            'Any order for a service implies the user’s unconditional acceptance of these terms.'
          ]
        },
        services: {
          title: '2. Services offered',
          intro: 'Ollync offers various paid services, including:',
          items: [
            'Premium subscription services',
            'Featured listings',
            'Additional promotional services',
            'Other paid services specified on the platform'
          ]
        },
        pricing: {
          title: '3. Pricing',
          paragraphs: [
            'Service prices are indicated in euros, all taxes included, unless otherwise stated. Prices may be changed at any time, but current orders will be honored at the price agreed at the time of purchase.',
            'Ollync reserves the right to offer promotions, discounts, or rebates at any time.'
          ]
        },
        order: {
          title: '4. Order and payment',
          intro: 'To order a paid service, the user must:',
          items: [
            'Have a valid user account',
            'Select the desired service',
            'Validate the order and proceed with payment'
          ],
          paragraphs: [
            'Payment is made online by bank card or any other payment method accepted on the platform. Payments are secured by our payment service providers.',
            'The order is considered confirmed once payment confirmation is received.'
          ]
        },
        delivery: {
          title: '5. Service delivery',
          paragraphs: [
            'Paid services are activated as soon as possible after payment confirmation. Subscription services take effect immediately upon activation.',
            'Ollync strives to provide the ordered services continuously and reliably but cannot guarantee absolute availability.'
          ]
        },
        withdrawal: {
          title: '6. Right of withdrawal',
          intro:
            'In accordance with applicable law, you have a 14-day right of withdrawal from the subscription date, except for:',
          items: [
            'Services fully performed before the end of the withdrawal period with your explicit consent',
            'Subscription services whose period has already elapsed'
          ],
          paragraph: 'To exercise your right of withdrawal, contact us at: contact@ollync.com'
        },
        refund: {
          title: '7. Refunds',
          paragraphs: [
            'When the right of withdrawal is exercised within the legal time limits, the refund will be issued within 14 days of receiving your request, using the same payment method as the initial payment.',
            'No refund will be granted for services already used or whose period has elapsed.'
          ]
        },
        termination: {
          title: '8. Termination',
          paragraphs: [
            'You may cancel your subscription at any time from your user account. Cancellation will take effect at the end of the current subscription period.',
            'Ollync reserves the right to terminate or suspend your access to paid services in case of violation of the Terms of Use or these Terms of Sale, without refund.'
          ]
        },
        claims: {
          title: '9. Claims',
          paragraphs: [
            'Any claim regarding a paid service must be sent to: contact@ollync.com',
            'We commit to responding to any claim within a maximum of 30 days.'
          ]
        },
        intellectual: {
          title: '10. Intellectual property',
          paragraph:
            'Access to paid services does not confer any ownership rights over the content, features, or elements of the platform, which remain the exclusive property of Ollync.'
        },
        law: {
          title: '11. Applicable law and jurisdiction',
          paragraph:
            'These Terms of Sale are governed by French law. Any dispute relating to their interpretation and/or execution falls under the jurisdiction of French courts.'
        }
      }
    : {
        title: 'Conditions Générales de Vente',
        updatedLabel: 'Dernière mise à jour :',
        purpose: {
          title: '1. Objet',
          paragraphs: [
            "Les présentes Conditions Générales de Vente (CGV) régissent les relations entre Ollync et ses utilisateurs concernant les services payants proposés sur la plateforme.",
            "Toute commande de service implique l'acceptation sans réserve des présentes CGV par l'utilisateur."
          ]
        },
        services: {
          title: '2. Services proposés',
          intro: 'Ollync propose divers services payants, notamment :',
          items: [
            "Services d'abonnement premium",
            "Mise en avant d'annonces",
            'Services additionnels de promotion',
            'Autres services payants spécifiés sur la plateforme'
          ]
        },
        pricing: {
          title: '3. Prix',
          paragraphs: [
            'Les prix des services sont indiqués en euros, toutes taxes comprises (TTC), sauf indication contraire. Les prix peuvent être modifiés à tout moment, mais les commandes en cours seront honorées au prix convenu au moment de la commande.',
            "Ollync se réserve le droit de proposer des offres promotionnelles, des réductions ou des remises à tout moment."
          ]
        },
        order: {
          title: '4. Commande et paiement',
          intro: "Pour commander un service payant, l'utilisateur doit :",
          items: [
            'Avoir un compte utilisateur valide',
            'Sélectionner le service souhaité',
            'Valider sa commande et procéder au paiement'
          ],
          paragraphs: [
            "Le paiement s'effectue en ligne par carte bancaire ou via tout autre moyen de paiement accepté sur la plateforme. Le paiement est sécurisé par nos prestataires de services de paiement.",
            'La commande est considérée comme validée dès réception de la confirmation de paiement.'
          ]
        },
        delivery: {
          title: '5. Exécution des services',
          paragraphs: [
            "Les services payants sont activés dans les meilleurs délais après confirmation du paiement. Les services d'abonnement prennent effet immédiatement après activation.",
            "Ollync s'efforce de fournir les services commandés de manière continue et fiable, mais ne peut garantir une disponibilité absolue du service."
          ]
        },
        withdrawal: {
          title: '6. Droit de rétractation',
          intro:
            "Conformément à la législation en vigueur, vous disposez d'un droit de rétractation de 14 jours à compter de la date de souscription, sauf pour :",
          items: [
            "Les services entièrement exécutés avant la fin du délai de rétractation avec votre accord explicite",
            "Les services d'abonnement dont la période est déjà écoulée"
          ],
          paragraph: "Pour exercer votre droit de rétractation, contactez-nous à : contact@ollync.com"
        },
        refund: {
          title: '7. Remboursement',
          paragraphs: [
            "En cas d'exercice du droit de rétractation dans les délais légaux, le remboursement sera effectué dans un délai de 14 jours suivant la réception de votre demande, selon les mêmes modalités que celles utilisées pour le paiement initial.",
            "Aucun remboursement ne sera accordé pour les services déjà utilisés ou dont la période est écoulée."
          ]
        },
        termination: {
          title: '8. Résiliation',
          paragraphs: [
            "Vous pouvez résilier votre abonnement à tout moment depuis votre compte utilisateur. La résiliation prendra effet à la fin de la période d'abonnement en cours.",
            "Ollync se réserve le droit de résilier ou suspendre votre accès aux services payants en cas de violation des Conditions Générales d'Utilisation ou de ces CGV, sans remboursement."
          ]
        },
        claims: {
          title: '9. Réclamations',
          paragraphs: [
            'Toute réclamation concernant un service payant doit être adressée à : contact@ollync.com',
            'Nous nous engageons à répondre à toute réclamation dans un délai de 30 jours maximum.'
          ]
        },
        intellectual: {
          title: '10. Propriété intellectuelle',
          paragraph:
            "L'accès aux services payants ne confère aucun droit de propriété sur les contenus, fonctionnalités ou éléments de la plateforme, qui demeurent la propriété exclusive d'Ollync."
        },
        law: {
          title: '11. Droit applicable et juridiction',
          paragraph:
            "Les présentes CGV sont régies par le droit français. Tout litige relatif à leur interprétation et/ou à leur exécution relève des tribunaux français."
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

          <h4>{content.purpose.title}</h4>
          {content.purpose.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.services.title}</h4>
          <p>{content.services.intro}</p>
          <ul>
            {content.services.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h4>{content.pricing.title}</h4>
          {content.pricing.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.order.title}</h4>
          <p>{content.order.intro}</p>
          <ul>
            {content.order.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {content.order.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.delivery.title}</h4>
          {content.delivery.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.withdrawal.title}</h4>
          <p>{content.withdrawal.intro}</p>
          <ul>
            {content.withdrawal.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{content.withdrawal.paragraph}</p>

          <h4>{content.refund.title}</h4>
          {content.refund.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.termination.title}</h4>
          {content.termination.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.claims.title}</h4>
          {content.claims.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.intellectual.title}</h4>
          <p>{content.intellectual.paragraph}</p>

          <h4>{content.law.title}</h4>
          <p>{content.law.paragraph}</p>
        </div>
      </div>
    </div>
  )
}

export default CGV

