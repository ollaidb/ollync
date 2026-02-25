import DOMPurify from 'dompurify'

/**
 * Liste de balises autorisées pour le contenu utilisateur (descriptions, bio, messages, etc.).
 * Formatage minimal : paragraphes, retours à la ligne, gras/italique, liens.
 */
const USER_CONTENT_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'a',
  'ul',
  'ol',
  'li',
  'span'
] as const

/**
 * Attributs autorisés (ex. pour <a href="..." title="...">).
 */
const USER_CONTENT_ALLOWED_ATTR = ['href', 'title', 'target', 'rel']

/**
 * Sanitize du HTML utilisateur avant injection dans le DOM.
 * À utiliser pour tout contenu saisi ou affiché par des utilisateurs (annonces, bio, messages, etc.).
 * Ne pas utiliser pour les textes statiques de l'application.
 */
export function sanitizeUserHtml(html: string): string {
  if (typeof html !== 'string') return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...USER_CONTENT_ALLOWED_TAGS],
    ALLOWED_ATTR: USER_CONTENT_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'] // pour forcer target="_blank" rel="noopener noreferrer" sur les liens si besoin côté composant
  })
}
