import { Mail, MessageSquare, Clock, MapPin, Phone, HelpCircle, AlertCircle, CheckCircle } from 'lucide-react'
import BackButton from '../../components/BackButton'
import './Contact.css'

const Contact = () => {
  return (
    <div className="contact-page">
      <div className="contact-header">
        <BackButton />
        <h2 className="contact-title">Nous contacter</h2>
        <div className="contact-header-spacer"></div>
      </div>

      <div className="contact-intro">
        <p>
          Nous sommes là pour vous aider ! Que vous ayez une question, une suggestion ou besoin d'assistance, 
          notre équipe est à votre écoute. Choisissez le moyen de contact qui vous convient le mieux.
        </p>
      </div>

      <div className="contact-section">
        <h3 className="contact-section-title">Moyens de contact</h3>
        <div className="contact-cards">
          <div className="contact-card">
            <div className="contact-icon">
              <Mail size={24} />
            </div>
            <h3>Email</h3>
            <p className="contact-detail">support@ollync.com</p>
            <p className="contact-description">Pour toute question, demande d'assistance ou réclamation</p>
            <p className="contact-note">Réponse garantie sous 24-48h</p>
            <div className="contact-info">
              <p><strong>Pour :</strong> Questions générales, support technique, réclamations</p>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-icon">
              <MessageSquare size={24} />
            </div>
            <h3>Chat en direct</h3>
            <p className="contact-detail">Disponible sur le site</p>
            <p className="contact-description">Assistance en temps réel pour vos questions urgentes</p>
            <p className="contact-note">Lundi - Vendredi, 9h - 18h</p>
            <div className="contact-info">
              <p><strong>Pour :</strong> Questions rapides, aide immédiate, problèmes urgents</p>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-icon">
              <Phone size={24} />
            </div>
            <h3>Téléphone</h3>
            <p className="contact-detail">+33 1 XX XX XX XX</p>
            <p className="contact-description">Parlez directement avec notre équipe de support</p>
            <p className="contact-note">Lundi - Vendredi, 9h - 18h</p>
            <div className="contact-info">
              <p><strong>Pour :</strong> Assistance téléphonique, questions complexes, suivi de dossiers</p>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-icon">
              <MapPin size={24} />
            </div>
            <h3>Adresse postale</h3>
            <p className="contact-detail">Ollync</p>
            <p className="contact-description">123 Rue de la République<br />75001 Paris, France</p>
            <p className="contact-note">Sur rendez-vous uniquement</p>
            <div className="contact-info">
              <p><strong>Pour :</strong> Réunions, visites, correspondance officielle</p>
            </div>
          </div>
        </div>
      </div>

      <div className="contact-section">
        <h3 className="contact-section-title">
          <Clock size={20} />
          Horaires d'ouverture
        </h3>
        <div className="contact-hours">
          <div className="contact-hours-row">
            <span className="contact-hours-day">Lundi - Vendredi</span>
            <span className="contact-hours-time">9h - 18h</span>
          </div>
          <div className="contact-hours-row">
            <span className="contact-hours-day">Samedi</span>
            <span className="contact-hours-time">10h - 16h</span>
          </div>
          <div className="contact-hours-row">
            <span className="contact-hours-day">Dimanche</span>
            <span className="contact-hours-time">Fermé</span>
          </div>
        </div>
        <p className="contact-hours-note">
          <AlertCircle size={16} />
          Les jours fériés, notre service peut être fermé. Nous vous conseillons de nous contacter par email 
          pour toute demande non urgente pendant ces périodes.
        </p>
      </div>

      <div className="contact-section">
        <h3 className="contact-section-title">
          <HelpCircle size={20} />
          Types de demandes
        </h3>
        <div className="contact-requests">
          <div className="contact-request-item">
            <CheckCircle size={20} className="contact-request-icon" />
            <div>
              <h4>Support technique</h4>
              <p>Problèmes de connexion, bugs, questions sur l'utilisation de la plateforme</p>
              <span className="contact-request-method">Email ou Chat</span>
            </div>
          </div>
          <div className="contact-request-item">
            <CheckCircle size={20} className="contact-request-icon" />
            <div>
              <h4>Questions sur mon compte</h4>
              <p>Modification de profil, réinitialisation de mot de passe, gestion des paramètres</p>
              <span className="contact-request-method">Email, Chat ou Téléphone</span>
            </div>
          </div>
          <div className="contact-request-item">
            <CheckCircle size={20} className="contact-request-icon" />
            <div>
              <h4>Problèmes de paiement</h4>
              <p>Facturation, remboursements, problèmes de transaction</p>
              <span className="contact-request-method">Email ou Téléphone</span>
            </div>
          </div>
          <div className="contact-request-item">
            <CheckCircle size={20} className="contact-request-icon" />
            <div>
              <h4>Signaler un contenu</h4>
              <p>Contenu inapproprié, utilisateur suspect, violation des règles</p>
              <span className="contact-request-method">Email (urgent) ou Chat</span>
            </div>
          </div>
          <div className="contact-request-item">
            <CheckCircle size={20} className="contact-request-icon" />
            <div>
              <h4>Partenariats et collaborations</h4>
              <p>Demandes commerciales, partenariats, collaborations</p>
              <span className="contact-request-method">Email</span>
            </div>
          </div>
          <div className="contact-request-item">
            <CheckCircle size={20} className="contact-request-icon" />
            <div>
              <h4>Suggestions et feedback</h4>
              <p>Idées d'amélioration, retours sur l'expérience utilisateur</p>
              <span className="contact-request-method">Email</span>
            </div>
          </div>
        </div>
      </div>

      <div className="contact-section">
        <h3 className="contact-section-title">Informations importantes</h3>
        <div className="contact-info-box">
          <h4>Délais de réponse</h4>
          <ul>
            <li><strong>Email :</strong> Réponse sous 24-48h ouvrables</li>
            <li><strong>Chat :</strong> Réponse immédiate pendant les horaires d'ouverture</li>
            <li><strong>Téléphone :</strong> Temps d'attente moyen de 2-5 minutes</li>
          </ul>
        </div>
        <div className="contact-info-box">
          <h4>Pour une réponse plus rapide</h4>
          <ul>
            <li>Précisez votre numéro de compte ou votre email d'inscription</li>
            <li>Décrivez clairement votre problème ou votre question</li>
            <li>Ajoutez des captures d'écran si nécessaire</li>
            <li>Indiquez la date et l'heure de l'incident si applicable</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Contact

