import { useTranslation } from 'react-i18next'
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
            'These Terms of Sale govern sales and exchanges carried out between users through the Ollync application.'
          ]
        },
        role: {
          title: '2. Role of Ollync',
          paragraphs: [
            'Ollync is a matchmaking platform. Users set their own prices and conditions for listings.',
            'Ollync does not sell products or services directly.'
          ]
        },
        offers: {
          title: '3. Listings and prices',
          paragraphs: [
            'Listings may be free, paid, or based on non-monetary exchanges (services, barter, or other forms of compensation).',
            'Prices and terms are defined by users.'
          ]
        },
        payments: {
          title: '4. Payments',
          paragraphs: [
            'If a payment is made outside the application, Ollync is not responsible for disputes or incidents.',
            'If a payment is made within the application, a commission may be applied.'
          ]
        },
        refunds: {
          title: '5. Refunds',
          paragraphs: [
            'If a payment is made within the application, any refund rules will be specified at the time of the transaction.',
            'If a payment is made outside the application, Ollync cannot manage refunds.'
          ]
        },
        contracts: {
          title: '6. Contracts between users',
          paragraphs: [
            'Ollync provides a contract module allowing users to formalize their collaboration terms (scope, price, deadlines, deliverables, usage rights, etc.).',
            'Any contract created through the application is concluded exclusively between the concerned users.',
            'Ollync only provides a technical tool for drafting and storing contracts. Ollync is not a party to the contract and does not intervene in negotiation or execution.',
            'Users remain solely responsible for the legality, accuracy, and performance of contractual terms and applicable legal obligations.',
            'In case of dispute, users must resolve it directly between themselves. Ollync cannot be held liable for non-performance, cancellation, or conflict related to user contracts.'
          ]
        },
        liability: {
          title: '7. Responsibility',
          paragraphs: [
            'Ollync is not responsible for the quality of services or products offered, for the execution of exchanges, or for disputes between users.'
          ]
        },
        security: {
          title: '8. Transaction security',
          paragraphs: [
            'Ollync implements measures to secure the platform but cannot guarantee the success or total security of transactions between users.'
          ]
        },
        law: {
          title: '9. Governing law',
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
            "Les présentes Conditions Générales de Vente (CGV) encadrent les ventes et échanges effectués entre utilisateurs via l’application Ollync."
          ]
        },
        role: {
          title: '2. Rôle d’Ollync',
          paragraphs: [
            'Ollync est une plateforme de mise en relation. Les utilisateurs fixent librement les prix et les conditions de leurs annonces.',
            'Ollync ne vend aucun produit ou service directement.'
          ]
        },
        offers: {
          title: '3. Annonces et prix',
          paragraphs: [
            'Les annonces peuvent être gratuites, payantes, ou faire l’objet d’échanges non monétaires (services, troc, ou autres formes de contrepartie).',
            'Les prix et modalités sont définis par les utilisateurs.'
          ]
        },
        payments: {
          title: '4. Paiements',
          paragraphs: [
            'Si un paiement est effectué en dehors de l’application, Ollync n’est pas responsable des litiges ou incidents.',
            'Si un paiement est effectué dans l’application, une commission peut être appliquée.'
          ]
        },
        refunds: {
          title: '5. Remboursements',
          paragraphs: [
            'Si un paiement est effectué dans l’application, les règles de remboursement seront précisées au moment de la transaction.',
            "Si un paiement est effectué en dehors de l’application, Ollync ne peut pas gérer les remboursements."
          ]
        },
        contracts: {
          title: '6. Contrats entre utilisateurs',
          paragraphs: [
            'Ollync met à disposition un module Contrats permettant aux utilisateurs de formaliser les conditions de leur collaboration (mission, prix, délais, livrables, droits d’utilisation, etc.).',
            'Tout contrat créé via l’application est conclu exclusivement entre les utilisateurs concernés.',
            'Ollync fournit uniquement un outil technique de création et de conservation du contrat. Ollync n’est pas partie au contrat et n’intervient pas dans sa négociation ni son exécution.',
            'Les utilisateurs restent seuls responsables de la légalité, de l’exactitude et de l’exécution des clauses convenues, ainsi que du respect des obligations légales applicables.',
            'En cas de litige, les utilisateurs règlent directement leur différend. Ollync ne peut être tenue responsable en cas de non-exécution, annulation ou conflit lié à un contrat entre utilisateurs.'
          ]
        },
        liability: {
          title: '7. Responsabilité',
          paragraphs: [
            'Ollync n’est pas responsable de la qualité des services ou produits proposés, de la bonne exécution des échanges, ni des litiges entre utilisateurs.'
          ]
        },
        security: {
          title: '8. Sécurité des échanges',
          paragraphs: [
            'Ollync met en œuvre des moyens pour sécuriser la plateforme, mais ne peut garantir la réussite ou la sécurité totale d’une transaction entre utilisateurs.'
          ]
        },
        law: {
          title: '9. Droit applicable',
          paragraph:
            "Les présentes CGV sont régies par le droit français. Tout litige relatif à leur interprétation et/ou à leur exécution relève des tribunaux français."
        }
      }

  return (
    <div className="legal-detail-page">
      <div className="legal-detail-section">
        <div className="legal-detail-content">
          <div className="legal-detail-update">
            <strong>{content.updatedLabel}</strong> {new Date().toLocaleDateString(dateLocale)}
          </div>

          <h4>{content.purpose.title}</h4>
          {content.purpose.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.role.title}</h4>
          {content.role.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.offers.title}</h4>
          {content.offers.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.payments.title}</h4>
          {content.payments.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.refunds.title}</h4>
          {content.refunds.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.contracts.title}</h4>
          {content.contracts.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.liability.title}</h4>
          {content.liability.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.security.title}</h4>
          {content.security.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.law.title}</h4>
          <p>{content.law.paragraph}</p>
        </div>
      </div>
    </div>
  )
}

export default CGV
