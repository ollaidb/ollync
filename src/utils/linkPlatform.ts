/**
 * Détecte la plateforme (réseau social ou site) à partir d'une URL
 * pour afficher la bonne icône (Instagram, TikTok, LinkedIn, etc.)
 */

export type LinkPlatform =
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'facebook'
  | 'twitter'
  | 'website'

export function getLinkPlatform(url: string): LinkPlatform {
  try {
    const trimmed = (url || '').trim().toLowerCase()
    if (!trimmed) return 'website'
    const href = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    const host = new URL(href).hostname.replace(/^www\./, '')
    if (host.includes('instagram.com')) return 'instagram'
    if (host.includes('tiktok.com')) return 'tiktok'
    if (host.includes('linkedin.com')) return 'linkedin'
    if (host.includes('facebook.com') || host.includes('fb.com') || host.includes('fb.me')) return 'facebook'
    if (host.includes('twitter.com') || host.includes('x.com')) return 'twitter'
    return 'website'
  } catch {
    return 'website'
  }
}
