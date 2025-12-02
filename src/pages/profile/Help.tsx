import { useState } from 'react'
import { ChevronDown, ChevronUp, Mail, MessageSquare, Book, FileText } from 'lucide-react'
import BackButton from '../../components/BackButton'
import './Help.css'

interface FAQItem {
  question: string
  answer: string
}

const Help = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs: FAQItem[] = [
    {
      question: "Comment créer une annonce ?",
      answer: "Pour créer une annonce, cliquez sur le bouton 'Publier' dans le menu principal. Remplissez le formulaire avec les informations de votre annonce, ajoutez des photos si nécessaire, puis publiez."
    },
    {
      question: "Comment contacter un utilisateur ?",
      answer: "Vous pouvez contacter un utilisateur en cliquant sur son profil ou en répondant directement à son annonce. Vous pourrez ensuite échanger via la messagerie."
    },
    {
      question: "Comment modifier mon profil ?",
      answer: "Allez dans 'Mon Profil' puis 'Paramètres'. Vous pourrez modifier vos informations personnelles, votre photo de profil, et personnaliser l'application."
    },
    {
      question: "Comment signaler un contenu inapproprié ?",
      answer: "Si vous rencontrez un contenu inapproprié, vous pouvez le signaler directement depuis la page de l'annonce ou du profil concerné. Notre équipe examinera le signalement rapidement."
    },
    {
      question: "Comment supprimer mon compte ?",
      answer: "Pour supprimer votre compte, contactez notre support via l'adresse email indiquée dans les paramètres. Nous traiterons votre demande dans les plus brefs délais."
    },
    {
      question: "Comment fonctionnent les avis ?",
      answer: "Les avis permettent aux utilisateurs de noter et commenter leurs expériences avec d'autres utilisateurs. Vous pouvez laisser un avis après une interaction réussie via une annonce."
    }
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="help-page">
      <div className="help-header">
        <BackButton />
        <h2 className="help-title">Centre d'aide</h2>
        <div className="help-header-spacer"></div>
      </div>

      <div className="help-section">
        <h3 className="help-section-title">
          <Book size={20} />
          Questions fréquentes
        </h3>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
              {openIndex === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="help-section">
        <h3 className="help-section-title">
          <MessageSquare size={20} />
          Nous contacter
        </h3>
        <div className="contact-options">
          <div className="contact-card">
            <div className="contact-icon">
              <Mail size={24} />
            </div>
            <h4>Email</h4>
            <p>support@ollync.com</p>
            <p className="contact-note">Réponse sous 24-48h</p>
          </div>

          <div className="contact-card">
            <div className="contact-icon">
              <MessageSquare size={24} />
            </div>
            <h4>Chat en direct</h4>
            <p>Disponible du lundi au vendredi</p>
            <p className="contact-note">9h - 18h</p>
          </div>
        </div>
      </div>

      <div className="help-section">
        <h3 className="help-section-title">
          <FileText size={20} />
          Ressources
        </h3>
        <div className="resources-list">
          <a href="/profile/legal" className="resource-link">
            <FileText size={18} />
            <span>Conditions d'utilisation</span>
          </a>
          <a href="/profile/legal" className="resource-link">
            <FileText size={18} />
            <span>Politique de confidentialité</span>
          </a>
          <a href="/profile/legal" className="resource-link">
            <FileText size={18} />
            <span>Mentions légales</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Help

