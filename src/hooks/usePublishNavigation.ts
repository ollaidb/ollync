import { useState, useCallback } from 'react'
import { PublicationType, Subcategory, Option } from '../constants/publishData'
import { publicationTypes } from '../constants/publishData'

interface FormData {
  category: string | null
  subcategory: string | null
  option: string | null
  platform: string | null
  [key: string]: any
}

export const usePublishNavigation = (
  formData: FormData,
  setFormData: (updates: Partial<FormData>) => void
) => {
  const [step, setStep] = useState(0)

  const handleBack = useCallback(() => {
    if (step === 0) return
    
    if (step === 1) {
      setStep(0)
      setFormData({ category: null, subcategory: null, option: null, platform: null })
    } else if (step === 2) {
      setStep(1)
      setFormData({ subcategory: null, option: null, platform: null })
    } else if (step === 2.5) {
      setStep(2)
      setFormData({ platform: null })
    } else if (step === 3) {
      if (formData.option) {
        const selectedCategory = publicationTypes.find(c => c.id === formData.category)
        const selectedSubcategory = selectedCategory?.subcategories.find(s => s.id === formData.subcategory)
        const selectedOption = selectedSubcategory?.options?.find(o => o.id === formData.option)
        
        if (selectedOption?.platforms && selectedOption.platforms.length > 0) {
          setStep(2.5)
        } else {
          setStep(2)
        }
      } else {
        setStep(2)
      }
      setFormData({ title: '', description: '', shortDescription: '' })
    } else if (step === 4) {
      setStep(3)
    }
  }, [step, formData, setFormData])

  const getBreadcrumb = useCallback((
    selectedCategory?: PublicationType | null,
    selectedSubcategory?: Subcategory | null,
    selectedOption?: Option | null
  ) => {
    const parts: string[] = []
    
    if (selectedCategory) {
      parts.push(selectedCategory.name)
    }
    if (selectedSubcategory && selectedSubcategory.id !== 'tout') {
      parts.push(selectedSubcategory.name)
    }
    if (selectedOption) {
      parts.push(selectedOption.name)
    }
    
    return parts.join(' > ')
  }, [])

  return {
    step,
    setStep,
    handleBack,
    getBreadcrumb
  }
}

