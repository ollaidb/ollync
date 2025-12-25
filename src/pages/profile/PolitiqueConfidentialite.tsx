import BackButton from '../../components/BackButton'
import './LegalPage.css'

const PolitiqueConfidentialite = () => {
  return (
    <div className="legal-detail-page">
      <div className="legal-detail-header">
        <BackButton />
        <h2 className="legal-detail-title">Politique de confidentialité</h2>
        <div className="legal-detail-header-spacer"></div>
      </div>

      <div className="legal-detail-section">
        <div className="legal-detail-content">
          <div className="legal-detail-update">
            <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
          </div>

          <p>
            La présente politique de confidentialité décrit la façon dont Ollync collecte, utilise et protège 
            vos informations personnelles lorsque vous utilisez notre plateforme.
          </p>

          <h4>1. Collecte des données</h4>
          <p>
            Nous collectons les informations que vous nous fournissez directement, notamment lors de :
          </p>
          <ul>
            <li>La création de votre compte utilisateur</li>
            <li>La publication d'annonces</li>
            <li>L'utilisation de nos services de messagerie</li>
            <li>La communication avec notre service client</li>
            <li>L'inscription à nos newsletters</li>
          </ul>
          <p>
            Les données collectées peuvent inclure : nom, prénom, adresse email, numéro de téléphone, 
            adresse postale, informations de paiement, photos, et autres informations que vous choisissez 
            de partager.
          </p>

          <h4>2. Utilisation des données</h4>
          <p>Nous utilisons vos données personnelles pour :</p>
          <ul>
            <li>Fournir, maintenir et améliorer nos services</li>
            <li>Traiter vos transactions et gérer votre compte</li>
            <li>Vous communiquer des informations importantes concernant votre compte ou nos services</li>
            <li>Personnaliser votre expérience sur la plateforme</li>
            <li>Assurer la sécurité de la plateforme et prévenir la fraude</li>
            <li>Respecter nos obligations légales et réglementaires</li>
          </ul>

          <h4>3. Partage des données</h4>
          <p>
            Nous ne vendons pas vos données personnelles à des tiers. Nous pouvons partager vos informations 
            uniquement dans les cas suivants :
          </p>
          <ul>
            <li>Avec votre consentement explicite</li>
            <li>Avec des prestataires de services qui nous aident à exploiter notre plateforme (hébergement, 
                traitement des paiements, etc.) sous réserve de garanties appropriées</li>
            <li>Pour se conformer à une obligation légale ou répondre à une demande d'autorité compétente</li>
            <li>En cas de fusion, acquisition ou vente d'actifs, sous réserve de notification préalable</li>
          </ul>

          <h4>4. Vos droits</h4>
          <p>
            Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
          </p>
          <ul>
            <li><strong>Droit d'accès :</strong> Vous pouvez demander une copie de vos données personnelles</li>
            <li><strong>Droit de rectification :</strong> Vous pouvez corriger vos données inexactes ou incomplètes</li>
            <li><strong>Droit à l'effacement :</strong> Vous pouvez demander la suppression de vos données</li>
            <li><strong>Droit d'opposition :</strong> Vous pouvez vous opposer au traitement de vos données</li>
            <li><strong>Droit à la portabilité :</strong> Vous pouvez récupérer vos données dans un format structuré</li>
            <li><strong>Droit à la limitation :</strong> Vous pouvez demander la limitation du traitement</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous à : contact@ollync.com
          </p>

          <h4>5. Sécurité</h4>
          <p>
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour 
            protéger vos données personnelles contre tout accès non autorisé, altération, divulgation ou 
            destruction. Ces mesures incluent notamment :
          </p>
          <ul>
            <li>Chiffrement des données sensibles</li>
            <li>Accès sécurisé aux serveurs</li>
            <li>Authentification forte pour les accès administrateurs</li>
            <li>Surveillance régulière de nos systèmes</li>
          </ul>

          <h4>6. Conservation des données</h4>
          <p>
            Nous conservons vos données personnelles aussi longtemps que nécessaire pour les finalités 
            décrites dans cette politique, sauf si une période de conservation plus longue est requise 
            ou permise par la loi.
          </p>

          <h4>7. Cookies</h4>
          <p>
            Notre site utilise des cookies pour améliorer votre expérience. Pour plus d'informations, 
            consultez notre <a href="/profile/legal/politique-cookies" style={{ color: 'var(--primary)' }}>Politique cookies</a>.
          </p>

          <h4>8. Modifications</h4>
          <p>
            Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
            Toute modification sera publiée sur cette page avec une mise à jour de la date de "Dernière mise à jour".
          </p>
        </div>
      </div>
    </div>
  )
}

export default PolitiqueConfidentialite

