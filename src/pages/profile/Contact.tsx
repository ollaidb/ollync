import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, HelpCircle, Search } from 'lucide-react'
import BackButton from '../../components/BackButton'
import './Contact.css'

const Contact = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  const labels = isEnglish
    ? {
        title: 'Contact us',
        intro:
          'We are here to help! Whether you have a question, a suggestion, or need assistance, our team is here for you. Choose the contact method that suits you best.',
        contactSectionTitle: 'Contact methods',
        emailTitle: 'Email',
        emailDescription: 'For any question, support request, or complaint',
        responseTime: 'Response within 24-48 hours',
        liveChat: 'Live chat available (Monday - Friday, 9am - 6pm)',
        forLabel: 'For:',
        forDetails: 'General questions, technical support, complaints, urgent issues',
        faqTitle: 'Frequently asked questions',
        searchPlaceholder: 'Search a question',
        emptySearch: 'No results for this search.'
      }
    : {
        title: 'Nous contacter',
        intro:
          "Nous sommes là pour vous aider ! Que vous ayez une question, une suggestion ou besoin d'assistance, notre équipe est à votre écoute. Choisissez le moyen de contact qui vous convient le mieux.",
        contactSectionTitle: 'Moyens de contact',
        emailTitle: 'Email',
        emailDescription: "Pour toute question, demande d'assistance ou réclamation",
        responseTime: 'Réponse garantie sous 24-48h',
        liveChat: 'Chat en direct disponible (Lundi - Vendredi, 9h - 18h)',
        forLabel: 'Pour :',
        forDetails: 'Questions générales, support technique, réclamations, urgences',
        faqTitle: 'Questions fréquentes',
        searchPlaceholder: 'Rechercher une question',
        emptySearch: 'Aucun résultat pour cette recherche.'
      }

  const faqItems = isEnglish
    ? [
        {
          question: 'How can I recover my account?',
          answer:
            'If you lost access, use the “Forgot password” option from the login screen. Also check your spam folder. If needed, contact support with your sign-up email.'
        },
        {
          question: 'How do I secure my account?',
          answer:
            'Use a unique password, enable two-factor authentication if available, and avoid sharing your credentials.'
        },
        {
          question: 'How do I report an account or content?',
          answer:
            'From the profile or post, use the report option. Describe the issue to speed up the review.'
        },
        {
          question: 'How do I block a user?',
          answer:
            'Go to the user’s profile and choose the “Block” option. You will no longer receive their messages.'
        },
        {
          question: 'How do I request a refund?',
          answer:
            'If you are eligible, contact support with the transaction details. We review each request case by case.'
        },
        {
          question: 'What are support response times?',
          answer:
            'We usually reply within 24 to 48 business hours. For urgent requests, use live chat.'
        },
        {
          question: 'How do I protect my exchanges with a client?',
          answer:
            'Provide a clear brief, validate steps in writing, and define deliverables. This helps prevent misunderstandings.'
        }
      ]
    : [
        {
          question: 'Comment récupérer mon compte ?',
          answer:
            'Si vous avez perdu l’accès, utilisez la fonctionnalité “Mot de passe oublié” depuis la connexion. Vérifiez aussi vos spams. Si besoin, contactez le support avec votre email d’inscription.'
        },
        {
          question: 'Comment sécuriser mon compte ?',
          answer:
            'Utilisez un mot de passe unique, activez la double authentification si disponible et évitez de partager vos identifiants.'
        },
        {
          question: 'Comment signaler un compte ou un contenu ?',
          answer:
            'Depuis le profil ou la publication concernée, utilisez l’option de signalement. Décrivez le problème pour accélérer le traitement.'
        },
        {
          question: 'Comment bloquer un utilisateur ?',
          answer:
            'Accédez au profil de l’utilisateur et choisissez l’option “Bloquer”. Vous ne recevrez plus ses messages.'
        },
        {
          question: 'Comment demander un remboursement ?',
          answer:
            'Si vous êtes éligible, contactez le support avec les détails de la transaction. Nous étudions chaque demande au cas par cas.'
        },
        {
          question: 'Quels sont les délais de réponse du support ?',
          answer:
            'Nous répondons généralement sous 24 à 48h ouvrées. Pour les demandes urgentes, privilégiez le chat en direct.'
        },
        {
          question: 'Comment protéger mes échanges avec un client ?',
          answer:
            'Précisez le brief, validez les étapes par écrit et définissez les livrables. Cela évite les malentendus.'
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
        <h2 className="contact-title">{labels.title}</h2>
        <div className="contact-header-spacer"></div>
      </div>

      <div className="contact-intro">
        <p>
          {labels.intro}
        </p>
      </div>

      <div className="contact-section">
        <h3 className="contact-section-title">{labels.contactSectionTitle}</h3>
        <div className="contact-cards">
          <div className="contact-card">
            <div className="contact-icon">
              <Mail size={24} />
            </div>
            <h3>{labels.emailTitle}</h3>
            <p className="contact-detail">support@ollync.com</p>
            <p className="contact-description">{labels.emailDescription}</p>
            <p className="contact-note">{labels.responseTime}</p>
            <p className="contact-note">{labels.liveChat}</p>
            <div className="contact-info">
              <p>
                <strong>{labels.forLabel}</strong> {labels.forDetails}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="contact-section">
        <h3 className="contact-section-title">
          <HelpCircle size={20} />
          {labels.faqTitle}
        </h3>
        <div className="contact-faq-search">
          <Search size={18} />
          <input
            type="text"
            placeholder={labels.searchPlaceholder}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="contact-faq-list">
          {filteredFaq.length === 0 && (
            <p className="contact-faq-empty">{labels.emptySearch}</p>
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

