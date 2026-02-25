import { sanitizeUserHtml } from '../utils/sanitizeHtml'

interface SanitizedHtmlProps {
  /** HTML d’origine (contenu utilisateur). Sera sanitized avant affichage. */
  html: string
  /** Élément utilisé pour le rendu (défaut: div). */
  as?: 'div' | 'span'
  /** Classes CSS optionnelles. */
  className?: string
}

/**
 * Affiche du HTML utilisateur de façon sûre en le passant par DOMPurify.
 * À utiliser pour tout contenu utilisateur rendu en HTML (descriptions d’annonces, bio, messages, etc.).
 * Ne pas utiliser pour les textes statiques de l’app.
 */
export function SanitizedHtml({ html, as: Tag = 'div', className }: SanitizedHtmlProps) {
  const sanitized = sanitizeUserHtml(html)
  if (!sanitized) return null
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
