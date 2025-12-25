import { ShoppingBag } from 'lucide-react'
import BackButton from '../../components/BackButton'
import './LegalPage.css'

const CGV = () => {
  return (
    <div className="legal-detail-page">
      <div className="legal-detail-header">
        <BackButton />
        <h2 className="legal-detail-title">Conditions Générales de Vente</h2>
        <div className="legal-detail-header-spacer"></div>
      </div>

      <div className="legal-detail-section">
        <div className="legal-detail-content">
          <div className="legal-detail-update">
            <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
          </div>

          <h4>1. Objet</h4>
          <p>
            Les présentes Conditions Générales de Vente (CGV) régissent les relations entre Ollync et ses 
            utilisateurs concernant les services payants proposés sur la plateforme.
          </p>
          <p>
            Toute commande de service implique l'acceptation sans réserve des présentes CGV par l'utilisateur.
          </p>

          <h4>2. Services proposés</h4>
          <p>
            Ollync propose divers services payants, notamment :
          </p>
          <ul>
            <li>Services d'abonnement premium</li>
            <li>Mise en avant d'annonces</li>
            <li>Services additionnels de promotion</li>
            <li>Autres services payants spécifiés sur la plateforme</li>
          </ul>

          <h4>3. Prix</h4>
          <p>
            Les prix des services sont indiqués en euros, toutes taxes comprises (TTC), sauf indication contraire. 
            Les prix peuvent être modifiés à tout moment, mais les commandes en cours seront honorées au prix 
            convenu au moment de la commande.
          </p>
          <p>
            Ollync se réserve le droit de proposer des offres promotionnelles, des réductions ou des remises 
            à tout moment.
          </p>

          <h4>4. Commande et paiement</h4>
          <p>
            Pour commander un service payant, l'utilisateur doit :
          </p>
          <ul>
            <li>Avoir un compte utilisateur valide</li>
            <li>Sélectionner le service souhaité</li>
            <li>Valider sa commande et procéder au paiement</li>
          </ul>
          <p>
            Le paiement s'effectue en ligne par carte bancaire ou via tout autre moyen de paiement accepté 
            sur la plateforme. Le paiement est sécurisé par nos prestataires de services de paiement.
          </p>
          <p>
            La commande est considérée comme validée dès réception de la confirmation de paiement.
          </p>

          <h4>5. Exécution des services</h4>
          <p>
            Les services payants sont activés dans les meilleurs délais après confirmation du paiement. 
            Les services d'abonnement prennent effet immédiatement après activation.
          </p>
          <p>
            Ollync s'efforce de fournir les services commandés de manière continue et fiable, mais ne peut 
            garantir une disponibilité absolue du service.
          </p>

          <h4>6. Droit de rétractation</h4>
          <p>
            Conformément à la législation en vigueur, vous disposez d'un droit de rétractation de 14 jours 
            à compter de la date de souscription, sauf pour :
          </p>
          <ul>
            <li>Les services entièrement exécutés avant la fin du délai de rétractation avec votre accord explicite</li>
            <li>Les services d'abonnement dont la période est déjà écoulée</li>
          </ul>
          <p>
            Pour exercer votre droit de rétractation, contactez-nous à : contact@ollync.com
          </p>

          <h4>7. Remboursement</h4>
          <p>
            En cas d'exercice du droit de rétractation dans les délais légaux, le remboursement sera effectué 
            dans un délai de 14 jours suivant la réception de votre demande, selon les mêmes modalités que 
            celles utilisées pour le paiement initial.
          </p>
          <p>
            Aucun remboursement ne sera accordé pour les services déjà utilisés ou dont la période est écoulée.
          </p>

          <h4>8. Résiliation</h4>
          <p>
            Vous pouvez résilier votre abonnement à tout moment depuis votre compte utilisateur. La résiliation 
            prendra effet à la fin de la période d'abonnement en cours.
          </p>
          <p>
            Ollync se réserve le droit de résilier ou suspendre votre accès aux services payants en cas de 
            violation des Conditions Générales d'Utilisation ou de ces CGV, sans remboursement.
          </p>

          <h4>9. Réclamations</h4>
          <p>
            Toute réclamation concernant un service payant doit être adressée à : contact@ollync.com
          </p>
          <p>
            Nous nous engageons à répondre à toute réclamation dans un délai de 30 jours maximum.
          </p>

          <h4>10. Propriété intellectuelle</h4>
          <p>
            L'accès aux services payants ne confère aucun droit de propriété sur les contenus, fonctionnalités 
            ou éléments de la plateforme, qui demeurent la propriété exclusive d'Ollync.
          </p>

          <h4>11. Droit applicable et juridiction</h4>
          <p>
            Les présentes CGV sont régies par le droit français. Tout litige relatif à leur interprétation 
            et/ou à leur exécution relève des tribunaux français.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CGV

