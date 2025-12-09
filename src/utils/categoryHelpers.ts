import { supabase } from '../lib/supabaseClient'
import { getDefaultSubMenus } from './defaultSubMenus'

interface Category {
  id: string
}

export const fetchSubMenusForCategory = async (categorySlug: string): Promise<Array<{ name: string; slug: string }>> => {
  const defaultSubMenus = getDefaultSubMenus(categorySlug)
  console.log(`[fetchSubMenusForCategory] Utilisation de la nouvelle structure pour slug: ${categorySlug}`, defaultSubMenus)
  
  // Utiliser directement les données mises à jour depuis defaultSubMenus
  // pour garantir que la nouvelle structure est toujours utilisée
  return defaultSubMenus
  
  // Code commenté pour récupérer depuis la base de données si nécessaire plus tard
  /*
  try {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (categoryError || !category || !(category as Category).id) {
      console.warn(`[fetchSubMenusForCategory] Catégorie non trouvée pour slug: ${categorySlug}, erreur:`, categoryError)
      return defaultSubMenus
    }

    console.log(`[fetchSubMenusForCategory] Catégorie trouvée, ID:`, (category as Category).id)

    const { data, error } = await supabase
      .from('sub_categories')
      .select('name, slug')
      .eq('category_id', (category as Category).id)
      .order('name')

    if (error) {
      console.error(`[fetchSubMenusForCategory] Erreur lors de la récupération des sous-catégories:`, error)
      return defaultSubMenus
    }

    if (!data || data.length === 0) {
      console.warn(`[fetchSubMenusForCategory] Aucune sous-catégorie trouvée, utilisation du fallback`)
      return defaultSubMenus
    }

    console.log(`[fetchSubMenusForCategory] Sous-catégories trouvées:`, data)
    return data
  } catch (error) {
    console.error('[fetchSubMenusForCategory] Erreur:', error)
    return defaultSubMenus
  }
  */
}

