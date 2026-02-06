import { Camera, Scissors, Users, Briefcase, Wrench, ShoppingBag, Building2 } from 'lucide-react'

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

// Ordre des catégories : Création de contenu, Casting, Emploi, Studio & lieu, Projet, Services, Vente, Poste/Service
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
      },
      {
        id: 'live',
        name: 'Live',
        slug: 'live'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre'
      }
    ]
  },
  {
    id: 'casting-role',
    name: 'Casting/Roles',
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
      },
      {
        id: 'youtube-video',
        name: 'YouTube vidéo',
        slug: 'youtube-video'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre'
      }
    ]
  },
  {
    id: 'emploi',
    name: 'Emploi',
    slug: 'emploi',
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
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre'
      }
    ]
  },
  {
    id: 'studio-lieu',
    name: 'Studio/Lieu',
    slug: 'studio-lieu',
    icon: Building2,
    color: '#f59e0b',
    description: 'Trouver un studio ou un lieu pour vos shootings et tournages',
    subcategories: [
      {
        id: 'studio-creation',
        name: 'Studio de création',
        slug: 'studio-creation'
      },
      {
        id: 'lieux-residentiels',
        name: 'Lieux résidentiels',
        slug: 'lieux-residentiels'
      },
      {
        id: 'lieux-professionnels',
        name: 'Lieux professionnels',
        slug: 'lieux-professionnels'
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
        id: 'projet-emission',
        name: 'Émission',
        slug: 'projet-emission'
      },
      {
        id: 'projet-newsletter',
        name: 'Newsletter',
        slug: 'projet-newsletter'
      },
      {
        id: 'projet-interview',
        name: 'Interview',
        slug: 'projet-interview'
      },
      {
        id: 'projet-podcast',
        name: 'Podcast',
        slug: 'projet-podcast'
      },
      {
        id: 'projet-youtube',
        name: 'Chaîne YouTube',
        slug: 'projet-youtube'
      },
      {
        id: 'projet-magazine',
        name: 'Magazine',
        slug: 'projet-magazine'
      },
      {
        id: 'projet-blog',
        name: 'Blog',
        slug: 'projet-blog'
      },
      {
        id: 'projet-media',
        name: 'Média',
        slug: 'projet-media'
      },
      {
        id: 'autre',
        name: 'Autre',
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
        id: 'agence',
        name: 'Agence',
        slug: 'agence'
      },
      {
        id: 'setup-materiel',
        name: 'Setup matériel',
        slug: 'setup-materiel'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre'
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
        id: 'gorille',
        name: 'Matériel',
        slug: 'gorille'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre'
      }
    ]
  },
  {
    id: 'poste-service',
    name: 'Poste/Service',
    slug: 'poste-service',
    icon: Briefcase,
    color: '#f97316',
    description: 'Poste/Service : prestations, food, lieux et autres besoins',
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
        id: 'food',
        name: 'Food',
        slug: 'food'
      },
      {
        id: 'lieux',
        name: 'Lieux',
        slug: 'lieux'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre'
      }
    ]
  }
]
