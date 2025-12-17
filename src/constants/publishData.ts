import { Camera, Scissors, Users, Briefcase, Wrench, ShoppingBag } from 'lucide-react'

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

// Ordre des catégories : Création de contenu, Casting, Emploi, Projet, Services, Vente
export const publicationTypes: PublicationType[] = [
  {
    id: 'creation-contenu',
    name: 'Création de contenu',
    slug: 'creation-contenu',
    icon: Camera,
    color: '#667eea',
    description: 'Créer du contenu : photos, vidéos, vlogs, sketchs, trends, événements',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'photo',
        name: 'Photo',
        slug: 'photo'
      },
      {
        id: 'video',
        name: 'Vidéo',
        slug: 'video'
      },
      {
        id: 'vlog',
        name: 'Vlog',
        slug: 'vlog'
      },
      {
        id: 'sketchs',
        name: 'Sketchs',
        slug: 'sketchs'
      },
      {
        id: 'trends',
        name: 'Trends',
        slug: 'trends'
      },
      {
        id: 'evenements',
        name: 'Événements',
        slug: 'evenements'
      }
    ]
  },
  {
    id: 'casting-role',
    name: 'Casting',
    slug: 'casting-role',
    icon: Users,
    color: '#2196f3',
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
        id: 'modele-photo',
        name: 'Modèle photo',
        slug: 'modele-photo'
      },
      {
        id: 'modele-video',
        name: 'Modèle vidéo',
        slug: 'modele-video'
      },
      {
        id: 'voix-off',
        name: 'Voix off',
        slug: 'voix-off'
      },
      {
        id: 'invite-podcast',
        name: 'Invité podcast',
        slug: 'invite-podcast'
      },
      {
        id: 'invite-micro-trottoir',
        name: 'Invité micro-trottoir',
        slug: 'invite-micro-trottoir'
      }
    ]
  },
  {
    id: 'montage',
    name: 'Emploi',
    slug: 'montage',
    icon: Scissors,
    color: '#9c27b0',
    description: 'Emploi : montage, micro-trottoir, live, écriture de contenu',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'montage',
        name: 'Montage',
        slug: 'montage'
      },
      {
        id: 'micro-trottoir',
        name: 'micro-trottoir',
        slug: 'micro-trottoir'
      },
      {
        id: 'live',
        name: 'live',
        slug: 'live'
      },
      {
        id: 'ecriture-contenu',
        name: 'Écriture de contenu',
        slug: 'ecriture-contenu'
      }
    ]
  },
  {
    id: 'projets-equipe',
    name: 'Projet',
    slug: 'projets-equipe',
    icon: Briefcase,
    color: '#4facfe',
    description: 'Trouver un associé, un collaborateur ou rejoindre un projet',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'recherche-equipe',
        name: 'Recherche équipe',
        slug: 'recherche-equipe'
      },
      {
        id: 'projet-media',
        name: 'media',
        slug: 'projet-media'
      },
      {
        id: 'projet-youtube',
        name: 'YouTube',
        slug: 'projet-youtube'
      },
      {
        id: 'projet-podcast',
        name: 'Podcast',
        slug: 'projet-podcast'
      },
      {
        id: 'projet-documentaire',
        name: 'documentaire',
        slug: 'projet-documentaire'
      },
      {
        id: 'autre',
        name: 'autre',
        slug: 'autre'
      }
    ]
  },
  {
    id: 'services',
    name: 'Services',
    slug: 'services',
    icon: Wrench,
    color: '#43e97b',
    description: 'Services pour créateurs : coaching, stratégie, organisation, setup',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'coaching-contenu',
        name: 'Coaching contenu',
        slug: 'coaching-contenu'
      },
      {
        id: 'strategie-editoriale',
        name: 'Stratégie éditoriale',
        slug: 'strategie-editoriale'
      },
      {
        id: 'organisation',
        name: 'Organisation',
        slug: 'organisation'
      },
      {
        id: 'setup-materiel',
        name: 'Setup matériel',
        slug: 'setup-materiel'
      },
      {
        id: 'aide-live-moderation',
        name: 'Aide Live / Modération',
        slug: 'aide-live-moderation'
      }
    ]
  },
  {
    id: 'vente',
    name: 'Vente',
    slug: 'vente',
    icon: ShoppingBag,
    color: '#f093fb',
    description: 'Vente de comptes, noms d\'utilisateur, concepts et packs pour créateurs',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'comptes',
        name: 'Comptes',
        slug: 'comptes'
      },
      {
        id: 'noms-utilisateur',
        name: 'Noms d\'utilisateur',
        slug: 'noms-utilisateur'
      },
      {
        id: 'concepts-niches',
        name: 'Concepts / Niches',
        slug: 'concepts-niches'
      },
      {
        id: 'pack-compte-contenu',
        name: 'Pack compte + contenu',
        slug: 'pack-compte-contenu'
      }
    ]
  }
]

