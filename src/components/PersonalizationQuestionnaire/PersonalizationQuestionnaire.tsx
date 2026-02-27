import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { publicationTypes } from '../../constants/publishData'
import { supabase } from '../../lib/supabaseClient'
import { markPersonalizationQuestionnaireCompleted } from '../../hooks/useAppUsageTime'
import './PersonalizationQuestionnaire.css'

const MAX_CATEGORIES = 3
const MIN_CATEGORIES = 1
const MAX_SUBCATEGORIES_TOTAL = 5
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

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Toutes les sous-catégories de l'app (hors "tout") */
function getAllSubcategories(): { categorySlug: string; subSlug: string }[] {
  const result: { categorySlug: string; subSlug: string }[] = []
  for (const cat of publicationTypes) {
    for (const sub of cat.subcategories) {
      if (sub.slug !== 'tout') {
        result.push({ categorySlug: cat.slug, subSlug: sub.slug })
      }
    }
  }
  return result
}

interface PersonalizationQuestionnaireProps {
  visible: boolean
  onComplete: () => void
  onSkip: () => void
  userId: string
}

export default function PersonalizationQuestionnaire({
  visible,
  onComplete,
  onSkip,
  userId
}: PersonalizationQuestionnaireProps) {
  const { t } = useTranslation(['categories', 'common'])
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const categoriesShuffled = useMemo(() => shuffle(publicationTypes), [])
  const allSubcategories = useMemo(getAllSubcategories, [])

  const categoryLabel = (slug: string) =>
    t(`categories:titles.${slug}`, { defaultValue: publicationTypes.find((c) => c.slug === slug)?.name ?? slug })
  const subcategoryLabel = (slug: string) =>
    t(`categories:submenus.${slug}`, { defaultValue: slug })

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
      if (prev.length >= MAX_SUBCATEGORIES_TOTAL) return prev
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

  const canProceedStep1 = selectedCategories.length >= MIN_CATEGORIES && selectedCategories.length <= MAX_CATEGORIES
  const canProceed = step === 1 ? canProceedStep1 : true

  if (!visible) return null

  const stepTitles: Record<1 | 2 | 3, string> = {
    1: 'Quels univers te parlent le plus ?',
    2: 'Choisis les thématiques qui t’inspirent',
    3: 'Comment te définirais-tu ?'
  }

  return (
    <div className="personalization-questionnaire-overlay">
      <div className="personalization-questionnaire-modal">
        {/* Bouton fermer (X) : même comportement que "Plus tard" — réafficher après 24 h */}
        <button
          type="button"
          className="personalization-questionnaire-close"
          onClick={onSkip}
          aria-label="Fermer (réafficher dans 24 h)"
        >
          <X size={22} />
        </button>
        {/* Barre de progression fixe en haut */}
        <div className="personalization-progress-wrap">
          <div className="personalization-progress-bar">
            <div
              className="personalization-progress-fill"
              style={{ width: `${(step / 3) * 100}%` }}
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={3}
              aria-label={`Étape ${step} sur 3`}
            />
          </div>
          <div className="personalization-progress-steps" aria-hidden="true">
            <span className={step >= 1 ? 'active' : ''}>1</span>
            <span className={step >= 2 ? 'active' : ''}>2</span>
            <span className={step >= 3 ? 'active' : ''}>3</span>
          </div>
        </div>

        <div className="personalization-questionnaire-header">
          <p className="personalization-step-title">{stepTitles[step]}</p>
        </div>

        <div className="personalization-questionnaire-body">
          {step === 1 && (
            <div className="personalization-step-content personalization-step-content--animate">
              <p className="personalization-question">
                Sélectionne trois catégories.
              </p>
              <div className="personalization-options-grid">
                {categoriesShuffled.map((cat) => {
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
                {selectedCategories.length} / {MAX_CATEGORIES} max
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="personalization-step-content personalization-step-content--animate">
              <p className="personalization-question">
                Sélectionne jusqu’à cinq sous-catégories.
              </p>
              <div className="personalization-options-grid personalization-options-grid--dense">
                {allSubcategories.map(({ categorySlug, subSlug }) => {
                  const key = `${categorySlug}::${subSlug}`
                  const selected = selectedSubcategories.includes(key)
                  const disabled =
                    !selected && selectedSubcategories.length >= MAX_SUBCATEGORIES_TOTAL
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`personalization-option-chip small ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                      onClick={() => toggleSubcategory(categorySlug, subSlug)}
                      disabled={disabled}
                      aria-pressed={selected}
                      aria-label={`${subcategoryLabel(subSlug)}${selected ? ' (sélectionné)' : ''}`}
                    >
                      {subcategoryLabel(subSlug)}
                    </button>
                  )
                })}
              </div>
              <p className="personalization-hint">
                {selectedSubcategories.length} / {MAX_SUBCATEGORIES_TOTAL} max
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="personalization-step-content personalization-step-content--animate">
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
                {selectedStatuses.length} / {MAX_STATUSES} max
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
            <button
              type="button"
              className="personalization-btn personalization-btn-text"
              onClick={onSkip}
              disabled={saving}
            >
              Répondre plus tard
            </button>
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
