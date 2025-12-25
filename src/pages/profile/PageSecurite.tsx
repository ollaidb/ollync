import { Shield } from 'lucide-react'
import BackButton from '../../components/BackButton'
import './LegalPage.css'

const PageSecurite = () => {
  return (
    <div className="legal-detail-page">
      <div className="legal-detail-header">
        <BackButton />
        <h2 className="legal-detail-title">Page Sécurité</h2>
        <div className="legal-detail-header-spacer"></div>
      </div>

      <div className="legal-detail-section">
        <div className="legal-detail-content">
          <div className="legal-detail-update">
            <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
          </div>

          <h4>1. Notre engagement en matière de sécurité</h4>
          <p>
            La sécurité de vos données personnelles et de votre compte est notre priorité absolue. Ollync 
            met en œuvre des mesures de sécurité techniques et organisationnelles de haut niveau pour protéger 
            vos informations contre tout accès non autorisé, perte, altération ou divulgation.
          </p>

          <h4>2. Mesures techniques de sécurité</h4>
          
          <h5>Chiffrement des données</h5>
          <p>
            Toutes les données sensibles sont chiffrées en transit et au repos :
          </p>
          <ul>
            <li>Connexions sécurisées via HTTPS/TLS pour toutes les communications</li>
            <li>Chiffrement des mots de passe avec des algorithmes de hachage sécurisés</li>
            <li>Chiffrement des données de paiement conformément aux standards PCI DSS</li>
            <li>Stockage sécurisé des données dans des bases de données chiffrées</li>
          </ul>

          <h5>Sécurité des serveurs</h5>
          <p>
            Notre infrastructure est sécurisée par :
          </p>
          <ul>
            <li>Surveillance 24/7 de nos systèmes</li>
            <li>Mises à jour régulières de sécurité</li>
            <li>Protection contre les attaques DDoS</li>
            <li>Sauvegardes régulières et sécurisées</li>
            <li>Accès restreint aux serveurs avec authentification forte</li>
          </ul>

          <h5>Authentification</h5>
          <p>
            Nous proposons plusieurs niveaux de sécurité pour votre compte :
          </p>
          <ul>
            <li>Mots de passe forts obligatoires</li>
            <li>Authentification à deux facteurs (2FA) disponible</li>
            <li>Vérification par email pour les actions sensibles</li>
            <li>Détection des connexions suspectes</li>
            <li>Limitation des tentatives de connexion</li>
          </ul>

          <h4>3. Mesures organisationnelles</h4>
          <p>
            Au-delà des mesures techniques, nous mettons en place des procédures organisationnelles strictes :
          </p>
          <ul>
            <li>Accès limité aux données personnelles uniquement aux personnes autorisées</li>
            <li>Formation régulière de notre équipe sur la sécurité et la protection des données</li>
            <li>Audits de sécurité réguliers</li>
            <li>Politique stricte de gestion des incidents de sécurité</li>
            <li>Conformité avec le RGPD et autres réglementations applicables</li>
          </ul>

          <h4>4. Sécurité de votre compte</h4>
          <p>
            Vous aussi avez un rôle important à jouer dans la sécurité de votre compte. Voici nos recommandations :
          </p>
          
          <h5>Mot de passe fort</h5>
          <ul>
            <li>Utilisez un mot de passe unique et complexe (au moins 12 caractères)</li>
            <li>Mélangez lettres majuscules, minuscules, chiffres et symboles</li>
            <li>Ne réutilisez pas vos mots de passe sur plusieurs sites</li>
            <li>Changez votre mot de passe régulièrement</li>
            <li>Utilisez un gestionnaire de mots de passe</li>
          </ul>

          <h5>Authentification à deux facteurs</h5>
          <p>
            Activez l'authentification à deux facteurs (2FA) pour ajouter une couche supplémentaire de sécurité 
            à votre compte. Même si quelqu'un obtient votre mot de passe, il ne pourra pas accéder à votre compte 
            sans votre code d'authentification.
          </p>

          <h5>Vigilance</h5>
          <ul>
            <li>Ne partagez jamais vos identifiants de connexion</li>
            <li>Méfiez-vous des emails suspects prétendant provenir d'Ollync</li>
            <li>Vérifiez régulièrement l'activité de votre compte</li>
            <li>Déconnectez-vous après utilisation sur un appareil partagé</li>
            <li>Signalez immédiatement toute activité suspecte</li>
          </ul>

          <h4>5. Signalement d'incidents de sécurité</h4>
          <p>
            Si vous découvrez une faille de sécurité ou suspectez un accès non autorisé à votre compte, 
            contactez-nous immédiatement à : security@ollync.com
          </p>
          <p>
            Nous prenons très au sérieux tout signalement et nous engageons à :
          </p>
          <ul>
            <li>Enquêter rapidement sur l'incident</li>
            <li>Corriger toute faille identifiée</li>
            <li>Vous informer si vos données ont été compromises</li>
            <li>Prendre les mesures nécessaires pour prévenir de futurs incidents</li>
          </ul>

          <h4>6. Protection contre les fraudes</h4>
          <p>
            Nous utilisons des systèmes de détection de fraude avancés pour protéger nos utilisateurs :
          </p>
          <ul>
            <li>Détection des comportements suspects</li>
            <li>Vérification des transactions suspectes</li>
            <li>Protection contre le phishing et l'usurpation d'identité</li>
            <li>Modération proactive du contenu</li>
          </ul>

          <h4>7. Conformité et certifications</h4>
          <p>
            Ollync s'engage à respecter les normes et réglementations en vigueur :
          </p>
          <ul>
            <li>RGPD (Règlement Général sur la Protection des Données)</li>
            <li>Standards PCI DSS pour les données de paiement</li>
            <li>ISO 27001 (en cours de certification)</li>
          </ul>

          <h4>8. Transparence</h4>
          <p>
            Nous nous engageons à vous informer en cas d'incident de sécurité affectant vos données personnelles, 
            conformément aux exigences légales.
          </p>

          <h4>9. Questions</h4>
          <p>
            Si vous avez des questions concernant la sécurité de vos données ou de notre plateforme, 
            n'hésitez pas à nous contacter à : security@ollync.com
          </p>
        </div>
      </div>
    </div>
  )
}

export default PageSecurite

