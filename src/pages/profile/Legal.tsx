import { FileText, Shield, Lock, Scale } from 'lucide-react'
import './Legal.css'

const Legal = () => {
  return (
    <div className="legal-page">
      <h2 className="legal-title">Pages légales</h2>

      <div className="legal-section">
        <div className="legal-header">
          <Scale size={24} />
          <h3>Conditions d'utilisation</h3>
        </div>
        <div className="legal-content">
          <p><strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
          
          <h4>1. Acceptation des conditions</h4>
          <p>
            En accédant et en utilisant Ollync, vous acceptez d'être lié par les présentes conditions d'utilisation. 
            Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
          </p>

          <h4>2. Description du service</h4>
          <p>
            Ollync est une plateforme de mise en relation permettant aux utilisateurs de publier des annonces, 
            de rechercher des opportunités et d'interagir avec d'autres membres de la communauté.
          </p>

          <h4>3. Utilisation du service</h4>
          <p>
            Vous vous engagez à utiliser Ollync de manière légale et conforme à ces conditions. 
            Vous êtes responsable de tout contenu que vous publiez sur la plateforme.
          </p>

          <h4>4. Propriété intellectuelle</h4>
          <p>
            Tous les contenus présents sur Ollync, y compris mais sans s'y limiter, les textes, graphiques, 
            logos, icônes, images, sont la propriété d'Ollync ou de ses concédants de licence.
          </p>

          <h4>5. Limitation de responsabilité</h4>
          <p>
            Ollync ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation 
            ou de l'impossibilité d'utiliser le service.
          </p>
        </div>
      </div>

      <div className="legal-section">
        <div className="legal-header">
          <Shield size={24} />
          <h3>Politique de confidentialité</h3>
        </div>
        <div className="legal-content">
          <p><strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
          
          <h4>1. Collecte des données</h4>
          <p>
            Nous collectons les informations que vous nous fournissez directement, notamment lors de la création 
            de votre compte, de la publication d'annonces ou de l'utilisation de nos services.
          </p>

          <h4>2. Utilisation des données</h4>
          <p>
            Nous utilisons vos données pour fournir, maintenir et améliorer nos services, communiquer avec vous, 
            et assurer la sécurité de la plateforme.
          </p>

          <h4>3. Partage des données</h4>
          <p>
            Nous ne vendons pas vos données personnelles. Nous pouvons partager vos informations uniquement dans 
            les cas prévus par la loi ou avec votre consentement explicite.
          </p>

          <h4>4. Vos droits</h4>
          <p>
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et 
            d'opposition concernant vos données personnelles.
          </p>

          <h4>5. Sécurité</h4>
          <p>
            Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données personnelles 
            contre tout accès non autorisé, altération, divulgation ou destruction.
          </p>
        </div>
      </div>

      <div className="legal-section">
        <div className="legal-header">
          <Lock size={24} />
          <h3>Mentions légales</h3>
        </div>
        <div className="legal-content">
          <h4>Éditeur</h4>
          <p>
            <strong>Ollync</strong><br />
            Adresse : [À compléter]<br />
            Email : contact@ollync.com<br />
            Directeur de publication : [À compléter]
          </p>

          <h4>Hébergement</h4>
          <p>
            Ce site est hébergé par Supabase<br />
            Pour plus d'informations : https://supabase.com
          </p>

          <h4>CNIL</h4>
          <p>
            Conformément à la loi "Informatique et Libertés" du 6 janvier 1978 modifiée, vous disposez d'un droit 
            d'accès, de modification et de suppression des données qui vous concernent.
          </p>
        </div>
      </div>

      <div className="legal-section">
        <div className="legal-header">
          <FileText size={24} />
          <h3>Cookies</h3>
        </div>
        <div className="legal-content">
          <p>
            Ollync utilise des cookies pour améliorer votre expérience de navigation. Les cookies sont de petits 
            fichiers texte stockés sur votre appareil qui nous aident à analyser l'utilisation du site et à 
            personnaliser votre expérience.
          </p>
          <p>
            Vous pouvez contrôler et gérer les cookies dans les paramètres de votre navigateur. Notez que la 
            désactivation des cookies peut affecter certaines fonctionnalités du site.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Legal

