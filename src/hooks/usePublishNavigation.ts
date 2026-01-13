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
      setFormData({ 
        category: null, 
        subcategory: null, 
        subSubCategory: null,
        subSubSubCategory: null,
        option: null, 
        platform: null 
      })
    } else if (step === 2) {
      setStep(1)
      setFormData({ 
        subcategory: null,
        subSubCategory: null,
        subSubSubCategory: null,
        option: null, 
        platform: null 
      })
    } else if (step === 2.5) {
      setStep(2)
      setFormData({ 
        subSubSubCategory: null,
        platform: null 
      })
    } else if (step === 3) {
      if (formData.subSubCategory || formData.option) {
        const selectedCategory = publicationTypes.find(c => c.id === formData.category)
        const selectedSubcategory = selectedCategory?.subcategories.find(s => s.id === formData.subcategory)
        const selectedOption = selectedSubcategory?.options?.find(o => o.id === formData.subSubCategory || o.id === formData.option)
        
        if (selectedOption?.platforms && selectedOption.platforms.length > 0) {
          setStep(2.5)
        } else {
          setStep(2)
        }
      } else {
        // Si pas de subSubCategory/option, vérifier si la sous-catégorie a des options
        // Si elle n'en a pas, retourner directement à l'étape 1 (sous-catégories)
        const selectedCategory = publicationTypes.find(c => c.id === formData.category)
        const selectedSubcategory = selectedCategory?.subcategories.find(s => s.id === formData.subcategory)
        
        if (selectedSubcategory?.options && selectedSubcategory.options.length > 0) {
          setStep(2)
        } else {
          // La sous-catégorie n'a pas d'options, retourner directement aux sous-catégories
          setStep(1)
        }
      }
      setFormData({ title: '', description: '', socialNetwork: null })
    } else if (step === 4) {
      setStep(3)
    }
  }, [step, formData, setFormData])

  const getBreadcrumb = useCallback((
    selectedCategory?: PublicationType | null,
    selectedSubcategory?: Subcategory | null,
    selectedOption?: Option | null,
    selectedPlatform?: { id: string; name: string } | null
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
    if (selectedPlatform) {
      parts.push(selectedPlatform.name)
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

