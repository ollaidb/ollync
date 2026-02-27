/**
 * Dispatche un événement pour faire défiler la page d'accueil vers le haut
 * (affichage des catégories). Utilisé par le logo, le nom de l'app et l'icône Accueil.
 */
export const SCROLL_HOME_TOP_EVENT = 'ollync:scrollHomeToTop'

export function scrollToHomeTop(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SCROLL_HOME_TOP_EVENT))
  }
}
