import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { publicationTypes } from '../../constants/publishData'
import { supabase } from '../../lib/supabaseClient'
import { markPersonalizationQuestionnaireCompleted } from '../../hooks/useAppUsageTime'
import './PersonalizationQuestionnaire.css'

const MAX_CATEGORIES = 3
const MAX_SUBCATEGORIES_PER_CATEGORY = 3
const MAX_STATUSES = 3

const PROFILE_TYPE_OPTIONS = [
  { id: 'creator', label: 'Créateur(trice) de contenu' },
  { id: 'freelance', label: 'Prestataire / Freelance' },
  { id: 'company', label: 'Entreprise' },
  { id: 'studio', label: 'Studio / Lieu' },
  { id: 'institut', label: 'Institut / Beauté' },
  { id: 'community-manager', label: 'Community manager' },
  { id: 'monteur', label: 'Monteur(euse)' },
  { id: 'animateur', label: 'Animateur(rice)' },
  { id: 'redacteur', label: 'Rédacteur(rice)' },
  { id: 'scenariste', label: 'Scénariste' },
  { id: 'coach', label: 'Coach' },
  { id: 'agence', label: 'Agence' },
  { id: 'branding', label: 'Branding' },
  { id: 'analyse-profil', label: 'Analyse de profil' },
  { id: 'other', label: 'Autre' }
]

interface PersonalizationQuestionnaireProps {
  visible: boolean
  onComplete: () => void
  userId: string
}

