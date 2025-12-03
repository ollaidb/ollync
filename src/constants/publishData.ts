import { Users, Briefcase, Wrench, ShoppingBag, Target, MoreHorizontal } from 'lucide-react'

export interface Platform {
  id: string
  name: string
  icon?: string
}

export interface Option {
  id: string
  name: string
  platforms?: Platform[]
}

export interface Subcategory {
  id: string
  name: string
  slug: string
  options?: Option[]
}

export interface PublicationType {
  id: string
  name: string
  slug: string
  icon: typeof Users
  color: string
  description: string
  subcategories: Subcategory[]
}

export const publicationTypes: PublicationType[] = [
  {
    id: 'match',
    name: 'Match',
    slug: 'match',
    icon: Users,
    color: '#667eea',
    description: 'Rencontres utiles : créatif, social ou événementiel',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'creation-contenu',
        name: 'Création de contenu',
        slug: 'creation-contenu',
        options: [
          {
            id: 'photo',
            name: 'Photo',
            platforms: [
              { id: 'instagram', name: 'Instagram' },
              { id: 'tiktok', name: 'TikTok' },
              { id: 'linkedin', name: 'LinkedIn' }
            ]
          },
          {
            id: 'video',
            name: 'Vidéo',
            platforms: [
              { id: 'instagram', name: 'Instagram' },
              { id: 'tiktok', name: 'TikTok' },
              { id: 'youtube', name: 'YouTube' }
            ]
          }
        ]
      },
      {
        id: 'plus-one',
        name: 'Plus One',
        slug: 'plus-one'
      },
      {
        id: 'evenements',
        name: 'Événements',
        slug: 'evenements'
      }
    ]
  },
  {
    id: 'recrutement',
    name: 'Recrutement',
    slug: 'recrutement',
    icon: Briefcase,
    color: '#9c27b0',
    description: 'Trouver des profils pour un projet ou une production',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'modele',
        name: 'Modèles',
        slug: 'modele'
      },
      {
        id: 'figurant',
        name: 'Figurants',
        slug: 'figurant'
      },
      {
        id: 'live',
        name: 'Live',
        slug: 'live'
      },
      {
        id: 'vlog',
        name: 'Vlog',
        slug: 'vlog'
      },
      {
        id: 'copywriting',
        name: 'Copywriting',
        slug: 'copywriting'
      },
      {
        id: 'montage-video',
        name: 'Montage vidéo',
        slug: 'montage-video'
      }
    ]
  },
  {
    id: 'projet',
    name: 'Projet',
    slug: 'projet',
    icon: Briefcase,
    color: '#2196f3',
    description: 'Trouver un associé, un collaborateur ou rejoindre un projet',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'association-collaboration',
        name: 'Association / Collaboration',
        slug: 'association-collaboration'
      }
    ]
  },
  {
    id: 'service',
    name: 'Service',
    slug: 'service',
    icon: Wrench,
    color: '#4facfe',
    description: 'Échange de compétences, petites tâches, formations',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'echange-service',
        name: 'Échange de service',
        slug: 'echange-service'
      },
      {
        id: 'taches',
        name: 'Tâches',
        slug: 'taches'
      },
      {
        id: 'formation',
        name: 'Formation',
        slug: 'formation'
      }
    ]
  },
  {
    id: 'vente',
    name: 'Vente',
    slug: 'vente',
    icon: ShoppingBag,
    color: '#f093fb',
    description: 'Achat, échange ou don',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'echange',
        name: 'Échange',
        slug: 'echange'
      },
      {
        id: 'vente-comptes',
        name: 'Vente de comptes',
        slug: 'vente-comptes'
      },
      {
        id: 'don',
        name: 'Don',
        slug: 'don'
      }
    ]
  },
  {
    id: 'mission',
    name: 'Mission',
    slug: 'mission',
    icon: Target,
    color: '#43e97b',
    description: 'Livraison, vérification, cuisine',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'livraison',
        name: 'Livraison',
        slug: 'livraison'
      },
      {
        id: 'verification',
        name: 'Vérification',
        slug: 'verification'
      },
      {
        id: 'cuisine',
        name: 'Cuisine',
        slug: 'cuisine'
      }
    ]
  },
  {
    id: 'autre',
    name: 'Autre',
    slug: 'autre',
    icon: MoreHorizontal,
    color: '#ffa726',
    description: 'Autres services',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'autre-service',
        name: 'Autre service',
        slug: 'autre-service'
      }
    ]
  }
]

