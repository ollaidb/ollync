/**
 * Gère le stockage local des IDs de posts vus (annonces déjà ouvertes).
 * L'icône œil s'affiche sur les cartes quand l'utilisateur a déjà cliqué pour voir l'annonce.
 */

const STORAGE_KEY = 'ollync-viewed-posts'
const MAX_IDS = 500

function getStoredIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** Vérifie si un post a déjà été vu */
export function isPostViewed(postId: string): boolean {
  return getStoredIds().includes(postId)
}

/** Marque un post comme vu (appelé quand l'utilisateur ouvre la page détail) */
export function markPostAsViewed(postId: string): void {
  if (!postId || typeof postId !== 'string') return
  const ids = getStoredIds()
  if (ids.includes(postId)) return
  const next = [postId, ...ids].slice(0, MAX_IDS)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('ollync-post-viewed', { detail: { postId } }))
  } catch {
    // localStorage full or unavailable
  }
}