export default function PersonalizationQuestionnaire({
  visible,
  onComplete,
  userId
}: PersonalizationQuestionnaireProps) {
  const { t } = useTranslation(['categories', 'common'])
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const categoryLabel = (slug: string) =>
    t(`categories:titles.${slug}`, { defaultValue: publicationTypes.find((c) => c.slug === slug)?.name ?? slug })
  const subcategoryLabel = (slug: string) =>
    t(`categories:submenus.${slug}`, { defaultValue: slug })

  const subcategoriesForCategory = (categorySlug: string) => {
    const cat = publicationTypes.find((c) => c.slug === categorySlug)
    if (!cat) return []
    return cat.subcategories.filter((s) => s.slug !== 'tout')
  }

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug)
      if (prev.length >= MAX_CATEGORIES) return prev
      return [...prev, slug]
    })
  }

  const toggleSubcategory = (categorySlug: string, subSlug: string) => {
    const key = `${categorySlug}::${subSlug}`
    setSelectedSubcategories((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      const sameCategory = prev.filter((k) => k.startsWith(`${categorySlug}::`))
      if (sameCategory.length >= MAX_SUBCATEGORIES_PER_CATEGORY) return prev
      return [...prev, key]
    })
  }

  const toggleStatus = (id: string) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id)
      if (prev.length >= MAX_STATUSES) return prev
      return [...prev, id]
    })
  }

  const subcategoryCountForCategory = (categorySlug: string) =>
    selectedSubcategories.filter((k) => k.startsWith(`${categorySlug}::`)).length

  const handleNext = () => {
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3)
    else handleSubmit()
  }

  const handlePrev = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const profileTypeToSave =
        selectedStatuses.length > 0 ? JSON.stringify(selectedStatuses) : null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('profiles') as any)
        .update({
          display_categories:
            selectedCategories.length > 0 ? selectedCategories : null,
          display_subcategories:
            selectedSubcategories.length > 0 ? selectedSubcategories : null,
          profile_type: profileTypeToSave,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Erreur mise à jour profil personnalisation:', error)
      }
      markPersonalizationQuestionnaireCompleted()
      onComplete()
    } finally {
      setSaving(false)
    }
  }

  const canProceed = (() => {
    if (step === 1) return selectedCategories.length > 0
    if (step === 2) return true
    return selectedStatuses.length > 0
  })()

  if (!visible) return null

  return (
    <div className="personalization-questionnaire-overlay">
      <div className="personalization-questionnaire-modal">
        <div className="personalization-questionnaire-header">
          <h2>Personnaliser tes recommandations</h2>
          <p>
            Tu utilises Creatik depuis un moment. Aide-nous à mieux te
            recommander du contenu.
          </p>
          <div className="personalization-steps" aria-hidden="true">
            <span
              className={step >= 1 ? 'active' : ''}
              aria-current={step === 1 ? 'step' : undefined}
            >
              1. Catégories
            </span>
            <span
              className={step >= 2 ? 'active' : ''}
              aria-current={step === 2 ? 'step' : undefined}
            >
              2. Sous-catégories
            </span>
            <span
              className={step >= 3 ? 'active' : ''}
              aria-current={step === 3 ? 'step' : undefined}
            >
              3. Statut
            </span>
          </div>
        </div>

        <div className="personalization-questionnaire-body">
          {step === 1 && (
            <div className="personalization-step-content">
              <h3>Quelles catégories t&apos;intéressent ? (max {MAX_CATEGORIES})</h3>
              <div className="personalization-options-grid">
                {publicationTypes.map((cat) => {
                  const selected = selectedCategories.includes(cat.slug)
                  const disabled =
                    !selected && selectedCategories.length >= MAX_CATEGORIES
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      className={`personalization-option-chip ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                      onClick={() => toggleCategory(cat.slug)}
                      disabled={disabled}
                      aria-pressed={selected}
                      aria-label={`${categoryLabel(cat.slug)}${selected ? ' (sélectionné)' : ''}`}
                    >
                      {categoryLabel(cat.slug)}
                    </button>
                  )
                })}
              </div>
              <p className="personalization-hint">
                {selectedCategories.length} / {MAX_CATEGORIES} sélectionnées
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="personalization-step-content">
              <h3>
                Quelles sous-catégories pour chaque catégorie ? (max{' '}
                {MAX_SUBCATEGORIES_PER_CATEGORY} par catégorie)
              </h3>
              {selectedCategories.map((categorySlug) => {
                const subs = subcategoriesForCategory(categorySlug)
                const count = subcategoryCountForCategory(categorySlug)
                return (
                  <div
                    key={categorySlug}
                    className="personalization-subcategory-group"
                  >
                    <h4>{categoryLabel(categorySlug)}</h4>
                    <div className="personalization-options-grid">
                      {subs.map((sub) => {
                        const key = `${categorySlug}::${sub.slug}`
                        const selected = selectedSubcategories.includes(key)
                        const disabled =
                          !selected &&
                          count >= MAX_SUBCATEGORIES_PER_CATEGORY
                        return (
                          <button
                            key={key}
                            type="button"
                            className={`personalization-option-chip small ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                            onClick={() =>
                              toggleSubcategory(categorySlug, sub.slug)
                            }
                            disabled={disabled}
                            aria-pressed={selected}
                            aria-label={`${subcategoryLabel(sub.slug)}${selected ? ' (sélectionné)' : ''}`}
                          >
                            {subcategoryLabel(sub.slug)}
                          </button>
                        )
                      })}
                    </div>
                    <p className="personalization-hint">
                      {count} / {MAX_SUBCATEGORIES_PER_CATEGORY}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {step === 3 && (
            <div className="personalization-step-content">
              <h3>Quel est ton statut ? (max {MAX_STATUSES})</h3>
              <p className="personalization-subtitle">
                Indique les statuts qui te correspondent
              </p>
              <div className="personalization-options-grid">
                {PROFILE_TYPE_OPTIONS.map((opt) => {
                  const selected = selectedStatuses.includes(opt.id)
                  const disabled =
                    !selected && selectedStatuses.length >= MAX_STATUSES
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`personalization-option-chip ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                      onClick={() => toggleStatus(opt.id)}
                      disabled={disabled}
                      aria-pressed={selected}
                      aria-label={`${opt.label}${selected ? ' (sélectionné)' : ''}`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              <p className="personalization-hint">
                {selectedStatuses.length} / {MAX_STATUSES} sélectionnés
              </p>
            </div>
          )}
        </div>

        <div className="personalization-questionnaire-actions">
          {step > 1 ? (
            <button
              type="button"
              className="personalization-btn personalization-btn-secondary"
              onClick={handlePrev}
              disabled={saving}
            >
              Retour
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="personalization-btn personalization-btn-primary"
            onClick={handleNext}
            disabled={!canProceed || saving}
          >
            {saving
              ? 'Enregistrement...'
              : step === 3
                ? 'Valider'
                : 'Continuer'}
          </button>
        </div>
      </div>
    </div>
  )
}
