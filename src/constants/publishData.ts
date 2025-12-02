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
  subcategories: Subcategory[]
}

export const publicationTypes: PublicationType[] = [
  {
    id: 'match',
    name: 'Match',
    slug: 'match',
    icon: Users,
    color: '#667eea',
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
        id: 'evenement',
        name: 'Événement',
        slug: 'evenement'
      }
    ]
  },
  {
    id: 'recrutement',
    name: 'Recrutement',
    slug: 'recrutement',
    icon: Briefcase,
    color: '#9c27b0',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'job',
        name: 'Job',
        slug: 'job'
      },
      {
        id: 'freelance',
        name: 'Freelance',
        slug: 'freelance'
      },
      {
        id: 'stage-alternance',
        name: 'Stage / Alternance',
        slug: 'stage-alternance'
      }
    ]
  },
  {
    id: 'projet',
    name: 'Projet',
    slug: 'projet',
    icon: Briefcase,
    color: '#2196f3',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'associer-collaboration',
        name: 'Associer / Collaboration',
        slug: 'associer-collaboration'
      }
    ]
  },
  {
    id: 'service',
    name: 'Service',
    slug: 'service',
    icon: Wrench,
    color: '#4facfe',
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
        id: 'vente-compte',
        name: 'Vente de comptes',
        slug: 'vente-compte'
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
        id: 'chauffeur',
        name: 'Chauffeur',
        slug: 'chauffeur'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre'
      }
    ]
  },
  {
    id: 'autre',
    name: 'Autre',
    slug: 'autre',
    icon: MoreHorizontal,
    color: '#ffa726',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      }
    ]
  }
]

