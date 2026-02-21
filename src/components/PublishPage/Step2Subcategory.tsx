import { PublicationType } from '../../constants/publishData'
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
  examplePosts: any[]
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
  // Les libellés Offre/Demande sont swappés côté UI.
  // On aligne donc les descriptions sur l'intention affichée et non la valeur technique stockée.
  const listingTypeForDisplayedIntent =
    listingType === 'offer' ? 'request' : listingType === 'request' ? 'offer' : ''

  const getSubcategoryDescription = (subcategorySlug: string, fallback?: string) => {
    if (subcategorySlug === 'autre') return 'Soyez spécifique !'
    const categoryDescriptions: Record<
      string,
      Record<string, { offer?: string; request?: string; default?: string }>
    > = {
      'creation-contenu': {
        photo: {
          offer:
            'Photographier quelqu’un : photos naturelles, Insta, soirée, anniversaire... Proposer ou shooter à plusieurs.',
          request:
            'Se faire photographier : photos naturelles, Insta, soirée, anniversaire... Chercher ou shooter à plusieurs.'
        },
        video: {
          offer:
            'Filmer quelqu’un : face-cam, playback, interview, événement... Proposer ou collaborer.',
          request:
            'Se faire filmer : face-cam, playback, interview, événement... Chercher ou collaborer.'
        },
        vlog: {
          offer:
            'Filmer un vlog : suivi, filmage naturel, plans en mouvement, moments clés... Proposer ou collaborer.',
          request:
            'Se faire filmer pour un vlog : suivi, filmage naturel, plans en mouvement, moments clés... Chercher ou collaborer.'
        },
        sketchs: {
          offer:
            'Jouer des rôles dans un sketch : comédie, duo, personnages, mise en scène... Proposer ou collaborer.',
          request:
            'Chercher des personnes pour un sketch : comédie, duo, personnages, mise en scène... Chercher ou collaborer.'
        },
        trends: {
          offer:
            'Réaliser des trends/défis : choré, duo, challenge, format viral... Proposer ou collaborer.',
          request:
            'Chercher un partenaire pour des trends/défis : choré, duo, challenge, format viral... Chercher ou collaborer.'
        },
        live: {
          offer:
            'Animer un live à deux : débat, discussion, partage d’avis, co-animation... Proposer ou collaborer.',
          request:
            'Chercher quelqu’un pour un live à deux : débat, discussion, partage d’avis, co-animation... Chercher ou collaborer.'
        }
      },
      services: {
        'coaching-contenu': {
          offer:
            'Coacher la création de contenu : idées, formats, rythme, direction artistique... Proposer ou collaborer.',
          request:
            'Chercher un coaching en création de contenu : idées, formats, rythme, direction artistique... Chercher ou collaborer.'
        },
        'strategie-editoriale': {
          offer:
            'Définir une stratégie éditoriale : thèmes, calendrier, fréquence, réseau principal... Proposer ou collaborer.',
          request:
            'Chercher une stratégie éditoriale : thèmes, calendrier, fréquence, réseau principal... Chercher ou collaborer.'
        },
        organisation: {
          offer:
            'Organiser la production de contenu : planning, workflow, priorités, suivi des posts... Proposer ou collaborer.',
          request:
            'Chercher de l’aide pour organiser la production : planning, workflow, priorités, suivi des posts... Chercher ou collaborer.'
        },
        agence: {
          offer:
            'Gérer les collaborations créateur : partenariats, négociation, suivi, opportunités... Proposer ou collaborer.',
          request:
            'Chercher une agence pour gérer les collaborations : partenariats, négociation, suivi, opportunités... Chercher ou collaborer.'
        },
        branding: {
          offer:
            'Construire une image de marque créateur : identité visuelle, positionnement, cohérence, ligne de ton... Proposer ou collaborer.',
          request:
            'Chercher un accompagnement branding : identité visuelle, positionnement, cohérence, ligne de ton... Chercher ou collaborer.'
        },
        'analyse-profil': {
          offer:
            'Analyser un profil créateur : points forts, axes d’amélioration, performance, opportunités... Proposer ou collaborer.',
          request:
            'Chercher une analyse de profil : points forts, axes d’amélioration, performance, opportunités... Chercher ou collaborer.'
        },
        'proposition-idees': {
          offer:
            'Proposer des idées de contenu : concepts, angles, formats, séries... Proposer ou collaborer.',
          request:
            'Chercher des idées de contenu : concepts, angles, formats, séries... Chercher ou collaborer.'
        },
        'assistant-createur': {
          offer:
            'Assister un créateur au quotidien : préparation, tournage, organisation, publication... Proposer ou collaborer.',
          request:
            'Chercher un assistant créateur : préparation, tournage, organisation, publication... Chercher ou collaborer.'
        },
        'monetisation-audience': {
          offer:
            'Accompagner la monétisation d’audience : offres, partenariats, produits, stratégie... Proposer ou collaborer.',
          request:
            'Chercher un accompagnement monétisation : offres, partenariats, produits, stratégie... Chercher ou collaborer.'
        },
        'aisance-camera': {
          offer:
            'Coacher l’aisance caméra : posture, voix, présence, confiance... Proposer ou collaborer.',
          request:
            'Chercher un coaching aisance caméra : posture, voix, présence, confiance... Chercher ou collaborer.'
        },
        'setup-materiel': {
          offer:
            'Installer un setup de création : décor, éclairage, espace, optimisation... Proposer ou collaborer.',
          request:
            'Chercher de l’aide pour un setup de création : décor, éclairage, espace, optimisation... Chercher ou collaborer.'
        },
        'visage-marque': {
          offer:
            'Incarner une marque régulièrement : vidéos, photos, stories, contenus réseaux... Proposer ou collaborer.',
          request:
            'Chercher un visage de marque régulier : vidéos, photos, stories, contenus réseaux... Chercher ou collaborer.'
        },
        'animation-compte': {
          offer:
            'Animer un compte de marque : publication, calendrier, engagement, suivi... Proposer ou collaborer.',
          request:
            'Chercher un profil pour animer un compte : publication, calendrier, engagement, suivi... Chercher ou collaborer.'
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
          offer: 'Fiction, documentaire, art. Présentation produit, mise en scène, contenu créatif...',
          request: 'Trouvez vos figurant(e)s. Présentation produit, mise en scène, contenu créatif...'
        },
        'voix-off': {
          offer: 'Fiction, documentaire, animation. Pub, story, vidéo explicative...',
          request: 'Trouvez des voix pour contenu. Pub, story, vidéo explicative...'
        },
        'invite-podcast': {
          offer: 'Interview, fiction audio, jeu...',
          request: 'Trouvez vos invités...'
        },
        'invite-micro-trottoir': {
          offer: 'Jeu, interview, sketch...',
          request: 'Trouvez des partenaires à interviewer...'
        },
        'youtube-video': {
          offer: 'Débat, témoignage, jeux...',
          request: 'Trouvez des profils pour du contenu...'
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
              sketchs: 7
            },
            'casting-role': {
              figurant: 5,
              'modele-photo': 6,
              'modele-video': 6,
              'voix-off': 6,
              'invite-podcast': 6,
              'invite-micro-trottoir': 6,
              'youtube-video': 6
            },
            emploi: {
              montage: 6,
              'micro-trottoir': 6,
              live: 6,
              'ecriture-contenu': 6
            },
            'studio-lieu': {
              'studio-creation': 7,
              'lieux-residentiels': 7,
              'lieux-professionnels': 6
            },
            'projets-equipe': {
              'projet-emission': 6,
              'projet-newsletter': 6,
              'projet-interview': 6,
              'projet-podcast': 6,
              'projet-youtube': 6,
              'projet-magazine': 6,
              'projet-blog': 6,
              'projet-media': 7
            },
            services: {
              'coaching-contenu': 8,
              'strategie-editoriale': 7,
              organisation: 7,
              agence: 6,
              'setup-materiel': 5,
              'aisance-camera': 8,
              'monetisation-audience': 7
            },
            vente: {
              comptes: 7,
              'noms-utilisateur': 5,
              'concepts-niches': 7,
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
                          onClick={(e) => handleProfileClick(e, post.user_id)}
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
