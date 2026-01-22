import { useState } from 'react'
import { Mail, HelpCircle, Search } from 'lucide-react'
import BackButton from '../../components/BackButton'
import './Contact.css'

const Contact = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const faqItems = [
    {
      question: 'Comment récupérer mon compte ?',
      answer: 'Si vous avez perdu l’accès, utilisez la fonctionnalité “Mot de passe oublié” depuis la connexion. Vérifiez aussi vos spams. Si besoin, contactez le support avec votre email d’inscription.'
    },
    {
      question: 'Comment sécuriser mon compte ?',
      answer: 'Utilisez un mot de passe unique, activez la double authentification si disponible et évitez de partager vos identifiants.'
    },
    {
      question: 'Comment signaler un compte ou un contenu ?',
      answer: 'Depuis le profil ou la publication concernée, utilisez l’option de signalement. Décrivez le problème pour accélérer le traitement.'
    },
    {
      question: 'Comment bloquer un utilisateur ?',
      answer: 'Accédez au profil de l’utilisateur et choisissez l’option “Bloquer”. Vous ne recevrez plus ses messages.'
    },
    {
      question: 'Comment demander un remboursement ?',
      answer: 'Si vous êtes éligible, contactez le support avec les détails de la transaction. Nous étudions chaque demande au cas par cas.'
    },
    {
      question: 'Quels sont les délais de réponse du support ?',
      answer: 'Nous répondons généralement sous 24 à 48h ouvrées. Pour les demandes urgentes, privilégiez le chat en direct.'
    },
    {
      question: 'Comment protéger mes échanges avec un client ?',
      answer: 'Précisez le brief, validez les étapes par écrit et définissez les livrables. Cela évite les malentendus.'
    }
  ]

  const filteredFaq = faqItems.filter((item) => {
    const search = searchQuery.trim().toLowerCase()
    if (!search) return true
    return (
      item.question.toLowerCase().includes(search) ||
      item.answer.toLowerCase().includes(search)
    )
  })

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
            <p className="contact-note">Chat en direct disponible (Lundi - Vendredi, 9h - 18h)</p>
            <div className="contact-info">
              <p><strong>Pour :</strong> Questions générales, support technique, réclamations, urgences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="contact-section">
        <h3 className="contact-section-title">
          <HelpCircle size={20} />
          Questions fréquentes
        </h3>
        <div className="contact-faq-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher une question"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="contact-faq-list">
          {filteredFaq.length === 0 && (
            <p className="contact-faq-empty">Aucun résultat pour cette recherche.</p>
          )}
          {filteredFaq.map((item) => (
            <div key={item.question} className="contact-faq-item">
              <h4>{item.question}</h4>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Contact

