import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, ChevronRight, Loader } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import PageHeader from '../components/PageHeader'
import Footer from '../components/Footer'
import { getDefaultSubMenus } from '../utils/defaultSubMenus'
import './Publish.css'

interface Category {
  id: string
  name: string
  slug: string
}

interface SubCategory {
  id: string
  name: string
  slug: string
}

// Mapping des slugs de catégories vers les noms du menu
const CATEGORY_NAME_MAP: Record<string, string> = {
  'match': 'Match',
  'recrutement': 'Recrutement',
  'projet': 'Projet',
  'service': 'Service',
  'vente': 'Vente',
  'mission': 'Mission',
  'autre': 'Autre'
}

// Catégories par défaut basées sur le menu (utilisées si la base de données n'est pas accessible)
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'match', name: 'Match', slug: 'match' },
  { id: 'recrutement', name: 'Recrutement', slug: 'recrutement' },
  { id: 'projet', name: 'Projet', slug: 'projet' },
  { id: 'service', name: 'Service', slug: 'service' },
  { id: 'vente', name: 'Vente', slug: 'vente' },
  { id: 'mission', name: 'Mission', slug: 'mission' },
  { id: 'autre', name: 'Autre', slug: 'autre' }
]

const Publish = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Données du formulaire
  const [categoryId, setCategoryId] = useState<string>('')
  const [subCategoryId, setSubCategoryId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [neededDate, setNeededDate] = useState('')
  const [numberOfPeople, setNumberOfPeople] = useState<number | ''>('')
  const [paymentType, setPaymentType] = useState<'benevole' | 'prix' | ''>('')
  const [price, setPrice] = useState<number | ''>('')
  const [mediaType, setMediaType] = useState<'photo' | 'video' | ''>('')
  const [images, setImages] = useState<string[]>([])

  // Données chargées - Initialiser avec les catégories par défaut
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])

  // Fonction pour obtenir le nom d'affichage d'une catégorie
  const getCategoryDisplayName = (category: Category): string => {
    return CATEGORY_NAME_MAP[category.slug] || category.name
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (categoryId) {
      fetchSubCategories(categoryId)
    } else {
      setSubCategories([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
        // Utiliser les catégories par défaut si la requête échoue
        setCategories(DEFAULT_CATEGORIES)
      } else if (data && data.length > 0) {
        setCategories(data)
      } else {
        // Utiliser les catégories par défaut si aucune donnée n'est retournée
        setCategories(DEFAULT_CATEGORIES)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Utiliser les catégories par défaut en cas d'erreur
      setCategories(DEFAULT_CATEGORIES)
    }
  }

  const fetchSubCategories = async (catId: string) => {
    try {
      const category = categories.find(c => c.id === catId)
      if (!category) return

      const defaultSubMenus = getDefaultSubMenus(category.slug)
      
      const { data, error } = await supabase
        .from('sub_categories')
        .select('id, name, slug')
        .eq('category_id', catId)
        .order('name')

      if (error || !data || data.length === 0) {
        // Utiliser les sous-menus par défaut si erreur ou aucune donnée
        // Convertir les sous-menus par défaut en format SubCategory
        const defaultSubCategories: SubCategory[] = defaultSubMenus.map((subMenu, index) => ({
          id: `default-${category.slug}-${index}`,
          name: subMenu.name,
          slug: subMenu.slug
        }))
        setSubCategories(defaultSubCategories)
      } else {
        setSubCategories(data)
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      // Utiliser les sous-menus par défaut en cas d'erreur
      const category = categories.find(c => c.id === catId)
      if (category) {
        const defaultSubMenus = getDefaultSubMenus(category.slug)
        const defaultSubCategories: SubCategory[] = defaultSubMenus.map((subMenu, index) => ({
          id: `default-${category.slug}-${index}`,
          name: subMenu.name,
          slug: subMenu.slug
        }))
        setSubCategories(defaultSubCategories)
      }
    }
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return
    if (!user) {
      alert('Vous devez être connecté pour télécharger des images')
      return
    }

    const newFiles = Array.from(files).slice(0, 7 - images.length)
    if (newFiles.length === 0) return

    setUploading(true)
    const uploadedUrls: string[] = []

    for (const file of newFiles) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `posts/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      } catch (error) {
        console.error('Error uploading image:', error)
        alert(`Erreur lors du téléchargement de ${file.name}`)
      }
    }

    setImages(prev => [...prev, ...uploadedUrls])
    setUploading(false)
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const calculateIsUrgent = (date: string): boolean => {
    if (!date) return false
    const neededDate = new Date(date)
    const today = new Date()
    const diffTime = neededDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 3
  }

  const handleSubmit = async () => {
    if (!user) {
      const confirm = window.confirm('Vous devez être connecté pour publier une annonce. Voulez-vous vous connecter ?')
      if (confirm) {
        navigate('/auth/login')
      }
      return
    }

    // Validation
    if (!categoryId || !title || !description) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (paymentType === 'prix' && !price) {
      alert('Veuillez indiquer un prix')
      return
    }

    if (images.length === 0) {
      const confirm = window.confirm('Aucune image ajoutée. Voulez-vous continuer ?')
      if (!confirm) return
    }

    setLoading(true)

    try {
      const isUrgent = calculateIsUrgent(neededDate)

      // Ne pas envoyer sub_category_id si c'est une sous-catégorie par défaut (ID qui commence par "default-")
      const finalSubCategoryId = subCategoryId && !subCategoryId.startsWith('default-') ? subCategoryId : null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const postData: any = {
        user_id: user.id,
        category_id: categoryId,
        sub_category_id: finalSubCategoryId,
        title,
        description: description || '', // S'assurer que description n'est jamais null
        content: description || '', // Ajouter content au cas où la colonne existe dans la DB
        location: location || null,
        needed_date: neededDate || null,
        number_of_people: numberOfPeople || null,
        payment_type: paymentType || null,
        price: price || null,
        media_type: mediaType || null,
        images: images.length > 0 ? images : null,
        is_urgent: isUrgent,
        status: 'active'
      }
      
      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single()

      if (error) throw error

      if (data) {
        alert('Annonce publiée avec succès !')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const postId = (data as any).id
        navigate(`/post/${postId}`)
      }
    } catch (error: unknown) {
      console.error('Error creating post:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      alert(`Erreur lors de la publication : ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find(c => c.id === categoryId)

  // Étape 1 : Sélection de la catégorie
  if (step === 1) {
    return (
      <div className="app">
        <PageHeader title="Publier une annonce" />
        <main className="main-content without-header">
          <div className="publish-page">
            <div className="publish-steps">
              <div className="step active">1. Catégorie</div>
              <div className="step">2. Détails</div>
              <div className="step">3. Résumé</div>
            </div>

            <div className="publish-form">
              <h2>Sélectionnez une catégorie</h2>
              {categories.length === 0 ? (
                <div className="loading-categories">
                  <p>Chargement des catégories...</p>
                </div>
              ) : (
                <div className="categories-grid">
                  {categories.map((category) => {
                    const displayName = getCategoryDisplayName(category)
                    return (
                      <button
                        key={category.id}
                        type="button"
                        className={`category-card ${categoryId === category.id ? 'selected' : ''}`}
                        onClick={() => {
                          setCategoryId(category.id)
                          setSubCategoryId('') // Réinitialiser la sous-catégorie quand on change de catégorie
                        }}
                      >
                        {displayName}
                      </button>
                    )
                  })}
                </div>
              )}

              {categoryId && subCategories.length > 0 && (
                <div className="subcategories-section">
                  <h3>Sous-catégorie (optionnel)</h3>
                  <p className="subcategories-hint">Choisissez une sous-catégorie pour mieux classer votre annonce</p>
                  <div className="subcategories-list">
                    {subCategories.map((subCat) => (
                      <button
                        key={subCat.id}
                        type="button"
                        className={`subcategory-btn ${subCategoryId === subCat.id ? 'selected' : ''}`}
                        onClick={() => {
                          if (subCategoryId === subCat.id) {
                            // Désélectionner si déjà sélectionné
                            setSubCategoryId('')
                            setMediaType('') // Réinitialiser le type de média
                          } else {
                            setSubCategoryId(subCat.id)
                          }
                        }}
                      >
                        {subCat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory?.slug === 'match' && subCategoryId && (() => {
                // Vérifier si la sous-catégorie sélectionnée est "Création de contenu"
                const selectedSubCat = subCategories.find(sc => sc.id === subCategoryId)
                const isCreationContenu = selectedSubCat?.slug === 'creation-contenu'
                
                if (isCreationContenu) {
                  // Afficher Photo et Vidéo comme sous-sous-catégories
                  return (
                    <div className="media-type-section">
                      <h3>Type de média</h3>
                      <p className="subcategories-hint">Choisissez Photo ou Vidéo</p>
                      <div className="media-type-buttons">
                        <button
                          type="button"
                          className={`media-type-btn ${mediaType === 'photo' ? 'selected' : ''}`}
                          onClick={() => {
                            if (mediaType === 'photo') {
                              setMediaType('')
                            } else {
                              setMediaType('photo')
                            }
                          }}
                        >
                          Photo
                        </button>
                        <button
                          type="button"
                          className={`media-type-btn ${mediaType === 'video' ? 'selected' : ''}`}
                          onClick={() => {
                            if (mediaType === 'video') {
                              setMediaType('')
                            } else {
                              setMediaType('video')
                            }
                          }}
                        >
                          Vidéo
                        </button>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              <div className="form-actions">
                <button className="btn-primary" onClick={() => setStep(2)} disabled={!categoryId}>
                  Suivant <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Étape 2 : Détails de l'annonce
  if (step === 2) {
    return (
      <div className="app">
        <PageHeader title="Détails de l'annonce" />
        <main className="main-content without-header">
          <div className="publish-page">
            <div className="publish-steps">
              <div className="step completed">1. Catégorie</div>
              <div className="step active">2. Détails</div>
              <div className="step">3. Résumé</div>
            </div>

            <div className="publish-form">
              <h2>Détails de l'annonce</h2>

              <div className="form-group">
                <label>Titre *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Recherche partenaire pour création de contenu"
                  maxLength={255}
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre annonce en détail..."
                  rows={6}
                />
              </div>

              <div className="form-group">
                <label>Lieu/Ville (optionnel)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Paris, France"
                />
              </div>

              {(selectedCategory?.slug === 'match' || selectedCategory?.slug === 'recrutement') && (
                <>
                  <div className="form-group">
                    <label>Date de besoin *</label>
                    <input
                      type="date"
                      value={neededDate}
                      onChange={(e) => setNeededDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-group">
                    <label>Nombre de personnes *</label>
                    <input
                      type="number"
                      value={numberOfPeople}
                      onChange={(e) => setNumberOfPeople(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Moyen de paiement</label>
                <div className="payment-buttons">
                  <button
                    className={`payment-btn ${paymentType === 'benevole' ? 'selected' : ''}`}
                    onClick={() => {
                      setPaymentType('benevole')
                      setPrice('')
                    }}
                  >
                    Bénévole
                  </button>
                  <button
                    className={`payment-btn ${paymentType === 'prix' ? 'selected' : ''}`}
                    onClick={() => setPaymentType('prix')}
                  >
                    Prix
                  </button>
                </div>
              </div>

              {paymentType === 'prix' && (
                <div className="form-group">
                  <label>Prix (€) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Images (maximum 7)</label>
                <div className="image-upload-area">
                  {images.map((url, index) => (
                    <div key={index} className="image-preview">
                      <img src={url} alt={`Preview ${index + 1}`} />
                      <button className="remove-image" onClick={() => removeImage(index)}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {images.length < 7 && (
                    <label className="upload-btn">
                      <Upload size={24} />
                      {uploading ? 'Téléchargement...' : 'Ajouter une image'}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e.target.files)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  Retour
                </button>
                <button className="btn-primary" onClick={() => setStep(3)} disabled={!title || !description}>
                  Suivant <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Étape 3 : Résumé
  return (
    <div className="app">
      <PageHeader title="Résumé de l'annonce" />
      <main className="main-content without-header">
        <div className="publish-page">
          <div className="publish-steps">
            <div className="step completed">1. Catégorie</div>
            <div className="step completed">2. Détails</div>
            <div className="step active">3. Résumé</div>
          </div>

          <div className="publish-form">
            <h2>Résumé de votre annonce</h2>

            <div className="summary-section">
              <h3>Catégorie</h3>
              <p>{selectedCategory ? getCategoryDisplayName(selectedCategory) : ''}</p>
              {subCategoryId && (
                <p className="subcategory">{subCategories.find(s => s.id === subCategoryId)?.name}</p>
              )}
            </div>

            <div className="summary-section">
              <h3>Titre</h3>
              <p>{title}</p>
            </div>

            <div className="summary-section">
              <h3>Description</h3>
              <p>{description}</p>
            </div>

            {location && (
              <div className="summary-section">
                <h3>Lieu</h3>
                <p>{location}</p>
              </div>
            )}

            {neededDate && (
              <div className="summary-section">
                <h3>Date de besoin</h3>
                <p>{new Date(neededDate).toLocaleDateString('fr-FR')}</p>
                {calculateIsUrgent(neededDate) && (
                  <span className="urgent-badge">⚠️ Urgent</span>
                )}
              </div>
            )}

            {numberOfPeople && (
              <div className="summary-section">
                <h3>Nombre de personnes</h3>
                <p>{numberOfPeople}</p>
              </div>
            )}

            {paymentType && (
              <div className="summary-section">
                <h3>Paiement</h3>
                <p>{paymentType === 'benevole' ? 'Bénévole' : `${price} €`}</p>
              </div>
            )}

            {images.length > 0 && (
              <div className="summary-section">
                <h3>Images ({images.length})</h3>
                <div className="summary-images">
                  {images.map((url, index) => (
                    <img key={index} src={url} alt={`Image ${index + 1}`} />
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setStep(2)}>
                Retour
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="spinner" size={18} />
                    Publication...
                  </>
                ) : (
                  'Publier l\'annonce'
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Publish
