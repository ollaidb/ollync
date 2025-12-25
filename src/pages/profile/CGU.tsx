import BackButton from '../../components/BackButton'
import './LegalPage.css'

const CGU = () => {
  return (
    <div className="legal-detail-page">
      <div className="legal-detail-header">
        <BackButton />
        <h2 className="legal-detail-title">Conditions Générales d'Utilisation</h2>
        <div className="legal-detail-header-spacer"></div>
      </div>

      <div className="legal-detail-section">
        <div className="legal-detail-content">
          <div className="legal-detail-update">
            <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
          </div>

          <h4>1. Acceptation des conditions</h4>
          <p>
            En accédant et en utilisant Ollync, vous acceptez d'être lié par les présentes Conditions Générales 
            d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
          </p>
          <p>
            Nous nous réservons le droit de modifier ces CGU à tout moment. Il est de votre responsabilité de 
            consulter régulièrement ces conditions. Votre utilisation continue du service après toute modification 
            constitue votre acceptation des nouvelles conditions.
          </p>

          <h4>2. Description du service</h4>
          <p>
            Ollync est une plateforme de mise en relation permettant aux utilisateurs de :
          </p>
          <ul>
            <li>Publier des annonces</li>
            <li>Rechercher des opportunités et services</li>
            <li>Interagir avec d'autres membres de la communauté</li>
            <li>Échanger via une messagerie intégrée</li>
            <li>Laisser et consulter des avis</li>
          </ul>

          <h4>3. Inscription et compte utilisateur</h4>
          <p>
            Pour utiliser nos services, vous devez créer un compte. Vous vous engagez à :
          </p>
          <ul>
            <li>Fournir des informations exactes, complètes et à jour</li>
            <li>Maintenir la sécurité de votre compte et de votre mot de passe</li>
            <li>Être responsable de toutes les activités qui se produisent sous votre compte</li>
            <li>Notifier immédiatement Ollync de tout usage non autorisé de votre compte</li>
          </ul>

          <h4>4. Utilisation du service</h4>
          <p>Vous vous engagez à utiliser Ollync de manière légale et conforme à ces conditions. Vous acceptez de ne pas :</p>
          <ul>
            <li>Utiliser le service à des fins illégales ou non autorisées</li>
            <li>Violer les droits d'autrui, y compris les droits de propriété intellectuelle</li>
            <li>Publier du contenu diffamatoire, offensant, obscène ou illégal</li>
            <li>Transmettre des virus, logiciels malveillants ou tout autre code nuisible</li>
            <li>Tenter d'accéder non autorisé aux systèmes ou réseaux d'Ollync</li>
            <li>Usurper l'identité d'autrui ou fournir de fausses informations</li>
            <li>Collecter des données personnelles d'autres utilisateurs sans leur consentement</li>
          </ul>

          <h4>5. Contenu utilisateur</h4>
          <p>
            Vous conservez la propriété de tout contenu que vous publiez sur Ollync. En publiant du contenu, 
            vous accordez à Ollync une licence mondiale, non exclusive, gratuite et transférable pour utiliser, 
            reproduire, distribuer et afficher ce contenu dans le cadre de l'exploitation de la plateforme.
          </p>
          <p>
            Vous êtes seul responsable du contenu que vous publiez et garantissez que vous disposez de tous les 
            droits nécessaires pour le publier.
          </p>

          <h4>6. Propriété intellectuelle</h4>
          <p>
            Tous les contenus présents sur Ollync, y compris mais sans s'y limiter, les textes, graphiques, 
            logos, icônes, images, clips audio, téléchargements numériques, compilations de données et logiciels, 
            sont la propriété d'Ollync ou de ses concédants de licence et sont protégés par les lois françaises 
            et internationales sur le droit d'auteur.
          </p>

          <h4>7. Limitation de responsabilité</h4>
          <p>
            Ollync agit en tant que plateforme de mise en relation. Nous ne sommes pas responsables :
          </p>
          <ul>
            <li>De la qualité, sécurité ou légalité des annonces ou services proposés</li>
            <li>De la capacité des utilisateurs à effectuer des transactions</li>
            <li>Des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service</li>
            <li>Des litiges entre utilisateurs</li>
          </ul>

          <h4>8. Suspension et résiliation</h4>
          <p>
            Nous nous réservons le droit de suspendre ou résilier votre compte et votre accès au service à tout 
            moment, sans préavis, en cas de violation de ces CGU ou pour toute autre raison légitime.
          </p>

          <h4>9. Données personnelles</h4>
          <p>
            Le traitement de vos données personnelles est régi par notre 
            <a href="/profile/legal/politique-confidentialite" style={{ color: 'var(--primary)' }}> Politique de confidentialité</a>.
          </p>

          <h4>10. Droit applicable et juridiction</h4>
          <p>
            Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation 
            et/ou à leur exécution relève des tribunaux français.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CGU

