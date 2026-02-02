import { useTranslation } from 'react-i18next'
import './LegalPage.css'

const MentionsLegales = () => {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')
  const dateLocale = isEnglish ? 'en-US' : 'fr-FR'

  const content = isEnglish
    ? {
        title: 'Legal notice',
        updatedLabel: 'Last updated:',
        editorTitle: 'Publisher',
        editorLines: [
          'Ollync',
          'Legal form: [To be completed]',
          'Share capital: [To be completed]',
          'Registered office: [To be completed]',
          'SIRET: [To be completed]',
          'Email: contact@ollync.com',
          'Phone: +33 1 XX XX XX XX',
          'Publication director: [To be completed]'
        ],
        hostingTitle: 'Hosting',
        hostingLines: [
          'This site is hosted by Supabase',
          'Address: [To be completed]',
          'More information: https://supabase.com'
        ],
        intellectualTitle: 'Intellectual property',
        intellectualParagraphs: [
          'All content on this site is protected by French and international copyright and intellectual property laws. All rights of reproduction are reserved, including for downloadable documents and iconographic and photographic representations.',
          'Any reproduction of all or part of this site on any electronic medium is strictly prohibited without the publisher’s express permission.'
        ],
        responsibilityTitle: 'Liability',
        responsibilityParagraphs: [
          'The information contained on this site is as accurate as possible and the site is updated at different times of the year, but it may nevertheless contain inaccuracies, omissions, or gaps.',
          'Ollync cannot be held liable for any direct or indirect damage caused to the user’s equipment when accessing the site, resulting either from the use of equipment that does not meet specifications or from the appearance of a bug or incompatibility.'
        ],
        cnilTitle: 'Data protection (CNIL)',
        cnilParagraphs: [
          'In accordance with the French “Informatique et Libertés” law of January 6, 1978 as amended, and the General Data Protection Regulation (GDPR), you have the right to access, modify, and delete data concerning you.',
          'You can exercise this right by contacting us at: contact@ollync.com'
        ],
        lawTitle: 'Applicable law',
        lawParagraphs: [
          'This website is governed by French law. In the event of a dispute and failing an amicable agreement, the dispute will be brought before French courts in accordance with applicable rules of jurisdiction.'
        ]
      }
    : {
        title: 'Mentions légales',
        updatedLabel: 'Dernière mise à jour :',
        editorTitle: 'Éditeur',
        editorLines: [
          'Ollync',
          'Forme juridique : [À compléter]',
          'Capital social : [À compléter]',
          'Siège social : [À compléter]',
          'SIRET : [À compléter]',
          'Email : contact@ollync.com',
          'Téléphone : +33 1 XX XX XX XX',
          'Directeur de publication : [À compléter]'
        ],
        hostingTitle: 'Hébergement',
        hostingLines: [
          'Ce site est hébergé par Supabase',
          'Adresse : [À compléter]',
          "Pour plus d'informations : https://supabase.com"
        ],
        intellectualTitle: 'Propriété intellectuelle',
        intellectualParagraphs: [
          "L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.",
          "La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse de l'éditeur."
        ],
        responsibilityTitle: 'Responsabilité',
        responsibilityParagraphs: [
          "Les informations contenues sur ce site sont aussi précises que possible et le site est mis à jour à différentes périodes de l'année, mais peut toutefois contenir des inexactitudes, des omissions ou des lacunes.",
          "Ollync ne pourra être tenu responsable de tout dommage direct ou indirect causé au matériel de l'utilisateur, lors de l'accès au site, et résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications, soit de l'apparition d'un bug ou d'une incompatibilité."
        ],
        cnilTitle: 'CNIL',
        cnilParagraphs: [
          'Conformément à la loi "Informatique et Libertés" du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD), vous disposez d\'un droit d\'accès, de modification et de suppression des données qui vous concernent.',
          "Vous pouvez exercer ce droit en nous contactant à l'adresse : contact@ollync.com"
        ],
        lawTitle: 'Loi applicable',
        lawParagraphs: [
          "Le présent site est régi par la loi française. En cas de litige et à défaut d'accord amiable, le litige sera porté devant les tribunaux français conformément aux règles de compétence en vigueur."
        ]
      }

  return (
    <div className="legal-detail-page">
      <div className="legal-detail-section">
        <div className="legal-detail-content">
          <div className="legal-detail-update">
            <strong>{content.updatedLabel}</strong> {new Date().toLocaleDateString(dateLocale)}
          </div>

          <h4>{content.editorTitle}</h4>
          <p>
            {content.editorLines.map((line, index) => (
              <span key={line}>
                {index === 0 ? <strong>{line}</strong> : line}
                <br />
              </span>
            ))}
          </p>

          <h4>{content.hostingTitle}</h4>
          <p>
            {content.hostingLines.map((line, index) => (
              <span key={line}>
                {line}
                {index < content.hostingLines.length - 1 && <br />}
              </span>
            ))}
          </p>

          <h4>{content.intellectualTitle}</h4>
          {content.intellectualParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.responsibilityTitle}</h4>
          {content.responsibilityParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.cnilTitle}</h4>
          {content.cnilParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <h4>{content.lawTitle}</h4>
          {content.lawParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MentionsLegales

