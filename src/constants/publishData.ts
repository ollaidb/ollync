import { Users, Briefcase, Wrench, ShoppingBag, Target, MoreHorizontal, MessageCircle } from 'lucide-react'

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
    id: 'role',
    name: 'Rôle',
    slug: 'role',
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
        id: 'figurant',
        name: 'Figurant',
        slug: 'figurant'
      },
      {
        id: 'modele',
        name: 'Modèle',
        slug: 'modele'
      },
      {
        id: 'live',
        name: 'Live',
        slug: 'live'
      },
      {
        id: 'micro-trottoir',
        name: 'Micro trottoir',
        slug: 'micro-trottoir'
      },
      {
        id: 'montage-video',
        name: 'Montage Vidéo',
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
        id: 'associer',
        name: 'Associer',
        slug: 'associer'
      },
      {
        id: 'creer-equipe',
        name: 'Créer une équipe',
        slug: 'creer-equipe'
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
        id: 'prestation',
        name: 'Prestation',
        slug: 'prestation'
      },
      {
        id: 'echange-de-services',
        name: 'Échange de services',
        slug: 'echange-de-services'
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
        id: 'compte',
        name: 'Compte',
        slug: 'compte'
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
        id: 'depot',
        name: 'Dépôt',
        slug: 'depot'
      },
      {
        id: 'verification',
        name: 'Vérification',
        slug: 'verification'
      }
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    slug: 'communication',
    icon: MessageCircle,
    color: '#00bcd4',
    description: 'Services de communication',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'langue',
        name: 'Langue',
        slug: 'langue'
      },
      {
        id: 'debat',
        name: 'Débat',
        slug: 'debat'
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
        id: 'assistance',
        name: 'Assistance',
        slug: 'assistance'
      }
    ]
  }
]

