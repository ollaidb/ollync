import { Cookie } from 'lucide-react'
import BackButton from '../../components/BackButton'
import './LegalPage.css'

const PolitiqueCookies = () => {
  return (
    <div className="legal-detail-page">
      <div className="legal-detail-header">
        <BackButton />
        <h2 className="legal-detail-title">Politique cookies</h2>
        <div className="legal-detail-header-spacer"></div>
      </div>

      <div className="legal-detail-section">
        <div className="legal-detail-content">
          <div className="legal-detail-update">
            <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
          </div>

          <h4>1. Qu'est-ce qu'un cookie ?</h4>
          <p>
            Un cookie est un petit fichier texte stocké sur votre appareil (ordinateur, tablette, smartphone) 
            lorsque vous visitez un site web. Les cookies permettent au site de reconnaître votre appareil et 
            de mémoriser certaines informations sur vos préférences ou actions passées.
          </p>

          <h4>2. Comment utilisons-nous les cookies ?</h4>
          <p>
            Ollync utilise des cookies pour améliorer votre expérience de navigation et vous fournir des 
            fonctionnalités personnalisées. Nous utilisons les cookies pour :
          </p>
          <ul>
            <li>Assurer le bon fonctionnement du site</li>
            <li>Mémoriser vos préférences et paramètres</li>
            <li>Maintenir votre session de connexion</li>
            <li>Analyser l'utilisation du site pour améliorer nos services</li>
            <li>Personnaliser le contenu et les publicités</li>
            <li>Assurer la sécurité de la plateforme</li>
          </ul>

          <h4>3. Types de cookies utilisés</h4>
          
          <h5>Cookies strictement nécessaires</h5>
          <p>
            Ces cookies sont indispensables au fonctionnement du site. Ils permettent notamment de maintenir 
            votre session de connexion et de sécuriser votre accès. Sans ces cookies, certaines fonctionnalités 
            ne peuvent pas fonctionner correctement.
          </p>

          <h5>Cookies de performance et d'analyse</h5>
          <p>
            Ces cookies nous permettent de comprendre comment les visiteurs utilisent notre site en collectant 
            des informations anonymes. Ils nous aident à améliorer le fonctionnement du site en identifiant 
            les pages les plus visitées, les parcours utilisateurs, etc.
          </p>

          <h5>Cookies de fonctionnalité</h5>
          <p>
            Ces cookies permettent au site de se souvenir de vos choix (langue, région, préférences d'affichage) 
            et de vous offrir des fonctionnalités améliorées et personnalisées.
          </p>

          <h5>Cookies de ciblage/publicitaires</h5>
          <p>
            Ces cookies peuvent être utilisés pour vous proposer des publicités personnalisées basées sur vos 
            intérêts. Ils peuvent également être utilisés pour limiter le nombre de fois qu'une publicité 
            vous est présentée et mesurer l'efficacité des campagnes publicitaires.
          </p>

          <h4>4. Cookies tiers</h4>
          <p>
            Certains cookies sont placés par des services tiers présents sur notre site. Ces cookies peuvent 
            inclure :
          </p>
          <ul>
            <li>Cookies d'analyse (Google Analytics, etc.)</li>
            <li>Cookies de réseaux sociaux (si vous interagissez avec des boutons de partage)</li>
            <li>Cookies de services de paiement</li>
            <li>Cookies de services de cartographie</li>
          </ul>
          <p>
            Nous n'avons pas le contrôle sur ces cookies tiers. Nous vous recommandons de consulter les 
            politiques de confidentialité de ces tiers pour plus d'informations.
          </p>

          <h4>5. Durée de conservation</h4>
          <p>
            Les cookies que nous utilisons ont différentes durées de vie :
          </p>
          <ul>
            <li><strong>Cookies de session :</strong> Supprimés à la fermeture de votre navigateur</li>
            <li><strong>Cookies persistants :</strong> Restent sur votre appareil pendant une durée déterminée 
                (quelques jours à plusieurs mois) ou jusqu'à ce que vous les supprimiez</li>
          </ul>

          <h4>6. Gestion des cookies</h4>
          <p>
            Vous pouvez contrôler et gérer les cookies de plusieurs façons :
          </p>
          
          <h5>Paramètres du navigateur</h5>
          <p>
            La plupart des navigateurs vous permettent de refuser ou d'accepter les cookies, ou de recevoir 
            une notification avant qu'un cookie ne soit stocké. Voici comment gérer les cookies selon votre 
            navigateur :
          </p>
          <ul>
            <li><strong>Chrome :</strong> Paramètres &gt; Confidentialité et sécurité &gt; Cookies</li>
            <li><strong>Firefox :</strong> Options &gt; Vie privée et sécurité &gt; Cookies</li>
            <li><strong>Safari :</strong> Préférences &gt; Confidentialité &gt; Cookies</li>
            <li><strong>Edge :</strong> Paramètres &gt; Confidentialité &gt; Cookies</li>
          </ul>

          <h5>Consentement</h5>
          <p>
            Lors de votre première visite, vous pouvez choisir d'accepter ou de refuser les cookies non 
            essentiels via notre bannière de consentement.
          </p>

          <h4>7. Conséquences du refus des cookies</h4>
          <p>
            Si vous choisissez de désactiver les cookies, certaines fonctionnalités du site peuvent ne pas 
            fonctionner correctement :
          </p>
          <ul>
            <li>Vous devrez vous reconnecter à chaque visite</li>
            <li>Vos préférences ne seront pas sauvegardées</li>
            <li>Certaines fonctionnalités personnalisées seront indisponibles</li>
          </ul>

          <h4>8. Cookies et données personnelles</h4>
          <p>
            Certains cookies peuvent collecter des données personnelles. Le traitement de ces données est 
            régi par notre <a href="/profile/legal/politique-confidentialite" style={{ color: 'var(--primary)' }}>Politique de confidentialité</a>.
          </p>

          <h4>9. Modifications</h4>
          <p>
            Nous nous réservons le droit de modifier cette politique cookies à tout moment. Toute modification 
            sera publiée sur cette page avec une mise à jour de la date de "Dernière mise à jour".
          </p>
        </div>
      </div>
    </div>
  )
}

export default PolitiqueCookies

