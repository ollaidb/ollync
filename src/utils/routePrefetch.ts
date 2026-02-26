/**
 * Préchargement des chunks de routes pour affichage immédiat au clic.
 * Même chemins que les lazy() dans App.tsx pour réutiliser le cache du bundler.
 */

const prefetchers: Record<string, () => Promise<unknown>> = {
  '/home': () => import('../pages/Home'),
  '/feed': () => import('../pages/Feed'),
  '/favorites': () => import('../pages/Favorites'),
  '/likes': () => import('../pages/Favorites'),
  '/publish': () => import('../pages/Publish'),
  '/publier-annonce': () => import('../pages/Publish'),
  '/messages': () => import('../pages/Messages'),
  '/profile': () => import('../pages/Profile'),
  '/search': () => import('../pages/Search'),
  '/notifications': () => import('../pages/Notifications'),
  '/creation-contenu': () => import('../pages/CreationContenu'),
  '/emploi': () => import('../pages/Emploi'),
  '/casting-role': () => import('../pages/CastingRole'),
  '/studio-lieu': () => import('../pages/StudioLieu'),
  '/services': () => import('../pages/Service'),
  '/evenements': () => import('../pages/Evenements'),
  '/vente': () => import('../pages/Vente'),
  '/swipe': () => import('../pages/SwipePage'),
  '/post': () => import('../pages/PostDetails'),
  '/recent': () => import('../pages/RecentPosts'),
  '/urgent': () => import('../pages/UrgentPosts')
}

const prefetched = new Set<string>()

export function prefetchRoute(pathname: string): void {
  const path = pathname.split('/').slice(0, 2).join('/') || '/'
  const toPrefetch = path === '/' ? '/home' : path
  if (prefetched.has(toPrefetch)) return
  const fn = prefetchers[toPrefetch]
  if (fn) {
    prefetched.add(toPrefetch)
    fn().catch(() => { prefetched.delete(toPrefetch) })
  }
}

/** Routes du footer + notifications, préchargées au démarrage */
export const mainNavPaths = ['/home', '/favorites', '/publish', '/messages', '/profile', '/notifications']
