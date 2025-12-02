import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { publicationTypes } from '../constants/publishData'
import { usePublishNavigation } from '../hooks/usePublishNavigation'
import { useExamplePosts } from '../hooks/useExamplePosts'
import { getMyLocation, handlePublish } from '../utils/publishHelpers'
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
  const [formData, setFormData] = useState({
    category: null as string | null,
    subcategory: null as string | null,
    option: null as string | null,
    platform: null as string | null,
    title: '',
    description: '',
    shortDescription: '',
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

  const selectedCategory = publicationTypes.find(
    (c) => c.id === formData.category,
  )

  const selectedSubcategory = selectedCategory?.subcategories.find(
    (s) => s.id === formData.subcategory,
  )

  const selectedOption = selectedSubcategory?.options?.find(
    (o) => o.id === formData.option,
  )

  // Récupérer les slugs pour useExamplePosts
  const categorySlug = selectedCategory?.slug || null
  const subcategorySlug = selectedSubcategory?.slug || null

  const { examplePosts, loadingPosts } = useExamplePosts(
    categorySlug,
    subcategorySlug
  )

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData({ ...formData, ...updates })
  }

  const handleGetMyLocation = () => {
    getMyLocation(formData, updateFormData)
  }

  const handlePublishPost = (status: 'draft' | 'active') => {
    handlePublish(formData, navigate, status)
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
            selectedOption,
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
                updateFormData({ subcategory: subcategoryId })
                const subcategory = selectedCategory?.subcategories.find(
                  (s) => s.id === subcategoryId
                )
                if (subcategory?.options && subcategory.options.length > 0) {
                  setStep(2)
                } else {
                  setStep(3)
                }
              }}
              examplePosts={examplePosts}
              loadingPosts={loadingPosts}
            />
          )}

          {step === 2 && !formData.option && (
            <Step3Option
              selectedSubcategory={selectedSubcategory ?? null}
              selectedCategory={selectedCategory ?? null}
              onSelectOption={(opt) => {
                updateFormData({ option: opt.id })
                if (opt.platforms && opt.platforms.length > 0) {
                  setStep(2.5)
                } else {
                  setStep(3)
                }
              }}
              examplePosts={examplePosts}
              loadingPosts={loadingPosts}
            />
          )}

          {step === 2.5 && (
            <Step3Platform
              selectedOption={selectedOption ?? null}
              onSelectPlatform={(platform) => {
                updateFormData({ platform })
                setStep(3)
              }}
            />
          )}

          {step === 3 && (
            <Step4Description
              formData={formData}
              onUpdateFormData={updateFormData}
              onContinue={() => setStep(4)}
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
        />
      )}
    </div>
  )
}
