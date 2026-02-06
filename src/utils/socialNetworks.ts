/**
 * Configuration des réseaux sociaux - Liste simple sans descriptions
 */

export interface SocialNetworkOption {
  id: string
  name: string
}

export const SOCIAL_NETWORKS_CONFIG: SocialNetworkOption[] = [
  { id: 'tiktok', name: 'TikTok' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'twitter', name: 'Twitter' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'snapchat', name: 'Snapchat' },
  { id: 'pinterest', name: 'Pinterest' },
  { id: 'twitch', name: 'Twitch' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'discord', name: 'Discord' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'autre', name: 'Autre' }
]

export const getSocialNetworkName = (networkId: string): string | undefined => {
  return SOCIAL_NETWORKS_CONFIG.find(network => network.id === networkId)?.name
}
