import { Camera, Scissors, Users, Wrench, ShoppingBag, Building2, Calendar } from 'lucide-react'

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
  description?: string
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

// Ordre des catégories : Création de contenu, Casting, Emploi, Lieu, Service/Mission, Événement, Vente
export const publicationTypes: PublicationType[] = [
  {
    id: 'creation-contenu',
    name: 'Création de contenu',
    slug: 'creation-contenu',
    icon: Camera,
    color: '#667eea',
    description:
      'Créer du contenu ensemble ou se faire aider : photos, vidéos, vlogs, sketchs, trends, lives ou événements',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'photo',
        name: 'Photo',
        slug: 'photo',
        description:
          'Se faire photographier ou photographier quelqu’un : photos naturelles, Insta, soirée, anniversaire, souvenirs, photos surprises.'
      },
      {
        id: 'video',
        name: 'Vidéo',
        slug: 'video',
        description:
          'Se faire filmer, filmer quelqu’un ou créer à plusieurs (vlog, trends, sketchs) : contenus simples, face-cam, playback, duo, podcasts, interviews, événements, snap.'
      },
      {
        id: 'live',
        name: 'Live',
        slug: 'live',
        description:
          'Animer un live à deux ou échanger sur un sujet précis (débat, discussion, partage d’avis, co-animation).'
      },
      {
        id: 'interview-emission',
        name: 'Interview/Émission',
        slug: 'interview-emission',
        description:
          'Créer une série d’interviews ou une émission en collaboration'
      },
      {
        id: 'podcast',
        name: 'Podcast',
        slug: 'podcast',
        description:
          'Lancer un podcast avec des profils complémentaires'
      },
      {
        id: 'ugc',
        name: 'UGC',
        slug: 'ugc',
        description:
          'Créer du contenu UGC (User Generated Content) : vidéos courtes, témoignages, tests produit pour les marques'
      },
      {
        id: 'court-metrage',
        name: 'Court-métrage',
        slug: 'court-metrage',
        description:
          'Créer un court-métrage en collaboration'
      },
      {
        id: 'media',
        name: 'Média',
        slug: 'media',
        description:
          'Créer un média en collaboration'
      },
      {
        id: 'newsletter',
        name: 'Newsletter/Magazine/Blog',
        slug: 'newsletter',
        description:
          'Collaborer pour lancer une newsletter, un magazine ou un blog'
      },
      {
        id: 'chaine-youtube',
        name: 'Chaîne YouTube',
        slug: 'chaine-youtube',
        description:
          'Collaborer pour une chaîne YouTube'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  },
  {
    id: 'casting-role',
    name: 'Casting',
    slug: 'casting-role',
    icon: Users,
    color: '#2196f3',
    description:
      'Trouver des personnes pour jouer dans un projet (figurants, rôles, comédie, tournage, contenu créatif)',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'figurant',
        name: 'Figurant',
        slug: 'figurant',
        description:
          'Rechercher des figurants pour apparaître dans un projet (vidéo, comédie, clip, tournage, contenu créatif)'
      },
      {
        id: 'modele-photo',
        name: 'Modèle photo',
        slug: 'modele-photo',
        description:
          'Trouver des modèles pour des photos de projet ou de mise en valeur (make-up, coiffure, ongles, skincare, vêtements, chaussures, sport, lifestyle, animaux, etc.)'
      },
      {
        id: 'modele-video',
        name: 'Modèle vidéo',
        slug: 'modele-video',
        description:
          'Trouver des modèles pour apparaître dans des vidéos ou clips (présentation produit, mise en scène, contenu créatif, visage de marque, animation de compte, etc.)'
      },
      {
        id: 'voix-off',
        name: 'Voix off',
        slug: 'voix-off',
        description:
          'Rechercher une voix pour narrer, présenter ou poser un texte (pub, documentaire, story, vidéo explicative, intro, outro)'
      },
      {
        id: 'invite',
        name: 'Invité',
        slug: 'invite',
        description:
          'Trouver vos invités : podcast, documentaire, émission, YouTube, micro-trottoir'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories'
      }
    ]
  },
  {
    id: 'emploi',
    name: 'Emploi',
    slug: 'emploi',
    icon: Scissors,
    color: '#9c27b0',
    description: 'Métiers liés à la création de contenu (vidéo, photo, montage, community, etc.).',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'montage',
        name: 'Montage',
        slug: 'montage',
        description:
          'Chercher quelqu’un pour faire le montage de vidéos ou photos (formats courts, longues vidéos, retouches, assemblage complet).'
      },
      {
        id: 'micro-trottoir',
        name: 'micro-trottoir',
        slug: 'micro-trottoir',
        description:
          'Recruter une personne pour réaliser des micro-trottoirs (interviewer des gens dans la rue pour votre projet ou contenu).'
      },
      {
        id: 'community-manager',
        name: 'Community manager',
        slug: 'community-manager',
        description:
          'Gérer la communauté et les réseaux (planning, publications, engagement, réponses, animation).'
      },
      {
        id: 'live',
        name: 'live',
        slug: 'live',
        description:
          'Trouver quelqu’un pour animer des lives autour de vos produits, services ou contenus à promouvoir sur les réseaux.'
      },
      {
        id: 'ecriture-contenu',
        name: 'Écriture de contenu',
        slug: 'ecriture-contenu',
        description:
          'Trouver un(e) scénariste pour vos contenus : vidéos, publicités, courts-métrages, séries web, storytelling de marque.'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  },
  {
    id: 'studio-lieu',
    name: 'Lieu',
    slug: 'studio-lieu',
    icon: Building2,
    color: '#f59e0b',
    description: 'Des lieux pour créer du contenu (shooting, tournage, décor, espaces adaptés).',
    subcategories: [
      {
        id: 'lieu-loisirs',
        name: 'Lieu de loisirs',
        slug: 'lieu-loisirs',
        description:
          'Tout ce qui est lieu de loisirs: restaurant, cinema, hotel, boite de nuit, etc.'
      },
      {
        id: 'lieu-bien-etre',
        name: 'Lieu de bien-etre',
        slug: 'lieu-bien-etre',
        description:
          'Prestation de service: ongles, maquillage, coiffure, massage, etc.'
      },
      {
        id: 'lieux-residentiels',
        name: 'Lieux résidentiels',
        slug: 'lieux-residentiels',
        description:
          'Louer un appartement ou une maison pour quelques heures afin de créer du contenu dans un cadre réel.'
      },
      {
        id: 'lieux-professionnels',
        name: 'Lieux professionnels',
        slug: 'lieux-professionnels',
        description:
          'Louer un espace professionnel pour produire du contenu (bureaux, salles de réunion, conférences, lives, interviews).'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  },
  {
    id: 'services',
    name: 'Service/Mission',
    slug: 'services',
    icon: Wrench,
    color: '#43e97b',
    description:
      'Proposer ou chercher des services dans la création de contenu (coaching contenu, branding, développement business, animation de compte).',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'coaching-contenu',
        name: 'Coaching contenu',
        slug: 'coaching-contenu',
        description:
          'Coaching pour la création de contenu et la direction artistique (idées, formats, publication, rythme, optimisation du compte, organisation, analyse de profil, setup matériel, aisance caméra).'
      },
      {
        id: 'agence',
        name: 'Développement business',
        slug: 'agence',
        description:
          'Développement business pour les créateurs (partenariats, monétisation, opportunités).'
      },
      {
        id: 'branding',
        name: 'Branding',
        slug: 'branding',
        description:
          'Construire l’image de marque d’un créateur (identité, positionnement, cohérence visuelle, stratégie éditoriale, proposition d’idées).'
      },
      {
        id: 'animation-compte',
        name: 'Animation de compte',
        slug: 'animation-compte',
        description:
          'Visage de marque, gestion et publication régulière de contenu sur un compte pour faire vivre la marque dans le temps.'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  },
  {
    id: 'evenements',
    name: 'Événement',
    slug: 'evenements',
    icon: Calendar,
    color: '#06b6d4',
    description: 'Participer ou proposer des événements créatifs (masterclass, conférence, débat, atelier).',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'masterclass',
        name: 'Masterclass',
        slug: 'masterclass',
        description:
          'Participer à une masterclass ou en proposer une autour de la création de contenu.'
      },
      {
        id: 'conference',
        name: 'Conférence',
        slug: 'conference',
        description:
          'Trouver ou proposer une conférence autour des médias, réseaux sociaux et création de contenu.'
      },
      {
        id: 'debat',
        name: 'Débat',
        slug: 'debat',
        description:
          'Organiser ou rejoindre un débat sur un sujet de création de contenu.'
      },
      {
        id: 'atelier',
        name: 'Atelier',
        slug: 'atelier',
        description:
          'Proposer ou rejoindre un atelier pratique (tournage, montage, stratégie, storytelling, etc.).'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  },
  {
    id: 'vente',
    name: 'Vente',
    slug: 'vente',
    icon: ShoppingBag,
    color: '#f093fb',
    description:
      'Acheter ou vendre (comptes, matériel).',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'comptes',
        name: 'Comptes',
        slug: 'comptes',
        description:
          'Vendre un compte déjà créé avec son audience, son thème ou son historique.'
      },
      {
        id: 'gorille',
        name: 'Matériel',
        slug: 'gorille',
        description:
          'Caméra, micro, éclairage, téléphone, fond, setup...'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  }
]
