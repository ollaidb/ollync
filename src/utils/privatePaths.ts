/**
 * Indique si un pathname correspond à une page "privée" (nécessite une session).
 * Utilisé pour rediriger vers /auth/login avec returnTo quand la session expire.
 */
export function isPrivatePath(pathname: string): boolean {
  if (!pathname || pathname === '/') return false
  if (pathname.startsWith('/messages')) return true
  if (pathname.startsWith('/notifications')) return true
  if (pathname === '/favorites' || pathname === '/likes') return true
  if (pathname.startsWith('/publish') || pathname === '/publier-annonce') return true
  if (pathname.startsWith('/moderation')) return true
  // /profile et tout sous-chemin sauf /profile/public et /profile/public/*
  if (pathname === '/profile') return true
  if (pathname.startsWith('/profile/') && !pathname.startsWith('/profile/public')) return true
  return false
}
