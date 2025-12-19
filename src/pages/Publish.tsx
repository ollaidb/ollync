import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'
import { getPublicationTypesWithSubSubCategories } from '../utils/publishDataConverter'
import { usePublishNavigation } from '../hooks/usePublishNavigation'
import { useExamplePosts } from '../hooks/useExamplePosts'
import { getMyLocation, handlePublish, validatePublishForm, shouldShowSocialNetwork } from '../utils/publishHelpers'
import { useAuth } from '../hooks/useSupabase'
import Footer from '../components/Footer'
import { PublishHeader } from '../components/PublishPage/PublishHeader'
import { Step1Category } from '../components/PublishPage/Step1Category'
import { Step2Subcategory } from '../components/PublishPage/Step2Subcategory'
import { Step3Option } from '../components/PublishPage/Step3Option'
import { Step3Platform } from '../components/PublishPage/Step3Platform'
import { Step4Description } from '../components/PublishPage/Step4Description'
import { Step5LocationMedia } from '../components/PublishPage/Step5LocationMedia'
import { PublishActions } from '../components/PublishPage/PublishActions'
import './Publish.css'

export default function Publish() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Récupérer les catégories enrichies avec les niveaux 3 et 4
  const enrichedPublicationTypes = useMemo(() => {
    return getPublicationTypesWithSubSubCategories()
  }, [])

  const [formData, setFormData] = useState({
    category: null as string | null,
    subcategory: null as string | null,
    subSubCategory: null as string | null, // N3
    subSubSubCategory: null as string | null, // N4
    option: null as string | null,
    platform: null as string | null,
    title: '',
    description: '',
    socialNetwork: undefined as string | undefined,
    price: '',
    location: '',
    location_city: '',
    location_lat: null as number | null,
    location_lng: null as number | null,
    location_address: '',
    location_visible_to_participants_only: false,
    exchange_type: '',
    urgent: false,
    images: [] as string[],
    video: null as string | null,
    dateFrom: '',
    dateTo: '',
    deadline: '',
    maxParticipants: '1',
    duration_minutes: '',
    visibility: 'public',
  })

  const { step, setStep, handleBack, getBreadcrumb } = usePublishNavigation(
    formData,
    (updates) => setFormData({ ...formData, ...updates })
  )

  const selectedCategory = enrichedPublicationTypes.find(
    (c) => c.id === formData.category,
  )

  const selectedSubcategory = selectedCategory?.subcategories.find(
    (s) => s.id === formData.subcategory,
  )

  // N3 : Sous-sous-catégorie (option dans la structure actuelle)
  const selectedSubSubCategory = selectedSubcategory?.options?.find(
    (o) => o.id === formData.subSubCategory || o.id === formData.option,
  )

  // N4 : Sous-sous-sous-catégorie (platform dans la structure actuelle)
  const selectedSubSubSubCategory = selectedSubSubCategory?.platforms?.find(
    (p) => p.id === formData.subSubSubCategory || p.id === formData.platform,
  )

  // Récupérer les slugs pour useExamplePosts
  const categorySlug = selectedCategory?.slug || null
  const subcategorySlug = selectedSubcategory?.slug || null
  const subSubCategorySlug = selectedSubSubCategory?.id || null
  const subSubSubCategorySlug = selectedSubSubSubCategory?.id || null

  const { examplePosts, loadingPosts } = useExamplePosts(
    categorySlug,
    subcategorySlug,
    subSubCategorySlug,
    subSubSubCategorySlug
  )

  // Validation des champs obligatoires
  const requireSocialNetwork = shouldShowSocialNetwork(categorySlug, subcategorySlug)
  const validation = useMemo(() => {
    return validatePublishForm(formData, requireSocialNetwork)
  }, [formData, requireSocialNetwork])

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData({ ...formData, ...updates })
  }

  const handleGetMyLocation = () => {
    getMyLocation(formData, updateFormData)
  }

  const handlePublishPost = (status: 'draft' | 'active') => {
    handlePublish(formData, navigate, status)
  }

  if (!user) {
    return (
      <div className="publish-page-container">
        <div className="publish-header-not-connected">
          <h1 className="publish-title-centered">Publier</h1>
        </div>
        <div className="publish-content-not-connected">
          <PlusCircle className="publish-not-connected-icon" strokeWidth={1.5} />
          <h2 className="publish-not-connected-title">Vous n'êtes pas connecté</h2>
          <p className="publish-not-connected-text">Connectez-vous pour publier une annonce</p>
          <button 
            className="publish-not-connected-button" 
            onClick={() => navigate('/auth/register')}
          >
            S'inscrire
          </button>
          <p className="publish-not-connected-login-link">
            Déjà un compte ?{' '}
            <button 
              className="publish-not-connected-link" 
              onClick={() => navigate('/auth/login')}
            >
              Se connecter
            </button>
          </p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="publish-page-container">
      {/* Header */}
      <div className="publish-header-wrapper">
        <PublishHeader
          step={step}
          onBack={handleBack}
          breadcrumb={getBreadcrumb(
            selectedCategory,
            selectedSubcategory,
            selectedSubSubCategory,
            selectedSubSubSubCategory,
          )}
          selectedCategory={selectedCategory || undefined}
        />
      </div>

      <div className="publish-content-wrapper">
        <div className="publish-content">
          {step === 0 && (
            <Step1Category
              onSelectCategory={(categoryId) => {
                updateFormData({ category: categoryId })
                setStep(1)
              }}
            />
          )}

          {step === 1 && (
            <Step2Subcategory
              selectedCategory={selectedCategory ?? null}
              onSelectSubcategory={(subcategoryId) => {
                updateFormData({ 
                  subcategory: subcategoryId,
                  subSubCategory: null,
                  subSubSubCategory: null,
                  option: null,
                  platform: null
                })
                const subcategory = selectedCategory?.subcategories.find(
                  (s) => s.id === subcategoryId
                )
                // Si cette sous-catégorie a des options (N3), aller à l'étape 2
                if (subcategory?.options && subcategory.options.length > 0) {
                  setStep(2)
                } else {
                  // Sinon, aller directement à la description
                  setStep(3)
                }
              }}
              examplePosts={examplePosts}
              loadingPosts={loadingPosts}
            />
          )}

          {step === 2 && !formData.subSubCategory && (
            <Step3Option
              selectedSubcategory={selectedSubcategory ?? null}
              selectedCategory={selectedCategory ?? null}
              onSelectOption={(opt) => {
                updateFormData({ 
                  subSubCategory: opt.id,
                  option: opt.id, // Pour compatibilité
                  subSubSubCategory: null,
                  platform: null
                })
                // Si cette option (N3) a des platforms (N4), aller à l'étape 2.5
                if (opt.platforms && opt.platforms.length > 0) {
                  setStep(2.5)
                } else {
                  // Sinon, aller directement à la description
                  setStep(3)
                }
              }}
              examplePosts={examplePosts}
              loadingPosts={loadingPosts}
            />
          )}

          {step === 2.5 && (
            <Step3Platform
              selectedOption={selectedSubSubCategory ?? null}
              onSelectPlatform={(platform) => {
                updateFormData({ 
                  subSubSubCategory: platform,
                  platform: platform // Pour compatibilité
                })
                setStep(3)
              }}
            />
          )}

          {step === 3 && (
            <Step4Description
              formData={formData}
              onUpdateFormData={updateFormData}
              onContinue={() => setStep(4)}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
            />
          )}

          {step === 4 && (
            <Step5LocationMedia
              formData={formData}
              onUpdateFormData={updateFormData}
              onGetMyLocation={handleGetMyLocation}
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {step === 4 && (
        <PublishActions
          selectedCategory={selectedCategory ?? null}
          onSaveDraft={() => handlePublishPost('draft')}
          onPreview={() => {}}
          onPublish={() => handlePublishPost('active')}
          isValid={validation.isValid}
        />
      )}
    </div>
  )
}
