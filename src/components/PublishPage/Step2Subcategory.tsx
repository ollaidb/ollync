import { PublicationType } from '../../constants/publishData'

export interface ExamplePost {
  id: string
  title?: string
  description?: string
  images?: string[] | null
  is_urgent?: boolean | null
  user_id?: string | null
  user?: { username?: string | null; full_name?: string | null; avatar_url?: string | null } | null
  category?: { name: string; slug: string } | null
}
import { Heart } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import './Step2Subcategory.css'

interface Step2SubcategoryProps {
  selectedCategory: PublicationType | null
  listingType?: 'offer' | 'request' | ''
  onSelectSubcategory: (subcategoryId: string) => void
  examplePosts: ExamplePost[]
  loadingPosts: boolean
}

export const Step2Subcategory = ({ 
  selectedCategory, 
  listingType,
  onSelectSubcategory,
  examplePosts,
  loadingPosts 
}: Step2SubcategoryProps) => {
  const navigate = useNavigate()
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})
  const isMobile = useIsMobile()
  
  if (!selectedCategory) return null

  const Icon = selectedCategory.icon
  
  const handleProfileClick = (e: React.MouseEvent, userId?: string) => {
    e.stopPropagation()
    if (userId) {
      navigate(`/profile/${userId}`)
    }
  }

  const toggleDescription = (e: React.MouseEvent, subcategoryId: string) => {
    e.stopPropagation()
    setExpandedDescriptions((prev) => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId]
    }))
  }

  const getPreviewText = (text: string, wordLimit: number) => {
    const words = text.trim().split(/\s+/)
    if (words.length <= wordLimit) return { preview: text, hasMore: false }
    return { preview: words.slice(0, wordLimit).join(' '), hasMore: true }
  }

  const getPreviewWithHalfWord = (text: string, baseWordLimit: number) => {
    const adjustedLimit = baseWordLimit + 2
    const { preview, hasMore } = getPreviewText(text, adjustedLimit)
    if (!hasMore) return { preview, hasMore }
    const words = text.trim().split(/\s+/)
    const nextWord = words[adjustedLimit] ?? ''
    if (!nextWord) return { preview, hasMore }
    const cutLength = Math.max(1, Math.floor(nextWord.length / 2))
    return { preview: `${preview} ${nextWord.slice(0, cutLength)}`, hasMore }
  }
  const getFirstSentence = (text: string) => {
    const match = text.match(/^.*?[.!?](\s|$)/)
    return match ? match[0].trim() : text
  }
  // Les libellés Offre/Demande sont swappés côté UI (offerTitle = "Demande", requestTitle = "Offre").
  // On aligne les descriptions sur l'intention affichée. Pour Emploi et Services/Mission, les rôles
  // sont inversés : on utilise donc listingType tel quel (pas de swap) pour ces catégories.
  const isEmploiOrServicesCategory = ['emploi', 'montage', 'recrutement', 'services', 'poste-service'].includes(selectedCategory?.slug ?? '')
  const listingTypeForDisplayedIntent = isEmploiOrServicesCategory
    ? (listingType || '')
    : (listingType === 'offer' ? 'request' : listingType === 'request' ? 'offer' : '')

  const getSubcategoryDescription = (subcategorySlug: string, fallback?: string) => {
    if (subcategorySlug === 'autre') return 'Soyez spécifique !'
    const categoryDescriptions: Record<
      string,
      Record<string, { offer?: string; request?: string; default?: string }>
    > = {
      'creation-contenu': {
        photo: {
          offer:
            'Photographier quelqu’un : photos naturelles, Insta, soirée, anniversaire.',
          request:
            'Se faire photographier : photos naturelles, Insta, soirée, anniversaire.'
        },
        video: {
          offer:
            'Filmer quelqu’un (vlog, trends, sketchs) : face-cam, playback, interview, événement.',
          request:
            'Se faire filmer (vlog, trends, sketchs) : face-cam, playback, interview, événement.'
        },
        live: {
          offer:
            'Animer un live à deux : débat, discussion, partage d’avis, co-animation.',
          request:
            'Chercher quelqu’un pour un live à deux : débat, discussion, partage d’avis, co-animation.'
        },
        'interview-emission': {
          offer:
            'Créer une série d’interviews ou une émission en collaboration.',
          request:
            'Créer une série d’interviews ou une émission en collaboration.'
        },
        podcast: {
          offer:
            'Lancer un podcast avec des profils complémentaires.',
          request:
            'Lancer un podcast avec des profils complémentaires.'
        },
        ugc: {
          offer:
            'Créer du contenu UGC : vidéos courtes, témoignages, tests produit pour les marques.',
          request:
            'Créer du contenu UGC : vidéos courtes, témoignages, tests produit pour les marques.'
        },
        'court-metrage': {
          offer:
            'Créer un court-métrage en collaboration.',
          request:
            'Créer un court-métrage en collaboration.'
        },
        media: {
          offer:
            'Créer un média en collaboration.',
          request:
            'Créer un média en collaboration.'
        },
        newsletter: {
          offer:
            'Collaborer pour lancer une newsletter, un magazine ou un blog.',
          request:
            'Collaborer pour lancer une newsletter, un magazine ou un blog.'
        },
        'chaine-youtube': {
          offer:
            'Collaborer pour une chaîne YouTube.',
          request:
            'Collaborer pour une chaîne YouTube.'
        }
      },
      services: {
        'coaching-contenu': {
          offer:
            'Idées, formats, rythme, direction artistique, organisation, analyse de profil, setup matériel, aisance caméra.',
          request:
            'Idées, formats, rythme, direction artistique, organisation, analyse de profil, setup matériel, aisance caméra.'
        },
        agence: {
          offer:
            'Partenariats, monétisation, opportunités.',
          request:
            'Partenariats, monétisation, opportunités.'
        },
        branding: {
          offer:
            'Identité visuelle, positionnement, cohérence, stratégie éditoriale, proposition d’idées.',
          request:
            'Identité visuelle, positionnement, cohérence, stratégie éditoriale, proposition d’idées.'
        },
        'animation-compte': {
          offer:
            'Visage de marque, publication, calendrier, engagement, suivi.',
          request:
            'Visage de marque, publication, calendrier, engagement, suivi.'
        }
      },
      'casting-role': {
        figurant: {
          offer: 'Court-métrage, clip, sketch...',
          request: 'Trouvez figurants, silhouettes, doublures...'
        },
        'modele-photo': {
          offer: 'Studio, extérieur, publicité, art...',
          request: 'Trouvez modèles pour projet, publicité, contenu...'
        },
        'modele-video': {
          offer: 'Fiction, documentaire, art. Présentation produit, mise en scène, contenu créatif, visage de marque, animation de compte...',
          request: 'Trouvez vos figurant(e)s. Présentation produit, mise en scène, contenu créatif, visage de marque, animation de compte...'
        },
        'voix-off': {
          offer: 'Fiction, documentaire, animation. Pub, story, vidéo explicative...',
          request: 'Trouvez des voix pour contenu. Pub, story, vidéo explicative...'
        },
        invite: {
          offer: 'Invités disponibles : podcast, documentaire, émission, YouTube, micro-trottoir.',
          request: 'Trouvez vos invités : podcast, documentaire, émission, YouTube, micro-trottoir.'
        }
      }
    }

    const custom = categoryDescriptions[selectedCategory?.slug || '']?.[subcategorySlug]
    if (!custom) return fallback
    if (listingTypeForDisplayedIntent && custom[listingTypeForDisplayedIntent]) {
      return custom[listingTypeForDisplayedIntent]
    }
    return custom.default || fallback
  }

  return (
    <div className="step2-subcategory">
      <h2 className="step-title">Choisissez une sous-catégorie</h2>
      <div className="subcategories-list">
        {selectedCategory.subcategories.map((subcategory) => {
          const description = getSubcategoryDescription(
            subcategory.slug,
            subcategory.description?.trim()
          )
          const isExpanded = isMobile || !!expandedDescriptions[subcategory.id]
          const wordLimitMap: Record<string, Record<string, number>> = {
            'creation-contenu': {
              live: 8,
              'interview-emission': 7,
              podcast: 6,
              ugc: 6,
              'court-metrage': 6,
              media: 7
            },
            'casting-role': {
              figurant: 5,
              'modele-photo': 6,
              'modele-video': 6,
              'voix-off': 6,
              invite: 6
            },
            emploi: {
              montage: 6,
              'micro-trottoir': 6,
              live: 6,
              'ecriture-contenu': 6
            },
            'studio-lieu': {
              'lieu-loisirs': 7,
              'lieu-bien-etre': 6,
              'lieux-residentiels': 7,
              'lieux-professionnels': 6
            },
            'projets-equipe': {
              'projet-newsletter': 6,
              'projet-youtube': 6,
              'projet-documentaire': 6
            },
            services: {
              'coaching-contenu': 8,
              agence: 6,
              branding: 7
            },
            vente: {
              comptes: 7,
              gorille: 7
            },
            'poste-service': {
              prestation: 5,
              food: 4,
              lieux: 7
            }
          }
          const wordLimit =
            wordLimitMap[selectedCategory.slug]?.[subcategory.slug] ?? 6
          const { preview, hasMore } = description
            ? getPreviewWithHalfWord(description, wordLimit)
            : { preview: '', hasMore: false }
          const mobilePreview = description ? getFirstSentence(description) : ''
          const displayPreview = preview
          return (
            <button
              key={subcategory.id}
              className="subcategory-card"
              onClick={() => onSelectSubcategory(subcategory.id)}
            style={{ '--category-color': selectedCategory.color } as React.CSSProperties}
          >
            <div className="subcategory-icon-wrapper">
              <Icon size={20} />
            </div>
              <div className="subcategory-content">
                <span className="subcategory-name">{subcategory.name}</span>
                {description && (
                  <div className="subcategory-description-row">
                    <span
                      className={`subcategory-description ${isExpanded || !hasMore ? 'is-expanded' : 'is-collapsed'}`}
                    >
                      {isExpanded || !hasMore
                        ? description
                        : isMobile
                          ? mobilePreview
                          : displayPreview}
                      {!isMobile && hasMore && !isExpanded && (
                        <button
                          type="button"
                          className="subcategory-more inline"
                          onClick={(e) => toggleDescription(e, subcategory.id)}
                          aria-label="Afficher la description complète"
                        >
                          ...
                        </button>
                      )}
                      {!isMobile && hasMore && isExpanded && (
                        <button
                          type="button"
                          className="subcategory-more inline"
                          onClick={(e) => toggleDescription(e, subcategory.id)}
                          aria-label="Réduire la description"
                        >
                          Réduire
                        </button>
                      )}
                    </span>
                  </div>
                )}
              </div>
              <ChevronRight size={18} className="subcategory-arrow" />
            </button>
          )
        })}
      </div>
      
      {examplePosts.length > 0 && (
        <div className="example-posts-section">
          <h3 className="example-posts-title">Exemples d'annonces</h3>
          {loadingPosts ? (
            <div className="loading-posts">Chargement...</div>
          ) : (
            <div className="example-posts-grid">
              {examplePosts.map((post) => {
                const displayName = post.user?.username || post.user?.full_name || 'Utilisateur'
                return (
                  <div key={post.id} className="example-post-card">
                    <div className="example-post-image-wrapper">
                      {post.images && post.images.length > 0 && (
                        <img 
                          src={post.images[0]} 
                          alt={post.title}
                          className="example-post-image"
                        />
                      )}
                      
                      {/* Badge urgent en haut à gauche */}
                      {post.is_urgent && (
                        <div className="example-post-urgent-badge">URGENT</div>
                      )}
                      
                      {/* Bouton like en haut à droite */}
                      <div className="example-post-like">
                        <Heart size={16} fill="currentColor" />
                      </div>
                      
                      {/* Profil utilisateur en bas à gauche */}
                      {post.user_id && (
                        <div 
                          className="example-post-profile"
                          onClick={(e) => handleProfileClick(e, post.user_id ?? undefined)}
                        >
                          <div className="example-post-avatar">
                            {post.user?.avatar_url ? (
                              <img 
                                src={post.user.avatar_url} 
                                alt={displayName}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName)
                                }}
                              />
                            ) : (
                              <div className="example-post-avatar-placeholder">
                                {(displayName[0] || 'U').toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="example-post-profile-name">{displayName}</div>
                        </div>
                      )}
                    </div>
                    <div className="example-post-content">
                      <h4 className="example-post-title">{post.title}</h4>
                      <p className="example-post-description">{post.description?.substring(0, 100)}...</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
